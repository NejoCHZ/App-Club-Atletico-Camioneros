using System.Reflection;
using CACC.API.Authorization;
using CACC.API.Controllers;
using CACC.API.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace CACC.Tests;

public class MedicalAuthorizationTests
{
    [Fact]
    public void UpdateMedicalRecord_IsRestrictedToAdministratorAndDoctor()
    {
        var method = typeof(FichasMedicasController).GetMethod(nameof(FichasMedicasController.ActualizarFicha));

        var authorize = Assert.Single(method!.GetCustomAttributes<AuthorizeAttribute>());
        Assert.Equal(RoleNames.EscrituraFichaMedica, authorize.Roles);
    }

    [Fact]
    public void ReadMedicalRecord_UsesAuthenticatedResourceScopeInsteadOfRoleWhitelist()
    {
        var controllerAuthorize = Assert.Single(typeof(FichasMedicasController).GetCustomAttributes<AuthorizeAttribute>());
        var method = typeof(FichasMedicasController).GetMethod(nameof(FichasMedicasController.GetFichaPorJugador));

        Assert.Null(controllerAuthorize.Roles);
        Assert.Empty(method!.GetCustomAttributes<AuthorizeAttribute>());
    }

    [Fact]
    public void AdministratorPlayerUpdateContract_AcceptsMedicalDataForAtomicSave()
    {
        Assert.NotNull(typeof(JugadorUpdateDto).GetProperty("FichaMedica"));
    }
}
