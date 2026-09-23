using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace CACC.DAO
{
    public class FichaMedicaDao : IFichaMedicaDao
    {
        private readonly string _connectionString;

        public FichaMedicaDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        public async Task<FichaMedica?> ObtenerPorJugadorIdAsync(int idJugador)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT PK_id_ficha_medica, FK_id_jugador, obra_social, numero_afiliado_os, 
                       grupo_sanguineo, factor, antecedentes_salud, medicamentos_cronicos, 
                       condiciones_cronicas, apto_fisico_vencimiento, observaciones, fecha_actualizacion 
                FROM FICHAS_MEDICAS 
                WHERE FK_id_jugador = @IdJugador";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdJugador", idJugador);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapearFichaMedica(reader);
            }

            return null;
        }

        public async Task<bool> CrearAsync(FichaMedica ficha)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                INSERT INTO FICHAS_MEDICAS 
                (FK_id_jugador, obra_social, numero_afiliado_os, grupo_sanguineo, factor, 
                 antecedentes_salud, medicamentos_cronicos, condiciones_cronicas, 
                 apto_fisico_vencimiento, observaciones, fecha_actualizacion)
                VALUES 
                (@IdJugador, @ObraSocial, @NumeroAfiliadoOs, @GrupoSanguineo, @Factor, 
                 @AntecedentesSalud, @MedicamentosCronicos, @CondicionesCronicas, 
                 @AptoFisicoVencimiento, @Observaciones, GETDATE())";

            using var command = new SqlCommand(query, connection);
            AgregarParametrosFicha(command, ficha);

            int filasAfectadas = await command.ExecuteNonQueryAsync();
            return filasAfectadas > 0;
        }

        public async Task<bool> ActualizarAsync(FichaMedica ficha)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                UPDATE FICHAS_MEDICAS SET 
                    obra_social = @ObraSocial,
                    numero_afiliado_os = @NumeroAfiliadoOs,
                    grupo_sanguineo = @GrupoSanguineo,
                    factor = @Factor,
                    antecedentes_salud = @AntecedentesSalud,
                    medicamentos_cronicos = @MedicamentosCronicos,
                    condiciones_cronicas = @CondicionesCronicas,
                    apto_fisico_vencimiento = @AptoFisicoVencimiento,
                    observaciones = @Observaciones,
                    fecha_actualizacion = GETDATE()
                WHERE PK_id_ficha_medica = @IdFichaMedica";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdFichaMedica", ficha.IdFichaMedica);
            AgregarParametrosFicha(command, ficha);

            int filasAfectadas = await command.ExecuteNonQueryAsync();
            return filasAfectadas > 0;
        }

        private void AgregarParametrosFicha(SqlCommand command, FichaMedica ficha)
        {
            command.Parameters.AddWithValue("@IdJugador", ficha.IdJugador);
            command.Parameters.AddWithValue("@ObraSocial", (object?)ficha.ObraSocial ?? DBNull.Value);
            command.Parameters.AddWithValue("@NumeroAfiliadoOs", (object?)ficha.NumeroAfiliadoOs ?? DBNull.Value);
            command.Parameters.AddWithValue("@GrupoSanguineo", (object?)ficha.GrupoSanguineo ?? DBNull.Value);
            command.Parameters.AddWithValue("@Factor", (object?)ficha.Factor ?? DBNull.Value);
            command.Parameters.AddWithValue("@AntecedentesSalud", (object?)ficha.AntecedentesSalud ?? DBNull.Value);
            command.Parameters.AddWithValue("@MedicamentosCronicos", (object?)ficha.MedicamentosCronicos ?? DBNull.Value);
            command.Parameters.AddWithValue("@CondicionesCronicas", (object?)ficha.CondicionesCronicas ?? DBNull.Value);
            command.Parameters.AddWithValue("@AptoFisicoVencimiento", (object?)ficha.AptoFisicoVencimiento ?? DBNull.Value);
            command.Parameters.AddWithValue("@Observaciones", (object?)ficha.Observaciones ?? DBNull.Value);
        }

        private FichaMedica MapearFichaMedica(SqlDataReader reader)
        {
            return new FichaMedica
            {
                IdFichaMedica = reader.GetInt32(reader.GetOrdinal("PK_id_ficha_medica")),
                IdJugador = reader.GetInt32(reader.GetOrdinal("FK_id_jugador")),
                ObraSocial = reader.IsDBNull(reader.GetOrdinal("obra_social")) ? null : reader.GetString(reader.GetOrdinal("obra_social")),
                NumeroAfiliadoOs = reader.IsDBNull(reader.GetOrdinal("numero_afiliado_os")) ? null : reader.GetInt32(reader.GetOrdinal("numero_afiliado_os")),
                GrupoSanguineo = reader.IsDBNull(reader.GetOrdinal("grupo_sanguineo")) ? null : reader.GetString(reader.GetOrdinal("grupo_sanguineo")),
                // Corregido: Obtenemos el string directamente sin usar indexación numérica en el ordinal
                Factor = reader.IsDBNull(reader.GetOrdinal("factor")) ? null : reader.GetString(reader.GetOrdinal("factor")),
                AntecedentesSalud = reader.IsDBNull(reader.GetOrdinal("antecedentes_salud")) ? null : reader.GetString(reader.GetOrdinal("antecedentes_salud")),
                MedicamentosCronicos = reader.IsDBNull(reader.GetOrdinal("medicamentos_cronicos")) ? null : reader.GetString(reader.GetOrdinal("medicamentos_cronicos")),
                CondicionesCronicas = reader.IsDBNull(reader.GetOrdinal("condiciones_cronicas")) ? null : reader.GetString(reader.GetOrdinal("condiciones_cronicas")),
                AptoFisicoVencimiento = reader.IsDBNull(reader.GetOrdinal("apto_fisico_vencimiento")) ? null : reader.GetDateTime(reader.GetOrdinal("apto_fisico_vencimiento")),
                Observaciones = reader.IsDBNull(reader.GetOrdinal("observaciones")) ? null : reader.GetString(reader.GetOrdinal("observaciones")),
                FechaActualizacion = reader.IsDBNull(reader.GetOrdinal("fecha_actualizacion")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_actualizacion"))
            };
        }
    }
}