using Xunit;

namespace CACC.Tests;

public class MatchParticipationSchemaContractTests
{
    [Fact]
    public void FreshSchemaExportAndMigrationProtectMatchParticipations()
    {
        var root = FindRepositoryRoot();
        var freshSchema = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "000-create-schema.sql"));
        var exportedSchema = File.ReadAllText(Path.Combine(root, "BaseDatos-ClubCamioneros.sql"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "005-enforce-valid-match-participations.sql"));

        foreach (var script in new[] { freshSchema, exportedSchema, migration })
        {
            Assert.Contains("UX_JUGADORES_PARTIDOS_PARTIDO_JUGADOR", script, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("CK_JUGADORES_PARTIDOS_MINUTOS", script, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("minutos_jugados", script, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("120", script);
        }

        Assert.Contains("THROW 51040", migration);
        Assert.Contains("THROW 51041", migration);
        Assert.Contains("sys.indexes", migration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("sys.check_constraints", migration, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DaoValidatesBeforeOpeningTheTransactionAndMapsDatabaseConstraints()
    {
        var root = FindRepositoryRoot();
        var dao = File.ReadAllText(Path.Combine(root, "BackEnd", "CACC.DAO", "CategoriaDao.cs"));

        Assert.Contains("ValidarParticipaciones(partido.JugadoresMinutos);", dao);
        Assert.Contains("UX_JUGADORES_PARTIDOS_PARTIDO_JUGADOR", dao);
        Assert.Contains("CK_JUGADORES_PARTIDOS_MINUTOS", dao);
        Assert.Contains("ParticipacionPartidoDuplicadaException", dao);
        Assert.Contains("ParticipacionPartidoInvalidaException", dao);
    }

    private static string FindRepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "BaseDatos-ClubCamioneros.sql")))
                return directory.FullName;
        }

        throw new DirectoryNotFoundException("No se encontró la raíz del repositorio.");
    }
}
