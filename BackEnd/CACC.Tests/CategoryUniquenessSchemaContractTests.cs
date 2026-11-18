using CACC.Entities;
using Xunit;

namespace CACC.Tests;

public class CategoryUniquenessSchemaContractTests
{
    [Theory]
    [InlineData("  Pt   AFA  2008  ", "Pt AFA 2008")]
    [InlineData("AFA\t20067", "AFA 20067")]
    [InlineData("Femenino", "Femenino")]
    public void CategoryNamesHaveOneCanonicalWhitespaceRepresentation(string input, string expected)
    {
        Assert.Equal(expected, CategoriaIdentity.NormalizeName(input));
    }

    [Fact]
    public void SchemaAndMigrationEnforceTheSameGlobalCategoryNameIdentity()
    {
        var root = FindRepositoryRoot();
        var initial = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "000-create-schema.sql"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "006-enforce-unique-category-name.sql"));
        var exported = File.ReadAllText(Path.Combine(root, "BaseDatos-ClubCamioneros.sql"));

        foreach (var sql in new[] { initial, migration, exported })
        {
            Assert.Contains("UX_CATEGORIAS_NOMBRE", sql);
            Assert.Contains("CK_CATEGORIAS_NOMBRE_NORMALIZADO", sql);
        }

        Assert.Contains("Modern_Spanish_CI_AS", initial);
        Assert.Contains("Modern_Spanish_CI_AS", migration);
        Assert.Contains("UPDLOCK, HOLDLOCK", migration);
        Assert.Contains("HAVING COUNT(*) > 1", migration);
    }

    [Fact]
    public void DaoSerializesCreateAndUpdateAndTranslatesUniqueViolations()
    {
        var root = FindRepositoryRoot();
        var dao = File.ReadAllText(Path.Combine(root, "BackEnd", "CACC.DAO", "CategoriaDao.cs"));

        Assert.Contains("IsolationLevel.Serializable", dao);
        Assert.Contains("WITH (UPDLOCK, HOLDLOCK)", dao);
        Assert.Contains("ex.Number == 2601 || ex.Number == 2627", dao);
        Assert.Contains("CategoriaDuplicadaException", dao);
    }

    private static string FindRepositoryRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current != null && !Directory.Exists(Path.Combine(current.FullName, "BackEnd"))) current = current.Parent;
        return current?.FullName ?? throw new DirectoryNotFoundException("Repository root not found.");
    }
}
