using Microsoft.Data.SqlClient;

namespace CACC.DAO
{
    // Quién hace el pedido que se está atendiendo (id del usuario del token). La API lo fija en cada pedido y las
    // conexiones lo copian a la sesión de SQL Server al abrirse: los triggers de auditoría de la base unificada lo leen
    // con SESSION_CONTEXT('idUsuario') para registrar quién hizo cada cambio.
    public static class ContextoAuditoria
    {
        private static readonly AsyncLocal<int?> _idUsuario = new();

        public static int? IdUsuario
        {
            get => _idUsuario.Value;
            set => _idUsuario.Value = value;
        }
    }

    public static class ConexionAuditada
    {
        // Igual que OpenAsync, pero deja el usuario en el contexto de la sesión. Usar siempre este método para abrir
        // conexiones que puedan escribir: sin él, la auditoría queda sin responsable.
        public static async Task OpenAuditadaAsync(this SqlConnection connection, CancellationToken ct = default)
        {
            await connection.OpenAsync(ct);

            if (ContextoAuditoria.IdUsuario is not int idUsuario)
            {
                return;
            }

            await using var command = new SqlCommand("EXEC sys.sp_set_session_context @clave, @valor;", connection);
            command.Parameters.AddWithValue("@clave", "idUsuario");
            command.Parameters.AddWithValue("@valor", idUsuario);
            await command.ExecuteNonQueryAsync(ct);
        }
    }
}
