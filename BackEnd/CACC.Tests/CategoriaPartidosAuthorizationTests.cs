using System.Reflection;
using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.API.Security;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace CACC.Tests;

public class CategoriaPartidosAuthorizationTests
{
    private static PartidoCreateDto ValidDto(params int[] playerIds) => new()
    {
        FechaPartido = "2026-11-17",
        Rival = "Rival",
        CondicionLocalia = "Local",
        Resultado = "G 1-0",
        JugadoresMinutos = playerIds.Select(id => new JugadorMinutoDto { IdJugador = id, MinutosJugados = 90 }).ToList()
    };

    [Fact]
    public void MutationEndpointsAllowAdministratorsAndDtButNotPhysicalTrainer()
    {
        foreach (var methodName in new[] { nameof(CategoriasController.CrearPartido), nameof(CategoriasController.ActualizarPartido), nameof(CategoriasController.EliminarPartido) })
        {
            var authorize = typeof(CategoriasController).GetMethod(methodName)!.GetCustomAttribute<AuthorizeAttribute>();
            var roles = authorize!.Roles!.Split(',');

            Assert.Contains(AppRoles.Administrador, roles);
            Assert.Contains(AppRoles.Tesorero, roles);
            Assert.Contains(AppRoles.DirectorTecnico, roles);
            Assert.DoesNotContain(AppRoles.PreparadorFisico, roles);
            Assert.DoesNotContain(AppRoles.Medico, roles);
            Assert.DoesNotContain(AppRoles.Coordinador, roles);
        }
    }

