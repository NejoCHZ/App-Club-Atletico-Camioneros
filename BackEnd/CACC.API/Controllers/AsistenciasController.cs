using CACC.API.DTOs;
using CACC.API.Services;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using CACC.API.Security;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/asistencias")]
    [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.DonQr)]
    public class AsistenciasController : ControllerBase
    {
        private readonly IAsistenciaDao _asistenciaDao;
        private readonly IEstadoDeudaClient _estadoDeuda;
        private readonly AdministrativoApiOptions _opciones;

        public AsistenciasController(IAsistenciaDao asistenciaDao, IEstadoDeudaClient estadoDeuda, IOptions<AdministrativoApiOptions> opciones)
        {
            _asistenciaDao = asistenciaDao;
            _estadoDeuda = estadoDeuda;
            _opciones = opciones.Value;
        }

        // La deuda la informa el Portal Administrativo (fuente única); acá solo se decide el acceso y se registra la asistencia.
        [HttpPost("verificar-y-registrar")]
        public async Task<IActionResult> VerificarYRegistrar([FromBody] AsistenciaRequestDto request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Dni))
            {
                return BadRequest(new { message = "El DNI es obligatorio." });
            }

            string dni = request.Dni.Trim();
            var consulta = await _estadoDeuda.PorDniAsync(dni, ct);

            switch (consulta.Resultado)
            {
                case ResultadoConsulta.DniInvalido:
                    return BadRequest(new { message = "El DNI no es válido." });
                case ResultadoConsulta.NoEsJugador:
                    return UnprocessableEntity(new { message = "El DNI no pertenece a un jugador." });
                case ResultadoConsulta.Ambiguo:
                    return UnprocessableEntity(new { message = "El DNI está asociado a múltiples jugadores." });
                case ResultadoConsulta.SinPermiso:
                    return StatusCode(consulta.CodigoHttp == 401 ? 401 : 403, new { message = "El Portal Administrativo no reconoce esta sesión. Volvé a iniciar sesión." });
                case ResultadoConsulta.NoResponde:
                    return await SinRespuestaAsync(dni, request.Observaciones);
            }

            var estado = consulta.Estado!;
            if (!estado.AccesoPermitido)
            {
                return Ok(new
                {
                    accesoPermitido = false,
                    asistenciaRegistrada = false,
                    yaRegistrada = false,
                    verificado = true,
                    estado = estado.Estado,
                    mensaje = MensajeDenegado(estado)
                });
            }

            var resultado = await _asistenciaDao.RegistrarAsistenciaAsync(dni, AsistenciaDao.Permitido, request.Observaciones);
            if (!resultado.PersonaEncontrada)
            {
                return UnprocessableEntity(new { message = resultado.Error ?? "No se pudo identificar un jugador inequívoco." });
            }

            string mensaje = resultado.YaRegistrada
                ? "La asistencia ya estaba registrada para hoy."
                : estado.Estado == "solo_entrenamientos"
                    ? "Asistencia registrada. El jugador posee un mes de deuda."
                    : "Asistencia registrada. Acceso permitido.";
            return Ok(new
            {
                accesoPermitido = true,
                asistenciaRegistrada = resultado.AsistenciaRegistrada,
                yaRegistrada = resultado.YaRegistrada,
                verificado = true,
                estado = estado.Estado,
                mensaje
            });
        }

        private async Task<IActionResult> SinRespuestaAsync(string dni, string? observaciones)
        {
            if (!_opciones.PermiteSiNoResponde)
            {
                return StatusCode(503, new
                {
                    message = "No se pudo consultar la deuda en el Portal Administrativo. No se registró el ingreso; reintentá en unos minutos."
                });
            }

            // Se deja pasar solo a un jugador activo (la base lo comprueba) y la asistencia queda marcada para revisarla.
            string nota = "Ingreso sin verificar la deuda: el Portal Administrativo no respondió." +
                (string.IsNullOrWhiteSpace(observaciones) ? "" : " " + observaciones.Trim());
            var resultado = await _asistenciaDao.RegistrarAsistenciaAsync(dni, AsistenciaDao.SinVerificar, nota);
            if (!resultado.PersonaEncontrada)
            {
                return UnprocessableEntity(new { message = resultado.Error ?? "No se pudo identificar un jugador inequívoco." });
            }

            return Ok(new
            {
                accesoPermitido = true,
                asistenciaRegistrada = resultado.AsistenciaRegistrada,
                yaRegistrada = resultado.YaRegistrada,
                verificado = false,
                estado = "sin_verificar",
                mensaje = "No se pudo verificar la deuda (el Portal Administrativo no responde). Ingreso permitido y marcado para revisar."
            });
        }

        private static string MensajeDenegado(EstadoDeudaAdministrativo estado) => estado.Estado == "baja"
            ? "Acceso denegado. El jugador está dado de baja y la asistencia no fue registrada."
            : "Acceso denegado. El jugador está inhabilitado por deuda y la asistencia no fue registrada.";
    }
}
