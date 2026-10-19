using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using CACC.Entities;
using Microsoft.Extensions.Options;

namespace CACC.API.Services
{
    // Cómo se configura la conexión con el Portal Administrativo (sección "AdministrativoApi").
    public class AdministrativoApiOptions
    {
        public const string Seccion = "AdministrativoApi";

        // Dirección de la API del Portal Administrativo, por ejemplo http://localhost:5118
        public string BaseUrl { get; set; } = string.Empty;

        // Cuánto se espera la respuesta antes de darla por caída.
        public int TimeoutSegundos { get; set; } = 3;

        // Qué hace el QR si el Portal Administrativo no responde:
        //   "Denegar" (por defecto): no deja pasar a nadie hasta que se pueda consultar la deuda.
        //   "Permitir": deja pasar a un jugador activo y marca la asistencia SIN_VERIFICAR para revisarla después.
        public string SiNoResponde { get; set; } = Denegar;

        public const string Permitir = "Permitir";
        public const string Denegar = "Denegar";

        public bool PermiteSiNoResponde => string.Equals(SiNoResponde?.Trim(), Permitir, StringComparison.OrdinalIgnoreCase);
    }

    public enum ResultadoConsulta
    {
        Ok,
        DniInvalido,
        NoEsJugador,
        Ambiguo,
        // El Portal Administrativo rechazó el token (sesión cerrada o sin permiso para consultar).
        SinPermiso,
        // No respondió a tiempo, devolvió un error o no está configurado.
        NoResponde
    }

    public sealed record ConsultaEstadoDeuda(ResultadoConsulta Resultado, EstadoDeudaAdministrativo? Estado = null, int CodigoHttp = 0);

    public interface IEstadoDeudaClient
    {
        Task<ConsultaEstadoDeuda> PorDniAsync(string dni, CancellationToken ct = default);

        // El estado de varios jugadores por DNI (para los listados). Devuelve null si el Portal Administrativo no responde;
        // los DNI que no son de jugadores simplemente no figuran en el resultado.
        Task<IReadOnlyDictionary<string, EstadoDeudaAdministrativo>?> PorLoteAsync(IEnumerable<string> dnis, CancellationToken ct = default);
    }

    public sealed class EstadoDeudaClient : IEstadoDeudaClient
    {
        private const int MaximoPorLote = 500;
        private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

        private readonly HttpClient _http;
        private readonly IHttpContextAccessor _contexto;
        private readonly ILogger<EstadoDeudaClient> _logger;

        public EstadoDeudaClient(HttpClient http, IHttpContextAccessor contexto, ILogger<EstadoDeudaClient> logger)
        {
            _http = http;
            _contexto = contexto;
            _logger = logger;
        }

        public async Task<ConsultaEstadoDeuda> PorDniAsync(string dni, CancellationToken ct = default)
        {
            using var pedido = NuevoPedido(HttpMethod.Get, $"api/integracion/v1/estado-deuda/dni/{Uri.EscapeDataString(dni)}");
            try
            {
                using var respuesta = await _http.SendAsync(pedido, ct);
                switch (respuesta.StatusCode)
                {
                    case HttpStatusCode.OK:
                        var estado = await respuesta.Content.ReadFromJsonAsync<EstadoDeudaAdministrativo>(Json, ct);
                        return estado is null
                            ? new ConsultaEstadoDeuda(ResultadoConsulta.NoResponde, CodigoHttp: 200)
                            : new ConsultaEstadoDeuda(ResultadoConsulta.Ok, estado, 200);
                    case HttpStatusCode.BadRequest:
                        return new ConsultaEstadoDeuda(ResultadoConsulta.DniInvalido, CodigoHttp: 400);
                    case HttpStatusCode.NotFound:
                        return new ConsultaEstadoDeuda(ResultadoConsulta.NoEsJugador, CodigoHttp: 404);
                    case HttpStatusCode.Conflict:
                        return new ConsultaEstadoDeuda(ResultadoConsulta.Ambiguo, CodigoHttp: 409);
                    case HttpStatusCode.Unauthorized:
                    case HttpStatusCode.Forbidden:
                        return new ConsultaEstadoDeuda(ResultadoConsulta.SinPermiso, CodigoHttp: (int)respuesta.StatusCode);
                    default:
                        _logger.LogWarning("El Portal Administrativo respondió {Codigo} al consultar la deuda.", (int)respuesta.StatusCode);
                        return new ConsultaEstadoDeuda(ResultadoConsulta.NoResponde, CodigoHttp: (int)respuesta.StatusCode);
                }
            }
            catch (Exception ex) when (EsFalloDeConexion(ex, ct))
            {
                _logger.LogWarning(ex, "No se pudo consultar la deuda al Portal Administrativo.");
                return new ConsultaEstadoDeuda(ResultadoConsulta.NoResponde);
            }
        }

