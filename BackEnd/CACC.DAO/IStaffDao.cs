using CACC.Entities;

namespace CACC.DAO
{
    public interface IStaffDao
    {
        Task<IEnumerable<Persona>> ObtenerStaffGeneralAsync();
        Task<IEnumerable<StaffDetalle>> ObtenerTodosAsync();
        Task<int> CrearAsync(StaffAlta staff);
    }
}