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

        public async Task<int> CrearAsync(StaffAlta staff)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Verificar si la persona ya existe por DNI o insertarla
                var queryCheckPersona = "SELECT PK_id_persona FROM PERSONAS WHERE dni = @Dni;";
                using var cmdCheckPersona = new SqlCommand(queryCheckPersona, connection, transaction);
                cmdCheckPersona.Parameters.AddWithValue("@Dni", staff.Dni);
                var resultPersona = await cmdCheckPersona.ExecuteScalarAsync();

                int idPersona;
                if (resultPersona != null)
                {
                    idPersona = Convert.ToInt32(resultPersona);
                }
                else
                {
                    var queryPersona = @"
                        INSERT INTO PERSONAS (nombre, apellido, dni, fecha_de_nacimiento, genero, domicilio)
                        OUTPUT INSERTED.PK_id_persona
                        VALUES (@Nombre, @Apellido, @Dni, @FechaNacimiento, @Genero, @Domicilio);";

                    using var cmdPersona = new SqlCommand(queryPersona, connection, transaction);
                    cmdPersona.Parameters.AddWithValue("@Nombre", staff.Nombre);
                    cmdPersona.Parameters.AddWithValue("@Apellido", staff.Apellido);
                    cmdPersona.Parameters.AddWithValue("@Dni", staff.Dni);
                    cmdPersona.Parameters.AddWithValue("@FechaNacimiento", staff.FechaNacimiento ?? (object)DBNull.Value);
                    cmdPersona.Parameters.AddWithValue("@Genero", staff.Genero ?? (object)DBNull.Value);
                    cmdPersona.Parameters.AddWithValue("@Domicilio", staff.Domicilio ?? (object)DBNull.Value);

                    idPersona = Convert.ToInt32(await cmdPersona.ExecuteScalarAsync());
                }

                // 2. Generar PK_id_usuario manualmente (la tabla no tiene IDENTITY)
                var queryMaxUsuario = "SELECT ISNULL(MAX(PK_id_usuario), 0) + 1 FROM USUARIOS;";
                using var cmdMaxUsuario = new SqlCommand(queryMaxUsuario, connection, transaction);
                int idUsuario = Convert.ToInt32(await cmdMaxUsuario.ExecuteScalarAsync());

                var queryUsuario = @"
                    INSERT INTO USUARIOS (PK_id_usuario, FK_id_persona, FK_id_rol, email, contrasenia, activo)
                    VALUES (@IdUsuario, @IdPersona, @IdRol, @Email, @Contrasenia, 1);";

                using var cmdUsuario = new SqlCommand(queryUsuario, connection, transaction);
                cmdUsuario.Parameters.AddWithValue("@IdUsuario", idUsuario);
                cmdUsuario.Parameters.AddWithValue("@IdPersona", idPersona);
                cmdUsuario.Parameters.AddWithValue("@IdRol", staff.IdRol);
                cmdUsuario.Parameters.AddWithValue("@Email", staff.Email);
                cmdUsuario.Parameters.AddWithValue("@Contrasenia", staff.ContraseniaHasheada);
                await cmdUsuario.ExecuteNonQueryAsync();

                // 3. Generar PK_id_staff manualmente e insertar en STAFF
                var queryMaxStaff = "SELECT ISNULL(MAX(PK_id_staff), 0) + 1 FROM STAFF;";
                using var cmdMaxStaff = new SqlCommand(queryMaxStaff, connection, transaction);
                int idStaff = Convert.ToInt32(await cmdMaxStaff.ExecuteScalarAsync());

                var queryStaff = @"
                    INSERT INTO STAFF (PK_id_staff, FK_id_usuario)
                    VALUES (@IdStaff, @IdUsuario);";

                using var cmdStaff = new SqlCommand(queryStaff, connection, transaction);
                cmdStaff.Parameters.AddWithValue("@IdStaff", idStaff);
                cmdStaff.Parameters.AddWithValue("@IdUsuario", idUsuario);
                await cmdStaff.ExecuteNonQueryAsync();

                // 4. Asignar categoría en STAFF_CATEGORIAS si fue provista
                if (staff.IdCategoria.HasValue && staff.IdCategoria.Value > 0)
                {
                    var queryMaxStaffCat = "SELECT ISNULL(MAX(PK_id_staff_categoria), 0) + 1 FROM STAFF_CATEGORIAS;";
                    using var cmdMaxStaffCat = new SqlCommand(queryMaxStaffCat, connection, transaction);
                    int idStaffCat = Convert.ToInt32(await cmdMaxStaffCat.ExecuteScalarAsync());

                    var queryStaffCat = @"
                        INSERT INTO STAFF_CATEGORIAS (PK_id_staff_categoria, FK_id_staff, FK_id_categoria)
                        VALUES (@IdStaffCat, @IdStaff, @IdCategoria);";

                    using var cmdStaffCat = new SqlCommand(queryStaffCat, connection, transaction);
                    cmdStaffCat.Parameters.AddWithValue("@IdStaffCat", idStaffCat);
                    cmdStaffCat.Parameters.AddWithValue("@IdStaff", idStaff);
                    cmdStaffCat.Parameters.AddWithValue("@IdCategoria", staff.IdCategoria.Value);
                    await cmdStaffCat.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();
                return idStaff;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}