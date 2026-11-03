using Xunit;

namespace CACC.Tests;

public class CredencialPdfContractTests
{
    [Fact]
    public void PdfUsesTheBrandedTwoSidedServiceAndSignedQrToken()
    {
        var root = FindRepositoryRoot();
        var controller = File.ReadAllText(Path.Combine(
            root, "BackEnd", "CACC.API", "Controllers", "CredencialesController.cs"));

        Assert.Contains("_pdfService.Generate", controller);
        Assert.Contains("new CredentialPdfData", controller);
        Assert.Contains("_tokenService.Create", controller);
        Assert.Contains("GetOrCreateActiveCredentialForPlayerAsync", controller);
        Assert.Contains("GetOrCreateActiveCredentialForStaffAsync", controller);
        Assert.Contains("staff/{idStaff}/pdf", controller);
        Assert.DoesNotContain("string dni = \"12345678\"", controller);
        Assert.DoesNotContain("Document.Create", controller);
    }

    private static string FindRepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory);
             directory is not null;
             directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "Bbdd CACC.sql")))
            {
                return directory.FullName;
            }
        }

        throw new DirectoryNotFoundException("No se encontró la raíz del repositorio.");
    }
}
