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
        Task<int> CrearAsync(string nombreCategoria, string asociacion);
        Task<bool> ActualizarAsync(int idCategoria, string nombreCategoria, string asociacion);
        Task<bool> EliminarAsync(int idCategoria);
        Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresPorCategoriaAsync(int idCategoria);
        Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresDisponiblesAsync(int idCategoria, string? search);
        Task<bool> AsignarJugadorAsync(int idCategoria, int idJugador);
        Task<bool> QuitarJugadorAsync(int idCategoria, int idJugador);
        Task<IEnumerable<StaffPlantel>> ObtenerStaffPorCategoriaAsync(int idCategoria);
        Task<IEnumerable<StaffPlantel>> ObtenerStaffDisponibleAsync(int idCategoria, string? search = null);
        Task<bool> AsignarStaffAsync(int idCategoria, int idStaff);
        Task<bool> QuitarStaffAsync(int idCategoria, int idStaff);
        Task<IEnumerable<PartidoDetalle>> ObtenerPartidosPorCategoriaAsync(int idCategoria);
        Task<PartidoDetalle?> ObtenerPartidoPorIdAsync(int idPartido);
        Task<int> RegistrarPartidoAsync(PartidoAlta partido);
        Task<bool> ActualizarPartidoAsync(PartidoEdicion partido);
        Task<bool> EliminarPartidoAsync(int idPartido);
    }
}