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
                    p.domicilio AS Domicilio,
                    j.FK_id_categoria AS IdCategoria,
                    c.nombre_categoria AS NombreCategoria,
                    j.club_origen AS ClubOrigen,
                    j.ficha_medica_liga AS FichaMedicaLiga,
                    j.posicion_cancha AS PosicionCancha,
                    j.peso AS Peso,
                    j.altura AS Altura,
                    j.pie_habil AS PieHabil,
                    ISNULL(v.cantidad_cuotas_vencidas, 0) AS CuotasVencidas
                FROM JUGADORES j
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                INNER JOIN CATEGORIAS c ON j.FK_id_categoria = c.PK_id_categoria
                LEFT JOIN VISTA_ESTADO_DEUDA v ON j.PK_id_jugador = v.FK_id_jugador;";

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
                SELECT 
                    j.PK_id_jugador AS IdJugador, 
                    p.nombre AS Nombre, 
                    p.apellido AS Apellido, 
                    p.dni AS Dni, 
                    p.genero AS Genero, 
                    p.fecha_de_nacimiento AS FechaDeNacimiento, 
                    p.domicilio AS Domicilio,
                    j.FK_id_categoria AS IdCategoria, 
                    c.nombre_categoria AS NombreCategoria, 
                    j.club_origen AS ClubOrigen, 
                    j.ficha_medica_liga AS FichaMedicaLiga, 
                    j.posicion_cancha AS PosicionCancha, 
                    j.peso AS Peso, 
                    j.altura AS Altura, 
                    j.pie_habil AS PieHabil,
                    ISNULL(v.cantidad_cuotas_vencidas, 0) AS CuotasVencidas
                FROM JUGADORES j
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                INNER JOIN CATEGORIAS c ON j.FK_id_categoria = c.PK_id_categoria
                LEFT JOIN VISTA_ESTADO_DEUDA v ON j.PK_id_jugador = v.FK_id_jugador
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
                        GrupoSanguineo = (grupo != null && factor != null) ? (grupo.Trim() + factor.Trim()) : (grupo ?? factor),
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
                    p.domicilio AS Domicilio,
                    j.FK_id_categoria AS IdCategoria,
                    c.nombre_categoria AS NombreCategoria,
                    j.club_origen AS ClubOrigen,
                    j.ficha_medica_liga AS FichaMedicaLiga,
                    j.posicion_cancha AS PosicionCancha,
                    j.peso AS Peso,
                    j.altura AS Altura,
                    j.pie_habil AS PieHabil,
                    ISNULL(v.cantidad_cuotas_vencidas, 0) AS CuotasVencidas
                FROM JUGADORES j
                INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
                INNER JOIN CATEGORIAS c ON j.FK_id_categoria = c.PK_id_categoria
                LEFT JOIN VISTA_ESTADO_DEUDA v ON j.PK_id_jugador = v.FK_id_jugador
                WHERE j.FK_id_categoria = @IdCategoria;";

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
                Domicilio = reader.IsDBNull(reader.GetOrdinal("Domicilio")) ? null : reader.GetString(reader.GetOrdinal("Domicilio")),
                IdCategoria = reader.GetInt32(reader.GetOrdinal("IdCategoria")),
                NombreCategoria = reader.IsDBNull(reader.GetOrdinal("NombreCategoria")) ? null : reader.GetString(reader.GetOrdinal("NombreCategoria")),
                ClubOrigen = reader.IsDBNull(reader.GetOrdinal("ClubOrigen")) ? null : reader.GetString(reader.GetOrdinal("ClubOrigen")),
                FichaMedicaLiga = reader.GetBoolean(reader.GetOrdinal("FichaMedicaLiga")),
                PosicionCancha = reader.IsDBNull(reader.GetOrdinal("PosicionCancha")) ? null : reader.GetString(reader.GetOrdinal("PosicionCancha")),
                Peso = reader.IsDBNull(reader.GetOrdinal("Peso")) ? null : reader.GetDecimal(reader.GetOrdinal("Peso")),
                Altura = reader.IsDBNull(reader.GetOrdinal("Altura")) ? null : reader.GetDecimal(reader.GetOrdinal("Altura")),
                PieHabil = reader.IsDBNull(reader.GetOrdinal("PieHabil")) ? null : reader.GetString(reader.GetOrdinal("PieHabil")),
                EstadoCuota = reader.GetInt32(reader.GetOrdinal("CuotasVencidas")) > 0 ? "ADEUDA" : "AL DÍA"
            };
        }

        public async Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Actualización de datos personales y contacto en PERSONAS
                var queryPersonas = @"
                    UPDATE p 
                    SET nombre = @Nombre, 
                        apellido = @Apellido, 
                        dni = @Dni, 
                        fecha_de_nacimiento = @FechaNacimiento,
                        genero = @Genero,
                        domicilio = @Domicilio
                    FROM PERSONAS p 
                    INNER JOIN JUGADORES j ON p.PK_id_persona = j.FK_id_persona
                    WHERE j.PK_id_jugador = @Id;";

                using var cmdPersonas = new SqlCommand(queryPersonas, connection, transaction);
                cmdPersonas.Parameters.AddWithValue("@Id", id);
                cmdPersonas.Parameters.AddWithValue("@Nombre", jugador.Nombre);
                cmdPersonas.Parameters.AddWithValue("@Apellido", jugador.Apellido);
                cmdPersonas.Parameters.AddWithValue("@Dni", jugador.Dni);
                cmdPersonas.Parameters.AddWithValue("@FechaNacimiento", jugador.FechaDeNacimiento ?? (object)DBNull.Value);
                cmdPersonas.Parameters.AddWithValue("@Genero", (object?)jugador.Genero ?? DBNull.Value);
                cmdPersonas.Parameters.AddWithValue("@Domicilio", (object?)jugador.Domicilio ?? DBNull.Value);
                await cmdPersonas.ExecuteNonQueryAsync();

                // 2. Actualización de datos deportivos en JUGADORES
                var queryJugadores = @"
                    UPDATE JUGADORES 
                    SET FK_id_categoria = CASE WHEN @IdCategoria > 0 THEN @IdCategoria ELSE FK_id_categoria END,
                        posicion_cancha = @Posicion, 
                        club_origen = @ClubOrigen,
                        peso = @Peso, 
                        altura = @Altura, 
                        pie_habil = @PieHabil
                    WHERE PK_id_jugador = @Id;";

                using var cmdJugadores = new SqlCommand(queryJugadores, connection, transaction);
                cmdJugadores.Parameters.AddWithValue("@Id", id);
                cmdJugadores.Parameters.AddWithValue("@IdCategoria", jugador.IdCategoria);
                cmdJugadores.Parameters.AddWithValue("@Posicion", (object?)jugador.PosicionCancha ?? DBNull.Value);
                cmdJugadores.Parameters.AddWithValue("@ClubOrigen", (object?)jugador.ClubOrigen ?? DBNull.Value);
                cmdJugadores.Parameters.AddWithValue("@Peso", (object?)jugador.Peso ?? DBNull.Value);
                cmdJugadores.Parameters.AddWithValue("@Altura", (object?)jugador.Altura ?? DBNull.Value);
                cmdJugadores.Parameters.AddWithValue("@PieHabil", (object?)jugador.PieHabil ?? DBNull.Value);

                int rowsJugador = await cmdJugadores.ExecuteNonQueryAsync();
                if (rowsJugador == 0)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                // 3. Extracción segura de grupo sanguíneo y factor
                string? grupo = null;
                string? factor = null;
                if (!string.IsNullOrWhiteSpace(jugador.FichaMedica?.GrupoSanguineo))
                {
                    var gs = jugador.FichaMedica.GrupoSanguineo.Trim();
                    if (gs.EndsWith("+") || gs.EndsWith("-"))
                    {
                        factor = gs.Substring(gs.Length - 1, 1);
                        grupo = gs.Substring(0, gs.Length - 1).Trim();
                    }
                    else
                    {
                        grupo = gs;
                    }
                }

                // 4. Persistencia en FICHAS_MEDICAS (UPSERT: Actualiza si existe o inserta si no fue creada previamente)
                var queryFicha = @"
                    IF EXISTS (SELECT 1 FROM FICHAS_MEDICAS WHERE FK_id_jugador = @Id)
                    BEGIN
                        UPDATE FICHAS_MEDICAS 
                        SET grupo_sanguineo = @Grupo, 
                            factor = @Factor, 
                            antecedentes_salud = @Patologias, 
                            condiciones_cronicas = @Lesiones, 
                            observaciones = @Observaciones,
                            fecha_actualizacion = GETDATE()
                        WHERE FK_id_jugador = @Id;
                    END
                    ELSE
                    BEGIN
                        INSERT INTO FICHAS_MEDICAS (FK_id_jugador, grupo_sanguineo, factor, antecedentes_salud, condiciones_cronicas, observaciones, fecha_actualizacion)
                        VALUES (@Id, @Grupo, @Factor, @Patologias, @Lesiones, @Observaciones, GETDATE());
                    END;";

                using var cmdFicha = new SqlCommand(queryFicha, connection, transaction);
                cmdFicha.Parameters.AddWithValue("@Id", id);
                cmdFicha.Parameters.AddWithValue("@Grupo", (object?)grupo ?? DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Factor", (object?)factor ?? DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Patologias", (object?)jugador.FichaMedica?.Patologias ?? DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Lesiones", (object?)jugador.FichaMedica?.HistorialLesiones ?? DBNull.Value);
                cmdFicha.Parameters.AddWithValue("@Observaciones", (object?)jugador.FichaMedica?.Observaciones ?? DBNull.Value);
                await cmdFicha.ExecuteNonQueryAsync();

                // 5. Actualización de minutos en partidos disputados si fueron provistos
                if (jugador.Partidos != null && jugador.Partidos.Count > 0)
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
                var queryPersona = @"
                    INSERT INTO PERSONAS (nombre, apellido, dni, fecha_de_nacimiento)
                    OUTPUT INSERTED.PK_id_persona
                    VALUES (@Nombre, @Apellido, @Dni, @FechaNacimiento);";

                using var cmdPersona = new SqlCommand(queryPersona, connection, transaction);
                cmdPersona.Parameters.AddWithValue("@Nombre", dto.Nombre);
                cmdPersona.Parameters.AddWithValue("@Apellido", dto.Apellido);
                cmdPersona.Parameters.AddWithValue("@Dni", dto.Dni);
                cmdPersona.Parameters.AddWithValue("@FechaNacimiento", dto.FechaNacimiento ?? (object)DBNull.Value);

                int idPersona = Convert.ToInt32(await cmdPersona.ExecuteScalarAsync());

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

                var queryFicha = @"
                    INSERT INTO FICHAS_MEDICAS (FK_id_jugador)
                    VALUES (@IdJugador);";

                using var cmdFicha = new SqlCommand(queryFicha, connection, transaction);
                cmdFicha.Parameters.AddWithValue("@IdJugador", idJugador);
                await cmdFicha.ExecuteNonQueryAsync();

                if (dto.Tutor != null && !string.IsNullOrWhiteSpace(dto.Tutor.Dni))
                {
                    var queryCheckPersona = "SELECT PK_id_persona FROM PERSONAS WHERE dni = @TutorDni;";
                    using var cmdCheckPersona = new SqlCommand(queryCheckPersona, connection, transaction);
                    cmdCheckPersona.Parameters.AddWithValue("@TutorDni", dto.Tutor.Dni);
                    var resultPersona = await cmdCheckPersona.ExecuteScalarAsync();

                    int idPersonaTutor;
                    if (resultPersona != null)
                    {
                        idPersonaTutor = Convert.ToInt32(resultPersona);
                    }
                    else
                    {
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

                    var queryCheckResp = "SELECT PK_id_responsable FROM RESPONSABLES WHERE FK_id_persona = @IdPersonaTutor;";
                    using var cmdCheckResp = new SqlCommand(queryCheckResp, connection, transaction);
                    cmdCheckResp.Parameters.AddWithValue("@IdPersonaTutor", idPersonaTutor);
                    var resultResp = await cmdCheckResp.ExecuteScalarAsync();

                    int idResponsable;
                    if (resultResp != null)
                    {
                        idResponsable = Convert.ToInt32(resultResp);
                    }
                    else
                    {
                        var queryMaxResp = "SELECT ISNULL(MAX(PK_id_responsable), 0) + 1 FROM RESPONSABLES;";
                        using var cmdMaxResp = new SqlCommand(queryMaxResp, connection, transaction);
                        int idResponsableMax = Convert.ToInt32(await cmdMaxResp.ExecuteScalarAsync());

                        var queryInsertResp = @"
                            INSERT INTO RESPONSABLES (PK_id_responsable, FK_id_persona, email, telefono)
                            VALUES (@IdResponsable, @IdPersonaTutor, @Email, @Telefono);";
                        using var cmdInsertResp = new SqlCommand(queryInsertResp, connection, transaction);
                        cmdInsertResp.Parameters.AddWithValue("@IdResponsable", idResponsableMax);
                        cmdInsertResp.Parameters.AddWithValue("@IdPersonaTutor", idPersonaTutor);
                        cmdInsertResp.Parameters.AddWithValue("@Email", dto.Tutor.Email ?? (object)DBNull.Value);
                        cmdInsertResp.Parameters.AddWithValue("@Telefono", dto.Tutor.Telefono ?? (object)DBNull.Value);
                        await cmdInsertResp.ExecuteNonQueryAsync();

                        idResponsable = idResponsableMax;
                    }

                    var queryMaxVinculo = "SELECT ISNULL(MAX(PK_id_jugador_responsable), 0) + 1 FROM JUGADORES_RESPONSABLES;";
                    using var cmdMaxVinculo = new SqlCommand(queryMaxVinculo, connection, transaction);
                    int idVinculo = Convert.ToInt32(await cmdMaxVinculo.ExecuteScalarAsync());

                    var queryInsertVinculo = @"
                        INSERT INTO JUGADORES_RESPONSABLES (PK_id_jugador_responsable, FK_id_jugador, FK_id_responsable, parentesco)
                        VALUES (@IdVinculo, @IdJugador, @IdResponsable, @Parentesco);";
                    using var cmdInsertVinculo = new SqlCommand(queryInsertVinculo, connection, transaction);
                    cmdInsertVinculo.Parameters.AddWithValue("@IdVinculo", idVinculo);
                    cmdInsertVinculo.Parameters.AddWithValue("@IdJugador", idJugador);
                    cmdInsertVinculo.Parameters.AddWithValue("@IdResponsable", idResponsable);
                    cmdInsertVinculo.Parameters.AddWithValue("@Parentesco", dto.Tutor.Parentesco ?? (object)DBNull.Value);
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
        public async Task<bool> EliminarAsync(int idJugador)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Obtener el FK_id_persona antes de borrar el jugador
                var queryPersona = "SELECT FK_id_persona FROM JUGADORES WHERE PK_id_jugador = @idJugador";
                int? idPersona = null;
                using (var cmdPersona = new SqlCommand(queryPersona, connection, transaction))
                {
                    cmdPersona.Parameters.AddWithValue("@idJugador", idJugador);
                    var result = await cmdPersona.ExecuteScalarAsync();
                    if (result != null && result != DBNull.Value)
                    {
                        idPersona = Convert.ToInt32(result);
                    }
                }

                if (!idPersona.HasValue)
                {
                    transaction.Rollback();
                    return false;
                }

                // 2. Limpieza de tablas dependientes por Foreign Key
                var queriesEliminacion = new[]
                {
            "DELETE FROM JUGADORES_PARTIDOS WHERE FK_id_jugador = @idJugador",
            "DELETE FROM ASISTENCIAS WHERE FK_id_jugador = @idJugador",
            "DELETE FROM PAGOS WHERE FK_id_jugador = @idJugador",
            "DELETE FROM JUGADORES_DESCUENTOS WHERE FK_id_jugador = @idJugador",
            "DELETE FROM FICHAS_MEDICAS WHERE FK_id_jugador = @idJugador",
            "DELETE FROM JUGADORES_RESPONSABLES WHERE FK_id_jugador = @idJugador",
            "DELETE FROM JUGADORES WHERE PK_id_jugador = @idJugador"
        };

                foreach (var sql in queriesEliminacion)
                {
                    using var cmd = new SqlCommand(sql, connection, transaction);
                    cmd.Parameters.AddWithValue("@idJugador", idJugador);
                    await cmd.ExecuteNonQueryAsync();
                }

                // 3. Eliminar persona base si no tiene usuarios en STAFF / USUARIOS
                var queryVerificarStaff = "SELECT COUNT(*) FROM USUARIOS WHERE FK_id_persona = @idPersona";
                int usuariosVinculados = 0;
                using (var cmdVerif = new SqlCommand(queryVerificarStaff, connection, transaction))
                {
                    cmdVerif.Parameters.AddWithValue("@idPersona", idPersona.Value);
                    usuariosVinculados = Convert.ToInt32(await cmdVerif.ExecuteScalarAsync());
                }

                if (usuariosVinculados == 0)
                {
                    using var cmdDelPersona = new SqlCommand("DELETE FROM PERSONAS WHERE PK_id_persona = @idPersona", connection, transaction);
                    cmdDelPersona.Parameters.AddWithValue("@idPersona", idPersona.Value);
                    await cmdDelPersona.ExecuteNonQueryAsync();
                }

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> GuardarTutorAsync(int idJugador, string nombre, string apellido, string parentesco, string telefono, string? email)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Verificar si el jugador ya tiene responsable asignado
                var sqlCheck = @"
            SELECT jr.FK_id_responsable, r.FK_id_persona
            FROM JUGADORES_RESPONSABLES jr
            INNER JOIN RESPONSABLES r ON jr.FK_id_responsable = r.PK_id_responsable
            WHERE jr.FK_id_jugador = @idJugador";

                int idResponsable = 0;
                int idPersonaTutor = 0;
                bool existe = false;

                using (var cmdCheck = new SqlCommand(sqlCheck, connection, transaction))
                {
                    cmdCheck.Parameters.AddWithValue("@idJugador", idJugador);
                    using var reader = await cmdCheck.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        existe = true;
                        idResponsable = reader.GetInt32(0);
                        idPersonaTutor = reader.GetInt32(1);
                    }
                }

                if (existe)
                {
                    // Actualizar datos existentes
                    var updatePersona = "UPDATE PERSONAS SET nombre = @nombre, apellido = @apellido WHERE PK_id_persona = @idPersona";
                    using (var cmdUpP = new SqlCommand(updatePersona, connection, transaction))
                    {
                        cmdUpP.Parameters.AddWithValue("@nombre", nombre.Trim());
                        cmdUpP.Parameters.AddWithValue("@apellido", apellido.Trim());
                        cmdUpP.Parameters.AddWithValue("@idPersona", idPersonaTutor);
                        await cmdUpP.ExecuteNonQueryAsync();
                    }

                    var updateResp = "UPDATE RESPONSABLES SET telefono = @telefono, email = @email WHERE PK_id_responsable = @idResp";
                    using (var cmdUpR = new SqlCommand(updateResp, connection, transaction))
                    {
                        cmdUpR.Parameters.AddWithValue("@telefono", telefono.Trim());
                        cmdUpR.Parameters.AddWithValue("@email", (object?)email?.Trim() ?? DBNull.Value);
                        cmdUpR.Parameters.AddWithValue("@idResp", idResponsable);
                        await cmdUpR.ExecuteNonQueryAsync();
                    }

                    var updateParentesco = "UPDATE JUGADORES_RESPONSABLES SET parentesco = @parentesco WHERE FK_id_responsable = @idResp AND FK_id_jugador = @idJugador";
                    using (var cmdUpPr = new SqlCommand(updateParentesco, connection, transaction))
                    {
                        cmdUpPr.Parameters.AddWithValue("@parentesco", parentesco.Trim());
                        cmdUpPr.Parameters.AddWithValue("@idResp", idResponsable);
                        cmdUpPr.Parameters.AddWithValue("@idJugador", idJugador);
                        await cmdUpPr.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    // Insertar nueva persona para el tutor
                    var insertPersona = @"
                INSERT INTO PERSONAS (nombre, apellido) 
                VALUES (@nombre, @apellido);
                SELECT SCOPE_IDENTITY();";

                    using (var cmdInP = new SqlCommand(insertPersona, connection, transaction))
                    {
                        cmdInP.Parameters.AddWithValue("@nombre", nombre.Trim());
                        cmdInP.Parameters.AddWithValue("@apellido", apellido.Trim());
                        idPersonaTutor = Convert.ToInt32(await cmdInP.ExecuteScalarAsync());
                    }

                    // Calcular nuevo PK_id_responsable (la tabla no es identity)
                    var sqlNextRespId = "SELECT ISNULL(MAX(PK_id_responsable), 0) + 1 FROM RESPONSABLES";
                    using (var cmdIdR = new SqlCommand(sqlNextRespId, connection, transaction))
                    {
                        idResponsable = Convert.ToInt32(await cmdIdR.ExecuteScalarAsync());
                    }

                    var insertResp = @"
                INSERT INTO RESPONSABLES (PK_id_responsable, FK_id_persona, telefono, email)
                VALUES (@idResp, @idPersona, @telefono, @email)";
                    using (var cmdInR = new SqlCommand(insertResp, connection, transaction))
                    {
                        cmdInR.Parameters.AddWithValue("@idResp", idResponsable);
                        cmdInR.Parameters.AddWithValue("@idPersona", idPersonaTutor);
                        cmdInR.Parameters.AddWithValue("@telefono", telefono.Trim());
                        cmdInR.Parameters.AddWithValue("@email", (object?)email?.Trim() ?? DBNull.Value);
                        await cmdInR.ExecuteNonQueryAsync();
                    }

                    // Calcular nuevo PK_id_jugador_responsable
                    var sqlNextJugRespId = "SELECT ISNULL(MAX(PK_id_jugador_responsable), 0) + 1 FROM JUGADORES_RESPONSABLES";
                    int idJugResp = 0;
                    using (var cmdIdJR = new SqlCommand(sqlNextJugRespId, connection, transaction))
                    {
                        idJugResp = Convert.ToInt32(await cmdIdJR.ExecuteScalarAsync());
                    }

                    var insertJugResp = @"
                INSERT INTO JUGADORES_RESPONSABLES (PK_id_jugador_responsable, FK_id_responsable, FK_id_jugador, parentesco)
                VALUES (@idJugResp, @idResp, @idJugador, @parentesco)";
                    using (var cmdInJR = new SqlCommand(insertJugResp, connection, transaction))
                    {
                        cmdInJR.Parameters.AddWithValue("@idJugResp", idJugResp);
                        cmdInJR.Parameters.AddWithValue("@idResp", idResponsable);
                        cmdInJR.Parameters.AddWithValue("@idJugador", idJugador);
                        cmdInJR.Parameters.AddWithValue("@parentesco", parentesco.Trim());
                        await cmdInJR.ExecuteNonQueryAsync();
                    }
                }

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    }
}