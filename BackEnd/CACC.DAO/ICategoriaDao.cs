using CACC.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CACC.DAO
{
    public interface ICategoriaDao
    {
        Task<IEnumerable<Categoria>> ObtenerTodasAsync();
        Task<IEnumerable<CategoriaConConteo>> ObtenerTodasConConteoAsync();
        Task<Categoria?> ObtenerPorIdAsync(int idCategoria);
        Task<int> CrearAsync(string nombreCategoria);
        Task<bool> ActualizarAsync(int idCategoria, string nombreCategoria);
        Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresPorCategoriaAsync(int idCategoria);
        Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresDisponiblesAsync(int idCategoria, string? search);
        Task<bool> AsignarJugadorAsync(int idCategoria, int idJugador);
        Task<bool> QuitarJugadorAsync(int idCategoria, int idJugador);
    }
}