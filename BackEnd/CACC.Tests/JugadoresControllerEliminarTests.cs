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

// Borrar un jugador: sin historial se elimina por completo (su DNI queda libre); con historial es una baja logica y se le
// avisa al Administrativo para que quite las cuotas futuras sin pagos.
public class JugadoresControllerEliminarTests
{
    private static async Task<(int? codigo, JsonElement cuerpo, AdministrativoFalso admin)> Borrar(
        ResultadoBajaJugador resultado, ResultadoBajaInformada? informada = null)
    {
        var admin = new AdministrativoFalso(informada ?? new ResultadoBajaInformada(EstadoBajaInformada.Informada));
        var controlador = new JugadoresController(new DaoFalso(resultado), new AccesoFalso(), admin)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
        var objeto = Assert.IsAssignableFrom<ObjectResult>(await controlador.EliminarJugador(7));
        return (objeto.StatusCode, JsonDocument.Parse(JsonSerializer.Serialize(objeto.Value)).RootElement.Clone(), admin);
    }

    [Fact]
    public async Task SinHistorial_SeEliminaYElMensajeDiceQueElDniQuedoLibre_SinAvisarAlAdministrativo()
    {
        var (codigo, cuerpo, admin) = await Borrar(ResultadoBajaJugador.Eliminado);

        Assert.Equal(200, codigo);
        Assert.True(cuerpo.GetProperty("eliminado").GetBoolean());
        Assert.Contains("DNI quedó libre", cuerpo.GetProperty("message").GetString());
        Assert.Empty(admin.BajasInformadas);   // no hay cuotas ni becas que quitar
    }

    [Fact]
    public async Task ConHistorial_EsUnaBajaLogica_YSeLeAvisaAlAdministrativoParaQuitarLasCuotasFuturas()
    {
        var (codigo, cuerpo, admin) = await Borrar(ResultadoBajaJugador.DadoDeBaja,
            new ResultadoBajaInformada(EstadoBajaInformada.Informada, CuotasFuturasQuitadas: 3, BeneficiosCancelados: 1));

        Assert.Equal(200, codigo);
        Assert.False(cuerpo.GetProperty("eliminado").GetBoolean());
        Assert.Contains("historial se conserva", cuerpo.GetProperty("message").GetString());
        Assert.Equal(new[] { 7 }, admin.BajasInformadas);
        Assert.Equal(3, cuerpo.GetProperty("cuotasFuturasQuitadas").GetInt32());
        Assert.Equal(JsonValueKind.Null, cuerpo.GetProperty("avisoBaja").ValueKind);
    }

    [Theory]
    [InlineData(EstadoBajaInformada.NoResponde)]
    [InlineData(EstadoBajaInformada.Rechazada)]
    public async Task SiElAdministrativoNoPuedeQuitarLasCuotas_LaBajaIgualQuedaHechaYSeAvisa(EstadoBajaInformada estado)
    {
        var (codigo, cuerpo, _) = await Borrar(ResultadoBajaJugador.DadoDeBaja, new ResultadoBajaInformada(estado, Motivo: "x"));

        Assert.Equal(200, codigo);
        Assert.False(cuerpo.GetProperty("eliminado").GetBoolean());
        Assert.Equal(JsonValueKind.Null, cuerpo.GetProperty("cuotasFuturasQuitadas").ValueKind);
        Assert.Contains("próxima revisión", cuerpo.GetProperty("avisoBaja").GetString());
    }

    [Fact]
    public async Task UnJugadorQueNoExiste_Da404_SinAvisarAlAdministrativo()
    {
        var (codigo, _, admin) = await Borrar(ResultadoBajaJugador.NoEncontrado);

        Assert.Equal(404, codigo);
        Assert.Empty(admin.BajasInformadas);
    }

    private sealed class DaoFalso(ResultadoBajaJugador resultado) : IJugadorDao
    {
        public Task<ResultadoBajaJugador> EliminarAsync(int idJugador) => Task.FromResult(resultado);

        public Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync() => throw new NotSupportedException();
        public Task<JugadorDetalle?> ObtenerPorIdAsync(int id) => throw new NotSupportedException();
        public Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria) => throw new NotSupportedException();
        public Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador) => throw new NotSupportedException();
        public Task<int> CrearAsync(JugadorAlta dto) => throw new NotSupportedException();
        public Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni) => throw new NotSupportedException();
        public Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email) => throw new NotSupportedException();
    }

    private sealed class AdministrativoFalso(ResultadoBajaInformada baja) : IEstadoDeudaClient
    {
        public List<int> BajasInformadas { get; } = new();

        public Task<ResultadoBajaInformada> InformarBajaAsync(int idJugador, CancellationToken ct = default)
        {
            BajasInformadas.Add(idJugador);
            return Task.FromResult(baja);
        }

        public Task<ResultadoCargosAlta> GenerarCargosDeAltaAsync(int idJugador, CancellationToken ct = default) => throw new NotSupportedException();
        public Task<ConsultaEstadoDeuda> PorDniAsync(string dni, CancellationToken ct = default) => throw new NotSupportedException();
        public Task<IReadOnlyDictionary<string, EstadoDeudaAdministrativo>?> PorLoteAsync(IEnumerable<string> dnis, CancellationToken ct = default) => throw new NotSupportedException();
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
