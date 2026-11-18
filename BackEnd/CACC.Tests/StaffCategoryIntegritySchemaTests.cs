using Xunit;

namespace CACC.Tests;

public class StaffCategoryIntegritySchemaTests
{
    [Fact]
    public void SchemasAndMigrationRejectIncompleteStaffCategoryAssignments()
    {
        var root = FindRepositoryRoot();
        var freshSchema = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "000-create-schema.sql"));
        var exportedSchema = File.ReadAllText(Path.Combine(root, "BaseDatos-ClubCamioneros.sql"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "008-enforce-complete-staff-category-assignments.sql"));
        var compactMigration = string.Join(" ", migration.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

        AssertStaffCategoryColumnsAreRequired(freshSchema);
        AssertStaffCategoryColumnsAreRequired(exportedSchema);

        Assert.Contains("DELETE FROM dbo.STAFF_CATEGORIAS", compactMigration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("OUTPUT deleted.PK_id_staff_categoria", compactMigration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("WHERE FK_id_staff IS NULL OR FK_id_categoria IS NULL", compactMigration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ALTER COLUMN FK_id_staff int NOT NULL", compactMigration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ALTER COLUMN FK_id_categoria int NOT NULL", compactMigration, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("CREATE UNIQUE INDEX UX_STAFF_CATEGORIAS_STAFF_CATEGORIA", compactMigration, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("WHERE FK_id_staff IS NOT NULL", compactMigration, StringComparison.OrdinalIgnoreCase);
    }

    private static void AssertStaffCategoryColumnsAreRequired(string schema)
    {
        var tableStart = schema.IndexOf("CREATE TABLE [dbo].[STAFF_CATEGORIAS]", StringComparison.OrdinalIgnoreCase);
        Assert.True(tableStart >= 0, "No se encontró STAFF_CATEGORIAS en el esquema.");

        var tableEnd = schema.IndexOf("\nGO", tableStart, StringComparison.OrdinalIgnoreCase);
        Assert.True(tableEnd > tableStart, "No se encontró el final de STAFF_CATEGORIAS.");

        var table = schema[tableStart..tableEnd];
        Assert.Contains("[FK_id_staff] [int] NOT NULL", table, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("[FK_id_categoria] [int] NOT NULL", table, StringComparison.OrdinalIgnoreCase);
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
