using CACC.Entities;
namespace CACC.DAO;
public interface IAsistenciaDao
{
    // Registra la asistencia de hoy del jugador activo con ese DNI. La deuda ya la resolvió quien llama (consulta al Portal Administrativo).
    Task<ResultadoIngreso> RegistrarAsistenciaAsync(string dni, string estadoAcceso, string? observaciones);
    Task<IReadOnlyList<Asistencia>> ObtenerHistorialJugadorAsync(
        int idJugador,
        DateTime? desde,
        DateTime? hasta,
        string? estado);
}
