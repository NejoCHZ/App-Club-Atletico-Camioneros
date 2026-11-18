SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (SELECT 1 FROM dbo.FICHAS_MEDICAS WHERE FK_id_jugador IS NULL)
        THROW 51070, 'FICHAS_MEDICAS contiene relaciones sin jugador. Corrija los datos antes de aplicar la migración.', 1;

    IF EXISTS (
        SELECT FK_id_jugador
        FROM dbo.FICHAS_MEDICAS
        GROUP BY FK_id_jugador
        HAVING COUNT(*) > 1
    )
        THROW 51071, 'Un jugador posee más de una ficha médica. Corrija los datos antes de aplicar la migración.', 1;

    IF EXISTS (SELECT 1 FROM dbo.RESPONSABLES WHERE FK_id_persona IS NULL)
        THROW 51072, 'RESPONSABLES contiene relaciones sin persona. Corrija los datos antes de aplicar la migración.', 1;

    IF EXISTS (
        SELECT FK_id_persona
        FROM dbo.RESPONSABLES
        GROUP BY FK_id_persona
        HAVING COUNT(*) > 1
    )
        THROW 51073, 'Una persona posee más de un registro de responsable. Corrija los datos antes de aplicar la migración.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.JUGADORES_RESPONSABLES
        WHERE FK_id_jugador IS NULL OR FK_id_responsable IS NULL
    )
        THROW 51074, 'JUGADORES_RESPONSABLES contiene relaciones incompletas. Corrija los datos antes de aplicar la migración.', 1;

    IF EXISTS (
        SELECT FK_id_jugador
        FROM dbo.JUGADORES_RESPONSABLES
        GROUP BY FK_id_jugador
        HAVING COUNT(*) > 1
    )
        THROW 51075, 'Un jugador posee más de un responsable. Corrija los datos antes de aplicar la migración.', 1;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.FICHAS_MEDICAS')
          AND name = N'FK_id_jugador'
          AND is_nullable = 1
    )
        ALTER TABLE dbo.FICHAS_MEDICAS ALTER COLUMN FK_id_jugador int NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.RESPONSABLES')
          AND name = N'FK_id_persona'
          AND is_nullable = 1
    )
        ALTER TABLE dbo.RESPONSABLES ALTER COLUMN FK_id_persona int NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES')
          AND name = N'FK_id_jugador'
          AND is_nullable = 1
    )
        ALTER TABLE dbo.JUGADORES_RESPONSABLES ALTER COLUMN FK_id_jugador int NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES')
          AND name = N'FK_id_responsable'
          AND is_nullable = 1
    )
        ALTER TABLE dbo.JUGADORES_RESPONSABLES ALTER COLUMN FK_id_responsable int NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.FICHAS_MEDICAS')
          AND name = N'UX_FICHAS_MEDICAS_JUGADOR'
    )
        CREATE UNIQUE INDEX UX_FICHAS_MEDICAS_JUGADOR
            ON dbo.FICHAS_MEDICAS(FK_id_jugador);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.RESPONSABLES')
          AND name = N'UX_RESPONSABLES_PERSONA'
    )
        CREATE UNIQUE INDEX UX_RESPONSABLES_PERSONA
            ON dbo.RESPONSABLES(FK_id_persona);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.JUGADORES_RESPONSABLES')
          AND name = N'UX_JUGADORES_RESPONSABLES_JUGADOR'
    )
        CREATE UNIQUE INDEX UX_JUGADORES_RESPONSABLES_JUGADOR
            ON dbo.JUGADORES_RESPONSABLES(FK_id_jugador);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
