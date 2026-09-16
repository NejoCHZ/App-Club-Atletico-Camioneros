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

        public async Task<IEnumerable<Jugador>> ObtenerTodosAsync()
        {
            var lista = new List<Jugador>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = "SELECT PK_id_jugador, FK_id_persona, FK_id_categoria, club_origen, ficha_medica_liga, posicion_cancha FROM JUGADORES";
            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lista.Add(MapearJugador(reader));
            }

            return lista;
        }

        public async Task<Jugador?> ObtenerPorIdAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = "SELECT PK_id_jugador, FK_id_persona, FK_id_categoria, club_origen, ficha_medica_liga, posicion_cancha FROM JUGADORES WHERE PK_id_jugador = @Id";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Id", id);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapearJugador(reader);
            }

            return null;
        }

        public async Task<IEnumerable<Jugador>> ObtenerPorCategoriaAsync(int idCategoria)
        {
            var lista = new List<Jugador>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = "SELECT PK_id_jugador, FK_id_persona, FK_id_categoria, club_origen, ficha_medica_liga, posicion_cancha FROM JUGADORES WHERE FK_id_categoria = @IdCategoria";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@IdCategoria", idCategoria);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                lista.Add(MapearJugador(reader));
            }

            return lista;
        }

        private Jugador MapearJugador(SqlDataReader reader)
        {
            return new Jugador
            {
                IdJugador = reader.GetInt32(reader.GetOrdinal("PK_id_jugador")),
                IdPersona = reader.GetInt32(reader.GetOrdinal("FK_id_persona")),
                IdCategoria = reader.GetInt32(reader.GetOrdinal("FK_id_categoria")),
                ClubOrigen = reader.IsDBNull(reader.GetOrdinal("club_origen")) ? null : reader.GetString(reader.GetOrdinal("club_origen")),
                FichaMedicaLiga = reader.GetBoolean(reader.GetOrdinal("ficha_medica_liga")),
                PosicionCancha = reader.IsDBNull(reader.GetOrdinal("posicion_cancha")) ? null : reader.GetString(reader.GetOrdinal("posicion_cancha"))
            };
        }
    }
}