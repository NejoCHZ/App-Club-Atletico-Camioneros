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
    SELECT email
    FROM dbo.USUARIOS
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
)
    THROW 51020, 'No se puede proteger USUARIOS.email: existen emails duplicados.', 1;

IF EXISTS (
    SELECT FK_id_persona
    FROM dbo.USUARIOS
    WHERE FK_id_persona IS NOT NULL
    GROUP BY FK_id_persona
    HAVING COUNT(*) > 1
)
    THROW 51021, 'No se puede proteger USUARIOS.FK_id_persona: existen personas con más de un usuario.', 1;

IF EXISTS (
    SELECT FK_id_usuario
    FROM dbo.STAFF
    WHERE FK_id_usuario IS NOT NULL
    GROUP BY FK_id_usuario
    HAVING COUNT(*) > 1
)
    THROW 51022, 'No se puede proteger STAFF.FK_id_usuario: existen usuarios con más de un registro de staff.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_EMAIL')
    CREATE UNIQUE INDEX UX_USUARIOS_EMAIL
        ON dbo.USUARIOS(email)
        WHERE email IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_PERSONA')
    CREATE UNIQUE INDEX UX_USUARIOS_PERSONA
        ON dbo.USUARIOS(FK_id_persona)
        WHERE FK_id_persona IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.STAFF') AND name = N'UX_STAFF_USUARIO')
    CREATE UNIQUE INDEX UX_STAFF_USUARIO
        ON dbo.STAFF(FK_id_usuario)
        WHERE FK_id_usuario IS NOT NULL;

COMMIT TRANSACTION;
