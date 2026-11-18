using CACC.API.DTOs;
using CACC.API.Services;
using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CACC.API.Security;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/asistencias")]
    [Authorize]
    public class AsistenciasController : ControllerBase
    {
        private readonly IAsistenciaDao _asistenciaDao;
        private readonly IJugadorDao _jugadorDao;
        private readonly IStaffDao _staffDao;
        private readonly ICurrentUserAccess _access;
        private readonly ICredentialTokenService _tokenService;
        private readonly ICredentialDao _credentialDao;

        public AsistenciasController(
            IAsistenciaDao asistenciaDao,
            IJugadorDao jugadorDao,
            IStaffDao staffDao,
            ICurrentUserAccess access,
            ICredentialTokenService tokenService,
            ICredentialDao credentialDao)
        {
            _asistenciaDao = asistenciaDao;
            _jugadorDao = jugadorDao;
            _staffDao = staffDao;
            _access = access;
            _tokenService = tokenService;
            _credentialDao = credentialDao;
        }

        [HttpPost("verificar-y-registrar")]
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.DonQr + "," + AppRoles.DirectorTecnico)]
        public async Task<IActionResult> VerificarYRegistrar([FromBody] AsistenciaRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Dni))
            {
                return BadRequest(new { message = "El DNI es obligatorio." });
            }

            var metodoRegistro = request.MetodoRegistro?.Trim().ToUpperInvariant();
            if (metodoRegistro is not ("DNI_MANUAL" or "QR"))
            {
                return BadRequest(new { message = "El método de registro debe ser DNI_MANUAL o QR." });
            }

            var identificador = request.Dni.Trim();
            if (metodoRegistro == "QR")
            {
                var token = _tokenService.Validate(identificador);
                if (token is null)
                {
                    return BadRequest(new { message = "La credencial QR no es válida." });
                }

                var dniActivo = await _credentialDao.GetActiveDniAsync(
                    token.CredentialId, HttpContext?.RequestAborted ?? CancellationToken.None);
                if (dniActivo is null)
                {
                    return NotFound(new { message = "La credencial no existe, fue revocada o está inactiva." });
                }

                identificador = dniActivo;
            }

            var resultado = await _asistenciaDao.ProcesarIngresoAsync(identificador, metodoRegistro);
            if (!resultado.PersonaEncontrada)
            {
                return UnprocessableEntity(new { message = resultado.Error ?? "No se pudo identificar una persona habilitada de forma inequívoca." });
            }
            var mensaje = resultado.YaRegistrada
                ? "Asistencia ya tomada."
                : resultado.CuotasVencidas switch {
                    0 => "Asistencia registrada. Acceso permitido.",
                    1 => "Asistencia registrada. El jugador posee un mes de deuda.",
                    _ => $"Acceso denegado. El jugador posee {resultado.CuotasVencidas} cuotas vencidas. El intento de ingreso fue registrado."
                };
            return Ok(new IngresoAsistenciaResponseDto
            {
                AccesoPermitido = resultado.AccesoPermitido,
                EstadoAcceso = resultado.EstadoAcceso,
                EstadoRegistro = resultado.YaRegistrada
                    ? EstadosRegistroAsistencia.YaRegistrada
                    : EstadosRegistroAsistencia.Registrada,
                AsistenciaRegistrada = resultado.AsistenciaRegistrada,
                YaRegistrada = resultado.YaRegistrada,
                Mensaje = mensaje,
                DeudaTotal = resultado.DeudaTotal,
                CuotasVencidas = resultado.CuotasVencidas
            });
        }

        [HttpGet("jugador/{idJugador:int}")]
        public async Task<IActionResult> ObtenerHistorialJugador(
            int idJugador,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] string? estado)
        {
            if (idJugador <= 0)
            {
                return BadRequest(new { message = "El jugador solicitado no es válido." });
            }

            if (desde.HasValue && hasta.HasValue && desde.Value.Date > hasta.Value.Date)
            {
                return BadRequest(new { message = "La fecha desde no puede ser posterior a la fecha hasta." });
            }

            var jugador = await _jugadorDao.ObtenerPorIdAsync(idJugador);
            if (jugador is null)
            {
                return NotFound(new { message = "Jugador no encontrado." });
            }

            if (!_access.PuedeAccederAlgunaCategoria(jugador.CategoriasIds))
            {
                return Forbid();
            }

            var asistencias = await _asistenciaDao.ObtenerHistorialJugadorAsync(
                idJugador,
                desde,
                hasta,
                string.IsNullOrWhiteSpace(estado) ? null : estado.Trim());

            return Ok(asistencias.Select(asistencia => new AsistenciaResponseDto
            {
                IdAsistencia = asistencia.IdAsistencia,
                IdJugador = asistencia.IdJugador,
                IdStaff = asistencia.IdStaff,
                FechaHora = asistencia.FechaHora,
                EstadoAcceso = asistencia.EstadoAcceso,
                Observaciones = asistencia.Observaciones
            }));
        }

        [HttpGet("staff/{idStaff:int}")]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> ObtenerHistorialStaff(
            int idStaff,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] string? estado)
        {
            if (idStaff <= 0)
            {
                return BadRequest(new { message = "El colaborador solicitado no es válido." });
            }

            if (desde.HasValue && hasta.HasValue && desde.Value.Date > hasta.Value.Date)
            {
                return BadRequest(new { message = "La fecha desde no puede ser posterior a la fecha hasta." });
            }

            if (await _staffDao.ObtenerPorIdAsync(idStaff) is null)
            {
                return NotFound(new { message = "Colaborador no encontrado." });
            }

            var asistencias = await _asistenciaDao.ObtenerHistorialStaffAsync(
                idStaff,
                desde,
                hasta,
                string.IsNullOrWhiteSpace(estado) ? null : estado.Trim());

            return Ok(asistencias.Select(asistencia => new AsistenciaResponseDto
            {
                IdAsistencia = asistencia.IdAsistencia,
                IdJugador = asistencia.IdJugador,
                IdStaff = asistencia.IdStaff,
                FechaHora = asistencia.FechaHora,
                EstadoAcceso = asistencia.EstadoAcceso,
                Observaciones = asistencia.Observaciones
            }));
        }
    }
}
