using Cacc.Api.Development;
using Cacc.Dao;
using Microsoft.Extensions.DependencyInjection;

namespace Cacc.Tests;

public sealed class DatosInicialesTests
{
    [Fact]
    public void Cargar_DosVeces_AgregaUnSoloJugadorDePrueba()
    {
        var services = new ServiceCollection()
            .AddSingleton<IJugadorRepository, JugadorRepository>()
            .BuildServiceProvider();

        DatosIniciales.Cargar(services);
        DatosIniciales.Cargar(services);

        var jugadores = services.GetRequiredService<IJugadorRepository>().ObtenerTodos();
        var jugador = Assert.Single(jugadores);
        Assert.Equal("40999888", jugador.Dni);
        Assert.Equal("Jugador", jugador.Nombre);
        Assert.Equal("Prueba API", jugador.Apellido);
        Assert.Equal("DELANTERO", jugador.Posicion);
    }
}
