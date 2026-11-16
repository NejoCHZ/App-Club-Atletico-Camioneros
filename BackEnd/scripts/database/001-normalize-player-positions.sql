SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE dbo.JUGADORES
    SET posicion_cancha = CASE UPPER(LTRIM(RTRIM(posicion_cancha)))
        WHEN 'ARQUERO' THEN 'Arquero'
        WHEN 'DEFENSOR' THEN 'Defensor'
        WHEN 'MEDIOCAMPISTA' THEN 'Mediocampista'
        WHEN 'VOLANTE' THEN 'Mediocampista'
        WHEN 'DELANTERO' THEN 'Delantero'
        WHEN 'DELANTERA' THEN 'Delantero'
        ELSE posicion_cancha
    END
    WHERE UPPER(LTRIM(RTRIM(posicion_cancha))) IN (
        'ARQUERO',
        'DEFENSOR',
        'MEDIOCAMPISTA',
        'VOLANTE',
        'DELANTERO',
        'DELANTERA'
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