    [Fact]
    public async Task AdministratorCanCreateUpdateAndDeleteMatches()
    {
        var dao = new FakeCategoriaDao { ExistingMatch = new PartidoDetalle { IdPartido = 11, IdCategoria = 7 } };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true, allowed: true));

        Assert.IsType<ObjectResult>(await controller.CrearPartido(7, ValidDto()));
        Assert.IsType<OkObjectResult>(await controller.ActualizarPartido(7, 11, ValidDto()));
        Assert.IsType<OkObjectResult>(await controller.EliminarPartido(7, 11));
        Assert.Equal(1, dao.Created);
        Assert.Equal(1, dao.Updated);
        Assert.Equal(1, dao.Deleted);
    }

    [Fact]
    public async Task AssignedDtCanCreateUpdateAndDeleteMatches()
    {
        var dao = new FakeCategoriaDao { ExistingMatch = new PartidoDetalle { IdPartido = 11, IdCategoria = 7 } };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isDt: true, allowed: true));

        Assert.IsType<ObjectResult>(await controller.CrearPartido(7, ValidDto()));
        Assert.IsType<OkObjectResult>(await controller.ActualizarPartido(7, 11, ValidDto()));
        Assert.IsType<OkObjectResult>(await controller.EliminarPartido(7, 11));
    }

    [Fact]
    public async Task UnassignedDtCannotMutateCategory()
    {
        var dao = new FakeCategoriaDao { ExistingMatch = new PartidoDetalle { IdPartido = 11, IdCategoria = 7 } };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isDt: true, allowed: false));

        Assert.IsType<ForbidResult>(await controller.CrearPartido(7, ValidDto()));
        Assert.IsType<ForbidResult>(await controller.ActualizarPartido(7, 11, ValidDto()));
        Assert.IsType<ForbidResult>(await controller.EliminarPartido(7, 11));
        Assert.Equal(2, dao.MatchReads);
        Assert.Equal(0, dao.Created + dao.Updated + dao.Deleted);
    }

    [Fact]
    public async Task AssignedDtCannotMutateGuessedMatchIdFromUnassignedCategory()
    {
        var dao = new FakeCategoriaDao { ExistingMatch = new PartidoDetalle { IdPartido = 11, IdCategoria = 8 } };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isDt: true, allowed: true));

        Assert.IsType<ForbidResult>(await controller.ActualizarPartido(7, 11, ValidDto()));
        Assert.IsType<ForbidResult>(await controller.EliminarPartido(7, 11));
        Assert.Equal(0, dao.Updated + dao.Deleted);
    }

    [Fact]
    public async Task AdministratorCannotCreateMatchWithPlayerFromAnotherCategory()
    {
        var dao = new FakeCategoriaDao
        {
            Roster = new[] { new JugadorPlantel { IdJugador = 1 } }
        };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.CrearPartido(7, ValidDto(99));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(1, dao.RosterReads);
        Assert.Equal(0, dao.Created);
    }

    [Fact]
    public async Task AssignedDtCannotUpdateMatchWithPlayerFromAnotherCategory()
    {
        var dao = new FakeCategoriaDao
        {
            ExistingMatch = new PartidoDetalle { IdPartido = 11, IdCategoria = 7 },
            Roster = new[] { new JugadorPlantel { IdJugador = 1 } }
        };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isDt: true, allowed: true));

        var result = await controller.ActualizarPartido(7, 11, ValidDto(99));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(1, dao.RosterReads);
        Assert.Equal(0, dao.Updated);
    }

    [Fact]
    public async Task DuplicateMatchReturnsConflictWithoutCreatingAnotherRecord()
    {
        var dao = new FakeCategoriaDao { DuplicateOnCreate = true };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.CrearPartido(7, ValidDto());

        var conflict = Assert.IsType<ObjectResult>(result);
        Assert.Equal(409, conflict.StatusCode);
        Assert.Equal(1, dao.Created);
    }

    [Fact]
    public async Task CreateRejectsTheSamePlayerTwiceBeforeCallingTheDao()
    {
        var dao = new FakeCategoriaDao();
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.CrearPartido(7, ValidDto(1, 1));

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("más de una vez", badRequest.Value!.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.Equal(0, dao.Created);
        Assert.Equal(0, dao.RosterReads);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(121)]
    public async Task CreateRejectsMinutesOutsideTheAllowedRange(int minutes)
    {
        var dto = ValidDto(1);
        dto.JugadoresMinutos[0].MinutosJugados = minutes;
        var dao = new FakeCategoriaDao();
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.CrearPartido(7, dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("entre 0 y 120", badRequest.Value!.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.Equal(0, dao.Created);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(120)]
    public async Task CreateAcceptsTheAllowedMinuteBoundaries(int minutes)
    {
        var dto = ValidDto(1);
        dto.JugadoresMinutos[0].MinutosJugados = minutes;
        var dao = new FakeCategoriaDao { Roster = new[] { new JugadorPlantel { IdJugador = 1 } } };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.CrearPartido(7, dto);

        Assert.Equal(201, Assert.IsType<ObjectResult>(result).StatusCode);
        Assert.Equal(1, dao.Created);
    }

    [Fact]
    public async Task UpdateRejectsInvalidParticipationsWithoutReplacingExistingRows()
    {
        var dto = ValidDto(1);
        dto.JugadoresMinutos[0].MinutosJugados = 121;
        var dao = new FakeCategoriaDao { ExistingMatch = new PartidoDetalle { IdPartido = 11, IdCategoria = 7 } };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.ActualizarPartido(7, 11, dto);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(0, dao.Updated);
    }

    [Fact]
    public async Task CreateCategoryNormalizesWhitespaceAndReturnsConflictForAnExistingName()
    {
        var dao = new FakeCategoriaDao { DuplicateCategoryOnCreate = true };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.CrearCategoria(new CategoriaCreateUpdateDto
        {
            NombreCategoria = "  Pt   AFA  2008  ",
            Asociacion = "AFA"
        });

        Assert.Equal("Pt AFA 2008", dao.CategoryName);
        Assert.Equal(409, Assert.IsType<ConflictObjectResult>(result).StatusCode);
    }

    [Fact]
    public async Task UpdateCategoryReturnsConflictWithoutTreatingTheCurrentIdAsMissing()
    {
        var dao = new FakeCategoriaDao { DuplicateCategoryOnUpdate = true };
        var controller = new CategoriasController(dao, new FakeCurrentUserAccess(isAdmin: true));

        var result = await controller.ActualizarCategoria(7, new CategoriaCreateUpdateDto
        {
            NombreCategoria = "AFA 20067",
            Asociacion = "AFA"
        });

        Assert.Equal(7, dao.CategoryId);
        Assert.Equal(409, Assert.IsType<ConflictObjectResult>(result).StatusCode);
    }

    private sealed class FakeCurrentUserAccess(bool isAdmin = false, bool isDt = false, bool allowed = false) : ICurrentUserAccess
    {
        public bool IsAdmin => isAdmin;
        public bool IsDirectorTecnico => isDt;
        public bool IsCategoryScoped => isDt;
        public IReadOnlySet<int> CategoriaIds { get; } = allowed ? new HashSet<int> { 7 } : new HashSet<int>();
        public bool PuedeAccederCategoria(int categoriaId) => !IsCategoryScoped || (allowed && categoriaId == 7);
        public bool PuedeAccederAlgunaCategoria(IEnumerable<int> categoriaIds) => allowed;
    }

    private sealed class FakeCategoriaDao : ICategoriaDao
    {
        public PartidoDetalle? ExistingMatch { get; init; }
        public IEnumerable<JugadorPlantel> Roster { get; init; } = Array.Empty<JugadorPlantel>();
        public int Created { get; private set; }
        public int Updated { get; private set; }
        public int Deleted { get; private set; }
        public int MatchReads { get; private set; }
        public int RosterReads { get; private set; }
        public bool DuplicateOnCreate { get; init; }
        public bool DuplicateCategoryOnCreate { get; init; }
        public bool DuplicateCategoryOnUpdate { get; init; }
        public string? CategoryName { get; private set; }
        public int CategoryId { get; private set; }

        public Task<int> RegistrarPartidoAsync(PartidoAlta partido)
        {
            Created++;
            if (DuplicateOnCreate) throw new PartidoDuplicadoException();
            return Task.FromResult(21);
        }
        public Task<bool> ActualizarPartidoAsync(PartidoEdicion partido) { Updated++; return Task.FromResult(true); }
        public Task<bool> EliminarPartidoAsync(int idPartido) { Deleted++; return Task.FromResult(true); }
        public Task<PartidoDetalle?> ObtenerPartidoPorIdAsync(int idPartido) { MatchReads++; return Task.FromResult(ExistingMatch); }
        public Task<IEnumerable<Categoria>> ObtenerTodasAsync() => throw new NotImplementedException();
        public Task<IEnumerable<CategoriaConConteo>> ObtenerTodasConConteoAsync() => throw new NotImplementedException();
        public Task<Categoria?> ObtenerPorIdAsync(int idCategoria) => throw new NotImplementedException();
        public Task<int> CrearAsync(string nombreCategoria, string asociacion)
        {
            CategoryName = nombreCategoria;
            if (DuplicateCategoryOnCreate) throw new CategoriaDuplicadaException();
            return Task.FromResult(20);
        }
        public Task<bool> ActualizarAsync(int idCategoria, string nombreCategoria, string asociacion)
        {
            CategoryId = idCategoria;
            CategoryName = nombreCategoria;
            if (DuplicateCategoryOnUpdate) throw new CategoriaDuplicadaException();
            return Task.FromResult(true);
        }
        public Task<bool> EliminarAsync(int idCategoria) => throw new NotImplementedException();
        public Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresPorCategoriaAsync(int idCategoria) { RosterReads++; return Task.FromResult(Roster); }
        public Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresDisponiblesAsync(int idCategoria, string? search) => throw new NotImplementedException();
        public Task<bool> AsignarJugadorAsync(int idCategoria, int idJugador) => throw new NotImplementedException();
        public Task<bool> QuitarJugadorAsync(int idCategoria, int idJugador) => throw new NotImplementedException();
        public Task<IEnumerable<StaffPlantel>> ObtenerStaffPorCategoriaAsync(int idCategoria) => throw new NotImplementedException();
        public Task<IEnumerable<StaffPlantel>> ObtenerStaffDisponibleAsync(int idCategoria, string? search = null) => throw new NotImplementedException();
        public Task<bool> AsignarStaffAsync(int idCategoria, int idStaff) => throw new NotImplementedException();
        public Task<bool> QuitarStaffAsync(int idCategoria, int idStaff) => throw new NotImplementedException();
        public Task<IEnumerable<PartidoDetalle>> ObtenerPartidosPorCategoriaAsync(int idCategoria) => throw new NotImplementedException();
    }
}
