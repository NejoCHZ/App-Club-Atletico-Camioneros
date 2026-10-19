using CACC.Entities;
namespace CACC.DAO;
public interface IAsistenciaDao { Task<ResultadoIngreso> RegistrarAsistenciaAsync(string dni, string estadoAcceso, string? observaciones); }
