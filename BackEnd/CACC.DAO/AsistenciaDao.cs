using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace CACC.DAO
{
    public class AsistenciaDao : IAsistenciaDao
    {
        private readonly string _connectionString;

        public AsistenciaDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        public async Task<EstadoDeuda?> ObtenerEstadoDeudaPorDniAsync(string dni)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Consultamos la vista de estado de deuda uniendo con personas por DNI
            var query = @"
                SELECT v.PK_id_jugador, v.deuda_total, v.cantidad_cuotas_vencidas 
                FROM VISTA_ESTADO_DEUDA v
                INNER JOIN JUGADORES j ON v.PK_id_jugador = j.PK_id_jugador
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                WHERE p.dni = @Dni";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Dni", dni);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new EstadoDeuda
                {
                    IdJugador = reader.GetInt32(reader.GetOrdinal("PK_id_jugador")),
                    DeudaTotal = reader.GetDecimal(reader.GetOrdinal("deuda_total")),
                    CantidadCuotasVencidas = reader.GetInt32(reader.GetOrdinal("cantidad_cuotas_vencidas"))
                };
            }

            return null; // Si no es jugador o no se encuentra
        }

        public async Task<bool> RegistrarAsistenciaAsync(string dni, bool estadoAcceso, string? observaciones)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // 1. Primero obtenemos el ID de la persona a partir del DNI
            var queryPersona = "SELECT PK_id_persona FROM PERSONAS WHERE dni = @Dni";
            int? idPersona = null;

            using (var cmdPersona = new SqlCommand(queryPersona, connection))
            {
                cmdPersona.Parameters.AddWithValue("@Dni", dni);
                var result = await cmdPersona.ExecuteScalarAsync();
                if (result != null)
                {
                    idPersona = Convert.ToInt32(result);
                }
            }

            if (idPersona == null) return false;

            // 2. Registramos la asistencia
            var queryAsistencia = @"
                INSERT INTO ASISTENCIAS (FK_id_persona, fecha_hora, estado_acceso, observaciones)
                VALUES (@IdPersona, GETDATE(), @EstadoAcceso, @Observaciones)";

            using var cmdAsistencia = new SqlCommand(queryAsistencia, connection);
            cmdAsistencia.Parameters.AddWithValue("@IdPersona", idPersona.Value);
            cmdAsistencia.Parameters.AddWithValue("@EstadoAcceso", estadoAcceso);
            cmdAsistencia.Parameters.AddWithValue("@Observaciones", (object?)observaciones ?? DBNull.Value);

            int filasAfectadas = await cmdAsistencia.ExecuteNonQueryAsync();
            return filasAfectadas > 0;
        }
    }
}