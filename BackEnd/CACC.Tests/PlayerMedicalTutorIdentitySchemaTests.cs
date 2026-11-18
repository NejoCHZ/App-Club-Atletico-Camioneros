using Xunit;

namespace CACC.Tests;

public class PlayerMedicalTutorIdentitySchemaTests
{
    [Fact]
    public void SchemasAndMigrationEnforceSingleMedicalRecordAndTutorLinkPerPlayer()
    {
        var root = FindRepositoryRoot();
        var freshSchema = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "000-create-schema.sql"));
        var exportedSchema = File.ReadAllText(Path.Combine(root, "BaseDatos-ClubCamioneros.sql"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "009-enforce-single-player-medical-and-tutor-relations.sql"));

        foreach (var schema in new[] { freshSchema, exportedSchema })
        {
            AssertRequiredColumn(schema, "FICHAS_MEDICAS", "FK_id_jugador");
            AssertRequiredColumn(schema, "RESPONSABLES", "FK_id_persona");
            AssertRequiredColumn(schema, "JUGADORES_RESPONSABLES", "FK_id_jugador");
            AssertRequiredColumn(schema, "JUGADORES_RESPONSABLES", "FK_id_responsable");
            Assert.Contains("UX_FICHAS_MEDICAS_JUGADOR", schema, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("UX_RESPONSABLES_PERSONA", schema, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("UX_JUGADORES_RESPONSABLES_JUGADOR", schema, StringComparison.OrdinalIgnoreCase);
        }

        Assert.Contains("THROW 51071", migration);
        Assert.Contains("THROW 51073", migration);
        Assert.Contains("THROW 51075", migration);
        Assert.Contains("sys.indexes", migration, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("DELETE FROM", migration, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DaoLocksIdentityLookupsBeforeUpsertingMedicalAndTutorRelations()
    {
        var root = FindRepositoryRoot();
        var dao = File.ReadAllText(Path.Combine(root, "BackEnd", "CACC.DAO", "JugadorDao.cs"));

        Assert.Contains("FICHAS_MEDICAS WITH (UPDLOCK, HOLDLOCK)", dao, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("RESPONSABLES WITH (UPDLOCK, HOLDLOCK)", dao, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("JUGADORES_RESPONSABLES WITH (UPDLOCK, HOLDLOCK)", dao, StringComparison.OrdinalIgnoreCase);
    }

    private static void AssertRequiredColumn(string schema, string tableName, string columnName)
    {
        var tableStart = schema.IndexOf($"CREATE TABLE [dbo].[{tableName}]", StringComparison.OrdinalIgnoreCase);
        Assert.True(tableStart >= 0, $"No se encontró {tableName}.");
        var tableEnd = schema.IndexOf("\nGO", tableStart, StringComparison.OrdinalIgnoreCase);
        Assert.True(tableEnd > tableStart, $"No se encontró el final de {tableName}.");
        var table = schema[tableStart..tableEnd];
        Assert.Contains($"[{columnName}] [int] NOT NULL", table, StringComparison.OrdinalIgnoreCase);
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
