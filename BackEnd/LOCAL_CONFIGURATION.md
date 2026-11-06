# Local configuration

The API reads its database, JWT and integration settings from standard ASP.NET Core configuration. Keep machine-specific values out of Git by using environment variables or .NET user secrets.

## Database

The Portal Deportivo and the Portal Administrativo share **one SQL Server database** (the unified one). It is created empty, with its catalogs, by the script `ClubCamioneros_unificada_v2_crear_base.sql` from https://github.com/Atzur1/cacc-unificacion (folder `base-de-datos`). The structure is owned by the Portal Administrativo: schema changes travel as migrations in its repository. This API does not change the structure.

```powershell
cd BackEnd/CACC.API
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=ClubCamionerosUnificadaV2;Trusted_Connection=True;TrustServerCertificate=True;"
```

## JWT (single login)

The login is the Portal Administrativo's; this API only validates its tokens, so **Key, Issuer and Audience must be exactly the same as the Administrativo's**. The key is private: share it through a private channel and never commit it. In production the API refuses to start with the sample key found in `appsettings.json`.

```powershell
dotnet user-secrets set "Jwt:Key" "<the same private key as the Administrativo, at least 32 characters>"
dotnet user-secrets set "Jwt:Issuer" "<same as the Administrativo>"
dotnet user-secrets set "Jwt:Audience" "<same as the Administrativo>"
```

Environment variables work the same way: `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`. The legacy `JwtSettings:*` names are still read as a fallback.

## Portal Administrativo (debt status)

```powershell
dotnet user-secrets set "AdministrativoApi:BaseUrl" "http://localhost:5118"
```

`BaseUrl` is the address of the Administrativo's API (in Development it defaults to `http://localhost:5118`). Optional: `AdministrativoApi:TimeoutSegundos` (default 3) and `AdministrativoApi:SiNoResponde` (`Denegar`, the default and the club's decision: nobody gets in if the debt cannot be checked; `Permitir` marks the attendance as unverified). Details in `INTEGRACION_ADMINISTRATIVO.md`.

## CORS and local login

`Cors:AllowedOrigins` lists the allowed front-end origins (default in Development: ports 4200, the Administrativo, and 4300, this portal). `Auth:LoginPropio=true` turns the old local login back on, only for a development machine without the Administrativo.

Alternatively, copy `CACC.API/appsettings.example.json` to `appsettings.Local.json` and load it only in your local environment. Never commit that local file (`appsettings.Development.json` is ignored).

Development-only seed data lives in `BackEnd/scripts/development`.
