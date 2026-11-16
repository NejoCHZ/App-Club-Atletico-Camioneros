using System.Reflection;
using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.API.Security;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.Tests;

public sealed class JugadoresDatosMedicosControllerTests
{
    [Fact]
    public void MedicalWriteAuthorizationAllowsDoctorAndRejectsSportRoles()
    {
        var attribute = typeof(JugadoresController)
            .GetMethod(nameof(JugadoresController.ActualizarDatosMedicos))!
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Contains(AppRoles.Medico, attribute!.Roles);
        Assert.Contains(AppRoles.Administrador, attribute.Roles);
        Assert.DoesNotContain(AppRoles.DirectorTecnico, attribute.Roles);
        Assert.DoesNotContain(AppRoles.PreparadorFisico, attribute.Roles);
    }

    [Fact]
    public async Task UpdatesPhysicalAndMedicalFieldsThroughOneDaoContract()
    {
        var dao = new FakeJugadorDao { UpdateMedicalResult = true };
        var controller = CreateController(dao);
        var dto = ValidDto();

        var result = await controller.ActualizarDatosMedicos(12, dto);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, dao.UpdateMedicalCalls);
        Assert.Equal(12, dao.LastMedical!.Value.Id);
        Assert.Equal(72.5m, dao.LastMedical.Value.Peso);
        Assert.Equal(1.78m, dao.LastMedical.Value.Altura);
        Assert.Equal("Derecho", dao.LastMedical.Value.PieHabil);
        Assert.Equal("O+", dao.LastMedical.Value.Ficha.GrupoSanguineo);
        Assert.Equal("Esguince (16/11/2026)", dao.LastMedical.Value.Ficha.HistorialLesiones);
    }

    [Theory]
    [InlineData(-1, 1.78)]
    [InlineData(501, 1.78)]
    [InlineData(72, -1)]
    [InlineData(72, 3.01)]
    public async Task RejectsOutOfRangeWeightOrHeight(double peso, double altura)
    {
        var dao = new FakeJugadorDao { UpdateMedicalResult = true };
        var dto = ValidDto();
        dto.Peso = (decimal)peso;
        dto.Altura = (decimal)altura;

        var result = await CreateController(dao).ActualizarDatosMedicos(12, dto);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(0, dao.UpdateMedicalCalls);
    }

    [Fact]
    public async Task ReturnsNotFoundWhenPlayerDoesNotExist()
    {
        var dao = new FakeJugadorDao { UpdateMedicalResult = false };

        var result = await CreateController(dao).ActualizarDatosMedicos(404, ValidDto());

        Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(1, dao.UpdateMedicalCalls);
    }

    private static JugadorDatosMedicosUpdateDto ValidDto() => new()
    {
        Peso = 72.5m,
        Altura = 1.78m,
        PieHabil = "Derecho",
        GrupoSanguineo = "O+",
        AntecedentesSalud = "Asma",
        HistorialLesiones = "Esguince (16/11/2026)",
        Observaciones = "Control",
    };

    private static JugadoresController CreateController(IJugadorDao dao) =>
        new(dao, new UnrestrictedAccess());

    private sealed class UnrestrictedAccess : ICurrentUserAccess
    {
        public bool IsAdmin => true;
        public bool IsDirectorTecnico => false;
        public bool IsCategoryScoped => false;
        public IReadOnlySet<int> CategoriaIds => new HashSet<int>();
        public bool PuedeAccederCategoria(int categoriaId) => true;
        public bool PuedeAccederAlgunaCategoria(IEnumerable<int> categoriaIds) => true;
    }

    private sealed class FakeJugadorDao : IJugadorDao
    {
        public bool UpdateMedicalResult { get; init; }
        public int UpdateMedicalCalls { get; private set; }
        public (int Id, decimal? Peso, decimal? Altura, string? PieHabil, FichaMedica Ficha)? LastMedical { get; private set; }

        public Task<bool> ActualizarDatosMedicosAsync(int id, decimal? peso, decimal? altura, string? pieHabil, FichaMedica ficha)
        {
            UpdateMedicalCalls++;
            LastMedical = (id, peso, altura, pieHabil, ficha);
            return Task.FromResult(UpdateMedicalResult);
        }

        public Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync() => Task.FromResult<IEnumerable<JugadorDetalle>>([]);
        public Task<JugadorDetalle?> ObtenerPorIdAsync(int id) => Task.FromResult<JugadorDetalle?>(null);
        public Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria) => Task.FromResult<IEnumerable<JugadorDetalle>>([]);
        public Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador) => Task.FromResult(false);
        public Task<bool> ActualizarDatosFisicosAsync(int id, decimal? peso, decimal? altura, string? pieHabil) => Task.FromResult(false);
        public Task<int> CrearAsync(JugadorAlta dto) => Task.FromResult(0);
        public Task<bool> EliminarAsync(int idJugador) => Task.FromResult(false);
        public Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni) => Task.FromResult<TutorDetalle?>(null);
        public Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email) => Task.FromResult(false);
    }
}
