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
        Task<bool> EliminarAsync(int idCategoria);
        Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresPorCategoriaAsync(int idCategoria);
        Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresDisponiblesAsync(int idCategoria, string? search);
        Task<bool> AsignarJugadorAsync(int idCategoria, int idJugador);
        Task<bool> QuitarJugadorAsync(int idCategoria, int idJugador);

        // Métodos para Cuerpo Técnico (DT y PF)
        Task<IEnumerable<StaffPlantel>> ObtenerStaffPorCategoriaAsync(int idCategoria);
        Task<IEnumerable<StaffPlantel>> ObtenerStaffDisponibleAsync(int idCategoria, string? search = null);
        Task<bool> AsignarStaffAsync(int idCategoria, int idStaff);
        Task<bool> QuitarStaffAsync(int idCategoria, int idStaff);
    }
}