using System.Text.Json;
using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.API.Services;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Xunit;
namespace CACC.Tests;

// El QR decide con la deuda que informa el Portal Administrativo y registra la asistencia en la base del club.
public class AsistenciasControllerTests
{
    private static EstadoDeudaAdministrativo Estado(string estado, bool acceso) =>
        new() { Dni = "40111222", IdJugador = 7, Estado = estado, AccesoPermitido = acceso };

    private static AsistenciasController Controlador(FakeDao dao, FakeDeuda deuda, string siNoResponde = "Denegar") =>
        new(dao, deuda, Options.Create(new AdministrativoApiOptions { SiNoResponde = siNoResponde }));

    private static JsonElement Cuerpo(IActionResult resultado, out int? codigo)
    {
        var objeto = Assert.IsAssignableFrom<ObjectResult>(resultado);
        codigo = objeto.StatusCode;
        return JsonDocument.Parse(JsonSerializer.Serialize(objeto.Value)).RootElement.Clone();
    }

    private static readonly AsistenciaRequestDto Pedido = new() { Dni = " 40111222 " };

    [Theory]
    [InlineData("habilitado", "Asistencia registrada. Acceso permitido.")]
    [InlineData("solo_entrenamientos", "Asistencia registrada. El jugador posee un mes de deuda.")]
    public async Task UnJugadorConAcceso_QuedaRegistradoComoPermitido(string estado, string mensaje)
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true, AccesoPermitido = true, AsistenciaRegistrada = true });
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado(estado, true)));

        var cuerpo = Cuerpo(await Controlador(dao, deuda).VerificarYRegistrar(Pedido), out var codigo);

        Assert.Equal(200, codigo);
        Assert.True(cuerpo.GetProperty("accesoPermitido").GetBoolean());
        Assert.True(cuerpo.GetProperty("asistenciaRegistrada").GetBoolean());
        Assert.True(cuerpo.GetProperty("verificado").GetBoolean());
        Assert.Equal(estado, cuerpo.GetProperty("estado").GetString());
        Assert.Equal(mensaje, cuerpo.GetProperty("mensaje").GetString());
        Assert.Equal(1, dao.Llamadas);
        Assert.Equal(AsistenciaDao.Permitido, dao.UltimoEstado);
        Assert.Equal("40111222", dao.UltimoDni);
        Assert.Equal("40111222", deuda.UltimoDni);
    }

    [Theory]
    [InlineData("inhabilitado")]
    [InlineData("baja")]
    public async Task UnJugadorSinAcceso_NoSeRegistra(string estado)
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true });
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado(estado, false)));

        var cuerpo = Cuerpo(await Controlador(dao, deuda).VerificarYRegistrar(Pedido), out _);

        Assert.False(cuerpo.GetProperty("accesoPermitido").GetBoolean());
        Assert.False(cuerpo.GetProperty("asistenciaRegistrada").GetBoolean());
        Assert.True(cuerpo.GetProperty("verificado").GetBoolean());
        Assert.Equal(0, dao.Llamadas);
        Assert.StartsWith("Acceso denegado", cuerpo.GetProperty("mensaje").GetString());
    }

    // Contrato v1 (HU-028): el Deportivo no recibe ni muestra montos ni cantidad de cuotas, en ninguna respuesta del QR.
    [Theory]
    [InlineData("habilitado", true)]
    [InlineData("solo_entrenamientos", true)]
    [InlineData("inhabilitado", false)]
    [InlineData("baja", false)]
    public async Task LaRespuestaDelQrNuncaLlevaDatosFinancieros(string estado, bool acceso)
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true, AccesoPermitido = true, AsistenciaRegistrada = true });
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado(estado, acceso)));

        var cuerpo = Cuerpo(await Controlador(dao, deuda).VerificarYRegistrar(Pedido), out _);

        var nombres = cuerpo.EnumerateObject().Select(p => p.Name.ToLowerInvariant()).ToArray();
        Assert.DoesNotContain(nombres, n => n.Contains("deuda") || n.Contains("cuota") || n.Contains("monto"));
    }

    [Fact]
    public async Task UnSegundoEscaneoDelMismoDia_SeInformaSinDuplicar()
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true, AccesoPermitido = true, AsistenciaRegistrada = true, YaRegistrada = true });
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado("habilitado", true)));

        var cuerpo = Cuerpo(await Controlador(dao, deuda).VerificarYRegistrar(Pedido), out _);

        Assert.True(cuerpo.GetProperty("yaRegistrada").GetBoolean());
        Assert.Contains("ya estaba registrada", cuerpo.GetProperty("mensaje").GetString());
    }

    [Theory]
    [InlineData(ResultadoConsulta.NoEsJugador, "El DNI no pertenece a un jugador.")]
    [InlineData(ResultadoConsulta.Ambiguo, "El DNI está asociado a múltiples jugadores.")]
    public async Task UnDniQueNoIdentificaAUnJugador_SeRechaza(ResultadoConsulta resultado, string mensaje)
    {
        var dao = new FakeDao(new ResultadoIngreso());
        var resp = await Controlador(dao, new FakeDeuda(new ConsultaEstadoDeuda(resultado))).VerificarYRegistrar(Pedido);

        var invalido = Assert.IsType<UnprocessableEntityObjectResult>(resp);
        Assert.Equal(mensaje, JsonDocument.Parse(JsonSerializer.Serialize(invalido.Value)).RootElement.GetProperty("message").GetString());
        Assert.Equal(0, dao.Llamadas);
    }

    [Fact]
    public async Task SinDni_EsUnPedidoInvalido()
    {
        var dao = new FakeDao(new ResultadoIngreso());
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok));
        Assert.IsType<BadRequestObjectResult>(await Controlador(dao, deuda).VerificarYRegistrar(new AsistenciaRequestDto { Dni = "  " }));
        Assert.Null(deuda.UltimoDni);
    }

    [Theory]
    [InlineData(401)]
    [InlineData(403)]
    public async Task SiElAdministrativoRechazaLaSesion_NoSeDejaPasar(int codigo)
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true });
        var resp = await Controlador(dao, new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.SinPermiso, CodigoHttp: codigo))).VerificarYRegistrar(Pedido);

        Cuerpo(resp, out var estado);
        Assert.Equal(codigo, estado);
        Assert.Equal(0, dao.Llamadas);
    }

    [Fact]
    public async Task SiElAdministrativoNoResponde_ConPoliticaPermitirConfigurada_PasaMarcadoSinVerificar()
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true, AccesoPermitido = true, AsistenciaRegistrada = true });
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.NoResponde));

        var cuerpo = Cuerpo(await Controlador(dao, deuda, "Permitir").VerificarYRegistrar(Pedido), out _);

        Assert.True(cuerpo.GetProperty("accesoPermitido").GetBoolean());
        Assert.False(cuerpo.GetProperty("verificado").GetBoolean());
        Assert.Equal("sin_verificar", cuerpo.GetProperty("estado").GetString());
        Assert.False(cuerpo.TryGetProperty("deudaTotal", out _));
        Assert.Equal(AsistenciaDao.SinVerificar, dao.UltimoEstado);
        Assert.Contains("no respondió", dao.UltimaObservacion);
    }

    [Fact]
    public async Task SiElAdministrativoNoResponde_UnaBajaSigueSinPasar()
    {
        // El DAO solo encuentra jugadores activos: aunque no se pueda verificar la deuda, una baja no entra.
        var dao = new FakeDao(new ResultadoIngreso { Error = "El DNI no pertenece a un jugador activo." });
        var resp = await Controlador(dao, new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.NoResponde)), "Permitir").VerificarYRegistrar(Pedido);

        Assert.IsType<UnprocessableEntityObjectResult>(resp);
    }

    [Theory]
    [InlineData("Denegar")]
    [InlineData("denegar")]
    public async Task SiElAdministrativoNoResponde_ConPoliticaDenegar_NoPasaNadie(string politica)
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true });
        var resp = await Controlador(dao, new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.NoResponde)), politica).VerificarYRegistrar(Pedido);

        Cuerpo(resp, out var codigo);
        Assert.Equal(503, codigo);
        Assert.Equal(0, dao.Llamadas);
    }

    private sealed class FakeDao(ResultadoIngreso resultado) : IAsistenciaDao
    {
        public int Llamadas { get; private set; }
        public string? UltimoDni { get; private set; }
        public string? UltimoEstado { get; private set; }
        public string? UltimaObservacion { get; private set; }

        public Task<ResultadoIngreso> RegistrarAsistenciaAsync(string dni, string estadoAcceso, string? observaciones)
        {
            Llamadas++;
            UltimoDni = dni;
            UltimoEstado = estadoAcceso;
            UltimaObservacion = observaciones;
            return Task.FromResult(resultado);
        }
    }

    private sealed class FakeDeuda(ConsultaEstadoDeuda consulta) : IEstadoDeudaClient
    {
        public string? UltimoDni { get; private set; }

        public Task<ConsultaEstadoDeuda> PorDniAsync(string dni, CancellationToken ct = default)
        {
            UltimoDni = dni;
            return Task.FromResult(consulta);
        }

        public Task<IReadOnlyDictionary<string, EstadoDeudaAdministrativo>?> PorLoteAsync(IEnumerable<string> dnis, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<string, EstadoDeudaAdministrativo>?>(null);
    }
}
