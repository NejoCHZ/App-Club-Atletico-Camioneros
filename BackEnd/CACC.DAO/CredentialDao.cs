using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace CACC.DAO;

public sealed class CredentialDao(IConfiguration configuration) : ICredentialDao
{
    private readonly string connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string no configurado.");

    public async Task<Guid?> GetOrCreateActiveCredentialForPlayerAsync(int playerId, CancellationToken ct)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAuditadaAsync(ct);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(ct);
        const string personSql = "SELECT FK_id_persona FROM dbo.JUGADORES WHERE PK_id_jugador=@PlayerId;";
        await using var person = new SqlCommand(personSql, connection, transaction);
        person.Parameters.AddWithValue("@PlayerId", playerId);
        var result = await person.ExecuteScalarAsync(ct);
        if (result is null or DBNull) { await transaction.RollbackAsync(ct); return null; }
        var personId = Convert.ToInt32(result);

        const string findSql = "SELECT id_credencial FROM dbo.CREDENCIALES_QR WITH (UPDLOCK,HOLDLOCK) WHERE FK_id_persona=@PersonId AND activa=1 AND fecha_revocacion IS NULL;";
        await using var find = new SqlCommand(findSql, connection, transaction);
        find.Parameters.AddWithValue("@PersonId", personId);
        var existing = await find.ExecuteScalarAsync(ct);
        var id = existing is Guid value ? value : Guid.NewGuid();
        if (existing is null)
        {
            await using var insert = new SqlCommand("INSERT dbo.CREDENCIALES_QR(id_credencial,FK_id_persona) VALUES(@Id,@PersonId);", connection, transaction);
            insert.Parameters.AddWithValue("@Id", id); insert.Parameters.AddWithValue("@PersonId", personId);
            await insert.ExecuteNonQueryAsync(ct);
        }
        await transaction.CommitAsync(ct);
        return id;
    }

    public async Task<string?> GetActiveDniAsync(Guid credentialId, CancellationToken ct)
    {
        await using var connection = new SqlConnection(connectionString); await connection.OpenAuditadaAsync(ct);
        const string sql = "SELECT p.dni FROM dbo.CREDENCIALES_QR c JOIN dbo.PERSONAS p ON p.PK_id_persona=c.FK_id_persona WHERE c.id_credencial=@Id AND c.activa=1 AND c.fecha_revocacion IS NULL;";
        await using var command = new SqlCommand(sql, connection); command.Parameters.AddWithValue("@Id", credentialId);
        return (string?)await command.ExecuteScalarAsync(ct);
    }

    public async Task<CredentialPlayerData?> GetPlayerAsync(int playerId, CancellationToken ct)
    {
        await using var connection = new SqlConnection(connectionString); await connection.OpenAuditadaAsync(ct);
        const string sql = "SELECT j.PK_id_jugador,p.nombre,p.apellido,p.dni FROM dbo.JUGADORES j JOIN dbo.PERSONAS p ON p.PK_id_persona=j.FK_id_persona WHERE j.PK_id_jugador=@Id;";
        await using var command = new SqlCommand(sql, connection); command.Parameters.AddWithValue("@Id", playerId);
        await using var reader = await command.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? new(reader.GetInt32(0), reader.GetString(1), reader.GetString(2), reader.GetString(3)) : null;
    }
}
