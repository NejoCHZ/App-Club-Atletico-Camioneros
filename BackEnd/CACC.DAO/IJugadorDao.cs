using CACC.Entities;

namespace CACC.DAO
{
    public interface IJugadorDao
    {
        Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync();
        Task<JugadorDetalle?> ObtenerPorIdAsync(int id);
        Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria);
        Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador);

    }
}