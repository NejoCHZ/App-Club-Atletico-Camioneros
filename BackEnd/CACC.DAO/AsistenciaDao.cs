using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace CACC.DAO
{
    public class AsistenciaDao : IAsistenciaDao
    {
        public const string Permitido = "PERMITIDO";
        // El Portal Administrativo no respondió y la política configurada deja pasar: queda marcado para revisarlo después.
        public const string SinVerificar = "SIN_VERIFICAR";

        private readonly string _connectionString;

        public AsistenciaDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        // Registra la asistencia de hoy del jugador activo con ese DNI. La deuda ya la resolvió quien llama (la consulta al
        // Portal Administrativo); acá solo se identifica al jugador, se descartan las bajas y se evita duplicar el día.
        public async Task<ResultadoIngreso> RegistrarAsistenciaAsync(string dni, string estadoAcceso, string? observaciones)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAuditadaAsync();
            await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
            try
            {
                const string query = @"SELECT j.PK_id_jugador
                    FROM JUGADORES j WITH (UPDLOCK, HOLDLOCK)
                    INNER JOIN PERSONAS p ON p.PK_id_persona=j.FK_id_persona
                    WHERE p.dni=@Dni AND j.activo=1";
                await using var command = new SqlCommand(query, connection, transaction);
                command.Parameters.AddWithValue("@Dni", dni);
                var ids = new List<int>();
                await using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync()) ids.Add(reader.GetInt32(0));
                }
                if (ids.Count != 1)
                {
                    await transaction.RollbackAsync();
                    return new ResultadoIngreso { Error = ids.Count == 0 ? "El DNI no pertenece a un jugador activo." : "El DNI está asociado a múltiples jugadores." };
                }

                int idJugador = ids[0];
                var result = new ResultadoIngreso { PersonaEncontrada = true, AccesoPermitido = true };

                const string exists = @"SELECT TOP(1) 1 FROM ASISTENCIAS WITH (UPDLOCK,HOLDLOCK)
                    WHERE FK_id_jugador=@IdJugador AND fecha_hora>=CONVERT(date,GETDATE()) AND fecha_hora<DATEADD(day,1,CONVERT(date,GETDATE()))";
                await using var existsCommand = new SqlCommand(exists, connection, transaction);
                existsCommand.Parameters.AddWithValue("@IdJugador", idJugador);
                result.YaRegistrada = await existsCommand.ExecuteScalarAsync() != null;
                if (result.YaRegistrada)
                {
                    result.AsistenciaRegistrada = true;
                    await transaction.CommitAsync();
                    return result;
                }

                const string insert = @"INSERT INTO ASISTENCIAS(FK_id_jugador,fecha_hora,estado_acceso,observaciones)
                    VALUES(@IdJugador,GETDATE(),@Estado,@Observaciones)";
                await using var insertCommand = new SqlCommand(insert, connection, transaction);
                insertCommand.Parameters.AddWithValue("@IdJugador", idJugador);
                insertCommand.Parameters.AddWithValue("@Estado", estadoAcceso);
                string? texto = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
                if (texto is { Length: > 500 }) texto = texto[..500];
                insertCommand.Parameters.AddWithValue("@Observaciones", (object?)texto ?? DBNull.Value);
                result.AsistenciaRegistrada = await insertCommand.ExecuteNonQueryAsync() == 1;

                await transaction.CommitAsync();
                return result;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
