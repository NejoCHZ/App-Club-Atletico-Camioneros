using Cacc.Dao;
using Cacc.Entities;

namespace Cacc.Tests;

public sealed class JugadorRepositoryTests
{
    [Fact]
    public void Agregar_CuandoElDniYaExiste_LanzaExcepcion()
    {
        var repository = new JugadorRepository();
        repository.Agregar(CrearJugador(Guid.NewGuid(), "40111222"));

        Assert.Throws<DniDuplicadoException>(() =>
            repository.Agregar(CrearJugador(Guid.NewGuid(), "40111222")));
    }

    [Fact]
    public async Task Agregar_EnParalelo_MantieneUnicidadDeDni()
    {
        var repository = new JugadorRepository();
        var intentos = Enumerable.Range(0, 20).Select(_ => Task.Run(() =>
        {
            try
            {
                repository.Agregar(CrearJugador(Guid.NewGuid(), "40111222"));
                return true;
            }
            catch (DniDuplicadoException)
            {
                return false;
            }
        }));

        var resultados = await Task.WhenAll(intentos);

        Assert.Single(resultados, resultado => resultado);
        Assert.Single(repository.ObtenerTodos());
    }

    [Fact]
    public void ActualizarYEliminar_ModificanElJugadorEsperado()
    {
        var repository = new JugadorRepository();
        var original = repository.Agregar(CrearJugador(Guid.NewGuid(), "40111222"));

        var actualizado = original with { Nombre = "Martín", AptoFisico = true };

        Assert.True(repository.Actualizar(actualizado));
        Assert.Equal(actualizado, repository.ObtenerPorId(original.Id));
        Assert.True(repository.Eliminar(original.Id));
        Assert.Null(repository.ObtenerPorId(original.Id));
    }

    private static Jugador CrearJugador(Guid id, string dni) =>
        new(id, dni, "Juan", "Pérez", new DateOnly(2000, 1, 1), "Primera", "DEFENSOR", null, false, null);
}
