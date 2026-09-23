using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace CACC.DAO
{
    public class StaffDao : IStaffDao
    {
        private readonly string _connectionString;

        public StaffDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        public async Task<IEnumerable<Persona>> ObtenerStaffGeneralAsync()
        {
            var listaStaff = new List<Persona>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT p.PK_id_persona, p.genero, p.fecha_de_nacimiento, p.dni, p.nombre, p.apellido
                FROM STAFF s
                INNER JOIN USUARIOS u ON s.FK_id_usuario = u.PK_id_usuario
                INNER JOIN PERSONAS p ON u.FK_id_persona = p.PK_id_persona";

            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                listaStaff.Add(new Persona
                {
                    IdPersona = reader.GetInt32(reader.GetOrdinal("PK_id_persona")),
                    Genero = reader.IsDBNull(reader.GetOrdinal("genero")) ? null : reader.GetString(reader.GetOrdinal("genero")),
                    FechaDeNacimiento = reader.IsDBNull(reader.GetOrdinal("fecha_de_nacimiento")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_de_nacimiento")),
                    Dni = reader.GetString(reader.GetOrdinal("dni")),
                    Nombre = reader.GetString(reader.GetOrdinal("nombre")),
                    Apellido = reader.GetString(reader.GetOrdinal("apellido"))
                });
            }

            return listaStaff;
        }
    }
}