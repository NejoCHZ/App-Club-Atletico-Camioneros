using Xunit;

namespace CACC.Tests;

public class PersonDniSchemaContractTests
{
    [Fact]
    public void FreshSchemaAndMigrationEnforceTheSameFilteredDniUniqueness()
    {
        var root = FindRepositoryRoot();
        var freshSchema = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "000-create-schema.sql"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "002-enforce-unique-person-dni.sql"));

        Assert.Contains("CREATE UNIQUE INDEX [UX_PERSONAS_DNI]", freshSchema);
        Assert.Contains("ON [dbo].[PERSONAS]([dni])", freshSchema);
        Assert.Contains("WHERE [dni] IS NOT NULL", freshSchema);

        Assert.Contains("name = N'UX_PERSONAS_DNI'", migration);
        Assert.Contains("CREATE UNIQUE INDEX UX_PERSONAS_DNI", migration);
        Assert.Contains("ON dbo.PERSONAS(dni)", migration);
        Assert.Contains("WHERE dni IS NOT NULL", migration);

        Assert.Equal(1, CountOccurrences(freshSchema, "CREATE UNIQUE INDEX [UX_PERSONAS_DNI]"));
    }

    private static int CountOccurrences(string source, string value)
    {
        var count = 0;
        var offset = 0;
        while ((offset = source.IndexOf(value, offset, StringComparison.Ordinal)) >= 0)
        {
            count++;
            offset += value.Length;
        }

        return count;
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
