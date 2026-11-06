using Microsoft.Data.SqlClient;
using System.Data;

namespace CACC.API.Security
{
    // La cuenta sigue activa y el token no fue invalidado (cierre de sesión, cambio de permisos o de contraseña). Es la misma
    // regla que aplica el Portal Administrativo: un token viejo deja de servir en los dos portales a la vez.
    public static class SesionVigente
    {
        // rolPortal: 0 si la cuenta no tiene acceso al Portal Administrativo (personal del Deportivo), 1 o 2 si lo tiene.
        public static async Task<bool> VerificarAsync(string connectionString, int idUsuario, int rolPortal, int tokenVersion, CancellationToken ct = default)
        {
            await using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(ct);
            await using var command = new SqlCommand(rolPortal == 0
                ? "SELECT 1 FROM USUARIOS WHERE PK_id_usuario = @id AND @rol = 0 AND activo = 1 AND token_version = @version"
                : "SELECT 1 FROM USUARIOS WHERE PK_id_usuario = @id AND rol_portal = @rol AND acceso_portal = 1 AND activo = 1 AND token_version = @version", connection);
            command.Parameters.Add("@id", SqlDbType.Int).Value = idUsuario;
            command.Parameters.Add("@rol", SqlDbType.Int).Value = rolPortal;
            command.Parameters.Add("@version", SqlDbType.Int).Value = tokenVersion;
            return await command.ExecuteScalarAsync(ct) is not null;
        }
    }
}
