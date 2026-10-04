using CACC.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CACC.DAO
{
    public interface IStaffDao
    {
        Task<IEnumerable<Persona>> ObtenerStaffGeneralAsync();
        Task<IEnumerable<StaffDetalle>> ObtenerTodosAsync(int? rolId = null);
        Task<StaffDetalle?> ObtenerPorIdAsync(int idStaff);
        Task<int> CrearAsync(StaffAlta staff);
    }
}