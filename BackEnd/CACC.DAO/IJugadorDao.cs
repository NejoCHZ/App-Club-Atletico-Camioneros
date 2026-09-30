using CACC.Entities;

namespace CACC.DAO
{
    public interface IJugadorDao
    {
        Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync();
        Task<JugadorDetalle?> ObtenerPorIdAsync(int id);
        Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria);
        Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador);
        Task<int> CrearAsync(JugadorAlta jugador);
        Task<bool> EliminarAsync(int idJugador);
        Task<bool> GuardarTutorAsync(int idJugador, string nombre, string apellido, string parentesco, string telefono, string? email);
    }
}