using Cacc.Dao;
using Cacc.Entities;

namespace Cacc.Api.Development;

public static class DatosIniciales
{
    private static readonly Guid JugadorPruebaId =
        Guid.Parse("7b02c2f7-087e-47ef-bc08-6f96e55b2574");

    public static void Cargar(IServiceProvider services)
    {
        var jugadorRepository = services.GetRequiredService<IJugadorRepository>();
        if (jugadorRepository.ObtenerTodos().Count > 0)
        {
            return;
        }

        jugadorRepository.Agregar(new Jugador(
            JugadorPruebaId,
            "40999888",
            "Jugador",
            "Prueba API",
            new DateOnly(2000, 1, 1),
            "Primera",
            "DELANTERO",
            "CACC",
            true,
            null));
    }
}
