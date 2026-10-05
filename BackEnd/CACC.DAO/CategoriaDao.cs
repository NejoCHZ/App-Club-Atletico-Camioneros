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
                    ISNULL(COUNT(DISTINCT jc.FK_id_jugador), 0) AS cantidad_jugadores
                FROM CATEGORIAS c
                LEFT JOIN JUGADORES_CATEGORIAS jc ON c.PK_id_categoria = jc.FK_id_categoria
                GROUP BY c.PK_id_categoria, c.nombre_categoria
                ORDER BY c.nombre_categoria ASC;";

            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lista.Add(new CategoriaConConteo
                {
                    IdCategoria = reader.GetInt32(reader.GetOrdinal("PK_id_categoria")),
                    NombreCategoria = reader.GetString(reader.GetOrdinal("nombre_categoria")),
                    CantidadJugadores = reader.GetInt32(reader.GetOrdinal("cantidad_jugadores"))
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

        public async Task<int> CrearAsync(string nombreCategoria)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                IF COLUMNPROPERTY(OBJECT_ID('CATEGORIAS'), 'PK_id_categoria', 'IsIdentity') = 1
                BEGIN
                    INSERT INTO CATEGORIAS (nombre_categoria) VALUES (@Nombre);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);
                END
                ELSE
                BEGIN
                    DECLARE @NewId INT = (SELECT ISNULL(MAX(PK_id_categoria), 0) + 1 FROM CATEGORIAS);
                    INSERT INTO CATEGORIAS (PK_id_categoria, nombre_categoria) VALUES (@NewId, @Nombre);
                    SELECT @NewId;
                END";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Nombre", nombreCategoria.Trim());

            var scalar = await command.ExecuteScalarAsync();
            return Convert.ToInt32(scalar);
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
                SELECT TOP 25
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
    }
}