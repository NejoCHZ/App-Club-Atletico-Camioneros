using Xunit;

namespace CACC.Tests;

public class CategoryAssignmentUniquenessTests
{
    [Fact]
    public void SchemaAndMigrationEnforceUniquePlayerAndStaffAssignments()
    {
        var root = FindRepositoryRoot();
        var freshSchema = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "000-create-schema.sql"));
        var exportedSchema = File.ReadAllText(Path.Combine(root, "BaseDatos-ClubCamioneros.sql"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "007-enforce-unique-category-assignments.sql"));

        Assert.Contains("CONSTRAINT [UQ_JUGADORES_CATEGORIAS] UNIQUE ([FK_id_jugador], [FK_id_categoria])", freshSchema);
        Assert.Contains("CREATE UNIQUE INDEX [UX_STAFF_CATEGORIAS_STAFF_CATEGORIA]", freshSchema);
        Assert.Contains("[FK_id_staff] [int] NOT NULL", freshSchema);
        Assert.Contains("[FK_id_categoria] [int] NOT NULL", freshSchema);

        Assert.Contains("UX_JUGADORES_CATEGORIAS_JUGADOR_CATEGORIA", exportedSchema);
        Assert.Contains("UX_STAFF_CATEGORIAS_STAFF_CATEGORIA", exportedSchema);

        Assert.Contains("HAVING COUNT_BIG(*) > 1", migration);
        Assert.Contains("CREATE UNIQUE INDEX UX_JUGADORES_CATEGORIAS_JUGADOR_CATEGORIA", migration);
        Assert.Contains("CREATE UNIQUE INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA", migration);
        Assert.Contains("La migración no modificó datos", migration);
    }

    [Fact]
    public void AssignmentCommandsUseSerializableTransactionsAndRangeLocks()
    {
        var root = FindRepositoryRoot();
        var dao = File.ReadAllText(Path.Combine(root, "BackEnd", "CACC.DAO", "CategoriaDao.cs"));

        Assert.True(CountOccurrences(dao, "BeginTransaction(IsolationLevel.Serializable)") >= 6);
        Assert.True(CountOccurrences(dao, "WITH (UPDLOCK, HOLDLOCK)") >= 3);
        Assert.Equal(2, CountOccurrences(dao, "ex.Number is 2601 or 2627"));
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