        public async Task<IReadOnlyDictionary<string, EstadoDeudaAdministrativo>?> PorLoteAsync(IEnumerable<string> dnis, CancellationToken ct = default)
        {
            var pendientes = dnis.Where(d => !string.IsNullOrWhiteSpace(d)).Distinct().ToList();
            var resultado = new Dictionary<string, EstadoDeudaAdministrativo>();
            if (pendientes.Count == 0) return resultado;

            try
            {
                for (int i = 0; i < pendientes.Count; i += MaximoPorLote)
                {
                    var tanda = pendientes.Skip(i).Take(MaximoPorLote).ToList();
                    using var pedido = NuevoPedido(HttpMethod.Post, "api/integracion/v1/estado-deuda/lote");
                    pedido.Content = new StringContent(JsonSerializer.Serialize(new { dnis = tanda }, Json), Encoding.UTF8, "application/json");
                    using var respuesta = await _http.SendAsync(pedido, ct);
                    if (!respuesta.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("El Portal Administrativo respondió {Codigo} al consultar la deuda por lote.", (int)respuesta.StatusCode);
                        return null;
                    }

                    var cuerpo = await respuesta.Content.ReadFromJsonAsync<LoteRespuesta>(Json, ct);
                    if (cuerpo?.Items is null) return null;
                    foreach (var item in cuerpo.Items) resultado[item.Dni] = item;
                }
                return resultado;
            }
            catch (Exception ex) when (EsFalloDeConexion(ex, ct))
            {
                _logger.LogWarning(ex, "No se pudo consultar la deuda por lote al Portal Administrativo.");
                return null;
            }
        }

        // Reenvía el token del usuario: es el mismo en los dos portales.
        private HttpRequestMessage NuevoPedido(HttpMethod metodo, string ruta)
        {
            var pedido = new HttpRequestMessage(metodo, ruta);
            string? autorizacion = _contexto.HttpContext?.Request.Headers.Authorization.ToString();
            if (!string.IsNullOrWhiteSpace(autorizacion) && AuthenticationHeaderValue.TryParse(autorizacion, out var valor))
            {
                pedido.Headers.Authorization = valor;
            }
            return pedido;
        }

        // Una cancelación pedida por quien llama se propaga; todo lo demás (caída, timeout, respuesta ilegible) cuenta como "no responde".
        private static bool EsFalloDeConexion(Exception ex, CancellationToken ct) =>
            !ct.IsCancellationRequested && (ex is HttpRequestException or TaskCanceledException or JsonException or NotSupportedException);

        private sealed class LoteRespuesta
        {
            public List<EstadoDeudaAdministrativo>? Items { get; set; }
        }
    }

    // Texto que muestran los listados del Deportivo para el estado de cuota de cada jugador.
    public static class EstadoCuotaTexto
    {
        public const string SinVerificar = "SIN VERIFICAR";

        public static string De(EstadoDeudaAdministrativo? estado) => estado?.Estado switch
        {
            "habilitado" => "AL DÍA",
            "solo_entrenamientos" => "PENDIENTE",
            "inhabilitado" => "INHABILITADO",
            "baja" => "BAJA",
            _ => SinVerificar
        };
    }
}
