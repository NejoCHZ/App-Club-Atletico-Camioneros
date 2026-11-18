SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF EXISTS (
    SELECT FK_id_categoria, fecha_partido,
           UPPER(LTRIM(RTRIM(rival))) AS rival_normalizado,
           UPPER(ISNULL(LTRIM(RTRIM(condicion_localia)), '')) AS condicion_normalizada
    FROM dbo.HISTORIAL_PARTIDOS
    WHERE FK_id_categoria IS NOT NULL
      AND fecha_partido IS NOT NULL
      AND rival IS NOT NULL
    GROUP BY FK_id_categoria, fecha_partido,
             UPPER(LTRIM(RTRIM(rival))),
             UPPER(ISNULL(LTRIM(RTRIM(condicion_localia)), ''))
    HAVING COUNT(*) > 1
)
    THROW 51030, 'No se puede proteger HISTORIAL_PARTIDOS: existen partidos duplicados para la misma categoría, fecha, rival y condición.', 1;

UPDATE dbo.HISTORIAL_PARTIDOS
SET rival = LTRIM(RTRIM(rival)),
    condicion_localia = NULLIF(LTRIM(RTRIM(condicion_localia)), '');

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.HISTORIAL_PARTIDOS')
      AND name = N'UX_HISTORIAL_PARTIDOS_IDENTIDAD'
)
    CREATE UNIQUE INDEX UX_HISTORIAL_PARTIDOS_IDENTIDAD
        ON dbo.HISTORIAL_PARTIDOS(FK_id_categoria, fecha_partido, rival, condicion_localia)
        WHERE FK_id_categoria IS NOT NULL
          AND fecha_partido IS NOT NULL
          AND rival IS NOT NULL;

COMMIT TRANSACTION;
