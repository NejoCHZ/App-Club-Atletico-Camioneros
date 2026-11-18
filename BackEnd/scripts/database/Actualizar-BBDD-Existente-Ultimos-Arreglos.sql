/*
  Actualizador consolidado de integridad para una base CACC existente.

  IMPORTANTE
  - Seleccione conscientemente la base de destino en SSMS antes de ejecutar.
  - El script rechaza bases del sistema y valida las tablas esperadas.
  - Es idempotente: puede ejecutarse nuevamente sin duplicar objetos.
  - Todas las modificaciones se confirman juntas o se revierten juntas.
  - Si detecta datos ambiguos o duplicados, aborta sin corregirlos automáticamente.

  Excepción deliberada: las asignaciones STAFF_CATEGORIAS con claves NULL no
  representan una relación recuperable. Se eliminan y se informan, igual que en
  la migración 008 original.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 52000, 'Seleccione la base CACC de destino en SSMS. No ejecute este archivo sobre una base del sistema.', 1;

IF OBJECT_ID(N'dbo.PERSONAS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.STAFF', N'U') IS NULL
   OR OBJECT_ID(N'dbo.JUGADORES', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CATEGORIAS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.HISTORIAL_PARTIDOS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.JUGADORES_PARTIDOS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.JUGADORES_CATEGORIAS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.STAFF_CATEGORIAS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.FICHAS_MEDICAS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.RESPONSABLES', N'U') IS NULL
   OR OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES', N'U') IS NULL
    THROW 52001, 'La base seleccionada no contiene el esquema CACC completo. No se realizó ningún cambio.', 1;

PRINT N'Base seleccionada: ' + QUOTENAME(DB_NAME());
PRINT N'Inicio de la actualización consolidada 002-009.';

DECLARE @AsignacionesEliminadas TABLE
(
    PK_id_staff_categoria int NOT NULL,
    FK_id_staff int NULL,
    FK_id_categoria int NULL
);

BEGIN TRY
    BEGIN TRANSACTION;

    /* 002 - DNI único por persona. A diferencia de la limpieza histórica,
       esta versión portable aborta ante duplicados en lugar de asumir IDs. */
    IF EXISTS
    (
        SELECT LTRIM(RTRIM(dni))
        FROM dbo.PERSONAS WITH (UPDLOCK, HOLDLOCK)
        WHERE NULLIF(LTRIM(RTRIM(dni)), '') IS NOT NULL
        GROUP BY LTRIM(RTRIM(dni))
        HAVING COUNT_BIG(*) > 1
    )
        THROW 52002, 'Existen DNI duplicados al normalizar espacios. Corríjalos antes de ejecutar el actualizador.', 1;

    UPDATE dbo.PERSONAS
    SET dni = NULLIF(LTRIM(RTRIM(dni)), '')
    WHERE dni IS NOT NULL
      AND ISNULL(dni, '') <> ISNULL(NULLIF(LTRIM(RTRIM(dni)), ''), '');

    IF NOT EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.PERSONAS')
          AND name = N'UX_PERSONAS_DNI'
    )
        CREATE UNIQUE INDEX UX_PERSONAS_DNI
            ON dbo.PERSONAS(dni)
            WHERE dni IS NOT NULL;

    /* 003 - Identidad única de usuarios y staff. */
    IF EXISTS
    (
        SELECT email FROM dbo.USUARIOS WITH (UPDLOCK, HOLDLOCK)
        WHERE email IS NOT NULL
        GROUP BY email HAVING COUNT_BIG(*) > 1
    )
        THROW 52003, 'Existen emails duplicados en USUARIOS.', 1;

    IF EXISTS
    (
        SELECT FK_id_persona FROM dbo.USUARIOS WITH (UPDLOCK, HOLDLOCK)
        WHERE FK_id_persona IS NOT NULL
        GROUP BY FK_id_persona HAVING COUNT_BIG(*) > 1
    )
        THROW 52004, 'Existen personas asociadas a más de un usuario.', 1;

    IF EXISTS
    (
        SELECT FK_id_usuario FROM dbo.STAFF WITH (UPDLOCK, HOLDLOCK)
        WHERE FK_id_usuario IS NOT NULL
        GROUP BY FK_id_usuario HAVING COUNT_BIG(*) > 1
    )
        THROW 52005, 'Existen usuarios asociados a más de un registro de staff.', 1;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_EMAIL')
        CREATE UNIQUE INDEX UX_USUARIOS_EMAIL ON dbo.USUARIOS(email) WHERE email IS NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_PERSONA')
        CREATE UNIQUE INDEX UX_USUARIOS_PERSONA ON dbo.USUARIOS(FK_id_persona) WHERE FK_id_persona IS NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.STAFF') AND name = N'UX_STAFF_USUARIO')
        CREATE UNIQUE INDEX UX_STAFF_USUARIO ON dbo.STAFF(FK_id_usuario) WHERE FK_id_usuario IS NOT NULL;

    /* 004 - Identidad lógica de partidos. */
    IF EXISTS
    (
        SELECT FK_id_categoria, fecha_partido,
               UPPER(LTRIM(RTRIM(rival))),
               UPPER(ISNULL(LTRIM(RTRIM(condicion_localia)), ''))
        FROM dbo.HISTORIAL_PARTIDOS WITH (UPDLOCK, HOLDLOCK)
        WHERE FK_id_categoria IS NOT NULL
          AND fecha_partido IS NOT NULL
          AND rival IS NOT NULL
        GROUP BY FK_id_categoria, fecha_partido,
                 UPPER(LTRIM(RTRIM(rival))),
                 UPPER(ISNULL(LTRIM(RTRIM(condicion_localia)), ''))
        HAVING COUNT_BIG(*) > 1
    )
        THROW 52006, 'Existen partidos duplicados para categoría, fecha, rival y condición.', 1;

    UPDATE dbo.HISTORIAL_PARTIDOS
    SET rival = LTRIM(RTRIM(rival)),
        condicion_localia = NULLIF(LTRIM(RTRIM(condicion_localia)), '');

    IF NOT EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.HISTORIAL_PARTIDOS')
          AND name = N'UX_HISTORIAL_PARTIDOS_IDENTIDAD'
    )
        CREATE UNIQUE INDEX UX_HISTORIAL_PARTIDOS_IDENTIDAD
            ON dbo.HISTORIAL_PARTIDOS(FK_id_categoria, fecha_partido, rival, condicion_localia)
            WHERE FK_id_categoria IS NOT NULL
              AND fecha_partido IS NOT NULL
              AND rival IS NOT NULL;

    /* 005 - Participaciones válidas en partidos. */
    IF EXISTS
    (
        SELECT 1 FROM dbo.JUGADORES_PARTIDOS WITH (UPDLOCK, HOLDLOCK)
        WHERE FK_id_partido IS NULL
           OR FK_id_jugador IS NULL
           OR minutos_jugados IS NULL
           OR minutos_jugados < 0
           OR minutos_jugados > 120
    )
        THROW 52007, 'JUGADORES_PARTIDOS contiene claves nulas o minutos fuera del rango 0-120.', 1;

    IF EXISTS
    (
        SELECT FK_id_partido, FK_id_jugador
        FROM dbo.JUGADORES_PARTIDOS WITH (UPDLOCK, HOLDLOCK)
        GROUP BY FK_id_partido, FK_id_jugador
        HAVING COUNT_BIG(*) > 1
    )
        THROW 52008, 'Un jugador aparece más de una vez en el mismo partido.', 1;

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_PARTIDOS') AND name = N'FK_id_partido' AND is_nullable = 1)
        ALTER TABLE dbo.JUGADORES_PARTIDOS ALTER COLUMN FK_id_partido int NOT NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_PARTIDOS') AND name = N'FK_id_jugador' AND is_nullable = 1)
        ALTER TABLE dbo.JUGADORES_PARTIDOS ALTER COLUMN FK_id_jugador int NOT NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_PARTIDOS') AND name = N'minutos_jugados' AND is_nullable = 1)
        ALTER TABLE dbo.JUGADORES_PARTIDOS ALTER COLUMN minutos_jugados int NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_PARTIDOS') AND name = N'UX_JUGADORES_PARTIDOS_PARTIDO_JUGADOR')
        CREATE UNIQUE INDEX UX_JUGADORES_PARTIDOS_PARTIDO_JUGADOR
            ON dbo.JUGADORES_PARTIDOS(FK_id_partido, FK_id_jugador);

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.JUGADORES_PARTIDOS') AND name = N'CK_JUGADORES_PARTIDOS_MINUTOS')
        ALTER TABLE dbo.JUGADORES_PARTIDOS WITH CHECK
            ADD CONSTRAINT CK_JUGADORES_PARTIDOS_MINUTOS
            CHECK (minutos_jugados >= 0 AND minutos_jugados <= 120);
    ALTER TABLE dbo.JUGADORES_PARTIDOS CHECK CONSTRAINT CK_JUGADORES_PARTIDOS_MINUTOS;

    /* 006 - Nombre único y normalizado de categoría. */
    DECLARE @CategoriasNormalizadas TABLE
    (
        id int NOT NULL PRIMARY KEY,
        nombre varchar(100) NULL
    );

    INSERT INTO @CategoriasNormalizadas (id, nombre)
    SELECT PK_id_categoria,
           LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(nombre_categoria, CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ')))
    FROM dbo.CATEGORIAS WITH (UPDLOCK, HOLDLOCK);

    WHILE EXISTS (SELECT 1 FROM @CategoriasNormalizadas WHERE nombre LIKE '%  %')
        UPDATE @CategoriasNormalizadas SET nombre = REPLACE(nombre, '  ', ' ') WHERE nombre LIKE '%  %';

    IF EXISTS (SELECT 1 FROM @CategoriasNormalizadas WHERE nombre IS NULL OR nombre = '')
        THROW 52009, 'Existen categorías con nombres vacíos.', 1;

    IF EXISTS
    (
        SELECT nombre COLLATE Modern_Spanish_CI_AS
        FROM @CategoriasNormalizadas
        GROUP BY nombre COLLATE Modern_Spanish_CI_AS
        HAVING COUNT_BIG(*) > 1
    )
        THROW 52010, 'Existen categorías duplicadas al normalizar espacios y mayúsculas.', 1;

    UPDATE c
    SET nombre_categoria = n.nombre
    FROM dbo.CATEGORIAS c
    INNER JOIN @CategoriasNormalizadas n ON n.id = c.PK_id_categoria
    WHERE c.nombre_categoria <> n.nombre;

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CATEGORIAS') AND name = N'nombre_categoria' AND (is_nullable = 1 OR collation_name <> N'Modern_Spanish_CI_AS'))
        ALTER TABLE dbo.CATEGORIAS ALTER COLUMN nombre_categoria varchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.CATEGORIAS') AND name = N'CK_CATEGORIAS_NOMBRE_NORMALIZADO')
        ALTER TABLE dbo.CATEGORIAS WITH CHECK
            ADD CONSTRAINT CK_CATEGORIAS_NOMBRE_NORMALIZADO CHECK
            (
                nombre_categoria = LTRIM(RTRIM(nombre_categoria))
                AND nombre_categoria NOT LIKE '%  %'
                AND CHARINDEX(CHAR(9), nombre_categoria) = 0
                AND CHARINDEX(CHAR(10), nombre_categoria) = 0
                AND CHARINDEX(CHAR(13), nombre_categoria) = 0
            );
    ALTER TABLE dbo.CATEGORIAS CHECK CONSTRAINT CK_CATEGORIAS_NOMBRE_NORMALIZADO;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CATEGORIAS') AND name = N'UX_CATEGORIAS_NOMBRE')
        CREATE UNIQUE INDEX UX_CATEGORIAS_NOMBRE ON dbo.CATEGORIAS(nombre_categoria);

    /* 007 - Asignaciones únicas por categoría. */
    IF EXISTS
    (
        SELECT FK_id_jugador, FK_id_categoria
        FROM dbo.JUGADORES_CATEGORIAS WITH (UPDLOCK, HOLDLOCK)
        GROUP BY FK_id_jugador, FK_id_categoria
        HAVING COUNT_BIG(*) > 1
    )
        THROW 52011, 'Existen asignaciones jugador-categoría duplicadas.', 1;

    IF EXISTS
    (
        SELECT FK_id_staff, FK_id_categoria
        FROM dbo.STAFF_CATEGORIAS WITH (UPDLOCK, HOLDLOCK)
        WHERE FK_id_staff IS NOT NULL AND FK_id_categoria IS NOT NULL
        GROUP BY FK_id_staff, FK_id_categoria
        HAVING COUNT_BIG(*) > 1
    )
        THROW 52012, 'Existen asignaciones staff-categoría duplicadas.', 1;

    IF NOT EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_CATEGORIAS')
          AND is_unique = 1
          AND name IN (N'UQ_JUGADORES_CATEGORIAS', N'UX_JUGADORES_CATEGORIAS_JUGADOR_CATEGORIA')
    )
        CREATE UNIQUE INDEX UX_JUGADORES_CATEGORIAS_JUGADOR_CATEGORIA
            ON dbo.JUGADORES_CATEGORIAS(FK_id_jugador, FK_id_categoria);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS') AND name = N'UX_STAFF_CATEGORIAS_STAFF_CATEGORIA')
        CREATE UNIQUE INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA
            ON dbo.STAFF_CATEGORIAS(FK_id_staff, FK_id_categoria)
            WHERE FK_id_staff IS NOT NULL AND FK_id_categoria IS NOT NULL;

    /* 008 - Relaciones Staff-categoría completas. */
    DELETE FROM dbo.STAFF_CATEGORIAS
    OUTPUT deleted.PK_id_staff_categoria, deleted.FK_id_staff, deleted.FK_id_categoria
    INTO @AsignacionesEliminadas
    WHERE FK_id_staff IS NULL OR FK_id_categoria IS NULL;

    IF EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS')
          AND name = N'UX_STAFF_CATEGORIAS_STAFF_CATEGORIA'
          AND has_filter = 1
    )
        DROP INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA ON dbo.STAFF_CATEGORIAS;

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS') AND name = N'FK_id_staff' AND is_nullable = 1)
        ALTER TABLE dbo.STAFF_CATEGORIAS ALTER COLUMN FK_id_staff int NOT NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS') AND name = N'FK_id_categoria' AND is_nullable = 1)
        ALTER TABLE dbo.STAFF_CATEGORIAS ALTER COLUMN FK_id_categoria int NOT NULL;

    IF NOT EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS')
          AND name = N'UX_STAFF_CATEGORIAS_STAFF_CATEGORIA'
          AND is_unique = 1 AND has_filter = 0
    )
        CREATE UNIQUE INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA
            ON dbo.STAFF_CATEGORIAS(FK_id_staff, FK_id_categoria);

    /* 009 - Una ficha y un responsable activo por jugador. */
    IF EXISTS (SELECT 1 FROM dbo.FICHAS_MEDICAS WITH (UPDLOCK, HOLDLOCK) WHERE FK_id_jugador IS NULL)
        THROW 52013, 'FICHAS_MEDICAS contiene relaciones sin jugador.', 1;
    IF EXISTS (SELECT FK_id_jugador FROM dbo.FICHAS_MEDICAS GROUP BY FK_id_jugador HAVING COUNT_BIG(*) > 1)
        THROW 52014, 'Un jugador posee más de una ficha médica.', 1;

    IF EXISTS (SELECT 1 FROM dbo.RESPONSABLES WITH (UPDLOCK, HOLDLOCK) WHERE FK_id_persona IS NULL)
        THROW 52015, 'RESPONSABLES contiene relaciones sin persona.', 1;
    IF EXISTS (SELECT FK_id_persona FROM dbo.RESPONSABLES GROUP BY FK_id_persona HAVING COUNT_BIG(*) > 1)
        THROW 52016, 'Una persona posee más de un registro de responsable.', 1;

    IF EXISTS (SELECT 1 FROM dbo.JUGADORES_RESPONSABLES WITH (UPDLOCK, HOLDLOCK) WHERE FK_id_jugador IS NULL OR FK_id_responsable IS NULL)
        THROW 52017, 'JUGADORES_RESPONSABLES contiene relaciones incompletas.', 1;
    IF EXISTS (SELECT FK_id_jugador FROM dbo.JUGADORES_RESPONSABLES GROUP BY FK_id_jugador HAVING COUNT_BIG(*) > 1)
        THROW 52018, 'Un jugador posee más de un responsable activo.', 1;

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.FICHAS_MEDICAS') AND name = N'FK_id_jugador' AND is_nullable = 1)
        ALTER TABLE dbo.FICHAS_MEDICAS ALTER COLUMN FK_id_jugador int NOT NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RESPONSABLES') AND name = N'FK_id_persona' AND is_nullable = 1)
        ALTER TABLE dbo.RESPONSABLES ALTER COLUMN FK_id_persona int NOT NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES') AND name = N'FK_id_jugador' AND is_nullable = 1)
        ALTER TABLE dbo.JUGADORES_RESPONSABLES ALTER COLUMN FK_id_jugador int NOT NULL;
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES') AND name = N'FK_id_responsable' AND is_nullable = 1)
        ALTER TABLE dbo.JUGADORES_RESPONSABLES ALTER COLUMN FK_id_responsable int NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.FICHAS_MEDICAS') AND name = N'UX_FICHAS_MEDICAS_JUGADOR')
        CREATE UNIQUE INDEX UX_FICHAS_MEDICAS_JUGADOR ON dbo.FICHAS_MEDICAS(FK_id_jugador);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.RESPONSABLES') AND name = N'UX_RESPONSABLES_PERSONA')
        CREATE UNIQUE INDEX UX_RESPONSABLES_PERSONA ON dbo.RESPONSABLES(FK_id_persona);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES') AND name = N'UX_JUGADORES_RESPONSABLES_JUGADOR')
        CREATE UNIQUE INDEX UX_JUGADORES_RESPONSABLES_JUGADOR ON dbo.JUGADORES_RESPONSABLES(FK_id_jugador);

    COMMIT TRANSACTION;

    PRINT N'Actualización completada correctamente en ' + QUOTENAME(DB_NAME()) + N'.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    PRINT N'Actualización cancelada. No se confirmó ningún cambio.';
    PRINT N'Error ' + CONVERT(nvarchar(20), ERROR_NUMBER()) + N': ' + ERROR_MESSAGE();
    THROW;
