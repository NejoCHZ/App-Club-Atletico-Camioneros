using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace CACC.DAO
{
    public class JugadorDao : IJugadorDao
    {
        private readonly string _connectionString;

        public JugadorDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        public async Task<IEnumerable<JugadorDetalle>> ObtenerTodosAsync()
        {
            var lista = new List<JugadorDetalle>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT 
                    j.PK_id_jugador AS IdJugador,
                    p.nombre AS Nombre,
                    p.apellido AS Apellido,
                    p.dni AS Dni,
                    p.genero AS Genero,
                    p.fecha_de_nacimiento AS FechaDeNacimiento,
                    j.FK_id_categoria AS IdCategoria,
                    c.nombre_categoria AS NombreCategoria,
                    j.club_origen AS ClubOrigen,
                    j.ficha_medica_liga AS FichaMedicaLiga,
                    j.posicion_cancha AS PosicionCancha
                FROM JUGADORES j
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                INNER JOIN CATEGORIAS c ON j.FK_id_categoria = c.PK_id_categoria";

            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lista.Add(MapearJugador(reader));
            }

            return lista;
        }

        public async Task<JugadorDetalle?> ObtenerPorIdAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT j.PK_id_jugador AS IdJugador, p.nombre AS Nombre, p.apellido AS Apellido, p.dni AS Dni, p.genero AS Genero, p.fecha_de_nacimiento AS FechaDeNacimiento, j.FK_id_categoria AS IdCategoria, c.nombre_categoria AS NombreCategoria, j.club_origen AS ClubOrigen, j.ficha_medica_liga AS FichaMedicaLiga, j.posicion_cancha AS PosicionCancha, j.peso AS Peso, j.altura AS Altura, j.pie_habil AS PieHabil
                FROM JUGADORES j
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                INNER JOIN CATEGORIAS c ON j.FK_id_categoria = c.PK_id_categoria
                WHERE j.PK_id_jugador = @Id;

                SELECT hp.fecha_partido AS Fecha, hp.rival AS Rival, hp.resultado AS Resultado, hp.condicion_localia AS Condicion, jp.minutos_jugados AS Minutos
                FROM JUGADORES_PARTIDOS jp
                INNER JOIN HISTORIAL_PARTIDOS hp ON jp.FK_id_partido = hp.PK_id_partido
                WHERE jp.FK_id_jugador = @Id
                ORDER BY hp.fecha_partido ASC;

                SELECT antecedentes_salud AS Patologias, condiciones_cronicas AS HistorialLesiones, observaciones AS Observaciones, grupo_sanguineo AS GrupoSanguineo, factor AS Factor
                FROM FICHAS_MEDICAS
                WHERE FK_id_jugador = @Id;
            ";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Id", id);

            using var reader = await command.ExecuteReaderAsync();
            JugadorDetalle? jugador = null;

            if (await reader.ReadAsync())
            {
                jugador = MapearJugador(reader);
                jugador.Peso = reader.IsDBNull(reader.GetOrdinal("Peso")) ? null : reader.GetDecimal(reader.GetOrdinal("Peso"));
                jugador.Altura = reader.IsDBNull(reader.GetOrdinal("Altura")) ? null : reader.GetDecimal(reader.GetOrdinal("Altura"));
                jugador.PieHabil = reader.IsDBNull(reader.GetOrdinal("PieHabil")) ? null : reader.GetString(reader.GetOrdinal("PieHabil"));

                jugador.Partidos = new List<PartidoDetalle>();
            }

            if (jugador != null)
            {
                if (await reader.NextResultAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        jugador.Partidos.Add(new PartidoDetalle
                        {
                            Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                            Rival = reader.GetString(reader.GetOrdinal("Rival")),
                            Resultado = reader.GetString(reader.GetOrdinal("Resultado")),
                            Condicion = reader.IsDBNull(reader.GetOrdinal("Condicion")) ? null : reader.GetString(reader.GetOrdinal("Condicion")),
                            Minutos = reader.GetInt32(reader.GetOrdinal("Minutos"))
                        });
                    }
                }

                if (await reader.NextResultAsync() && await reader.ReadAsync())
                {
                    string? grupo = reader.IsDBNull(reader.GetOrdinal("GrupoSanguineo")) ? null : reader.GetString(reader.GetOrdinal("GrupoSanguineo"));
                    string? factor = reader.IsDBNull(reader.GetOrdinal("Factor")) ? null : reader.GetString(reader.GetOrdinal("Factor"));

                    jugador.FichaMedica = new FichaMedicaDetalle
                    {
                        GrupoSanguineo = (grupo != null && factor != null) ? grupo + factor : null,
                        Patologias = reader.IsDBNull(reader.GetOrdinal("Patologias")) ? null : reader.GetString(reader.GetOrdinal("Patologias")),
                        HistorialLesiones = reader.IsDBNull(reader.GetOrdinal("HistorialLesiones")) ? null : reader.GetString(reader.GetOrdinal("HistorialLesiones")),
                        Observaciones = reader.IsDBNull(reader.GetOrdinal("Observaciones")) ? null : reader.GetString(reader.GetOrdinal("Observaciones"))
                    };
                }
            }
            return jugador;
        }

        public async Task<IEnumerable<JugadorDetalle>> ObtenerPorCategoriaAsync(int idCategoria)
        {
            var lista = new List<JugadorDetalle>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT 
                    j.PK_id_jugador AS IdJugador,
                    p.nombre AS Nombre,
                    p.apellido AS Apellido,
                    p.dni AS Dni,
                    p.genero AS Genero,
                    p.fecha_de_nacimiento AS FechaDeNacimiento,
                    j.FK_id_categoria AS IdCategoria,
                    c.nombre_categoria AS NombreCategoria,
                    j.club_origen AS ClubOrigen,
                    j.ficha_medica_liga AS FichaMedicaLiga,
                    j.posicion_cancha AS PosicionCancha
                FROM JUGADORES j
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                INNER JOIN CATEGORIAS c ON j.FK_id_categoria = c.PK_id_categoria
                WHERE j.FK_id_categoria = @IdCategoria";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lista.Add(MapearJugador(reader));
            }

            return lista;
        }

        private JugadorDetalle MapearJugador(SqlDataReader reader)
        {
            return new JugadorDetalle
            {
                IdJugador = reader.GetInt32(reader.GetOrdinal("IdJugador")),
                Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                Apellido = reader.GetString(reader.GetOrdinal("Apellido")),
                Dni = reader.GetString(reader.GetOrdinal("Dni")),
                Genero = reader.IsDBNull(reader.GetOrdinal("Genero")) ? null : reader.GetString(reader.GetOrdinal("Genero")),
                FechaDeNacimiento = reader.IsDBNull(reader.GetOrdinal("FechaDeNacimiento")) ? null : reader.GetDateTime(reader.GetOrdinal("FechaDeNacimiento")),
                IdCategoria = reader.GetInt32(reader.GetOrdinal("IdCategoria")),
                NombreCategoria = reader.IsDBNull(reader.GetOrdinal("NombreCategoria")) ? null : reader.GetString(reader.GetOrdinal("NombreCategoria")),
                ClubOrigen = reader.IsDBNull(reader.GetOrdinal("ClubOrigen")) ? null : reader.GetString(reader.GetOrdinal("ClubOrigen")),
                FichaMedicaLiga = reader.GetBoolean(reader.GetOrdinal("FichaMedicaLiga")),
                PosicionCancha = reader.IsDBNull(reader.GetOrdinal("PosicionCancha")) ? null : reader.GetString(reader.GetOrdinal("PosicionCancha"))
            };
        }

        public async Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Actualizar PERSONAS
                var queryPersonas = @"
                    UPDATE p 
                    SET nombre = @Nombre, apellido = @Apellido, dni = @Dni, fecha_de_nacimiento = @FechaNacimiento
                    FROM PERSONAS p 
                    INNER JOIN JUGADORES j ON p.PK_id_persona = j.FK_id_persona
                    WHERE j.PK_id_jugador = @Id;";

                using var cmdPersonas = new SqlCommand(queryPersonas, connection, transaction);
                cmdPersonas.Parameters.AddWithValue("@Id", id);
                cmdPersonas.Parameters.AddWithValue("@Nombre", jugador.Nombre);
                cmdPersonas.Parameters.AddWithValue("@Apellido", jugador.Apellido);
                cmdPersonas.Parameters.AddWithValue("@Dni", jugador.Dni);
                cmdPersonas.Parameters.AddWithValue("@FechaNacimiento", jugador.FechaDeNacimiento ?? (object)DBNull.Value);
                await cmdPersonas.ExecuteNonQueryAsync();

                // 2. Actualizar JUGADORES
                var queryJugadores = @"
                    UPDATE JUGADORES 
                    SET posicion_cancha = @Posicion, peso = @Peso, altura = @Altura, pie_habil = @PieHabil
                    WHERE PK_id_jugador = @Id;";

                using var cmdJugadores = new SqlCommand(queryJugadores, connection, transaction);
                cmdJugadores.Parameters.AddWithValue("@Id", id);
                cmdJugadores.Parameters.AddWithValue("@Posicion", jugador.PosicionCancha ?? (object)DBNull.Value);
                cmdJugadores.Parameters.AddWithValue("@Peso", jugador.Peso ?? (object)DBNull.Value);
                cmdJugadores.Parameters.AddWithValue("@Altura", jugador.Altura ?? (object)DBNull.Value);
                cmdJugadores.Parameters.AddWithValue("@PieHabil", jugador.PieHabil ?? (object)DBNull.Value);
                await cmdJugadores.ExecuteNonQueryAsync();

                // 3. Actualizar FICHAS_MEDICAS
                string? grupo = null;
                string? factor = null;
                if (!string.IsNullOrEmpty(jugador.FichaMedica?.GrupoSanguineo) && jugador.FichaMedica.GrupoSanguineo.Length >= 2)
                {
                    factor = jugador.FichaMedica.GrupoSanguineo.Substring(jugador.FichaMedica.GrupoSanguineo.Length - 1);
                    grupo = jugador.FichaMedica.GrupoSanguineo.Substring(0, jugador.FichaMedica.GrupoSanguineo.Length - 1);
                }

                var queryFicha = @"
                    UPDATE FICHAS_MEDICAS 
                    SET grupo_sanguineo = @Grupo, factor = @Factor, antecedentes_salud = @Patologias, 
                        condiciones_cronicas = @Lesiones, observaciones = @Observaciones
                    WHERE FK_id_jugador = @Id;";

                using var cmdFicha = new SqlCommand(queryFicha, connection, transaction);
                cmdFicha.Parameters.AddWithValue("@Id", id);
                cmdFicha.Parameters.AddWithValue("@Grupo", grupo ?? (object)DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Factor", factor ?? (object)DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Patologias", jugador.FichaMedica?.Patologias ?? (object)DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Lesiones", jugador.FichaMedica?.HistorialLesiones ?? (object)DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Observaciones", jugador.FichaMedica?.Observaciones ?? (object)DBNull.Value);
                await cmdFicha.ExecuteNonQueryAsync();

                // 4. Actualizar Minutos de Partidos
                if (jugador.Partidos != null)
                {
                    var queryPartidos = @"
                        UPDATE jp 
                        SET jp.minutos_jugados = @Minutos
                        FROM JUGADORES_PARTIDOS jp
                        INNER JOIN HISTORIAL_PARTIDOS hp ON jp.FK_id_partido = hp.PK_id_partido
                        WHERE jp.FK_id_jugador = @Id AND hp.fecha_partido = @Fecha AND hp.rival = @Rival;";

                    foreach (var partido in jugador.Partidos)
                    {
                        using var cmdPartido = new SqlCommand(queryPartidos, connection, transaction);
                        cmdPartido.Parameters.AddWithValue("@Id", id);
                        cmdPartido.Parameters.AddWithValue("@Minutos", partido.Minutos);
                        cmdPartido.Parameters.AddWithValue("@Fecha", partido.Fecha);
                        cmdPartido.Parameters.AddWithValue("@Rival", partido.Rival);
                        await cmdPartido.ExecuteNonQueryAsync();
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
    }
}