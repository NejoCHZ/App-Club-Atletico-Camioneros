using System.Reflection;
using System.Text.Json;
using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.API.Security;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace CACC.Tests;

public class AsistenciasControllerTests
{
    [Theory]
    [InlineData(0, true, true)]
    [InlineData(1, true, true)]
    [InlineData(2, false, true)]
    public async Task AppliesDebtPolicyAtomically(int cuotas, bool acceso, bool registrada)
    {
        var dao = new FakeAsistenciaDao(new ResultadoIngreso { PersonaEncontrada = true, CuotasVencidas = cuotas, AccesoPermitido = acceso, EstadoAcceso = acceso ? "PERMITIDO" : "DENEGADO", AsistenciaRegistrada = registrada });
        var result = await CreateController(dao).VerificarYRegistrar(new AsistenciaRequestDto { Dni = "40111222", MetodoRegistro = "DNI_MANUAL" });
        var ok = Assert.IsType<OkObjectResult>(result);
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
        Assert.Equal(acceso, doc.RootElement.GetProperty("accesoPermitido").GetBoolean());
        Assert.Equal(registrada, doc.RootElement.GetProperty("asistenciaRegistrada").GetBoolean());
        Assert.Equal(acceso ? "PERMITIDO" : "DENEGADO", doc.RootElement.GetProperty("estadoAcceso").GetString());
        if (!acceso) Assert.Contains("intento de ingreso fue registrado", doc.RootElement.GetProperty("mensaje").GetString());
        Assert.Equal(1, dao.WriteCalls);
        Assert.Equal("DNI_MANUAL", dao.LastMethod);
    }

    [Fact]
    public async Task ReportsRepeatedDeniedAttemptAsRecordedWithoutDuplicating()
    {
        var dao = new FakeAsistenciaDao(new ResultadoIngreso { PersonaEncontrada = true, CuotasVencidas = 2, AccesoPermitido = false, EstadoAcceso = "DENEGADO", AsistenciaRegistrada = true, YaRegistrada = true });
        var ok = Assert.IsType<OkObjectResult>(await CreateController(dao).VerificarYRegistrar(new AsistenciaRequestDto { Dni = "99000002", MetodoRegistro = "QR" }));
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
        Assert.True(doc.RootElement.GetProperty("yaRegistrada").GetBoolean());
        Assert.Contains("ya estaba registrado", doc.RootElement.GetProperty("mensaje").GetString());
        Assert.Equal("QR", dao.LastMethod);
    }

    [Fact]
    public async Task RejectsUntrustedRegistrationMethodBeforeCallingDao()
    {
        var dao = new FakeAsistenciaDao(new ResultadoIngreso());
        Assert.IsType<BadRequestObjectResult>(await CreateController(dao).VerificarYRegistrar(new AsistenciaRequestDto { Dni = "99000002", MetodoRegistro = "Posee deuda" }));
        Assert.Equal(0, dao.WriteCalls);
    }

    [Fact]
    public async Task ReturnsFilteredPlayerHistory()
    {
        var rows = new[] { new Asistencia { IdAsistencia = 7, IdJugador = 11, FechaHora = new DateTime(2026, 10, 20, 15, 49, 0), EstadoAcceso = "PERMITIDO" } };
        var dao = new FakeAsistenciaDao(new ResultadoIngreso(), rows);
        var result = await CreateController(dao).ObtenerHistorialJugador(11, new DateTime(2026, 10, 1), new DateTime(2026, 10, 20), " PERMITIDO ");
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Single(Assert.IsAssignableFrom<IEnumerable<AsistenciaResponseDto>>(ok.Value));
        Assert.Equal((11, new DateTime(2026, 10, 1), new DateTime(2026, 10, 20), "PERMITIDO"), dao.LastQuery);
    }

    [Fact]
    public async Task RejectsInvertedDateRange() =>
        Assert.IsType<BadRequestObjectResult>(await CreateController().ObtenerHistorialJugador(11, new DateTime(2026, 10, 21), new DateTime(2026, 10, 20), null));

    [Fact]
    public async Task PreservesPlayerCategoryScope() =>
        Assert.IsType<ForbidResult>(await CreateController(access: new FakeAccess(false)).ObtenerHistorialJugador(11, null, null, null));

