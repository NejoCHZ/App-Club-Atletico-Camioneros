using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.API.Security;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CACC.Tests;

public sealed class JugadoresDniControllerTests
{
    [Fact]
    public async Task RejectsDuplicateDniBeforeCreatingPlayer()
    {
        var dao = new FakeJugadorDao { DniExists = true };
        var result = await CreateController(dao).CrearJugador(ValidCreateDto(" 47265479 "));

        Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal("47265479", dao.LastDniChecked);
        Assert.Equal(0, dao.CreateCalls);
    }

    [Fact]
    public async Task NormalizesDniBeforeCreatingPlayer()
    {
        var dao = new FakeJugadorDao();
        var result = await CreateController(dao).CrearJugador(ValidCreateDto(" 99000001 "));

        Assert.Equal(201, Assert.IsType<ObjectResult>(result).StatusCode);
        Assert.Equal("99000001", dao.CreatedPlayer!.Dni);
        Assert.Equal(1, dao.CreateCalls);
    }

    [Fact]
    public async Task RejectsPlayerAsOwnTutorBeforeCreatingAnything()
    {
        var dao = new FakeJugadorDao();
        var dto = ValidCreateDto("47265479");
        dto.Tutor = new TutorCreateDto
        {
            Dni = " 47.265.479 ",
            Nombre = "Tutor",
            Apellido = "Inválido",
            Telefono = "3510000000",
        };

        var result = await CreateController(dao).CrearJugador(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("propio tutor", badRequest.Value!.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.Equal(0, dao.CreateCalls);
        Assert.Null(dao.LastDniChecked);
    }

    [Fact]
    public async Task ExcludesCurrentPlayerWhenCheckingDniDuringEdit()
    {
        var dao = new FakeJugadorDao { UpdateResult = true };
        var dto = new JugadorUpdateDto
        {
            Nombre = "Jugador",
            Apellido = "Existente",
            Dni = " 99000001 ",
            Posicion = "Defensor",
        };

        var result = await CreateController(dao).ActualizarPerfil(25, dto);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(25, dao.LastExcludedPlayerId);
        Assert.Equal("99000001", dao.UpdatedPlayer!.Dni);
    }

    [Fact]
    public async Task RejectsPlayerAsOwnTutorDuringProfileEdit()
    {
        var dao = new FakeJugadorDao { UpdateResult = true };
        var dto = new JugadorUpdateDto
        {
            Nombre = "Jugador",
            Apellido = "Existente",
            Dni = "47265479",
            Posicion = "Defensor",
            Tutor = new GuardarTutorDto
            {
                Dni = "47.265.479",
                Nombre = "Tutor",
                Apellido = "Inválido",
                Telefono = "3510000000",
            },
        };

        var result = await CreateController(dao).ActualizarPerfil(25, dto);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Null(dao.UpdatedPlayer);
        Assert.Null(dao.LastDniChecked);
    }

    [Fact]
    public async Task SendsProfileAndMedicalRecordThroughOneAtomicDaoContract()
    {
        var dao = new FakeJugadorDao { UpdateResult = true };
        var dto = new JugadorUpdateDto
        {
            Nombre = "Jugador",
            Apellido = "Existente",
            Dni = "47265479",
            Posicion = "Defensor",
            Peso = 72.5m,
            Altura = 1.78m,
            PieHabil = "Derecho",
            FichaMedica = new FichaMedicaDto
            {
                GrupoSanguineo = "O+",
                Patologias = "Asma",
                HistorialLesiones = "Esguince",
                Observaciones = "Control"
            }
        };

        var result = await CreateController(dao).ActualizarPerfil(25, dto);

        Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(dao.UpdatedPlayer);
        Assert.Equal(72.5m, dao.UpdatedPlayer!.Peso);
        Assert.Equal("O+", dao.UpdatedPlayer.FichaMedica!.GrupoSanguineo);
        Assert.Equal("Asma", dao.UpdatedPlayer.FichaMedica.Patologias);
        Assert.Equal("Esguince", dao.UpdatedPlayer.FichaMedica.HistorialLesiones);
        Assert.Equal("Control", dao.UpdatedPlayer.FichaMedica.Observaciones);
    }

    [Fact]
    public async Task RejectsPlayerAsOwnTutorWhenSavingTutorDirectly()
    {
        var dao = new FakeJugadorDao
        {
            Player = new JugadorDetalle { IdJugador = 25, Dni = "47265479" },
        };
        var dto = new GuardarTutorDto
        {
            Dni = "47-265-479",
            Nombre = "Tutor",
            Apellido = "Inválido",
            Telefono = "3510000000",
        };

        var result = await CreateController(dao).GuardarTutor(25, dto);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(0, dao.SaveTutorCalls);
    }

    private static JugadorCreateDto ValidCreateDto(string dni) => new()
    {
        Dni = dni,
        Nombre = "Jugador",
        Apellido = "Nuevo",
        Posicion = "Defensor",
        Categoria = "1",
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
        public bool DniExists { get; init; }
        public bool UpdateResult { get; init; }
        public int CreateCalls { get; private set; }
        public string? LastDniChecked { get; private set; }
        public int? LastExcludedPlayerId { get; private set; }
        public JugadorAlta? CreatedPlayer { get; private set; }
        public JugadorDetalle? UpdatedPlayer { get; private set; }
        public JugadorDetalle? Player { get; init; }
        public int SaveTutorCalls { get; private set; }

        public Task<bool> ExisteDniAsync(string dni, int? idJugadorExcluir = null)
        {
            LastDniChecked = dni;
            LastExcludedPlayerId = idJugadorExcluir;
            return Task.FromResult(DniExists);
        }

        public Task<int> CrearAsync(JugadorAlta dto)
        {
            CreateCalls++;
            CreatedPlayer = dto;
            return Task.FromResult(123);
        }

        public Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador)
        {
            UpdatedPlayer = jugador;
            return Task.FromResult(UpdateResult);
        }

        public Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync() => Task.FromResult<IEnumerable<JugadorDetalle>>([]);
        public Task<JugadorDetalle?> ObtenerPorIdAsync(int id) => Task.FromResult(Player);
        public Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria) => Task.FromResult<IEnumerable<JugadorDetalle>>([]);
        public Task<bool> ActualizarDatosFisicosAsync(int id, decimal? peso, decimal? altura, string? pieHabil) => Task.FromResult(false);
        public Task<bool> ActualizarDatosMedicosAsync(int id, decimal? peso, decimal? altura, string? pieHabil, FichaMedica ficha) => Task.FromResult(false);
        public Task<bool> EliminarAsync(int idJugador) => Task.FromResult(false);
        public Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni) => Task.FromResult<TutorDetalle?>(null);
        public Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email)
        {
            SaveTutorCalls++;
            return Task.FromResult(true);
        }
    }
}
