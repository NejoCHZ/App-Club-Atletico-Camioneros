using CACC.API.DTOs;
using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/asistencias")]
    [Authorize]
    public class AsistenciasController : ControllerBase
    {
        private readonly IAsistenciaDao _asistenciaDao;

        public AsistenciasController(IAsistenciaDao asistenciaDao)
        {
            _asistenciaDao = asistenciaDao;
        }

        [HttpPost("verificar-y-registrar")]
        [Authorize(Roles = "Don QR,Tesorero,Coordinador")] // Accesible por Don QR y administradores
        public async Task<IActionResult> VerificarYRegistrar([FromBody] AsistenciaRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Dni))
            {
                return BadRequest(new { message = "El DNI es obligatorio." });
            }

            // Verificamos si tiene deuda (si es jugador)
            var estadoDeuda = await _asistenciaDao.ObtenerEstadoDeudaPorDniAsync(request.Dni);

            // Regla de acceso: Si tiene cuotas vencidas (ej: más de 0 o según política del club), denegamos o admitimos.
            // Asumimos que si CantidadCuotasVencidas > 0, el acceso es denegado (false), de lo contrario admitido (true).
            bool estadoAcceso = true;
            string mensaje = "Acceso permitido. ¡Bienvenido!";

            if (estadoDeuda != null && estadoDeuda.CantidadCuotasVencidas > 0)
            {
                estadoAcceso = false;
                mensaje = $"Acceso denegado. El jugador posee {estadoDeuda.CantidadCuotasVencidas} cuota(s) vencida(s).";
            }

            // Registramos el intento de acceso / asistencia 
            bool registrado = await _asistenciaDao.RegistrarAsistenciaAsync(request.Dni, estadoAcceso, request.Observaciones ?? string.Empty);

            if (!registrado)
            {
                return NotFound(new { message = "Persona no encontrada con el DNI proporcionado." });
            }

            return Ok(new
            {
                accesoPermitido = estadoAcceso,
                mensaje = mensaje,
                deudaTotal = estadoDeuda?.DeudaTotal ?? 0,
                cuotasVencidas = estadoDeuda?.CantidadCuotasVencidas ?? 0
            });
        }
    }
}