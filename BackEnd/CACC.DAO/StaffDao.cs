using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

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

            const string query = @"
                SELECT p.PK_id_persona, p.genero, p.fecha_de_nacimiento, p.dni, p.nombre, p.apellido
                FROM STAFF s
                INNER JOIN USUARIOS u ON s.FK_id_usuario = u.PK_id_usuario
                INNER JOIN PERSONAS p ON u.FK_id_persona = p.PK_id_persona;";

            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                listaStaff.Add(new Persona
                {
                    IdPersona = reader.GetInt32(reader.GetOrdinal("PK_id_persona")),
                    Genero = reader.IsDBNull(reader.GetOrdinal("genero")) ? null : reader.GetString(reader.GetOrdinal("genero")),
                    FechaDeNacimiento = reader.IsDBNull(reader.GetOrdinal("fecha_de_nacimiento")) ? null : reader.GetDateTime(reader.GetOrdinal("fecha_de_nacimiento")),
                    Dni = reader.IsDBNull(reader.GetOrdinal("dni")) ? string.Empty : reader.GetString(reader.GetOrdinal("dni")),
                    Nombre = reader.IsDBNull(reader.GetOrdinal("nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("nombre")),
                    Apellido = reader.IsDBNull(reader.GetOrdinal("apellido")) ? string.Empty : reader.GetString(reader.GetOrdinal("apellido"))
                });
            }

            return listaStaff;
        }

        public async Task<IEnumerable<StaffDetalle>> ObtenerTodosAsync(int? rolId = null)
        {
            var lista = new List<StaffDetalle>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 
                    s.PK_id_staff AS IdStaff,
                    u.PK_id_usuario AS IdUsuario,
                    p.PK_id_persona AS IdPersona,
                    p.nombre AS Nombre,
                    p.apellido AS Apellido,
                    p.dni AS Dni,
                    p.fecha_de_nacimiento AS FechaDeNacimiento,
                    p.genero AS Genero,
                    p.domicilio AS Domicilio,
                    u.email AS Email,
                    r.PK_id_rol AS IdRol,
                    r.nombre_rol AS Rol,
                    (SELECT TOP 1 sc.FK_id_categoria FROM STAFF_CATEGORIAS sc WHERE sc.FK_id_staff = s.PK_id_staff) AS IdCategoriaAsignada,
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
                INNER JOIN ROLES r ON u.FK_id_rol = r.PK_id_rol
                WHERE (@RolId IS NULL OR r.PK_id_rol = @RolId)
                ORDER BY r.PK_id_rol ASC, p.apellido ASC, p.nombre ASC;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@RolId", (object?)rolId ?? DBNull.Value);

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
                    FechaDeNacimiento = reader.IsDBNull(reader.GetOrdinal("FechaDeNacimiento")) ? null : reader.GetDateTime(reader.GetOrdinal("FechaDeNacimiento")),
                    Genero = reader.IsDBNull(reader.GetOrdinal("Genero")) ? null : reader.GetString(reader.GetOrdinal("Genero")),
                    Domicilio = reader.IsDBNull(reader.GetOrdinal("Domicilio")) ? null : reader.GetString(reader.GetOrdinal("Domicilio")),
                    Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? string.Empty : reader.GetString(reader.GetOrdinal("Email")),
                    IdRol = reader.GetInt32(reader.GetOrdinal("IdRol")),
                    Rol = reader.IsDBNull(reader.GetOrdinal("Rol")) ? string.Empty : reader.GetString(reader.GetOrdinal("Rol")),
                    IdCategoriaAsignada = reader.IsDBNull(reader.GetOrdinal("IdCategoriaAsignada")) ? null : reader.GetInt32(reader.GetOrdinal("IdCategoriaAsignada")),
                    CategoriaAsignada = reader.IsDBNull(reader.GetOrdinal("CategoriaAsignada")) ? "Todas / General" : reader.GetString(reader.GetOrdinal("CategoriaAsignada")),
                    Activo = reader.IsDBNull(reader.GetOrdinal("Activo")) || reader.GetBoolean(reader.GetOrdinal("Activo"))
                });
            }

            return lista;
        }

        public async Task<StaffDetalle?> ObtenerPorIdAsync(int idStaff)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 
                    s.PK_id_staff AS IdStaff,
                    u.PK_id_usuario AS IdUsuario,
                    p.PK_id_persona AS IdPersona,
                    p.nombre AS Nombre,
                    p.apellido AS Apellido,
                    p.dni AS Dni,
                    p.fecha_de_nacimiento AS FechaDeNacimiento,
                    p.genero AS Genero,
                    p.domicilio AS Domicilio,
                    u.email AS Email,
                    r.PK_id_rol AS IdRol,
                    r.nombre_rol AS Rol,
                    (SELECT TOP 1 sc.FK_id_categoria FROM STAFF_CATEGORIAS sc WHERE sc.FK_id_staff = s.PK_id_staff) AS IdCategoriaAsignada,
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
                INNER JOIN ROLES r ON u.FK_id_rol = r.PK_id_rol
                WHERE s.PK_id_staff = @IdStaff;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdStaff", idStaff);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new StaffDetalle
                {
                    IdStaff = reader.GetInt32(reader.GetOrdinal("IdStaff")),
                    IdUsuario = reader.GetInt32(reader.GetOrdinal("IdUsuario")),
                    IdPersona = reader.GetInt32(reader.GetOrdinal("IdPersona")),
                    Nombre = reader.IsDBNull(reader.GetOrdinal("Nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("Nombre")),
                    Apellido = reader.IsDBNull(reader.GetOrdinal("Apellido")) ? string.Empty : reader.GetString(reader.GetOrdinal("Apellido")),
                    Dni = reader.IsDBNull(reader.GetOrdinal("Dni")) ? string.Empty : reader.GetString(reader.GetOrdinal("Dni")),
                    FechaDeNacimiento = reader.IsDBNull(reader.GetOrdinal("FechaDeNacimiento")) ? null : reader.GetDateTime(reader.GetOrdinal("FechaDeNacimiento")),
                    Genero = reader.IsDBNull(reader.GetOrdinal("Genero")) ? null : reader.GetString(reader.GetOrdinal("Genero")),
                    Domicilio = reader.IsDBNull(reader.GetOrdinal("Domicilio")) ? null : reader.GetString(reader.GetOrdinal("Domicilio")),
                    Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? string.Empty : reader.GetString(reader.GetOrdinal("Email")),
                    IdRol = reader.GetInt32(reader.GetOrdinal("IdRol")),
                    Rol = reader.IsDBNull(reader.GetOrdinal("Rol")) ? string.Empty : reader.GetString(reader.GetOrdinal("Rol")),
                    IdCategoriaAsignada = reader.IsDBNull(reader.GetOrdinal("IdCategoriaAsignada")) ? null : reader.GetInt32(reader.GetOrdinal("IdCategoriaAsignada")),
                    CategoriaAsignada = reader.IsDBNull(reader.GetOrdinal("CategoriaAsignada")) ? "Todas / General" : reader.GetString(reader.GetOrdinal("CategoriaAsignada")),
                    Activo = reader.IsDBNull(reader.GetOrdinal("Activo")) || reader.GetBoolean(reader.GetOrdinal("Activo"))
                };
            }

            return null;
        }

        public async Task<int> CrearAsync(StaffAlta staff)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Verificar si la persona ya existe por DNI o insertarla
                const string queryCheckPersona = "SELECT PK_id_persona FROM PERSONAS WHERE dni = @Dni;";
                using var cmdCheckPersona = new SqlCommand(queryCheckPersona, connection, transaction);
                cmdCheckPersona.Parameters.AddWithValue("@Dni", staff.Dni.Trim());
                var resultPersona = await cmdCheckPersona.ExecuteScalarAsync();

                int idPersona;
                if (resultPersona != null && resultPersona != DBNull.Value)
                {
                    idPersona = Convert.ToInt32(resultPersona);
                }
                else
                {
                    const string queryPersona = @"
                INSERT INTO PERSONAS (nombre, apellido, dni, fecha_de_nacimiento, genero, domicilio)
                VALUES (@Nombre, @Apellido, @Dni, @FechaNacimiento, @Genero, @Domicilio);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

                    using var cmdPersona = new SqlCommand(queryPersona, connection, transaction);
                    cmdPersona.Parameters.AddWithValue("@Nombre", staff.Nombre.Trim());
                    cmdPersona.Parameters.AddWithValue("@Apellido", staff.Apellido.Trim());
                    cmdPersona.Parameters.AddWithValue("@Dni", staff.Dni.Trim());
                    cmdPersona.Parameters.AddWithValue("@FechaNacimiento", staff.FechaNacimiento.HasValue ? (object)staff.FechaNacimiento.Value : DBNull.Value);
                    cmdPersona.Parameters.AddWithValue("@Genero", string.IsNullOrWhiteSpace(staff.Genero) ? (object)DBNull.Value : staff.Genero.Trim());
                    cmdPersona.Parameters.AddWithValue("@Domicilio", string.IsNullOrWhiteSpace(staff.Domicilio) ? (object)DBNull.Value : staff.Domicilio.Trim());

                    var scalarPersona = await cmdPersona.ExecuteScalarAsync();
                    idPersona = Convert.ToInt32(scalarPersona);
                }

                // 2. Insertar en USUARIOS contemplando IDENTITY
                const string queryUsuario = @"
            IF COLUMNPROPERTY(OBJECT_ID('USUARIOS'), 'PK_id_usuario', 'IsIdentity') = 1
            BEGIN
                INSERT INTO USUARIOS (FK_id_persona, FK_id_rol, email, contrasenia, activo)
                VALUES (@IdPersona, @IdRol, @Email, @Contrasenia, 1);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
            END
            ELSE
            BEGIN
                DECLARE @NewIdUsuario INT = (SELECT ISNULL(MAX(PK_id_usuario), 0) + 1 FROM USUARIOS);
                INSERT INTO USUARIOS (PK_id_usuario, FK_id_persona, FK_id_rol, email, contrasenia, activo)
                VALUES (@NewIdUsuario, @IdPersona, @IdRol, @Email, @Contrasenia, 1);
                SELECT @NewIdUsuario;
            END";

                using var cmdUsuario = new SqlCommand(queryUsuario, connection, transaction);
                cmdUsuario.Parameters.AddWithValue("@IdPersona", idPersona);
                cmdUsuario.Parameters.AddWithValue("@IdRol", staff.IdRol);
                cmdUsuario.Parameters.AddWithValue("@Email", staff.Email.Trim());
                cmdUsuario.Parameters.AddWithValue("@Contrasenia", staff.ContraseniaHasheada);

                var scalarUsuario = await cmdUsuario.ExecuteScalarAsync();
                int idUsuario = Convert.ToInt32(scalarUsuario);

                // 3. Insertar en STAFF contemplando IDENTITY o MAX + 1
                const string queryStaff = @"
            IF COLUMNPROPERTY(OBJECT_ID('STAFF'), 'PK_id_staff', 'IsIdentity') = 1
            BEGIN
                INSERT INTO STAFF (FK_id_usuario)
                VALUES (@IdUsuario);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
            END
            ELSE
            BEGIN
                DECLARE @NewIdStaff INT = (SELECT ISNULL(MAX(PK_id_staff), 0) + 1 FROM STAFF);
                INSERT INTO STAFF (PK_id_staff, FK_id_usuario)
                VALUES (@NewIdStaff, @IdUsuario);
                SELECT @NewIdStaff;
            END";

                using var cmdStaff = new SqlCommand(queryStaff, connection, transaction);
                cmdStaff.Parameters.AddWithValue("@IdUsuario", idUsuario);

                var scalarStaff = await cmdStaff.ExecuteScalarAsync();
                int idStaff = Convert.ToInt32(scalarStaff);

                // 4. Asignar categoría en STAFF_CATEGORIAS si fue seleccionada (DT o Preparador Físico)
                if (staff.IdCategoria.HasValue && staff.IdCategoria.Value > 0)
                {
                    const string queryStaffCat = @"
                IF COLUMNPROPERTY(OBJECT_ID('STAFF_CATEGORIAS'), 'PK_id_staff_categoria', 'IsIdentity') = 1
                BEGIN
                    INSERT INTO STAFF_CATEGORIAS (FK_id_staff, FK_id_categoria)
                    VALUES (@IdStaff, @IdCategoria);
                END
                ELSE
                BEGIN
                    DECLARE @NewIdStaffCat INT = (SELECT ISNULL(MAX(PK_id_staff_categoria), 0) + 1 FROM STAFF_CATEGORIAS);
                    INSERT INTO STAFF_CATEGORIAS (PK_id_staff_categoria, FK_id_staff, FK_id_categoria)
                    VALUES (@NewIdStaffCat, @IdStaff, @IdCategoria);
                END";

                    using var cmdStaffCat = new SqlCommand(queryStaffCat, connection, transaction);
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

        public async Task<bool> ActualizarAsync(StaffEdicion staff)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Actualizar PERSONAS
                const string queryPersona = @"
                    UPDATE PERSONAS 
                    SET nombre = @Nombre, 
                        apellido = @Apellido, 
                        dni = @Dni, 
                        fecha_de_nacimiento = @FechaNacimiento, 
                        domicilio = @Domicilio
                    WHERE PK_id_persona = (
                        SELECT u.FK_id_persona 
                        FROM USUARIOS u 
                        INNER JOIN STAFF s ON u.PK_id_usuario = s.FK_id_usuario 
                        WHERE s.PK_id_staff = @IdStaff
                    );";

                using var cmdPersona = new SqlCommand(queryPersona, connection, transaction);
                cmdPersona.Parameters.AddWithValue("@Nombre", staff.Nombre);
                cmdPersona.Parameters.AddWithValue("@Apellido", staff.Apellido);
                cmdPersona.Parameters.AddWithValue("@Dni", staff.Dni);
                cmdPersona.Parameters.AddWithValue("@FechaNacimiento", staff.FechaNacimiento ?? (object)DBNull.Value);
                cmdPersona.Parameters.AddWithValue("@Domicilio", staff.Domicilio ?? (object)DBNull.Value);
                cmdPersona.Parameters.AddWithValue("@IdStaff", staff.IdStaff);
                await cmdPersona.ExecuteNonQueryAsync();

                // 2. Actualizar USUARIOS (con re-hasheo de contraseña si fue enviada)
                string queryUsuario = @"
                    UPDATE USUARIOS 
                    SET email = @Email, 
                        FK_id_rol = @IdRol, 
                        activo = @Activo" +
                        (!string.IsNullOrWhiteSpace(staff.ContraseniaHasheada) ? ", contrasenia = @Contrasenia " : " ") +
                    @"WHERE PK_id_usuario = (
                        SELECT FK_id_usuario FROM STAFF WHERE PK_id_staff = @IdStaff
                    );";

                using var cmdUsuario = new SqlCommand(queryUsuario, connection, transaction);
                cmdUsuario.Parameters.AddWithValue("@Email", staff.Email);
                cmdUsuario.Parameters.AddWithValue("@IdRol", staff.IdRol);
                cmdUsuario.Parameters.AddWithValue("@Activo", staff.Activo);
                cmdUsuario.Parameters.AddWithValue("@IdStaff", staff.IdStaff);
                if (!string.IsNullOrWhiteSpace(staff.ContraseniaHasheada))
                {
                    cmdUsuario.Parameters.AddWithValue("@Contrasenia", staff.ContraseniaHasheada);
                }
                await cmdUsuario.ExecuteNonQueryAsync();

                // 3. Sincronizar STAFF_CATEGORIAS
                if (staff.IdCategoria.HasValue && staff.IdCategoria.Value > 0)
                {
                    const string queryCatCheck = "SELECT 1 FROM STAFF_CATEGORIAS WHERE FK_id_staff = @IdStaff;";
                    using var cmdCatCheck = new SqlCommand(queryCatCheck, connection, transaction);
                    cmdCatCheck.Parameters.AddWithValue("@IdStaff", staff.IdStaff);
                    var existeCat = await cmdCatCheck.ExecuteScalarAsync();

                    if (existeCat != null)
                    {
                        const string queryUpdateCat = @"
                            UPDATE STAFF_CATEGORIAS 
                            SET FK_id_categoria = @IdCategoria 
                            WHERE FK_id_staff = @IdStaff;";
                        using var cmdUpdateCat = new SqlCommand(queryUpdateCat, connection, transaction);
                        cmdUpdateCat.Parameters.AddWithValue("@IdCategoria", staff.IdCategoria.Value);
                        cmdUpdateCat.Parameters.AddWithValue("@IdStaff", staff.IdStaff);
                        await cmdUpdateCat.ExecuteNonQueryAsync();
                    }
                    else
                    {
                        const string queryMaxStaffCat = "SELECT ISNULL(MAX(PK_id_staff_categoria), 0) + 1 FROM STAFF_CATEGORIAS;";
                        using var cmdMaxStaffCat = new SqlCommand(queryMaxStaffCat, connection, transaction);
                        int idStaffCat = Convert.ToInt32(await cmdMaxStaffCat.ExecuteScalarAsync());

                        const string queryInsertCat = @"
                            INSERT INTO STAFF_CATEGORIAS (PK_id_staff_categoria, FK_id_staff, FK_id_categoria)
                            VALUES (@IdStaffCat, @IdStaff, @IdCategoria);";
                        using var cmdInsertCat = new SqlCommand(queryInsertCat, connection, transaction);
                        cmdInsertCat.Parameters.AddWithValue("@IdStaffCat", idStaffCat);
                        cmdInsertCat.Parameters.AddWithValue("@IdStaff", staff.IdStaff);
                        cmdInsertCat.Parameters.AddWithValue("@IdCategoria", staff.IdCategoria.Value);
                        await cmdInsertCat.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    const string queryDeleteCat = "DELETE FROM STAFF_CATEGORIAS WHERE FK_id_staff = @IdStaff;";
                    using var cmdDeleteCat = new SqlCommand(queryDeleteCat, connection, transaction);
                    cmdDeleteCat.Parameters.AddWithValue("@IdStaff", staff.IdStaff);
                    await cmdDeleteCat.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}