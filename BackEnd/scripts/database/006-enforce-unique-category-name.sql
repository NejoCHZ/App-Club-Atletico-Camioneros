SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

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
    THROW 51050, 'No se puede proteger CATEGORIAS: existen nombres vacíos.', 1;

IF EXISTS (
    SELECT nombre COLLATE Modern_Spanish_CI_AS
    FROM @CategoriasNormalizadas
    GROUP BY nombre COLLATE Modern_Spanish_CI_AS
    HAVING COUNT(*) > 1
)
    THROW 51051, 'No se puede proteger CATEGORIAS: existen nombres duplicados al normalizar espacios y mayúsculas.', 1;

UPDATE c
SET nombre_categoria = n.nombre
FROM dbo.CATEGORIAS c
INNER JOIN @CategoriasNormalizadas n ON n.id = c.PK_id_categoria
WHERE c.nombre_categoria <> n.nombre;

ALTER TABLE dbo.CATEGORIAS
    ALTER COLUMN nombre_categoria varchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.CATEGORIAS')
      AND name = N'CK_CATEGORIAS_NOMBRE_NORMALIZADO'
)
    ALTER TABLE dbo.CATEGORIAS WITH CHECK
        ADD CONSTRAINT CK_CATEGORIAS_NOMBRE_NORMALIZADO CHECK (
            nombre_categoria = LTRIM(RTRIM(nombre_categoria))
            AND nombre_categoria NOT LIKE '%  %'
            AND CHARINDEX(CHAR(9), nombre_categoria) = 0
            AND CHARINDEX(CHAR(10), nombre_categoria) = 0
            AND CHARINDEX(CHAR(13), nombre_categoria) = 0
        );

ALTER TABLE dbo.CATEGORIAS CHECK CONSTRAINT CK_CATEGORIAS_NOMBRE_NORMALIZADO;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.CATEGORIAS')
      AND name = N'UX_CATEGORIAS_NOMBRE'
)
    CREATE UNIQUE INDEX UX_CATEGORIAS_NOMBRE ON dbo.CATEGORIAS(nombre_categoria);

COMMIT TRANSACTION;