    [Fact]
    public async Task PhysicalTrainerCanReadPlayerInsideAssignedCategory()
    {
        var result = await CreateController(access: CreatePhysicalTrainerAccess(10)).ObtenerHistorialJugador(11, null, null, null);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task PhysicalTrainerCannotReadPlayerOutsideAssignedCategory()
    {
        var result = await CreateController(access: CreatePhysicalTrainerAccess(99)).ObtenerHistorialJugador(11, null, null, null);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public void PostKeepsItsRoleRestrictionWhileGetUsesAuthenticatedAccess()
    {
        Assert.Null(typeof(AsistenciasController).GetCustomAttributes<AuthorizeAttribute>().Single().Roles);
        var post = typeof(AsistenciasController).GetMethod(nameof(AsistenciasController.VerificarYRegistrar))!;
        Assert.Equal(AppRoles.Administradores + "," + AppRoles.DonQr, post.GetCustomAttribute<AuthorizeAttribute>()?.Roles);
        var get = typeof(AsistenciasController).GetMethod(nameof(AsistenciasController.ObtenerHistorialJugador))!;
        Assert.Null(get.GetCustomAttribute<AuthorizeAttribute>());
    }

    private static AsistenciasController CreateController(FakeAsistenciaDao? dao = null, ICurrentUserAccess? access = null) =>
        new(dao ?? new FakeAsistenciaDao(new ResultadoIngreso()), new FakeJugadorDao(), access ?? new FakeAccess(true), new FakeCredentialTokenService(), new FakeCredentialDao());

    private sealed class FakeCredentialTokenService : CACC.API.Services.ICredentialTokenService
    {
        public string Create(Guid id) => id.ToString();
        public CACC.API.Services.CredentialToken? Validate(string token) =>
            token == "invalid" ? null : new CACC.API.Services.CredentialToken(1, Guid.Parse("11111111-1111-1111-1111-111111111111"));
    }

    private sealed class FakeCredentialDao : ICredentialDao
    {
        public Task<Guid?> GetOrCreateActiveCredentialForPlayerAsync(int playerId, CancellationToken cancellationToken) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task<Guid?> GetOrCreateActiveCredentialForStaffAsync(int staffId, CancellationToken cancellationToken) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task<string?> GetActiveDniAsync(Guid credentialId, CancellationToken cancellationToken) => Task.FromResult<string?>("99000002");
        public Task<CredentialPlayerData?> GetPlayerAsync(int playerId, CancellationToken cancellationToken) => Task.FromResult<CredentialPlayerData?>(null);
        public Task<CredentialStaffData?> GetStaffAsync(int staffId, CancellationToken cancellationToken) => Task.FromResult<CredentialStaffData?>(null);
    }

    private static CurrentUserAccess CreatePhysicalTrainerAccess(int categoryId)
    {
        var identity = new ClaimsIdentity([
            new Claim(ClaimTypes.Role, AppRoles.PreparadorFisico),
            new Claim("id_categoria", categoryId.ToString())
        ], "Test");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        return new CurrentUserAccess(new HttpContextAccessor { HttpContext = context });
    }

    private sealed class FakeAsistenciaDao(ResultadoIngreso writeResult, IReadOnlyList<Asistencia>? rows = null) : IAsistenciaDao
    {
        public int WriteCalls { get; private set; }
        public string? LastMethod { get; private set; }
        public (int, DateTime?, DateTime?, string?) LastQuery { get; private set; }
        public Task<ResultadoIngreso> ProcesarIngresoAsync(string dni, string metodoRegistro) { WriteCalls++; LastMethod = metodoRegistro; return Task.FromResult(writeResult); }
        public Task<IReadOnlyList<Asistencia>> ObtenerHistorialJugadorAsync(int id, DateTime? desde, DateTime? hasta, string? estado)
        {
            LastQuery = (id, desde, hasta, estado);
            return Task.FromResult(rows ?? (IReadOnlyList<Asistencia>)[]);
        }
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
        public Task<bool> EliminarAsync(int idJugador) => Task.FromResult(false);
        public Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni) => Task.FromResult<TutorDetalle?>(null);
        public Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email) => Task.FromResult(false);
    }
}
