USE [ClubCamioneros];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

DECLARE @RemovedAssignments TABLE
(
    PK_id_staff_categoria int NOT NULL,
    FK_id_staff int NULL,
    FK_id_categoria int NULL
);

BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.STAFF_CATEGORIAS', N'U') IS NULL
    THROW 51040, 'No existe dbo.STAFF_CATEGORIAS. Ejecute primero el esquema base completo.', 1;

DELETE FROM dbo.STAFF_CATEGORIAS
OUTPUT
    deleted.PK_id_staff_categoria,
    deleted.FK_id_staff,
    deleted.FK_id_categoria
INTO @RemovedAssignments
WHERE FK_id_staff IS NULL OR FK_id_categoria IS NULL;

IF EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS')
      AND name = N'UX_STAFF_CATEGORIAS_STAFF_CATEGORIA'
      AND has_filter = 1
)
BEGIN
    DROP INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA
        ON dbo.STAFF_CATEGORIAS;
END;

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS')
      AND name = N'FK_id_staff'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.STAFF_CATEGORIAS
        ALTER COLUMN FK_id_staff int NOT NULL;
END;

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS')
      AND name = N'FK_id_categoria'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.STAFF_CATEGORIAS
        ALTER COLUMN FK_id_categoria int NOT NULL;
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.STAFF_CATEGORIAS')
      AND name = N'UX_STAFF_CATEGORIAS_STAFF_CATEGORIA'
      AND is_unique = 1
      AND has_filter = 0
)
BEGIN
    CREATE UNIQUE INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA
        ON dbo.STAFF_CATEGORIAS(FK_id_staff, FK_id_categoria);
END;

COMMIT TRANSACTION;

SELECT
    PK_id_staff_categoria,
    FK_id_staff,
    FK_id_categoria
FROM @RemovedAssignments
ORDER BY PK_id_staff_categoria;
GO
