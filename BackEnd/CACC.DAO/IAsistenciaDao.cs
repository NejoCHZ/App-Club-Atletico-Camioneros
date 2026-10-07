using CACC.Entities;

namespace CACC.DAO
{
    public interface IAsistenciaDao
    {
        Task<bool> RegistrarAsistenciaAsync(string dni, bool estadoAcceso, string observaciones);
        Task<EstadoDeuda?> ObtenerEstadoDeudaPorDniAsync(string dni);
    }
}