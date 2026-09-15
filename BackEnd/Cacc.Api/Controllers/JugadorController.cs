using Cacc.Api.Contracts;
using Cacc.Api.Validation;
using Cacc.Dao;
using Cacc.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Cacc.Api.Controllers;

[ApiController]
[Route("api/jugadores")]
public sealed class JugadorController(IJugadorRepository jugadorRepository) : ControllerBase
{
    private readonly IJugadorRepository _jugadorRepository = jugadorRepository;

    [HttpGet]
    [ProducesResponseType<IReadOnlyCollection<Jugador>>(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyCollection<Jugador>> ObtenerTodos() =>
        Ok(_jugadorRepository.ObtenerTodos());

    [HttpGet("{id:guid}")]
    [ProducesResponseType<Jugador>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<Jugador> ObtenerPorId(Guid id)
    {
        var jugador = _jugadorRepository.ObtenerPorId(id);
        return jugador is null
            ? NotFound(CrearProblemaNoEncontrado(id))
            : Ok(jugador);
    }

    [HttpPost]
    [ProducesResponseType<Jugador>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public ActionResult<Jugador> Crear(GuardarJugadorRequest request)
    {
        var validacion = Validar(request);
        if (validacion is not null)
        {
            return validacion;
        }

        var jugador = CrearEntidad(Guid.NewGuid(), request);
        try
        {
            _jugadorRepository.Agregar(jugador);
        }
        catch (DniDuplicadoException exception)
        {
            return Conflict(CrearProblemaDniDuplicado(exception.Message));
        }

        return CreatedAtAction(nameof(ObtenerPorId), new { id = jugador.Id }, jugador);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public IActionResult Actualizar(Guid id, GuardarJugadorRequest request)
    {
        var validacion = Validar(request);
        if (validacion is not null)
        {
            return validacion;
        }

        try
        {
            if (!_jugadorRepository.Actualizar(CrearEntidad(id, request)))
            {
                return NotFound(CrearProblemaNoEncontrado(id));
            }
        }
        catch (DniDuplicadoException exception)
        {
            return Conflict(CrearProblemaDniDuplicado(exception.Message));
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public IActionResult Eliminar(Guid id) =>
        _jugadorRepository.Eliminar(id)
            ? NoContent()
            : NotFound(CrearProblemaNoEncontrado(id));

    private ActionResult? Validar(GuardarJugadorRequest request)
    {
        var errores = JugadorRequestValidator.Validar(request, DateOnly.FromDateTime(DateTime.Today));
        if (errores.Count == 0)
        {
            return null;
        }

        var details = new ValidationProblemDetails(errores)
        {
            Title = "Uno o más campos no son válidos.",
            Status = StatusCodes.Status400BadRequest
        };
        return BadRequest(details);
    }

    private static Jugador CrearEntidad(Guid id, GuardarJugadorRequest request) =>
        new(
            id,
            JugadorRequestValidator.NormalizarDni(request.Dni),
            request.Nombre!.Trim(),
            request.Apellido!.Trim(),
            request.FechaNacimiento,
            request.Categoria!.Trim(),
            JugadorRequestValidator.NormalizarPosicion(request.Posicion),
            string.IsNullOrWhiteSpace(request.ClubOrigen) ? null : request.ClubOrigen.Trim(),
            request.AptoFisico,
            request.Tutor is null
                ? null
                : new Tutor(
                    JugadorRequestValidator.NormalizarDni(request.Tutor.Dni),
                    request.Tutor.Nombre!.Trim(),
                    request.Tutor.Apellido!.Trim(),
                    request.Tutor.Telefono!.Trim(),
                    request.Tutor.Email!.Trim()));

    private static ProblemDetails CrearProblemaNoEncontrado(Guid id) => new()
    {
        Title = "Jugador no encontrado.",
        Detail = $"No existe un jugador con el identificador {id}.",
        Status = StatusCodes.Status404NotFound
    };

    private static ProblemDetails CrearProblemaDniDuplicado(string detail) => new()
    {
        Title = "DNI duplicado.",
        Detail = detail,
        Status = StatusCodes.Status409Conflict
    };
}
