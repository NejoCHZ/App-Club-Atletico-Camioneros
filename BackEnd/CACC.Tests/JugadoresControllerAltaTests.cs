using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.API.Security;
using CACC.API.Services;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Xunit;
namespace CACC.Tests;

// Al dar de alta un jugador, el Deportivo avisa al Administrativo para que genere su inscripción y su cuota del mes.
// El alta ya está hecha en la base: si el aviso falla, no se deshace ni se rechaza.
public class JugadoresControllerAltaTests
{
    private static JugadorCreateDto Dto() => new()
    {
        Nombre = "Juan", Apellido = "Perez", Dni = "41000001", Genero = "Masculino", Categoria = "3",
        FechaNacimiento = new DateTime(2010, 5, 5)
    };

    private static (JugadoresController controlador, DaoFalso dao, AdministrativoFalso admin) Crear(ResultadoCargosAlta resultado)
    {
        var dao = new DaoFalso();
        var admin = new AdministrativoFalso(resultado);
        var controlador = new JugadoresController(dao, new AccesoFalso(), admin)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
        return (controlador, dao, admin);
    }

    private static JsonElement Cuerpo(IActionResult resultado, out int? codigo)
    {
        var objeto = Assert.IsAssignableFrom<ObjectResult>(resultado);
        codigo = objeto.StatusCode;
        return JsonDocument.Parse(JsonSerializer.Serialize(objeto.Value)).RootElement.Clone();
    }

    [Fact]
    public async Task UnAltaConCargosGenerados_LoDiceYPideLosCargosDelJugadorCreado()
    {
        var (controlador, dao, admin) = Crear(new ResultadoCargosAlta(EstadoCargosAlta.Generados, Inscripcion: true, Cuota: true));

        var cuerpo = Cuerpo(await controlador.CrearJugador(Dto()), out var codigo);

        Assert.Equal(201, codigo);
        Assert.Equal(1, dao.Altas);
        Assert.Equal(new[] { 42 }, admin.JugadoresConsultados);
        Assert.Equal(42, cuerpo.GetProperty("idJugador").GetInt32());
        Assert.True(cuerpo.GetProperty("cargosGenerados").GetBoolean());
        Assert.Equal(JsonValueKind.Null, cuerpo.GetProperty("avisoCargos").ValueKind);
    }

    [Theory]
    [InlineData(EstadoCargosAlta.NoResponde)]
    [InlineData(EstadoCargosAlta.Rechazado)]
    public async Task SiElAdministrativoNoGeneraLosCargos_ElAltaIgualQuedaHechaYSeAvisa(EstadoCargosAlta estado)
    {
        var (controlador, dao, _) = Crear(new ResultadoCargosAlta(estado, Motivo: "x"));

        var cuerpo = Cuerpo(await controlador.CrearJugador(Dto()), out var codigo);

        Assert.Equal(201, codigo);
        Assert.Equal(1, dao.Altas);
        Assert.False(cuerpo.GetProperty("cargosGenerados").GetBoolean());
        Assert.Contains("primer pago", cuerpo.GetProperty("avisoCargos").GetString());
    }

    [Fact]
    public async Task UnAltaIncompleta_NoLlegaAlAdministrativoNiToca_LaBase()
    {
        var (controlador, dao, admin) = Crear(new ResultadoCargosAlta(EstadoCargosAlta.Generados));
        var dto = Dto();
        dto.Genero = "";

        Assert.IsType<BadRequestObjectResult>(await controlador.CrearJugador(dto));
        Assert.Equal(0, dao.Altas);
        Assert.Empty(admin.JugadoresConsultados);
    }

    private sealed class AdministrativoFalso(ResultadoCargosAlta resultado) : IEstadoDeudaClient
    {
        public List<int> JugadoresConsultados { get; } = new();

        public Task<ResultadoCargosAlta> GenerarCargosDeAltaAsync(int idJugador, CancellationToken ct = default)
        {
            JugadoresConsultados.Add(idJugador);
            return Task.FromResult(resultado);
        }

        public Task<ConsultaEstadoDeuda> PorDniAsync(string dni, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyDictionary<string, EstadoDeudaAdministrativo>?> PorLoteAsync(IEnumerable<string> dnis, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<string, EstadoDeudaAdministrativo>?>(null);
    }

    private sealed class DaoFalso : IJugadorDao
    {
        public int Altas { get; private set; }

        public Task<int> CrearAsync(JugadorAlta dto)
        {
            Altas++;
            return Task.FromResult(42);
        }

        public Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync() => throw new NotSupportedException();
        public Task<JugadorDetalle?> ObtenerPorIdAsync(int id) => throw new NotSupportedException();
        public Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria) => throw new NotSupportedException();
        public Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador) => throw new NotSupportedException();
        public Task<ResultadoBajaJugador> EliminarAsync(int idJugador) => throw new NotSupportedException();
        public Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni) => throw new NotSupportedException();
        public Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email) => throw new NotSupportedException();
    }

    private sealed class AccesoFalso : ICurrentUserAccess
    {
        public bool IsAdmin => true;
        public bool IsDirectorTecnico => false;
        public bool IsCategoryScoped => false;
        public IReadOnlySet<int> CategoriaIds => new HashSet<int>();
        public bool PuedeAccederCategoria(int categoriaId) => true;
        public bool PuedeAccederAlgunaCategoria(IEnumerable<int> categoriaIds) => true;
    }
}
