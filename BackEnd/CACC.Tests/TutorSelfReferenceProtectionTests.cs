using CACC.Entities;

namespace CACC.Tests;

public sealed class TutorSelfReferenceProtectionTests
{
    [Theory]
    [InlineData("47265479", "47.265.479")]
    [InlineData("TEST-RBAC-01", " test rbac 01 ")]
    public void DniIdentityRecognizesEquivalentFormats(string playerDni, string tutorDni)
    {
        Assert.True(DniIdentity.AreSame(playerDni, tutorDni));
    }

    [Fact]
    public void DaoProtectsCreateUpdateAndDirectTutorSave()
    {
        var root = FindRepositoryRoot();
        var dao = File.ReadAllText(Path.Combine(root, "BackEnd", "CACC.DAO", "JugadorDao.cs"));

        Assert.Equal(4, CountOccurrences(dao, "EnsureTutorIsNotPlayer("));
        Assert.Contains("JUGADORES j WITH (UPDLOCK, HOLDLOCK)", dao);
        Assert.Contains("PERSONAS p WITH (UPDLOCK, HOLDLOCK)", dao);
        Assert.Contains("throw new TutorSelfReferenceException()", dao);
    }

    private static int CountOccurrences(string source, string value)
    {
        var count = 0;
        var index = 0;
        while ((index = source.IndexOf(value, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += value.Length;
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
