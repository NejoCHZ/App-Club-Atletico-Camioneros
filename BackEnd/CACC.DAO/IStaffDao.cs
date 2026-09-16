using CACC.Entities;

namespace CACC.DAO
{
    public interface IStaffDao
    {
        Task<IEnumerable<Persona>> ObtenerStaffGeneralAsync();
    }
}