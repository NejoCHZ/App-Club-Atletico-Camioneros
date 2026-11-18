USE [ClubCamioneros];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.JUGADORES_CATEGORIAS', N'U') IS NULL
    THROW 51030, 'No existe dbo.JUGADORES_CATEGORIAS. Ejecute primero el esquema base completo.', 1;

IF OBJECT_ID(N'dbo.STAFF_CATEGORIAS', N'U') IS NULL
    THROW 51031, 'No existe dbo.STAFF_CATEGORIAS. Ejecute primero el esquema base completo.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.JUGADORES_CATEGORIAS
    GROUP BY FK_id_jugador, FK_id_categoria
    HAVING COUNT_BIG(*) > 1
)
    THROW 51032, 'Existen asignaciones jugador-categoría duplicadas. La migración no modificó datos.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.STAFF_CATEGORIAS
    WHERE FK_id_staff IS NOT NULL AND FK_id_categoria IS NOT NULL
    GROUP BY FK_id_staff, FK_id_categoria
    HAVING COUNT_BIG(*) > 1
)
    THROW 51033, 'Existen asignaciones staff-categoría duplicadas. La migración no modificó datos.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID(N'dbo.JUGADORES_CATEGORIAS')
      AND i.is_unique = 1
      AND i.name IN (N'UQ_JUGADORES_CATEGORIAS', N'UX_JUGADORES_CATEGORIAS_JUGADOR_CATEGORIA')
)
BEGIN
    CREATE UNIQUE INDEX UX_JUGADORES_CATEGORIAS_JUGADOR_CATEGORIA
        ON dbo.JUGADORES_CATEGORIAS(FK_id_jugador, FK_id_categoria);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS')
      AND i.is_unique = 1
      AND i.name = N'UX_STAFF_CATEGORIAS_STAFF_CATEGORIA'
)
BEGIN
    CREATE UNIQUE INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA
        ON dbo.STAFF_CATEGORIAS(FK_id_staff, FK_id_categoria)
        WHERE FK_id_staff IS NOT NULL AND FK_id_categoria IS NOT NULL;
END;

COMMIT TRANSACTION;
GO
