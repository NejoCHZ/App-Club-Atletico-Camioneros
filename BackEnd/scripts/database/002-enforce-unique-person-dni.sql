SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.PERSONAS_DNI_DUPLICADOS_BACKUP_20261116', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.PERSONAS_DNI_DUPLICADOS_BACKUP_20261116
        (
            PK_id_persona int NOT NULL PRIMARY KEY,
            genero varchar(50) NULL,
            fecha_de_nacimiento date NULL,
            dni varchar(20) NULL,
            nombre varchar(100) NULL,
            apellido varchar(100) NULL,
            domicilio varchar(255) NULL,
            backed_up_at datetime2(0) NOT NULL
        );
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.PERSONAS p
        WHERE p.PK_id_persona BETWEEN 1 AND 8
          AND (
              EXISTS (SELECT 1 FROM dbo.JUGADORES j WHERE j.FK_id_persona = p.PK_id_persona)
              OR EXISTS (SELECT 1 FROM dbo.RESPONSABLES r WHERE r.FK_id_persona = p.PK_id_persona)
              OR EXISTS (SELECT 1 FROM dbo.USUARIOS u WHERE u.FK_id_persona = p.PK_id_persona)
              OR EXISTS (SELECT 1 FROM dbo.CREDENCIALES_QR q WHERE q.FK_id_persona = p.PK_id_persona)
          )
    )
        THROW 51000, 'La limpieza se canceló: una persona candidata tiene referencias activas.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.PERSONAS p
        WHERE p.PK_id_persona BETWEEN 1 AND 8
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.PERSONAS vigente
              JOIN dbo.JUGADORES j ON j.FK_id_persona = vigente.PK_id_persona
              WHERE vigente.dni = p.dni
                AND vigente.PK_id_persona <> p.PK_id_persona
          )
    )
        THROW 51001, 'La limpieza se canceló: no existe un jugador vigente para una persona candidata.', 1;

    INSERT INTO dbo.PERSONAS_DNI_DUPLICADOS_BACKUP_20261116
        (PK_id_persona, genero, fecha_de_nacimiento, dni, nombre, apellido, domicilio, backed_up_at)
    SELECT
        p.PK_id_persona, p.genero, p.fecha_de_nacimiento, p.dni, p.nombre, p.apellido, p.domicilio,
        CONVERT(datetime2(0), SYSUTCDATETIME())
    FROM dbo.PERSONAS p
    WHERE p.PK_id_persona BETWEEN 1 AND 8
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.PERSONAS_DNI_DUPLICADOS_BACKUP_20261116 b
          WHERE b.PK_id_persona = p.PK_id_persona
      );

    DELETE p
    FROM dbo.PERSONAS p
    WHERE p.PK_id_persona BETWEEN 1 AND 8
      AND EXISTS (
          SELECT 1
          FROM dbo.PERSONAS vigente
          JOIN dbo.JUGADORES j ON j.FK_id_persona = vigente.PK_id_persona
          WHERE vigente.dni = p.dni
            AND vigente.PK_id_persona <> p.PK_id_persona
      )
      AND NOT EXISTS (SELECT 1 FROM dbo.JUGADORES j WHERE j.FK_id_persona = p.PK_id_persona)
      AND NOT EXISTS (SELECT 1 FROM dbo.RESPONSABLES r WHERE r.FK_id_persona = p.PK_id_persona)
      AND NOT EXISTS (SELECT 1 FROM dbo.USUARIOS u WHERE u.FK_id_persona = p.PK_id_persona)
      AND NOT EXISTS (SELECT 1 FROM dbo.CREDENCIALES_QR q WHERE q.FK_id_persona = p.PK_id_persona);

    UPDATE dbo.PERSONAS
    SET dni = NULLIF(LTRIM(RTRIM(dni)), '')
    WHERE dni IS NOT NULL;

    IF EXISTS (
        SELECT dni
        FROM dbo.PERSONAS
        WHERE dni IS NOT NULL
        GROUP BY dni
        HAVING COUNT(*) > 1
    )
        THROW 51002, 'La limpieza se canceló: todavía existen DNI duplicados.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.PERSONAS')
          AND name = N'UX_PERSONAS_DNI'
    )
    BEGIN
        CREATE UNIQUE INDEX UX_PERSONAS_DNI
            ON dbo.PERSONAS(dni)
            WHERE dni IS NOT NULL;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT COUNT(*) AS filas_respaldo
FROM dbo.PERSONAS_DNI_DUPLICADOS_BACKUP_20261116;

SELECT dni, COUNT(*) AS cantidad
FROM dbo.PERSONAS
WHERE dni IS NOT NULL
GROUP BY dni
HAVING COUNT(*) > 1;
