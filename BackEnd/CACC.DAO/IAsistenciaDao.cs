using CACC.Entities;
namespace CACC.DAO;
public interface IAsistenciaDao
{
    Task<ResultadoIngreso> ProcesarIngresoAsync(string dni, string metodoRegistro);
    Task<IReadOnlyList<Asistencia>> ObtenerHistorialJugadorAsync(
        int idJugador,
        DateTime? desde,
        DateTime? hasta,
        string? estado);
    Task<IReadOnlyList<Asistencia>> ObtenerHistorialStaffAsync(
        int idStaff,
        DateTime? desde,
        DateTime? hasta,
        string? estado);
}
