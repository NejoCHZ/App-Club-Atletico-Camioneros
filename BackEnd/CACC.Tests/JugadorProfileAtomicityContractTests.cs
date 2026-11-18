namespace CACC.Tests;

public sealed class JugadorProfileAtomicityContractTests
{
    [Fact]
    public void ProfileMedicalAndTutorWritesShareOneTransactionWithRollback()
    {
        var dao = File.ReadAllText(Path.Combine(
            FindRepositoryRoot(), "BackEnd", "CACC.DAO", "JugadorDao.cs"));
        var start = dao.IndexOf("public async Task<bool> ActualizarPerfilAsync", StringComparison.Ordinal);
        var end = dao.IndexOf("public async Task<bool> ExisteDniAsync", start, StringComparison.Ordinal);
        var method = dao[start..end];

        Assert.Contains("connection.BeginTransaction()", method);
        Assert.Contains("new SqlCommand(queryPersonas, connection, transaction)", method);
        Assert.Contains("new SqlCommand(queryJugadores, connection, transaction)", method);
        Assert.Contains("new SqlCommand(queryFicha, connection, transaction)", method);
        Assert.Contains("new SqlCommand(tutorSql, connection, transaction)", method);
        Assert.Contains("await transaction.CommitAsync()", method);
        Assert.Contains("await transaction.RollbackAsync()", method);
    }

    private static string FindRepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory);
             directory is not null;
             directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "BaseDatos-ClubCamioneros.sql")))
            {
                return directory.FullName;
            }
        }

        throw new DirectoryNotFoundException("No se encontró la raíz del repositorio.");
    }
}
