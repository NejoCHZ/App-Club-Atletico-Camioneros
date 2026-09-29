using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

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

        public async Task<IEnumerable<StaffDetalle>> ObtenerTodosAsync()
        {
            var lista = new List<StaffDetalle>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT 
                    s.PK_id_staff AS IdStaff,
                    u.PK_id_usuario AS IdUsuario,
                    p.PK_id_persona AS IdPersona,
                    p.nombre AS Nombre,
                    p.apellido AS Apellido,
                    p.dni AS Dni,
                    p.fecha_de_nacimiento AS FechaDeNacimiento,
                    p.genero AS Genero,
                    u.email AS Email,
                    r.nombre_rol AS Rol,
                    ISNULL((
                        SELECT STRING_AGG(c.nombre_categoria, ', ')
                        FROM STAFF_CATEGORIAS sc
                        INNER JOIN CATEGORIAS c ON sc.FK_id_categoria = c.PK_id_categoria
                        WHERE sc.FK_id_staff = s.PK_id_staff
                    ), 'Todas / General') AS CategoriaAsignada,
                    ISNULL(u.activo, 1) AS Activo
                FROM STAFF s
                INNER JOIN USUARIOS u ON s.FK_id_usuario = u.PK_id_usuario
                INNER JOIN PERSONAS p ON u.FK_id_persona = p.PK_id_persona
                INNER JOIN ROLES r ON u.FK_id_rol = r.PK_id_rol";

            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lista.Add(new StaffDetalle
                {
                    IdStaff = reader.GetInt32(reader.GetOrdinal("IdStaff")),
                    IdUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario")),
                    IdPersona = reader.GetInt32(reader.GetOrdinal("IdPersona")),
                    Nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre")),
                    Apellido = reader.IsDBNull(reader.GetOrdinal("Apellido")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido")),
                    Dni = reader.IsDBNull(reader.GetOrdinal("Dni")) ? string.Empty : reader.GetString(reader.GetOrdinal("Dni")),
                    FechaDeNacimiento = reader.IsDBNull(reader.GetOrdinal("FechaDeNacimiento"))
                        ? null
                        : reader.GetDateTime(reader.GetOrdinal("FechaDeNacimiento")),
                    Genero = reader.IsDBNull(reader.GetOrdinal("Genero")) ? null : reader.GetString(reader.GetOrdinal("Genero")),
                    Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? string.Empty : reader.GetString(reader.GetOrdinal("Email")),
                    Rol = reader.IsDBNull(reader.GetOrdinal("Rol")) ? string.Empty : reader.GetString(reader.GetOrdinal("Rol")),
                    CategoriaAsignada = reader.IsDBNull(reader.GetOrdinal("CategoriaAsignada")) ? "Todas / General" : reader.GetString(reader.GetOrdinal("CategoriaAsignada")),
                    Activo = reader.IsDBNull(reader.GetOrdinal("Activo")) || reader.GetBoolean(reader.GetOrdinal("Activo"))
                });
            }

            return lista;
        }
    }
}