using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.API.Security;
using CACC.API.Services;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Xunit;
namespace CACC.Tests;

// El QR decide con la deuda que informa el Portal Administrativo y registra la asistencia en la base del club.
// Además: el ingreso por credencial QR (firmada) o por DNI, y el historial de asistencia de cada jugador.
public class AsistenciasControllerTests
{
    private static EstadoDeudaAdministrativo Estado(string estado, bool acceso) =>
        new() { Dni = "40111222", IdJugador = 7, Estado = estado, AccesoPermitido = acceso };

    private static AsistenciasController Controlador(
        FakeDao dao, FakeDeuda deuda, string siNoResponde = "Denegar", ICurrentUserAccess? access = null,
        FakeCredentialDao? credenciales = null) =>
        new(dao, deuda, Options.Create(new AdministrativoApiOptions { SiNoResponde = siNoResponde }),
            new FakeJugadorDao(), access ?? new FakeAccess(true), new FakeCredentialTokenService(), credenciales ?? new FakeCredentialDao());

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
        Assert.Equal("PERMITIDO", cuerpo.GetProperty("estadoAcceso").GetString());
        Assert.Equal(mensaje, cuerpo.GetProperty("mensaje").GetString());
        Assert.Equal(1, dao.Llamadas);
        Assert.Equal(AsistenciaDao.Permitido, dao.UltimoEstado);
        Assert.Equal("40111222", dao.UltimoDni);
        Assert.Equal("40111222", deuda.UltimoDni);
    }

    [Fact]
    public async Task ElHistorialDejaConstanciaDelMetodoYDelAvisoDeDeudaSinMontos()
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true, AccesoPermitido = true, AsistenciaRegistrada = true });
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado("solo_entrenamientos", true)));

        await Controlador(dao, deuda).VerificarYRegistrar(new AsistenciaRequestDto { Dni = "40111222", MetodoRegistro = "DNI_MANUAL" });

        Assert.Equal("Posee 1 mes de deuda - Registro manual por DNI", dao.UltimaObservacion);
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
        Assert.Equal("DENEGADO", cuerpo.GetProperty("estadoAcceso").GetString());
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

    [Fact]
    public async Task UnMetodoDeRegistroNoConfiable_SeRechazaAntesDeConsultarNada()
    {
        var dao = new FakeDao(new ResultadoIngreso());
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado("habilitado", true)));

        Assert.IsType<BadRequestObjectResult>(await Controlador(dao, deuda).VerificarYRegistrar(
            new AsistenciaRequestDto { Dni = "99000002", MetodoRegistro = "Posee deuda" }));

        Assert.Equal(0, dao.Llamadas);
        Assert.Null(deuda.UltimoDni);
    }

    [Fact]
    public async Task ConUnaCredencialQrValida_SeResuelveElDniYSeVerificaLaDeuda()
    {
        var dao = new FakeDao(new ResultadoIngreso { PersonaEncontrada = true, AccesoPermitido = true, AsistenciaRegistrada = true });
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado("habilitado", true)));

        var cuerpo = Cuerpo(await Controlador(dao, deuda, credenciales: new FakeCredentialDao("99000002"))
            .VerificarYRegistrar(new AsistenciaRequestDto { Dni = "token-valido", MetodoRegistro = "qr" }), out var codigo);

        Assert.Equal(200, codigo);
        Assert.Equal("99000002", deuda.UltimoDni);   // el DNI sale de la credencial, no de lo que se escaneó
        Assert.Equal("99000002", dao.UltimoDni);
        Assert.Equal("Lectura de credencial QR", dao.UltimaObservacion);
    }

    [Fact]
    public async Task UnaCredencialQrConFirmaInvalida_NoSeProcesa()
    {
        var dao = new FakeDao(new ResultadoIngreso());
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado("habilitado", true)));

        Assert.IsType<BadRequestObjectResult>(await Controlador(dao, deuda)
            .VerificarYRegistrar(new AsistenciaRequestDto { Dni = "invalid", MetodoRegistro = "QR" }));

        Assert.Equal(0, dao.Llamadas);
        Assert.Null(deuda.UltimoDni);
    }

    [Fact]
    public async Task UnaCredencialQrRevocadaOInactiva_NoSeProcesa()
    {
        var dao = new FakeDao(new ResultadoIngreso());
        var deuda = new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok, Estado("habilitado", true)));

        Assert.IsType<NotFoundObjectResult>(await Controlador(dao, deuda, credenciales: new FakeCredentialDao(null))
            .VerificarYRegistrar(new AsistenciaRequestDto { Dni = "token-valido", MetodoRegistro = "QR" }));

        Assert.Equal(0, dao.Llamadas);
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

    // ===== Historial de asistencia de un jugador =====

    [Fact]
    public async Task DevuelveElHistorialDelJugadorConSusFiltros()
    {
        var filas = new[] { new Asistencia { IdAsistencia = 7, IdJugador = 11, FechaHora = new DateTime(2026, 10, 20, 15, 49, 0), EstadoAcceso = "PERMITIDO" } };
        var dao = new FakeDao(new ResultadoIngreso(), filas);

        var ok = Assert.IsType<OkObjectResult>(await Controlador(dao, new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok)))
            .ObtenerHistorialJugador(11, new DateTime(2026, 10, 1), new DateTime(2026, 10, 20), " PERMITIDO "));

        Assert.Single(Assert.IsAssignableFrom<IEnumerable<AsistenciaResponseDto>>(ok.Value));
        Assert.Equal((11, new DateTime(2026, 10, 1), new DateTime(2026, 10, 20), "PERMITIDO"), dao.UltimaConsulta);
    }

    [Fact]
    public async Task UnRangoDeFechasInvertido_SeRechaza() =>
        Assert.IsType<BadRequestObjectResult>(await Controlador(new FakeDao(new ResultadoIngreso()), new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok)))
            .ObtenerHistorialJugador(11, new DateTime(2026, 10, 21), new DateTime(2026, 10, 20), null));

    [Fact]
    public async Task ElHistorialRespetaLaCategoriaDelJugador() =>
        Assert.IsType<ForbidResult>(await Controlador(new FakeDao(new ResultadoIngreso()), new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok)),
            access: new FakeAccess(false)).ObtenerHistorialJugador(11, null, null, null));

    [Fact]
    public async Task UnPreparadorFisicoLeeElHistorialDeUnJugadorDeSuCategoria() =>
        Assert.IsType<OkObjectResult>(await Controlador(new FakeDao(new ResultadoIngreso()), new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok)),
            access: CrearAccesoDePreparadorFisico(10)).ObtenerHistorialJugador(11, null, null, null));

    [Fact]
    public async Task UnPreparadorFisicoNoLeeElHistorialDeOtraCategoria() =>
        Assert.IsType<ForbidResult>(await Controlador(new FakeDao(new ResultadoIngreso()), new FakeDeuda(new ConsultaEstadoDeuda(ResultadoConsulta.Ok)),
            access: CrearAccesoDePreparadorFisico(99)).ObtenerHistorialJugador(11, null, null, null));

    [Fact]
    public void ElRegistroConservaSuRestriccionDeRolYLaLecturaUsaElAccesoAutenticado()
    {
        Assert.Null(typeof(AsistenciasController).GetCustomAttributes<AuthorizeAttribute>().Single().Roles);
        var post = typeof(AsistenciasController).GetMethod(nameof(AsistenciasController.VerificarYRegistrar))!;
        Assert.Equal(AppRoles.Administradores + "," + AppRoles.DonQr, post.GetCustomAttribute<AuthorizeAttribute>()?.Roles);
        var get = typeof(AsistenciasController).GetMethod(nameof(AsistenciasController.ObtenerHistorialJugador))!;
        Assert.Null(get.GetCustomAttribute<AuthorizeAttribute>());
    }

    private static CurrentUserAccess CrearAccesoDePreparadorFisico(int categoriaId)
    {
        var identity = new ClaimsIdentity([
            new Claim(ClaimTypes.Role, AppRoles.PreparadorFisico),
            new Claim("id_categoria", categoriaId.ToString())
        ], "Test");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        return new CurrentUserAccess(new HttpContextAccessor { HttpContext = context });
    }

    private sealed class FakeDao(ResultadoIngreso resultado, IReadOnlyList<Asistencia>? filas = null) : IAsistenciaDao
    {
        public int Llamadas { get; private set; }
        public string? UltimoDni { get; private set; }
        public string? UltimoEstado { get; private set; }
        public string? UltimaObservacion { get; private set; }
        public (int, DateTime?, DateTime?, string?) UltimaConsulta { get; private set; }

        public Task<ResultadoIngreso> RegistrarAsistenciaAsync(string dni, string estadoAcceso, string? observaciones)
        {
            Llamadas++;
            UltimoDni = dni;
            UltimoEstado = estadoAcceso;
            UltimaObservacion = observaciones;
            return Task.FromResult(resultado);
        }

        public Task<IReadOnlyList<Asistencia>> ObtenerHistorialJugadorAsync(int idJugador, DateTime? desde, DateTime? hasta, string? estado)
        {
            UltimaConsulta = (idJugador, desde, hasta, estado);
            return Task.FromResult(filas ?? (IReadOnlyList<Asistencia>)[]);
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

        public Task<ResultadoCargosAlta> GenerarCargosDeAltaAsync(int idJugador, CancellationToken ct = default) =>
            Task.FromResult(new ResultadoCargosAlta(EstadoCargosAlta.NoResponde));
    }

    private sealed class FakeCredentialTokenService : ICredentialTokenService
    {
        public string Create(Guid id) => id.ToString();
        public CredentialToken? Validate(string token) =>
            token == "invalid" ? null : new CredentialToken(1, Guid.Parse("11111111-1111-1111-1111-111111111111"));
    }

    // dniActivo: el DNI que devuelve la credencial; null = revocada o inactiva
    private sealed class FakeCredentialDao(string? dniActivo = "99000002") : ICredentialDao
    {
        public Task<Guid?> GetOrCreateActiveCredentialForPlayerAsync(int playerId, CancellationToken cancellationToken) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task<Guid?> GetOrCreateActiveCredentialForStaffAsync(int staffId, CancellationToken cancellationToken) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task<string?> GetActiveDniAsync(Guid credentialId, CancellationToken cancellationToken) => Task.FromResult(dniActivo);
        public Task<CredentialPlayerData?> GetPlayerAsync(int playerId, CancellationToken cancellationToken) => Task.FromResult<CredentialPlayerData?>(null);
        public Task<CredentialStaffData?> GetStaffAsync(int staffId, CancellationToken cancellationToken) => Task.FromResult<CredentialStaffData?>(null);
    }

    private sealed class FakeAccess(bool allowed) : ICurrentUserAccess
    {
        public bool IsAdmin => true;
        public bool IsDirectorTecnico => !allowed;
        public bool IsCategoryScoped => !allowed;
        public IReadOnlySet<int> CategoriaIds => new HashSet<int>();
        public bool PuedeAccederCategoria(int categoriaId) => allowed;
        public bool PuedeAccederAlgunaCategoria(IEnumerable<int> categoriaIds) => allowed;
    }

    private sealed class FakeJugadorDao : IJugadorDao
    {
        public Task<JugadorDetalle?> ObtenerPorIdAsync(int id) => Task.FromResult<JugadorDetalle?>(new JugadorDetalle { IdJugador = id, CategoriasIds = [10] });
        public Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync() => Task.FromResult<IEnumerable<JugadorDetalle>>([]);
        public Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria) => Task.FromResult<IEnumerable<JugadorDetalle>>([]);
        public Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador) => Task.FromResult(false);
        public Task<int> CrearAsync(JugadorAlta dto) => Task.FromResult(0);
        public Task<ResultadoBajaJugador> EliminarAsync(int idJugador) => Task.FromResult(ResultadoBajaJugador.NoEncontrado);
        public Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni) => Task.FromResult<TutorDetalle?>(null);
        public Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email) => Task.FromResult(false);
    }
}