END CATCH;

SELECT
    PK_id_staff_categoria AS asignacion_eliminada,
    FK_id_staff,
    FK_id_categoria
FROM @AsignacionesEliminadas
ORDER BY PK_id_staff_categoria;

/* Verificación resumida: todos los valores deben ser 1. */
SELECT N'UX_PERSONAS_DNI' AS proteccion,
       CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PERSONAS') AND name = N'UX_PERSONAS_DNI' AND is_unique = 1) THEN 1 ELSE 0 END) AS activa
UNION ALL SELECT N'UX_USUARIOS_EMAIL', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_EMAIL' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_USUARIOS_PERSONA', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_PERSONA' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_STAFF_USUARIO', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.STAFF') AND name = N'UX_STAFF_USUARIO' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_HISTORIAL_PARTIDOS_IDENTIDAD', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.HISTORIAL_PARTIDOS') AND name = N'UX_HISTORIAL_PARTIDOS_IDENTIDAD' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_JUGADORES_PARTIDOS_PARTIDO_JUGADOR', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_PARTIDOS') AND name = N'UX_JUGADORES_PARTIDOS_PARTIDO_JUGADOR' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'CK_JUGADORES_PARTIDOS_MINUTOS', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.JUGADORES_PARTIDOS') AND name = N'CK_JUGADORES_PARTIDOS_MINUTOS' AND is_disabled = 0 AND is_not_trusted = 0) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_CATEGORIAS_NOMBRE', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CATEGORIAS') AND name = N'UX_CATEGORIAS_NOMBRE' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_JUGADORES_CATEGORIAS', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_CATEGORIAS') AND is_unique = 1 AND name IN (N'UQ_JUGADORES_CATEGORIAS', N'UX_JUGADORES_CATEGORIAS_JUGADOR_CATEGORIA')) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_STAFF_CATEGORIAS', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS') AND name = N'UX_STAFF_CATEGORIAS_STAFF_CATEGORIA' AND is_unique = 1 AND has_filter = 0) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_FICHAS_MEDICAS_JUGADOR', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.FICHAS_MEDICAS') AND name = N'UX_FICHAS_MEDICAS_JUGADOR' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_RESPONSABLES_PERSONA', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.RESPONSABLES') AND name = N'UX_RESPONSABLES_PERSONA' AND is_unique = 1) THEN 1 ELSE 0 END)
UNION ALL SELECT N'UX_JUGADORES_RESPONSABLES_JUGADOR', CONVERT(bit, CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES') AND name = N'UX_JUGADORES_RESPONSABLES_JUGADOR' AND is_unique = 1) THEN 1 ELSE 0 END);

