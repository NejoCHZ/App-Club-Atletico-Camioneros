using CACC.Entities;

namespace CACC.DAO
{
    public interface IJugadorDao
    {
        Task<IEnumerable<Jugador>> ObtenerTodosAsync();
        Task<Jugador?> ObtenerPorIdAsync(int id);
        Task<IEnumerable<Jugador>> ObtenerPorCategoriaAsync(int idCategoria);
    }
}