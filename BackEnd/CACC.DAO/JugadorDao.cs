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
        public async Task<int> CrearAsync(JugadorAlta dto)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Insertar PERSONA del Jugador
                var queryPersona = @"
                    INSERT INTO PERSONAS (nombre, apellido, dni, fecha_de_nacimiento)
                    OUTPUT INSERTED.PK_id_persona
                    VALUES (@Nombre, @Apellido, @Dni, @FechaNacimiento);";

                using var cmdPersona = new SqlCommand(queryPersona, connection, transaction);
                cmdPersona.Parameters.AddWithValue("@Nombre", dto.Nombre);
                cmdPersona.Parameters.AddWithValue("@Apellido", dto.Apellido);
                cmdPersona.Parameters.AddWithValue("@Dni", dto.Dni);
                cmdPersona.Parameters.AddWithValue("@FechaNacimiento", dto.FechaNacimiento ?? (object)DBNull.Value);

                // Convert.ToInt32 elimina el warning CS8605
                int idPersona = Convert.ToInt32(await cmdPersona.ExecuteScalarAsync());

                // 2. Insertar JUGADOR
                int idCategoria = 0;
                if (!string.IsNullOrEmpty(dto.Categoria)) int.TryParse(dto.Categoria, out idCategoria);

                var queryJugador = @"
                    INSERT INTO JUGADORES (FK_id_persona, FK_id_categoria, posicion_cancha, club_origen, ficha_medica_liga)
                    OUTPUT INSERTED.PK_id_jugador
                    VALUES (@IdPersona, @IdCategoria, @Posicion, @ClubOrigen, @AptoFisico);";

                using var cmdJugador = new SqlCommand(queryJugador, connection, transaction);
                cmdJugador.Parameters.AddWithValue("@IdPersona", idPersona);
                cmdJugador.Parameters.AddWithValue("@IdCategoria", idCategoria);
                cmdJugador.Parameters.AddWithValue("@Posicion", dto.Posicion ?? (object)DBNull.Value);
                cmdJugador.Parameters.AddWithValue("@ClubOrigen", dto.ClubOrigen ?? (object)DBNull.Value);
                cmdJugador.Parameters.AddWithValue("@AptoFisico", dto.AptoFisico);

                int idJugador = Convert.ToInt32(await cmdJugador.ExecuteScalarAsync());

                // 3. Crear FICHA_MEDICA vacía
                var queryFicha = @"
                    INSERT INTO FICHAS_MEDICAS (FK_id_jugador)
                    VALUES (@IdJugador);";

                using var cmdFicha = new SqlCommand(queryFicha, connection, transaction);
                cmdFicha.Parameters.AddWithValue("@IdJugador", idJugador);
                await cmdFicha.ExecuteNonQueryAsync();

                // 4. Insertar/Vincular RESPONSABLE (Tutor)
                if (dto.Tutor != null && !string.IsNullOrWhiteSpace(dto.Tutor.Dni))
                {
                    // 4a. Verificar si la PERSONA del tutor ya existe por DNI
                    var queryCheckPersona = "SELECT PK_id_persona FROM PERSONAS WHERE dni = @TutorDni;";
                    using var cmdCheckPersona = new SqlCommand(queryCheckPersona, connection, transaction);
                    cmdCheckPersona.Parameters.AddWithValue("@TutorDni", dto.Tutor.Dni);
                    var resultPersona = await cmdCheckPersona.ExecuteScalarAsync();

                    int idPersonaTutor;
                    if (resultPersona != null)
                    {
                        // La persona ya existe, reutilizamos su ID
                        idPersonaTutor = Convert.ToInt32(resultPersona);
                    }
                    else
                    {
                        // No existe, la creamos
                        var queryInsertPersonaTutor = @"
                            INSERT INTO PERSONAS (nombre, apellido, dni)
                            OUTPUT INSERTED.PK_id_persona
                            VALUES (@TutorNombre, @TutorApellido, @TutorDni);";
                        using var cmdInsertPersonaTutor = new SqlCommand(queryInsertPersonaTutor, connection, transaction);
                        cmdInsertPersonaTutor.Parameters.AddWithValue("@TutorNombre", dto.Tutor.Nombre);
                        cmdInsertPersonaTutor.Parameters.AddWithValue("@TutorApellido", dto.Tutor.Apellido);
                        cmdInsertPersonaTutor.Parameters.AddWithValue("@TutorDni", dto.Tutor.Dni);
                        idPersonaTutor = Convert.ToInt32(await cmdInsertPersonaTutor.ExecuteScalarAsync());
                    }

                    // 4b. Verificar si ya está en la tabla RESPONSABLES
                    var queryCheckResp = "SELECT PK_id_responsable FROM RESPONSABLES WHERE FK_id_persona = @IdPersonaTutor;";
                    using var cmdCheckResp = new SqlCommand(queryCheckResp, connection, transaction);
                    cmdCheckResp.Parameters.AddWithValue("@IdPersonaTutor", idPersonaTutor);
                    var resultResp = await cmdCheckResp.ExecuteScalarAsync();

                    int idResponsable;
                    if (resultResp != null)
                    {
                        // Ya es responsable, reutilizamos su ID
                        idResponsable = Convert.ToInt32(resultResp);
                    }
                    else
                    {
                        // Lo agregamos a RESPONSABLES
                        var queryInsertResp = @"
                            INSERT INTO RESPONSABLES (FK_id_persona, email, telefono)
                            OUTPUT INSERTED.PK_id_responsable
                            VALUES (@IdPersonaTutor, @Email, @Telefono);";
                        using var cmdInsertResp = new SqlCommand(queryInsertResp, connection, transaction);
                        cmdInsertResp.Parameters.AddWithValue("@IdPersonaTutor", idPersonaTutor);
                        cmdInsertResp.Parameters.AddWithValue("@Email", dto.Tutor.Email ?? (object)DBNull.Value);
                        cmdInsertResp.Parameters.AddWithValue("@Telefono", dto.Tutor.Telefono ?? (object)DBNull.Value);
                        idResponsable = Convert.ToInt32(await cmdInsertResp.ExecuteScalarAsync());
                    }

                    // 4c. Vincular en JUGADORES_RESPONSABLES
                    var queryInsertVinculo = @"
                        INSERT INTO JUGADORES_RESPONSABLES (FK_id_jugador, FK_id_responsable)
                        VALUES (@IdJugador, @IdResponsable);";
                    using var cmdInsertVinculo = new SqlCommand(queryInsertVinculo, connection, transaction);
                    cmdInsertVinculo.Parameters.AddWithValue("@IdJugador", idJugador);
                    cmdInsertVinculo.Parameters.AddWithValue("@IdResponsable", idResponsable);
                    await cmdInsertVinculo.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();
                return idJugador;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}