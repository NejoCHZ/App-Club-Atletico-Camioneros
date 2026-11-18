using Xunit;

namespace CACC.Tests;

public class MatchUniquenessSchemaContractTests
{
    [Fact]
    public void FreshSchemaExportAndMigrationShareTheSameLogicalMatchIdentity()
    {
        var root = FindRepositoryRoot();
        var freshSchema = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "000-create-schema.sql"));
        var exportedSchema = File.ReadAllText(Path.Combine(root, "BaseDatos-ClubCamioneros.sql"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "004-enforce-unique-match-identity.sql"));

        foreach (var script in new[] { freshSchema, exportedSchema, migration })
        {
            Assert.Contains("UX_HISTORIAL_PARTIDOS_IDENTIDAD", script, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("FK_id_categoria", script, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("fecha_partido", script, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("rival", script, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("condicion_localia", script, StringComparison.OrdinalIgnoreCase);
        }

        Assert.Contains("THROW 51030", migration);
        Assert.Contains("sys.indexes", migration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("CREATE UNIQUE INDEX UX_HISTORIAL_PARTIDOS_IDENTIDAD", migration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("UPPER(LTRIM(RTRIM(rival)))", migration, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DaoSerializesTheIdentityCheckBeforeInsert()
    {
        var root = FindRepositoryRoot();
        var dao = File.ReadAllText(Path.Combine(root, "BackEnd", "CACC.DAO", "CategoriaDao.cs"));

        Assert.Contains("IsolationLevel.Serializable", dao);
        Assert.Contains("WITH (UPDLOCK, HOLDLOCK)", dao);
        Assert.Contains("PartidoDuplicadoException", dao);
    }

    private static string FindRepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "BaseDatos-ClubCamioneros.sql")))
            {
                return directory.FullName;
            }
        }

        throw new DirectoryNotFoundException("No se encontró la raíz del repositorio.");
    }
}
