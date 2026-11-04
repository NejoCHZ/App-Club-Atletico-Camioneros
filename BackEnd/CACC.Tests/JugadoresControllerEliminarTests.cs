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

// Borrar un jugador: sin historial se elimina por completo (su DNI queda libre); con historial es una baja logica.
public class JugadoresControllerEliminarTests
{
    private static async Task<(int? codigo, JsonElement cuerpo)> Borrar(ResultadoBajaJugador resultado)
    {
        var controlador = new JugadoresController(new DaoFalso(resultado), new AccesoFalso(), new AdministrativoFalso())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
        var objeto = Assert.IsAssignableFrom<ObjectResult>(await controlador.EliminarJugador(7));
        return (objeto.StatusCode, JsonDocument.Parse(JsonSerializer.Serialize(objeto.Value)).RootElement.Clone());
    }

    [Fact]
    public async Task SinHistorial_SeEliminaYElMensajeDiceQueElDniQuedoLibre()
    {
        var (codigo, cuerpo) = await Borrar(ResultadoBajaJugador.Eliminado);

        Assert.Equal(200, codigo);
        Assert.True(cuerpo.GetProperty("eliminado").GetBoolean());
        Assert.Contains("DNI quedó libre", cuerpo.GetProperty("message").GetString());
    }

    [Fact]
    public async Task ConHistorial_EsUnaBajaLogicaYSeConservaTodo()
    {
        var (codigo, cuerpo) = await Borrar(ResultadoBajaJugador.DadoDeBaja);

        Assert.Equal(200, codigo);
        Assert.False(cuerpo.GetProperty("eliminado").GetBoolean());
        Assert.Contains("historial se conserva", cuerpo.GetProperty("message").GetString());
    }

    [Fact]
    public async Task UnJugadorQueNoExiste_Da404()
    {
        var (codigo, _) = await Borrar(ResultadoBajaJugador.NoEncontrado);

        Assert.Equal(404, codigo);
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

    private sealed class AdministrativoFalso : IEstadoDeudaClient
    {
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
