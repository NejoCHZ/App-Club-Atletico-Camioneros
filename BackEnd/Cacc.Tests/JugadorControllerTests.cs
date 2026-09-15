using Cacc.Api.Contracts;
using Cacc.Api.Controllers;
using Cacc.Dao;
using Cacc.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Cacc.Tests;

public sealed class JugadorControllerTests
{
    [Fact]
    public void Crear_ConJugadorMenorSinTutor_DevuelveBadRequest()
    {
        var controller = new JugadorController(new JugadorRepository());
        var request = CrearRequest(DateOnly.FromDateTime(DateTime.Today).AddYears(-10));

        var resultado = controller.Crear(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(resultado.Result);
        var problema = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("tutor", problema.Errors.Keys);
    }

    [Fact]
    public void Crear_ConDatosValidos_DevuelveCreatedYNormalizaDniYPosicion()
    {
        var controller = new JugadorController(new JugadorRepository());
        var request = CrearRequest(new DateOnly(2000, 1, 1)) with
        {
            Dni = "40.111.222",
            Posicion = " delantero "
        };

        var resultado = controller.Crear(request);

        var created = Assert.IsType<CreatedAtActionResult>(resultado.Result);
        var jugador = Assert.IsType<Jugador>(created.Value);
        Assert.Equal("40111222", jugador.Dni);
        Assert.Equal("DELANTERO", jugador.Posicion);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("lateral")]
    public void Crear_ConPosicionVaciaOInvalida_DevuelveValidationProblemDetails(string? posicion)
    {
        var controller = new JugadorController(new JugadorRepository());
        var request = CrearRequest(new DateOnly(2000, 1, 1)) with { Posicion = posicion };

        var resultado = controller.Crear(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(resultado.Result);
        var problema = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Equal(400, problema.Status);
        Assert.Contains("posicion", problema.Errors.Keys);
    }

    [Fact]
    public void Actualizar_ConPosicionValidaEnMinusculas_PersisteNormalizada()
    {
        var repository = new JugadorRepository();
        var controller = new JugadorController(repository);
        var creado = Assert.IsType<Jugador>(Assert.IsType<CreatedAtActionResult>(
            controller.Crear(CrearRequest(new DateOnly(2000, 1, 1))).Result).Value);

        var resultado = controller.Actualizar(
            creado.Id,
            CrearRequest(new DateOnly(2000, 1, 1)) with { Posicion = "arquero" });

        Assert.IsType<NoContentResult>(resultado);
        Assert.Equal("ARQUERO", repository.ObtenerPorId(creado.Id)!.Posicion);
    }

    [Fact]
    public void Crear_ConDniDuplicado_DevuelveConflict()
    {
        var controller = new JugadorController(new JugadorRepository());
        var request = CrearRequest(new DateOnly(2000, 1, 1));
        controller.Crear(request);

        var resultado = controller.Crear(request);

        var conflict = Assert.IsType<ConflictObjectResult>(resultado.Result);
        var problema = Assert.IsType<ProblemDetails>(conflict.Value);
        Assert.Equal(409, problema.Status);
    }

    private static GuardarJugadorRequest CrearRequest(DateOnly fechaNacimiento) =>
        new("40111222", "Juan", "Pérez", fechaNacimiento, "Primera", "VOLANTE", null, false, null);
}
