using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace CACC.DAO
{
    public class JugadorDao : IJugadorDao
    {
        private readonly string _connectionString;

        // Consulta base que concatena todas las divisiones deportivas asociadas al jugador
        private const string BaseJugadorQuery = @"
            SELECT 
                j.PK_id_jugador AS IdJugador,
                p.nombre AS Nombre,
                p.apellido AS Apellido,
                p.dni AS Dni,
                p.genero AS Genero,
                p.fecha_de_nacimiento AS FechaDeNacimiento,
                p.domicilio AS Domicilio,
                j.FK_id_categoria AS IdCategoria,
                ISNULL((
                    SELECT STRING_AGG(c_sub.nombre_categoria, ', ')
                    FROM (
                        SELECT DISTINCT c2.nombre_categoria
                        FROM JUGADORES_CATEGORIAS jc
                        INNER JOIN CATEGORIAS c2 ON jc.FK_id_categoria = c2.PK_id_categoria
                        WHERE jc.FK_id_jugador = j.PK_id_jugador
                    ) AS c_sub
                ), ISNULL(c.nombre_categoria, 'Sin categoría')) AS NombreCategoria,
                j.club_origen AS ClubOrigen,
                j.ficha_medica_liga AS FichaMedicaLiga,
                j.posicion_cancha AS PosicionCancha,
                j.peso AS Peso,
                j.altura AS Altura,
                j.pie_habil AS PieHabil,
                ISNULL(v.cantidad_cuotas_vencidas, 0) AS CuotasVencidas,
                pt.dni AS TutorDni,
                pt.nombre AS TutorNombre,
                pt.apellido AS TutorApellido,
                r.telefono AS TutorTelefono,
                r.email AS TutorEmail,
                jr.parentesco AS TutorParentesco
            FROM JUGADORES j
            INNER JOIN PERSONAS p ON j.FK_id_persona = p.PK_id_persona
            LEFT JOIN CATEGORIAS c ON j.FK_id_categoria = c.PK_id_categoria
            LEFT JOIN VISTA_ESTADO_DEUDA v ON j.PK_id_jugador = v.FK_id_jugador
            LEFT JOIN JUGADORES_RESPONSABLES jr ON j.PK_id_jugador = jr.FK_id_jugador
            LEFT JOIN RESPONSABLES r ON jr.FK_id_responsable = r.PK_id_responsable
            LEFT JOIN PERSONAS pt ON r.FK_id_persona = pt.PK_id_persona";

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

            var query = $"{BaseJugadorQuery} ORDER BY j.PK_id_jugador ASC;";

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

            var query = $@"
                {BaseJugadorQuery}
                WHERE j.PK_id_jugador = @Id;

                SELECT 
                    hp.PK_id_partido AS IdPartido,
                    hp.FK_id_categoria AS IdCategoria,
                    ISNULL(c.nombre_categoria, 'Sin categoría') AS Categoria,
                    hp.fecha_partido AS Fecha, 
                    hp.rival AS Rival, 
                    hp.resultado AS Resultado, 
                    hp.condicion_localia AS Condicion, 
                    ISNULL(jp.minutos_jugados, 0) AS Minutos
                FROM JUGADORES_PARTIDOS jp
                INNER JOIN HISTORIAL_PARTIDOS hp ON jp.FK_id_partido = hp.PK_id_partido
                LEFT JOIN CATEGORIAS c ON hp.FK_id_categoria = c.PK_id_categoria
                WHERE jp.FK_id_jugador = @Id
                ORDER BY hp.fecha_partido DESC;

                SELECT antecedentes_salud AS Patologias, condiciones_cronicas AS HistorialLesiones, observaciones AS Observaciones, grupo_sanguineo AS GrupoSanguineo, factor AS Factor
                FROM FICHAS_MEDICAS
                WHERE FK_id_jugador = @Id;";

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
                            IdPartido = reader.GetInt32(reader.GetOrdinal("IdPartido")),
                            IdCategoria = reader.IsDBNull(reader.GetOrdinal("IdCategoria")) ? 0 : reader.GetInt32(reader.GetOrdinal("IdCategoria")),
                            Categoria = reader.IsDBNull(reader.GetOrdinal("Categoria")) ? string.Empty : reader.GetString(reader.GetOrdinal("Categoria")),
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

            var query = $@"{BaseJugadorQuery} 
                WHERE (j.FK_id_categoria = @IdCategoria OR EXISTS (
                    SELECT 1 FROM JUGADORES_CATEGORIAS jc 
                    WHERE jc.FK_id_jugador = j.PK_id_jugador AND jc.FK_id_categoria = @IdCategoria
                ))
                ORDER BY j.PK_id_jugador ASC;";

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
            int cuotasVencidas = reader.GetInt32(reader.GetOrdinal("CuotasVencidas"));
            string estadoCuota = cuotasVencidas >= 2
                ? "INHABILITADO"
                : (cuotasVencidas == 1 ? "PENDIENTE" : "AL DÍA");

            var jugador = new JugadorDetalle
            {
                IdJugador = reader.GetInt32(reader.GetOrdinal("IdJugador")),
                Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                Apellido = reader.GetString(reader.GetOrdinal("Apellido")),
                Dni = reader.GetString(reader.GetOrdinal("Dni")),
                Genero = reader.IsDBNull(reader.GetOrdinal("Genero")) ? null : reader.GetString(reader.GetOrdinal("Genero")),
                FechaDeNacimiento = reader.IsDBNull(reader.GetOrdinal("FechaDeNacimiento")) ? null : reader.GetDateTime(reader.GetOrdinal("FechaDeNacimiento")),
                Domicilio = reader.IsDBNull(reader.GetOrdinal("Domicilio")) ? null : reader.GetString(reader.GetOrdinal("Domicilio")),
                IdCategoria = reader.IsDBNull(reader.GetOrdinal("IdCategoria")) ? 0 : reader.GetInt32(reader.GetOrdinal("IdCategoria")),
                NombreCategoria = reader.IsDBNull(reader.GetOrdinal("NombreCategoria")) ? "Sin categoría" : reader.GetString(reader.GetOrdinal("NombreCategoria")),
                ClubOrigen = reader.IsDBNull(reader.GetOrdinal("ClubOrigen")) ? null : reader.GetString(reader.GetOrdinal("ClubOrigen")),
                FichaMedicaLiga = !reader.IsDBNull(reader.GetOrdinal("FichaMedicaLiga")) && reader.GetBoolean(reader.GetOrdinal("FichaMedicaLiga")),
                PosicionCancha = reader.IsDBNull(reader.GetOrdinal("PosicionCancha")) ? null : reader.GetString(reader.GetOrdinal("PosicionCancha")),
                Peso = reader.IsDBNull(reader.GetOrdinal("Peso")) ? null : reader.GetDecimal(reader.GetOrdinal("Peso")),
                Altura = reader.IsDBNull(reader.GetOrdinal("Altura")) ? null : reader.GetDecimal(reader.GetOrdinal("Altura")),
                PieHabil = reader.IsDBNull(reader.GetOrdinal("PieHabil")) ? null : reader.GetString(reader.GetOrdinal("PieHabil")),
                EstadoCuota = estadoCuota
            };

            int tutorNombreOrdinal = reader.GetOrdinal("TutorNombre");
            if (!reader.IsDBNull(tutorNombreOrdinal))
            {
                jugador.Tutor = new TutorDetalle
                {
                    Dni = reader.IsDBNull(reader.GetOrdinal("TutorDni")) ? string.Empty : reader.GetString(reader.GetOrdinal("TutorDni")),
                    Nombre = reader.GetString(tutorNombreOrdinal),
                    Apellido = reader.IsDBNull(reader.GetOrdinal("TutorApellido")) ? string.Empty : reader.GetString(reader.GetOrdinal("TutorApellido")),
                    Telefono = reader.IsDBNull(reader.GetOrdinal("TutorTelefono")) ? null : reader.GetString(reader.GetOrdinal("TutorTelefono")),
                    Email = reader.IsDBNull(reader.GetOrdinal("TutorEmail")) ? null : reader.GetString(reader.GetOrdinal("TutorEmail")),
                    Parentesco = reader.IsDBNull(reader.GetOrdinal("TutorParentesco")) ? null : reader.GetString(reader.GetOrdinal("TutorParentesco"))
                };
            }

            return jugador;
        }

        public async Task<bool> ActualizarPerfilAsync(int id, JugadorDetalle jugador)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Datos personales en PERSONAS
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

                // 2. Datos deportivos en JUGADORES y sincronización en JUGADORES_CATEGORIAS
                var queryJugadores = @"
                    UPDATE JUGADORES 
                    SET FK_id_categoria = CASE WHEN @IdCategoria > 0 THEN @IdCategoria ELSE FK_id_categoria END,
                        posicion_cancha = @Posicion, 
                        club_origen = @ClubOrigen, 
                        peso = @Peso, 
                        altura = @Altura, 
                        pie_habil = @PieHabil
                    WHERE PK_id_jugador = @Id;

                    IF @IdCategoria > 0
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM JUGADORES_CATEGORIAS WHERE FK_id_jugador = @Id AND FK_id_categoria = @IdCategoria)
                        BEGIN
                            INSERT INTO JUGADORES_CATEGORIAS (FK_id_jugador, FK_id_categoria)
                            VALUES (@Id, @IdCategoria);
                        END
                    END;";

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

                // 3. Extracción de grupo sanguíneo y factor
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

                // 4. Persistencia en FICHAS_MEDICAS
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

                // 5. Minutos jugados en partidos usando IdPartido o fecha/rival
                if (jugador.Partidos != null && jugador.Partidos.Count > 0)
                {
                    var queryPartidos = @"
                        UPDATE jp 
                        SET jp.minutos_jugados = @Minutos
                        FROM JUGADORES_PARTIDOS jp 
                        INNER JOIN HISTORIAL_PARTIDOS hp ON jp.FK_id_partido = hp.PK_id_partido
                        WHERE jp.FK_id_jugador = @Id 
                          AND (
                              (@IdPartido > 0 AND jp.FK_id_partido = @IdPartido)
                              OR (@IdPartido <= 0 AND hp.fecha_partido = @Fecha AND hp.rival = @Rival)
                          );";

                    foreach (var partido in jugador.Partidos)
                    {
                        using var cmdPartido = new SqlCommand(queryPartidos, connection, transaction);
                        cmdPartido.Parameters.AddWithValue("@Id", id);
                        cmdPartido.Parameters.AddWithValue("@IdPartido", partido.IdPartido);
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
                cmdJugador.Parameters.AddWithValue("@IdCategoria", idCategoria > 0 ? (object)idCategoria : DBNull.Value);
                cmdJugador.Parameters.AddWithValue("@Posicion", dto.Posicion ?? (object)DBNull.Value);
                cmdJugador.Parameters.AddWithValue("@ClubOrigen", dto.ClubOrigen ?? (object)DBNull.Value);
                cmdJugador.Parameters.AddWithValue("@AptoFisico", dto.AptoFisico);

                int idJugador = Convert.ToInt32(await cmdJugador.ExecuteScalarAsync());

                // Alta directa en JUGADORES_CATEGORIAS si posee categoría inicial
                if (idCategoria > 0)
                {
                    var queryJugCat = @"
                        IF NOT EXISTS (SELECT 1 FROM JUGADORES_CATEGORIAS WHERE FK_id_jugador = @IdJugador AND FK_id_categoria = @IdCategoria)
                        BEGIN
                            INSERT INTO JUGADORES_CATEGORIAS (FK_id_jugador, FK_id_categoria)
                            VALUES (@IdJugador, @IdCategoria);
                        END";
                    using var cmdJugCat = new SqlCommand(queryJugCat, connection, transaction);
                    cmdJugCat.Parameters.AddWithValue("@IdJugador", idJugador);
                    cmdJugCat.Parameters.AddWithValue("@IdCategoria", idCategoria);
                    await cmdJugCat.ExecuteNonQueryAsync();
                }

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
                    cmdCheckPersona.Parameters.AddWithValue("@TutorDni", dto.Tutor.Dni.Trim());
                    var resultPersona = await cmdCheckPersona.ExecuteScalarAsync();

                    int idPersonaTutor;
                    if (resultPersona != null && resultPersona != DBNull.Value)
                    {
                        idPersonaTutor = Convert.ToInt32(resultPersona);
                        // Actualizar datos del tutor si ya existía
                        var queryUpdateP = @"
                            UPDATE PERSONAS 
                            SET nombre = @TutorNombre, apellido = @TutorApellido 
                            WHERE PK_id_persona = @IdPersonaTutor;";
                        using var cmdUpP = new SqlCommand(queryUpdateP, connection, transaction);
                        cmdUpP.Parameters.AddWithValue("@TutorNombre", dto.Tutor.Nombre.Trim());
                        cmdUpP.Parameters.AddWithValue("@TutorApellido", dto.Tutor.Apellido.Trim());
                        cmdUpP.Parameters.AddWithValue("@IdPersonaTutor", idPersonaTutor);
                        await cmdUpP.ExecuteNonQueryAsync();
                    }
                    else
                    {
                        var queryInsertPersonaTutor = @"
                            INSERT INTO PERSONAS (nombre, apellido, dni)
                            OUTPUT INSERTED.PK_id_persona
                            VALUES (@TutorNombre, @TutorApellido, @TutorDni);";
                        using var cmdInsertPersonaTutor = new SqlCommand(queryInsertPersonaTutor, connection, transaction);
                        cmdInsertPersonaTutor.Parameters.AddWithValue("@TutorNombre", dto.Tutor.Nombre.Trim());
                        cmdInsertPersonaTutor.Parameters.AddWithValue("@TutorApellido", dto.Tutor.Apellido.Trim());
                        cmdInsertPersonaTutor.Parameters.AddWithValue("@TutorDni", dto.Tutor.Dni.Trim());
                        idPersonaTutor = Convert.ToInt32(await cmdInsertPersonaTutor.ExecuteScalarAsync());
                    }

                    var queryCheckResp = "SELECT PK_id_responsable FROM RESPONSABLES WHERE FK_id_persona = @IdPersonaTutor;";
                    using var cmdCheckResp = new SqlCommand(queryCheckResp, connection, transaction);
                    cmdCheckResp.Parameters.AddWithValue("@IdPersonaTutor", idPersonaTutor);
                    var resultResp = await cmdCheckResp.ExecuteScalarAsync();

                    int idResponsable;
                    if (resultResp != null && resultResp != DBNull.Value)
                    {
                        idResponsable = Convert.ToInt32(resultResp);
                        var queryUpdateResp = @"
                            UPDATE RESPONSABLES 
                            SET email = @Email, telefono = @Telefono 
                            WHERE PK_id_responsable = @IdResponsable;";
                        using var cmdUpR = new SqlCommand(queryUpdateResp, connection, transaction);
                        cmdUpR.Parameters.AddWithValue("@Email", dto.Tutor.Email ?? (object)DBNull.Value);
                        cmdUpR.Parameters.AddWithValue("@Telefono", dto.Tutor.Telefono ?? (object)DBNull.Value);
                        cmdUpR.Parameters.AddWithValue("@IdResponsable", idResponsable);
                        await cmdUpR.ExecuteNonQueryAsync();
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
                    await transaction.RollbackAsync();
                    return false;
                }

                var queriesEliminacion = new[]
                {
                    "DELETE FROM JUGADORES_PARTIDOS WHERE FK_id_jugador = @idJugador",
                    "DELETE FROM ASISTENCIAS WHERE FK_id_jugador = @idJugador",
                    "DELETE FROM PAGOS WHERE FK_id_jugador = @idJugador",
                    "DELETE FROM JUGADORES_DESCUENTOS WHERE FK_id_jugador = @idJugador",
                    "DELETE FROM FICHAS_MEDICAS WHERE FK_id_jugador = @idJugador",
                    "DELETE FROM JUGADORES_RESPONSABLES WHERE FK_id_jugador = @idJugador",
                    "DELETE FROM JUGADORES_CATEGORIAS WHERE FK_id_jugador = @idJugador",
                    "DELETE FROM JUGADORES WHERE PK_id_jugador = @idJugador"
                };

                foreach (var sql in queriesEliminacion)
                {
                    using var cmd = new SqlCommand(sql, connection, transaction);
                    cmd.Parameters.AddWithValue("@idJugador", idJugador);
                    await cmd.ExecuteNonQueryAsync();
                }

                var queryVerificarStaff = "SELECT COUNT(*) FROM USUARIOS WHERE FK_id_persona = @idPersona";
                int usuariosVinculados = 0;
                using (var cmdVerif = new SqlCommand(queryVerificarStaff, connection, transaction))
                {
                    cmdVerif.Parameters.AddWithValue("@idPersona", idPersona.Value);
                    usuariosVinculados = Convert.ToInt32(await cmdVerif.ExecuteScalarAsync());
                }

                var queryVerificarResponsable = @"
                    SELECT COUNT(*) 
                    FROM RESPONSABLES r 
                    INNER JOIN JUGADORES_RESPONSABLES jr ON r.PK_id_responsable = jr.FK_id_responsable 
                    WHERE r.FK_id_persona = @idPersona";
                int responsablesVinculados = 0;
                using (var cmdVerifResp = new SqlCommand(queryVerificarResponsable, connection, transaction))
                {
                    cmdVerifResp.Parameters.AddWithValue("@idPersona", idPersona.Value);
                    responsablesVinculados = Convert.ToInt32(await cmdVerifResp.ExecuteScalarAsync());
                }

                if (usuariosVinculados == 0 && responsablesVinculados == 0)
                {
                    using var cmdDelPersona = new SqlCommand("DELETE FROM PERSONAS WHERE PK_id_persona = @idPersona", connection, transaction);
                    cmdDelPersona.Parameters.AddWithValue("@idPersona", idPersona.Value);
                    await cmdDelPersona.ExecuteNonQueryAsync();
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

        public async Task<TutorDetalle?> BuscarTutorPorDniAsync(string dni)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT TOP 1
                    p.dni AS Dni,
                    p.nombre AS Nombre,
                    p.apellido AS Apellido,
                    ISNULL(r.telefono, '') AS Telefono,
                    ISNULL(r.email, '') AS Email,
                    ISNULL((
                        SELECT TOP 1 jr.parentesco 
                        FROM JUGADORES_RESPONSABLES jr 
                        WHERE jr.FK_id_responsable = r.PK_id_responsable
                    ), 'Padre') AS Parentesco
                FROM PERSONAS p
                INNER JOIN RESPONSABLES r ON p.PK_id_persona = r.FK_id_persona
                WHERE p.dni = @Dni;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Dni", dni.Trim());

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new TutorDetalle
                {
                    Dni = reader.GetString(reader.GetOrdinal("Dni")),
                    Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                    Apellido = reader.GetString(reader.GetOrdinal("Apellido")),
                    Telefono = reader.IsDBNull(reader.GetOrdinal("Telefono")) ? string.Empty : reader.GetString(reader.GetOrdinal("Telefono")),
                    Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? string.Empty : reader.GetString(reader.GetOrdinal("Email")),
                    Parentesco = reader.IsDBNull(reader.GetOrdinal("Parentesco")) ? "Padre" : reader.GetString(reader.GetOrdinal("Parentesco"))
                };
            }

            return null;
        }

        public async Task<bool> GuardarTutorAsync(int idJugador, string dni, string nombre, string apellido, string parentesco, string telefono, string? email)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Verificar existencia del jugador
                const string checkJugadorSql = "SELECT COUNT(1) FROM JUGADORES WHERE PK_id_jugador = @idJugador";
                using (var cmdCheckJug = new SqlCommand(checkJugadorSql, connection, transaction))
                {
                    cmdCheckJug.Parameters.AddWithValue("@idJugador", idJugador);
                    int count = Convert.ToInt32(await cmdCheckJug.ExecuteScalarAsync());
                    if (count == 0)
                    {
                        await transaction.RollbackAsync();
                        return false;
                    }
                }

                // 2. Buscar si la persona ya existe por DNI
                int idPersonaTutor;
                const string queryCheckPersona = "SELECT PK_id_persona FROM PERSONAS WHERE dni = @Dni;";
                using (var cmdCheckPersona = new SqlCommand(queryCheckPersona, connection, transaction))
                {
                    cmdCheckPersona.Parameters.AddWithValue("@Dni", dni.Trim());
                    var resPersona = await cmdCheckPersona.ExecuteScalarAsync();
                    if (resPersona != null && resPersona != DBNull.Value)
                    {
                        idPersonaTutor = Convert.ToInt32(resPersona);
                        const string queryUpP = "UPDATE PERSONAS SET nombre = @Nombre, apellido = @Apellido WHERE PK_id_persona = @IdPersona;";
                        using var cmdUpP = new SqlCommand(queryUpP, connection, transaction);
                        cmdUpP.Parameters.AddWithValue("@Nombre", nombre.Trim());
                        cmdUpP.Parameters.AddWithValue("@Apellido", apellido.Trim());
                        cmdUpP.Parameters.AddWithValue("@IdPersona", idPersonaTutor);
                        await cmdUpP.ExecuteNonQueryAsync();
                    }
                    else
                    {
                        const string queryInP = @"
                            INSERT INTO PERSONAS (nombre, apellido, dni)
                            OUTPUT INSERTED.PK_id_persona
                            VALUES (@Nombre, @Apellido, @Dni);";
                        using var cmdInP = new SqlCommand(queryInP, connection, transaction);
                        cmdInP.Parameters.AddWithValue("@Nombre", nombre.Trim());
                        cmdInP.Parameters.AddWithValue("@Apellido", apellido.Trim());
                        cmdInP.Parameters.AddWithValue("@Dni", dni.Trim());
                        idPersonaTutor = Convert.ToInt32(await cmdInP.ExecuteScalarAsync());
                    }
                }

                // 3. Buscar si ya existe el registro en RESPONSABLES para esa persona (reutilización relacional)
                int idResponsable;
                const string queryCheckResp = "SELECT PK_id_responsable FROM RESPONSABLES WHERE FK_id_persona = @IdPersona;";
                using (var cmdCheckResp = new SqlCommand(queryCheckResp, connection, transaction))
                {
                    cmdCheckResp.Parameters.AddWithValue("@IdPersona", idPersonaTutor);
                    var resResp = await cmdCheckResp.ExecuteScalarAsync();
                    if (resResp != null && resResp != DBNull.Value)
                    {
                        idResponsable = Convert.ToInt32(resResp);
                        const string queryUpR = "UPDATE RESPONSABLES SET telefono = @Telefono, email = @Email WHERE PK_id_responsable = @IdResp;";
                        using var cmdUpR = new SqlCommand(queryUpR, connection, transaction);
                        cmdUpR.Parameters.AddWithValue("@Telefono", telefono.Trim());
                        cmdUpR.Parameters.AddWithValue("@Email", (object?)email?.Trim() ?? DBNull.Value);
                        cmdUpR.Parameters.AddWithValue("@IdResp", idResponsable);
                        await cmdUpR.ExecuteNonQueryAsync();
                    }
                    else
                    {
                        const string sqlNextRespId = "SELECT ISNULL(MAX(PK_id_responsable), 0) + 1 FROM RESPONSABLES;";
                        int nextRespId;
                        using (var cmdNextId = new SqlCommand(sqlNextRespId, connection, transaction))
                        {
                            nextRespId = Convert.ToInt32(await cmdNextId.ExecuteScalarAsync());
                        }

                        const string queryInR = @"
                            INSERT INTO RESPONSABLES (PK_id_responsable, FK_id_persona, telefono, email)
                            VALUES (@IdResp, @IdPersona, @Telefono, @Email);";
                        using var cmdInR = new SqlCommand(queryInR, connection, transaction);
                        cmdInR.Parameters.AddWithValue("@IdResp", nextRespId);
                        cmdInR.Parameters.AddWithValue("@IdPersona", idPersonaTutor);
                        cmdInR.Parameters.AddWithValue("@Telefono", telefono.Trim());
                        cmdInR.Parameters.AddWithValue("@Email", (object?)email?.Trim() ?? DBNull.Value);
                        await cmdInR.ExecuteNonQueryAsync();

                        idResponsable = nextRespId;
                    }
                }

                // 4. Vincular al jugador en JUGADORES_RESPONSABLES (actualizar o crear nuevo vínculo)
                const string queryCheckVinculo = "SELECT PK_id_jugador_responsable FROM JUGADORES_RESPONSABLES WHERE FK_id_jugador = @IdJugador;";
                using (var cmdCheckV = new SqlCommand(queryCheckVinculo, connection, transaction))
                {
                    cmdCheckV.Parameters.AddWithValue("@IdJugador", idJugador);
                    var resVinculo = await cmdCheckV.ExecuteScalarAsync();
                    if (resVinculo != null && resVinculo != DBNull.Value)
                    {
                        int idVinculoExistente = Convert.ToInt32(resVinculo);
                        const string queryUpV = @"
                            UPDATE JUGADORES_RESPONSABLES 
                            SET FK_id_responsable = @IdResp, parentesco = @Parentesco 
                            WHERE PK_id_jugador_responsable = @IdVinculo;";
                        using var cmdUpV = new SqlCommand(queryUpV, connection, transaction);
                        cmdUpV.Parameters.AddWithValue("@IdResp", idResponsable);
                        cmdUpV.Parameters.AddWithValue("@Parentesco", parentesco.Trim());
                        cmdUpV.Parameters.AddWithValue("@IdVinculo", idVinculoExistente);
                        await cmdUpV.ExecuteNonQueryAsync();
                    }
                    else
                    {
                        const string sqlNextVinculoId = "SELECT ISNULL(MAX(PK_id_jugador_responsable), 0) + 1 FROM JUGADORES_RESPONSABLES;";
                        int nextVinculoId;
                        using (var cmdNextVId = new SqlCommand(sqlNextVinculoId, connection, transaction))
                        {
                            nextVinculoId = Convert.ToInt32(await cmdNextVId.ExecuteScalarAsync());
                        }

                        const string queryInV = @"
                            INSERT INTO JUGADORES_RESPONSABLES (PK_id_jugador_responsable, FK_id_responsable, FK_id_jugador, parentesco)
                            VALUES (@IdVinculo, @IdResp, @IdJugador, @Parentesco);";
                        using var cmdInV = new SqlCommand(queryInV, connection, transaction);
                        cmdInV.Parameters.AddWithValue("@IdVinculo", nextVinculoId);
                        cmdInV.Parameters.AddWithValue("@IdResp", idResponsable);
                        cmdInV.Parameters.AddWithValue("@IdJugador", idJugador);
                        cmdInV.Parameters.AddWithValue("@Parentesco", parentesco.Trim());
                        await cmdInV.ExecuteNonQueryAsync();
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