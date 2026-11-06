using CACC.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CACC.DAO
{
    public interface IJugadorDao
    {
        Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync();
        Task<JugadorDetalle?> ObtenerPorIdAsync(int id);
        Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria);
        Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador);
        Task<int> CrearAsync(JugadorAlta dto);
        Task<ResultadoBajaJugador> EliminarAsync(int idJugador);

        // Borra al jugador solo si no tiene historial. Con historial no toca nada y devuelve RequiereBaja: la baja la registra el
        // Administrativo (que quita las cuotas futuras sin pagos); si no responde, el Deportivo la graba con EliminarAsync.
        Task<ResultadoBajaJugador> EliminarSinHistorialAsync(int idJugador);
        Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni);
        Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email);
    }
}