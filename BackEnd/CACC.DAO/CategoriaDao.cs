using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace CACC.DAO
{
    public class CategoriaDao : ICategoriaDao
    {
        private readonly string _connectionString;

        public CategoriaDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        public async Task<IEnumerable<Categoria>> ObtenerTodasAsync()
        {
            var categorias = new List<Categoria>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = "SELECT PK_id_categoria, nombre_categoria FROM CATEGORIAS ORDER BY nombre_categoria ASC;";
            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                categorias.Add(new Categoria
                {
                    IdCategoria = reader.GetInt32(reader.GetOrdinal("PK_id_categoria")),
                    NombreCategoria = reader.IsDBNull(reader.GetOrdinal("nombre_categoria"))
                        ? string.Empty
                        : reader.GetString(reader.GetOrdinal("nombre_categoria"))
                });
            }

            return categorias;
        }

        public async Task<IEnumerable<CategoriaConConteo>> ObtenerTodasConConteoAsync()
        {
            var lista = new List<CategoriaConConteo>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
        SELECT 
            c.PK_id_categoria, 
            ISNULL(c.nombre_categoria, '') AS nombre_categoria,
            ISNULL(c.asociacion, CASE WHEN c.nombre_categoria LIKE '%AFA%' THEN 'AFA' ELSE 'Liga Cordobesa' END) AS asociacion,
            ISNULL(COUNT(DISTINCT jc.FK_id_jugador), 0) AS cantidad_jugadores,
            ISNULL(COUNT(DISTINCT sc.FK_id_staff), 0) AS cantidad_staff
        FROM CATEGORIAS c
        LEFT JOIN JUGADORES_CATEGORIAS jc ON c.PK_id_categoria = jc.FK_id_categoria
        LEFT JOIN STAFF_CATEGORIAS sc ON c.PK_id_categoria = sc.FK_id_categoria
        GROUP BY c.PK_id_categoria, c.nombre_categoria, c.asociacion
        ORDER BY c.nombre_categoria ASC;";

            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lista.Add(new CategoriaConConteo
                {
                    IdCategoria = reader.GetInt32(reader.GetOrdinal("PK_id_categoria")),
                    NombreCategoria = reader.GetString(reader.GetOrdinal("nombre_categoria")),
                    Asociacion = reader.GetString(reader.GetOrdinal("asociacion")),
                    CantidadJugadores = reader.GetInt32(reader.GetOrdinal("cantidad_jugadores")),
                    CantidadStaff = reader.GetInt32(reader.GetOrdinal("cantidad_staff"))
                });
            }

            return lista;
        }

        public async Task<Categoria?> ObtenerPorIdAsync(int idCategoria)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = "SELECT PK_id_categoria, nombre_categoria FROM CATEGORIAS WHERE PK_id_categoria = @Id;";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Id", idCategoria);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Categoria
                {
                    IdCategoria = reader.GetInt32(reader.GetOrdinal("PK_id_categoria")),
                    NombreCategoria = reader.IsDBNull(reader.GetOrdinal("nombre_categoria"))
                        ? string.Empty
                        : reader.GetString(reader.GetOrdinal("nombre_categoria"))
                };
            }

            return null;
        }

        public async Task<int> CrearAsync(string nombreCategoria, string asociacion)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
        IF COLUMNPROPERTY(OBJECT_ID('CATEGORIAS'), 'PK_id_categoria', 'IsIdentity') = 1
        BEGIN
            INSERT INTO CATEGORIAS (nombre_categoria, asociacion) VALUES (@Nombre, @Asociacion);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
        END
        ELSE
        BEGIN
            DECLARE @NewId INT = (SELECT ISNULL(MAX(PK_id_categoria), 0) + 1 FROM CATEGORIAS);
            INSERT INTO CATEGORIAS (PK_id_categoria, nombre_categoria, asociacion) VALUES (@NewId, @Nombre, @Asociacion);
            SELECT @NewId;
        END";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Nombre", nombreCategoria.Trim());
            command.Parameters.AddWithValue("@Asociacion", string.IsNullOrWhiteSpace(asociacion) ? "Liga Cordobesa" : asociacion.Trim());

            var scalar = await command.ExecuteScalarAsync();
            return Convert.ToInt32(scalar);
        }

        public async Task<bool> ActualizarAsync(int idCategoria, string nombreCategoria, string asociacion)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = "UPDATE CATEGORIAS SET nombre_categoria = @Nombre, asociacion = @Asociacion WHERE PK_id_categoria = @Id;";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Nombre", nombreCategoria.Trim());
            command.Parameters.AddWithValue("@Asociacion", string.IsNullOrWhiteSpace(asociacion) ? "Liga Cordobesa" : asociacion.Trim());
            command.Parameters.AddWithValue("@Id", idCategoria);

            int filas = await command.ExecuteNonQueryAsync();
            return filas > 0;
        }

        public async Task<bool> ActualizarAsync(int idCategoria, string nombreCategoria)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = "UPDATE CATEGORIAS SET nombre_categoria = @Nombre WHERE PK_id_categoria = @Id;";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Nombre", nombreCategoria.Trim());
            command.Parameters.AddWithValue("@Id", idCategoria);

            int filas = await command.ExecuteNonQueryAsync();
            return filas > 0;
        }

        public async Task<bool> EliminarAsync(int idCategoria)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Desvincular de JUGADORES_CATEGORIAS
                const string queryJugCat = "DELETE FROM JUGADORES_CATEGORIAS WHERE FK_id_categoria = @Id;";
                using (var cmd = new SqlCommand(queryJugCat, connection, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", idCategoria);
                    await cmd.ExecuteNonQueryAsync();
                }

                // 2. Desvincular cuerpo técnico de STAFF_CATEGORIAS
                const string queryStaffCat = "DELETE FROM STAFF_CATEGORIAS WHERE FK_id_categoria = @Id;";
                using (var cmd = new SqlCommand(queryStaffCat, connection, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", idCategoria);
                    await cmd.ExecuteNonQueryAsync();
                }

                // 3. Poner en NULL la categoría base en JUGADORES para preservar al atleta
                const string queryJug = "UPDATE JUGADORES SET FK_id_categoria = NULL WHERE FK_id_categoria = @Id;";
                using (var cmd = new SqlCommand(queryJug, connection, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", idCategoria);
                    await cmd.ExecuteNonQueryAsync();
                }

                // 4. Limpieza de partidos e historial dependientes
                const string queryPartidosJug = @"
                    DELETE FROM JUGADORES_PARTIDOS 
                    WHERE FK_id_partido IN (SELECT PK_id_partido FROM HISTORIAL_PARTIDOS WHERE FK_id_categoria = @Id);";
                using (var cmd = new SqlCommand(queryPartidosJug, connection, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", idCategoria);
                    await cmd.ExecuteNonQueryAsync();
                }

                const string queryPartidos = "DELETE FROM HISTORIAL_PARTIDOS WHERE FK_id_categoria = @Id;";
                using (var cmd = new SqlCommand(queryPartidos, connection, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", idCategoria);
                    await cmd.ExecuteNonQueryAsync();
                }

                // 5. Eliminar la división deportiva en CATEGORIAS
                const string queryCat = "DELETE FROM CATEGORIAS WHERE PK_id_categoria = @Id;";
                using (var cmd = new SqlCommand(queryCat, connection, transaction))
                {
                    cmd.Parameters.AddWithValue("@Id", idCategoria);
                    int filas = await cmd.ExecuteNonQueryAsync();
                    if (filas == 0)
                    {
                        await transaction.RollbackAsync();
                        return false;
                    }
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

        public async Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresPorCategoriaAsync(int idCategoria)
        {
            var jugadores = new List<JugadorPlantel>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 
                    j.PK_id_jugador,
                    p.nombre,
                    p.apellido,
                    p.dni,
                    p.fecha_de_nacimiento,
                    ISNULL(j.posicion_cancha, 'Sin definir') AS posicion_cancha
                FROM JUGADORES_CATEGORIAS jc
                INNER JOIN JUGADORES j ON jc.FK_id_jugador = j.PK_id_jugador
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                WHERE jc.FK_id_categoria = @IdCategoria
                ORDER BY p.apellido ASC, p.nombre ASC;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                DateTime? fn = reader.IsDBNull(reader.GetOrdinal("fecha_de_nacimiento"))
                    ? null
                    : reader.GetDateTime(reader.GetOrdinal("fecha_de_nacimiento"));

                jugadores.Add(new JugadorPlantel
                {
                    IdJugador = reader.GetInt32(reader.GetOrdinal("PK_id_jugador")),
                    NombreCompleto = $"{reader.GetString(reader.GetOrdinal("nombre"))} {reader.GetString(reader.GetOrdinal("apellido"))}".Trim().ToUpper(),
                    Dni = reader.IsDBNull(reader.GetOrdinal("dni")) ? "-" : reader.GetString(reader.GetOrdinal("dni")),
                    PosicionCancha = reader.GetString(reader.GetOrdinal("posicion_cancha")),
                    FechaNacimiento = fn?.ToString("dd/MM/yyyy")
                });
            }

            return jugadores;
        }

        public async Task<IEnumerable<JugadorPlantel>> ObtenerJugadoresDisponiblesAsync(int idCategoria, string? search)
        {
            var disponibles = new List<JugadorPlantel>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT TOP 50
                    j.PK_id_jugador,
                    p.nombre,
                    p.apellido,
                    p.dni,
                    p.fecha_de_nacimiento,
                    ISNULL(j.posicion_cancha, 'Sin definir') AS posicion_cancha
                FROM JUGADORES j
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                WHERE j.PK_id_jugador NOT IN (
                    SELECT jc.FK_id_jugador 
                    FROM JUGADORES_CATEGORIAS jc 
                    WHERE jc.FK_id_categoria = @IdCategoria
                )
                AND (@Search IS NULL OR p.dni LIKE '%' + @Search + '%' OR p.nombre LIKE '%' + @Search + '%' OR p.apellido LIKE '%' + @Search + '%')
                ORDER BY p.apellido ASC, p.nombre ASC;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);
            command.Parameters.AddWithValue("@Search", string.IsNullOrWhiteSpace(search) ? (object)DBNull.Value : search.Trim());

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                DateTime? fn = reader.IsDBNull(reader.GetOrdinal("fecha_de_nacimiento"))
                    ? null
                    : reader.GetDateTime(reader.GetOrdinal("fecha_de_nacimiento"));

                disponibles.Add(new JugadorPlantel
                {
                    IdJugador = reader.GetInt32(reader.GetOrdinal("PK_id_jugador")),
                    NombreCompleto = $"{reader.GetString(reader.GetOrdinal("nombre"))} {reader.GetString(reader.GetOrdinal("apellido"))}".Trim().ToUpper(),
                    Dni = reader.IsDBNull(reader.GetOrdinal("dni")) ? "-" : reader.GetString(reader.GetOrdinal("dni")),
                    PosicionCancha = reader.GetString(reader.GetOrdinal("posicion_cancha")),
                    FechaNacimiento = fn?.ToString("dd/MM/yyyy")
                });
            }

            return disponibles;
        }

        public async Task<bool> AsignarJugadorAsync(int idCategoria, int idJugador)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                IF NOT EXISTS (SELECT 1 FROM JUGADORES_CATEGORIAS WHERE FK_id_jugador = @IdJugador AND FK_id_categoria = @IdCategoria)
                BEGIN
                    INSERT INTO JUGADORES_CATEGORIAS (FK_id_jugador, FK_id_categoria)
                    VALUES (@IdJugador, @IdCategoria);
                END";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);
            command.Parameters.AddWithValue("@IdJugador", idJugador);

            int filas = await command.ExecuteNonQueryAsync();
            return filas > 0;
        }

        public async Task<bool> QuitarJugadorAsync(int idCategoria, int idJugador)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = "DELETE FROM JUGADORES_CATEGORIAS WHERE FK_id_jugador = @IdJugador AND FK_id_categoria = @IdCategoria;";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);
            command.Parameters.AddWithValue("@IdJugador", idJugador);

            int filas = await command.ExecuteNonQueryAsync();
            return filas > 0;
        }

        public async Task<IEnumerable<StaffPlantel>> ObtenerStaffPorCategoriaAsync(int idCategoria)
        {
            var staffList = new List<StaffPlantel>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 
                    s.PK_id_staff,
                    p.nombre,
                    p.apellido,
                    p.dni,
                    r.nombre_rol AS rol,
                    u.email
                FROM STAFF_CATEGORIAS sc
                INNER JOIN STAFF s ON sc.FK_id_staff = s.PK_id_staff
                INNER JOIN USUARIOS u ON s.FK_id_usuario = u.PK_id_usuario
                INNER JOIN PERSONAS p ON u.FK_id_persona = p.PK_id_persona
                INNER JOIN ROLES r ON u.FK_id_rol = r.PK_id_rol
                WHERE sc.FK_id_categoria = @IdCategoria
                ORDER BY r.nombre_rol ASC, p.apellido ASC, p.nombre ASC;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                staffList.Add(new StaffPlantel
                {
                    IdStaff = reader.GetInt32(reader.GetOrdinal("PK_id_staff")),
                    NombreCompleto = $"{reader.GetString(reader.GetOrdinal("nombre"))} {reader.GetString(reader.GetOrdinal("apellido"))}".Trim().ToUpper(),
                    Dni = reader.IsDBNull(reader.GetOrdinal("dni")) ? "-" : reader.GetString(reader.GetOrdinal("dni")),
                    Rol = reader.GetString(reader.GetOrdinal("rol")),
                    Email = reader.GetString(reader.GetOrdinal("email"))
                });
            }

            return staffList;
        }

        public async Task<IEnumerable<StaffPlantel>> ObtenerStaffDisponibleAsync(int idCategoria, string? search = null)
        {
            var disponibles = new List<StaffPlantel>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT TOP 50
                    s.PK_id_staff,
                    p.nombre,
                    p.apellido,
                    p.dni,
                    r.nombre_rol AS rol,
                    u.email
                FROM STAFF s
                INNER JOIN USUARIOS u ON s.FK_id_usuario = u.PK_id_usuario
                INNER JOIN PERSONAS p ON u.FK_id_persona = p.PK_id_persona
                INNER JOIN ROLES r ON u.FK_id_rol = r.PK_id_rol
                WHERE s.PK_id_staff NOT IN (
                    SELECT sc.FK_id_staff 
                    FROM STAFF_CATEGORIAS sc 
                    WHERE sc.FK_id_categoria = @IdCategoria
                )
                AND (
                    UPPER(r.nombre_rol) LIKE '%T_CNICO%' 
                    OR UPPER(r.nombre_rol) LIKE '%F_SICO%'
                    OR UPPER(r.nombre_rol) LIKE '%DT%'
                    OR UPPER(r.nombre_rol) LIKE '%PF%'
                )
                AND ISNULL(u.activo, 1) = 1
                AND (@Search IS NULL OR p.dni LIKE '%' + @Search + '%' OR p.nombre LIKE '%' + @Search + '%' OR p.apellido LIKE '%' + @Search + '%')
                ORDER BY r.nombre_rol ASC, p.apellido ASC;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);
            command.Parameters.AddWithValue("@Search", string.IsNullOrWhiteSpace(search) ? (object)DBNull.Value : search.Trim());

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                disponibles.Add(new StaffPlantel
                {
                    IdStaff = reader.GetInt32(reader.GetOrdinal("PK_id_staff")),
                    NombreCompleto = $"{reader.GetString(reader.GetOrdinal("nombre"))} {reader.GetString(reader.GetOrdinal("apellido"))}".Trim().ToUpper(),
                    Dni = reader.IsDBNull(reader.GetOrdinal("dni")) ? "-" : reader.GetString(reader.GetOrdinal("dni")),
                    Rol = reader.GetString(reader.GetOrdinal("rol")),
                    Email = reader.GetString(reader.GetOrdinal("email"))
                });
            }

            return disponibles;
        }

        public async Task<bool> AsignarStaffAsync(int idCategoria, int idStaff)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                IF NOT EXISTS (SELECT 1 FROM STAFF_CATEGORIAS WHERE FK_id_staff = @IdStaff AND FK_id_categoria = @IdCategoria)
                BEGIN
                    IF COLUMNPROPERTY(OBJECT_ID('STAFF_CATEGORIAS'), 'PK_id_staff_categoria', 'IsIdentity') = 1
                    BEGIN
                        INSERT INTO STAFF_CATEGORIAS (FK_id_staff, FK_id_categoria)
                        VALUES (@IdStaff, @IdCategoria);
                    END
                    ELSE
                    BEGIN
                        DECLARE @NewId INT = (SELECT ISNULL(MAX(PK_id_staff_categoria), 0) + 1 FROM STAFF_CATEGORIAS);
                        INSERT INTO STAFF_CATEGORIAS (PK_id_staff_categoria, FK_id_staff, FK_id_categoria)
                        VALUES (@NewId, @IdStaff, @IdCategoria);
                    END
                END";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);
            command.Parameters.AddWithValue("@IdStaff", idStaff);

            int filas = await command.ExecuteNonQueryAsync();
            return filas > 0;
        }

        public async Task<bool> QuitarStaffAsync(int idCategoria, int idStaff)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = "DELETE FROM STAFF_CATEGORIAS WHERE FK_id_staff = @IdStaff AND FK_id_categoria = @IdCategoria;";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);
            command.Parameters.AddWithValue("@IdStaff", idStaff);

            int filas = await command.ExecuteNonQueryAsync();
            return filas > 0;
        }
        public async Task<IEnumerable<PartidoDetalle>> ObtenerPartidosPorCategoriaAsync(int idCategoria)
        {
            var partidos = new List<PartidoDetalle>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
        SELECT 
            hp.PK_id_partido AS IdPartido,
            hp.FK_id_categoria AS IdCategoria,
            ISNULL(c.nombre_categoria, '') AS Categoria,
            hp.fecha_partido AS Fecha,
            hp.rival AS Rival,
            hp.resultado AS Resultado,
            hp.condicion_localia AS Condicion
        FROM HISTORIAL_PARTIDOS hp
        LEFT JOIN CATEGORIAS c ON hp.FK_id_categoria = c.PK_id_categoria
        WHERE hp.FK_id_categoria = @IdCategoria
        ORDER BY hp.fecha_partido DESC;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                partidos.Add(new PartidoDetalle
                {
                    IdPartido = reader.GetInt32(reader.GetOrdinal("IdPartido")),
                    IdCategoria = reader.GetInt32(reader.GetOrdinal("IdCategoria")),
                    Categoria = reader.GetString(reader.GetOrdinal("Categoria")),
                    Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                    Rival = reader.GetString(reader.GetOrdinal("Rival")),
                    Resultado = reader.GetString(reader.GetOrdinal("Resultado")),
                    Condicion = reader.IsDBNull(reader.GetOrdinal("Condicion")) ? null : reader.GetString(reader.GetOrdinal("Condicion"))
                });
            }

            return partidos;
        }

        public async Task<int> RegistrarPartidoAsync(PartidoAlta partido)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                const string queryPartido = @"
            INSERT INTO HISTORIAL_PARTIDOS (FK_id_categoria, fecha_partido, rival, condicion_localia, resultado, observaciones)
            VALUES (@IdCategoria, @FechaPartido, @Rival, @CondicionLocalia, @Resultado, @Observaciones);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";

                using var cmdPartido = new SqlCommand(queryPartido, connection, transaction);
                cmdPartido.Parameters.AddWithValue("@IdCategoria", partido.IdCategoria);
                cmdPartido.Parameters.AddWithValue("@FechaPartido", partido.FechaPartido);
                cmdPartido.Parameters.AddWithValue("@Rival", partido.Rival.Trim());
                cmdPartido.Parameters.AddWithValue("@CondicionLocalia", partido.CondicionLocalia.Trim());
                cmdPartido.Parameters.AddWithValue("@Resultado", partido.Resultado.Trim());
                cmdPartido.Parameters.AddWithValue("@Observaciones", (object?)partido.Observaciones ?? DBNull.Value);

                int idPartido = Convert.ToInt32(await cmdPartido.ExecuteScalarAsync());

                if (partido.JugadoresMinutos != null && partido.JugadoresMinutos.Count > 0)
                {
                    const string queryMinutos = @"
                INSERT INTO JUGADORES_PARTIDOS (FK_id_partido, FK_id_jugador, minutos_jugados)
                VALUES (@IdPartido, @IdJugador, @Minutos);";

                    foreach (var jm in partido.JugadoresMinutos)
                    {
                        using var cmdMinutos = new SqlCommand(queryMinutos, connection, transaction);
                        cmdMinutos.Parameters.AddWithValue("@IdPartido", idPartido);
                        cmdMinutos.Parameters.AddWithValue("@IdJugador", jm.IdJugador);
                        cmdMinutos.Parameters.AddWithValue("@Minutos", jm.MinutosJugados);
                        await cmdMinutos.ExecuteNonQueryAsync();
                    }
                }

                await transaction.CommitAsync();
                return idPartido;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        public async Task<PartidoDetalle?> ObtenerPartidoPorIdAsync(int idPartido)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
        SELECT 
            hp.PK_id_partido AS IdPartido,
            hp.FK_id_categoria AS IdCategoria,
            ISNULL(c.nombre_categoria, '') AS Categoria,
            hp.fecha_partido AS Fecha,
            hp.rival AS Rival,
            hp.resultado AS Resultado,
            hp.condicion_localia AS Condicion,
            hp.observaciones AS Observaciones
        FROM HISTORIAL_PARTIDOS hp
        LEFT JOIN CATEGORIAS c ON hp.FK_id_categoria = c.PK_id_categoria
        WHERE hp.PK_id_partido = @IdPartido;

        SELECT 
            jp.FK_id_jugador AS IdJugador,
            CONCAT(p.nombre, ' ', p.apellido) AS NombreCompleto,
            p.dni AS Dni,
            ISNULL(jp.minutos_jugados, 0) AS MinutosJugados
        FROM JUGADORES_PARTIDOS jp
        INNER JOIN JUGADORES j ON jp.FK_id_jugador = j.PK_id_jugador
        INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
        WHERE jp.FK_id_partido = @IdPartido
        ORDER BY p.apellido ASC, p.nombre ASC;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdPartido", idPartido);

            using var reader = await command.ExecuteReaderAsync();
            PartidoDetalle? partido = null;

            if (await reader.ReadAsync())
            {
                partido = new PartidoDetalle
                {
                    IdPartido = reader.GetInt32(reader.GetOrdinal("IdPartido")),
                    IdCategoria = reader.GetInt32(reader.GetOrdinal("IdCategoria")),
                    Categoria = reader.GetString(reader.GetOrdinal("Categoria")),
                    Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                    Rival = reader.GetString(reader.GetOrdinal("Rival")),
                    Resultado = reader.GetString(reader.GetOrdinal("Resultado")),
                    Condicion = reader.IsDBNull(reader.GetOrdinal("Condicion")) ? null : reader.GetString(reader.GetOrdinal("Condicion")),
                    Observaciones = reader.IsDBNull(reader.GetOrdinal("Observaciones")) ? null : reader.GetString(reader.GetOrdinal("Observaciones"))
                };
            }

            if (partido != null && await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    partido.JugadoresMinutos.Add(new JugadorMinutoDetalle
                    {
                        IdJugador = reader.GetInt32(reader.GetOrdinal("IdJugador")),
                        NombreCompleto = reader.GetString(reader.GetOrdinal("NombreCompleto")),
                        Dni = reader.IsDBNull(reader.GetOrdinal("Dni")) ? "-" : reader.GetString(reader.GetOrdinal("Dni")),
                        MinutosJugados = reader.GetInt32(reader.GetOrdinal("MinutosJugados"))
                    });
                }
            }

            return partido;
        }

        public async Task<bool> ActualizarPartidoAsync(PartidoEdicion partido)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                const string queryUpdate = @"
            UPDATE HISTORIAL_PARTIDOS
            SET fecha_partido = @FechaPartido,
                rival = @Rival,
                condicion_localia = @CondicionLocalia,
                resultado = @Resultado,
                observaciones = @Observaciones
            WHERE PK_id_partido = @IdPartido;";

                using var cmdUpdate = new SqlCommand(queryUpdate, connection, transaction);
                cmdUpdate.Parameters.AddWithValue("@IdPartido", partido.IdPartido);
                cmdUpdate.Parameters.AddWithValue("@FechaPartido", partido.FechaPartido);
                cmdUpdate.Parameters.AddWithValue("@Rival", partido.Rival.Trim());
                cmdUpdate.Parameters.AddWithValue("@CondicionLocalia", partido.CondicionLocalia.Trim());
                cmdUpdate.Parameters.AddWithValue("@Resultado", partido.Resultado.Trim());
                cmdUpdate.Parameters.AddWithValue("@Observaciones", (object?)partido.Observaciones ?? DBNull.Value);

                int rows = await cmdUpdate.ExecuteNonQueryAsync();
                if (rows == 0)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                // Reemplazar minutos de los jugadores para mantener consistencia
                const string queryDeleteMin = "DELETE FROM JUGADORES_PARTIDOS WHERE FK_id_partido = @IdPartido;";
                using var cmdDeleteMin = new SqlCommand(queryDeleteMin, connection, transaction);
                cmdDeleteMin.Parameters.AddWithValue("@IdPartido", partido.IdPartido);
                await cmdDeleteMin.ExecuteNonQueryAsync();

                if (partido.JugadoresMinutos != null && partido.JugadoresMinutos.Count > 0)
                {
                    const string queryInsertMin = @"
                INSERT INTO JUGADORES_PARTIDOS (FK_id_partido, FK_id_jugador, minutos_jugados)
                VALUES (@IdPartido, @IdJugador, @Minutos);";

                    foreach (var jm in partido.JugadoresMinutos)
                    {
                        using var cmdInsertMin = new SqlCommand(queryInsertMin, connection, transaction);
                        cmdInsertMin.Parameters.AddWithValue("@IdPartido", partido.IdPartido);
                        cmdInsertMin.Parameters.AddWithValue("@IdJugador", jm.IdJugador);
                        cmdInsertMin.Parameters.AddWithValue("@Minutos", jm.MinutosJugados);
                        await cmdInsertMin.ExecuteNonQueryAsync();
                    }
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

        public async Task<bool> EliminarPartidoAsync(int idPartido)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                const string queryDeleteMin = "DELETE FROM JUGADORES_PARTIDOS WHERE FK_id_partido = @IdPartido;";
                using var cmdDeleteMin = new SqlCommand(queryDeleteMin, connection, transaction);
                cmdDeleteMin.Parameters.AddWithValue("@IdPartido", idPartido);
                await cmdDeleteMin.ExecuteNonQueryAsync();

                const string queryDeletePartido = "DELETE FROM HISTORIAL_PARTIDOS WHERE PK_id_partido = @IdPartido;";
                using var cmdDeletePartido = new SqlCommand(queryDeletePartido, connection, transaction);
                cmdDeletePartido.Parameters.AddWithValue("@IdPartido", idPartido);
                int rows = await cmdDeletePartido.ExecuteNonQueryAsync();

                if (rows == 0)
                {
                    await transaction.RollbackAsync();
                    return false;
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