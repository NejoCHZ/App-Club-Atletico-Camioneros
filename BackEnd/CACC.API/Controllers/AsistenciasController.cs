using CACC.API.DTOs;
using CACC.API.Security;
using CACC.API.Services;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/asistencias")]
    [Authorize]
    public class AsistenciasController : ControllerBase
    {
        private readonly IAsistenciaDao _asistenciaDao;
        private readonly IEstadoDeudaClient _estadoDeuda;
        private readonly AdministrativoApiOptions _opciones;
        private readonly IJugadorDao _jugadorDao;
        private readonly ICurrentUserAccess _access;
        private readonly ICredentialTokenService _tokenService;
        private readonly ICredentialDao _credentialDao;

        public AsistenciasController(
            IAsistenciaDao asistenciaDao,
            IEstadoDeudaClient estadoDeuda,
            IOptions<AdministrativoApiOptions> opciones,
            IJugadorDao jugadorDao,
            ICurrentUserAccess access,
            ICredentialTokenService tokenService,
            ICredentialDao credentialDao)
        {
            _asistenciaDao = asistenciaDao;
            _estadoDeuda = estadoDeuda;
            _opciones = opciones.Value;
            _jugadorDao = jugadorDao;
            _access = access;
            _tokenService = tokenService;
            _credentialDao = credentialDao;
        }

        // La deuda la informa el Portal Administrativo (fuente única); acá solo se decide el acceso y se registra la asistencia.
        // El ingreso llega por la credencial QR (se valida su firma y se resuelve el DNI vigente) o por el DNI escrito a mano.
        [HttpPost("verificar-y-registrar")]
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.DonQr)]
        public async Task<IActionResult> VerificarYRegistrar([FromBody] AsistenciaRequestDto request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Dni))
            {
                return BadRequest(new { message = "El DNI es obligatorio." });
            }

            // Sin método informado se toma como DNI escrito a mano (clientes anteriores a la credencial QR).
            var metodoRegistro = string.IsNullOrWhiteSpace(request.MetodoRegistro) ? "DNI_MANUAL" : request.MetodoRegistro.Trim().ToUpperInvariant();
            if (metodoRegistro is not ("DNI_MANUAL" or "QR"))
            {
                return BadRequest(new { message = "El método de registro debe ser DNI_MANUAL o QR." });
            }

            string dni = request.Dni.Trim();
            if (metodoRegistro == "QR")
            {
                var token = _tokenService.Validate(dni);
                if (token is null)
                {
                    return BadRequest(new { message = "La credencial QR no es válida." });
                }

                var dniActivo = await _credentialDao.GetActiveDniAsync(token.CredentialId, ct);
                if (dniActivo is null)
                {
                    return NotFound(new { message = "La credencial no existe, fue revocada o está inactiva." });
                }

                dni = dniActivo;
            }

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
                    return await SinRespuestaAsync(dni, metodoRegistro, request.Observaciones);
            }

            var estado = consulta.Estado!;
            if (!estado.AccesoPermitido)
            {
                return Ok(new
                {
                    accesoPermitido = false,
                    estadoAcceso = "DENEGADO",
                    asistenciaRegistrada = false,
                    yaRegistrada = false,
                    verificado = true,
                    estado = estado.Estado,
                    mensaje = MensajeDenegado(estado)
                });
            }

            var resultado = await _asistenciaDao.RegistrarAsistenciaAsync(
                dni, AsistenciaDao.Permitido, Observacion(metodoRegistro, estado.Estado, request.Observaciones));
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
                estadoAcceso = AsistenciaDao.Permitido,
                asistenciaRegistrada = resultado.AsistenciaRegistrada,
                yaRegistrada = resultado.YaRegistrada,
                verificado = true,
                estado = estado.Estado,
                mensaje
            });
        }

        // Historial de asistencia de un jugador, con el mismo alcance por categoría que el resto de sus datos.
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
                FechaHora = asistencia.FechaHora,
                EstadoAcceso = asistencia.EstadoAcceso,
                Observaciones = asistencia.Observaciones
            }));
        }

        private async Task<IActionResult> SinRespuestaAsync(string dni, string metodoRegistro, string? observaciones)
        {
            if (!_opciones.PermiteSiNoResponde)
            {
                return StatusCode(503, new
                {
                    message = "No se pudo consultar la deuda en el Portal Administrativo. No se registró el ingreso; reintentá en unos minutos."
                });
            }

            // Se deja pasar solo a un jugador activo (la base lo comprueba) y la asistencia queda marcada para revisarla.
            string nota = "Ingreso sin verificar la deuda: el Portal Administrativo no respondió. " + DescripcionDelMetodo(metodoRegistro) +
                (string.IsNullOrWhiteSpace(observaciones) ? "" : ". " + observaciones.Trim());
            var resultado = await _asistenciaDao.RegistrarAsistenciaAsync(dni, AsistenciaDao.SinVerificar, nota);
            if (!resultado.PersonaEncontrada)
            {
                return UnprocessableEntity(new { message = resultado.Error ?? "No se pudo identificar un jugador inequívoco." });
            }

            return Ok(new
            {
                accesoPermitido = true,
                estadoAcceso = AsistenciaDao.SinVerificar,
                asistenciaRegistrada = resultado.AsistenciaRegistrada,
                yaRegistrada = resultado.YaRegistrada,
                verificado = false,
                estado = "sin_verificar",
                mensaje = "No se pudo verificar la deuda (el Portal Administrativo no responde). Ingreso permitido y marcado para revisar."
            });
        }

        private static string DescripcionDelMetodo(string metodoRegistro) =>
            metodoRegistro == "QR" ? "Lectura de credencial QR" : "Registro manual por DNI";

        // Lo que queda escrito en el historial: cómo se registró y, si corresponde, el aviso de deuda (sin montos).
        private static string Observacion(string metodoRegistro, string estado, string? extra)
        {
            string descripcion = DescripcionDelMetodo(metodoRegistro);
            string texto = estado == "solo_entrenamientos" ? $"Posee 1 mes de deuda - {descripcion}" : descripcion;
            return string.IsNullOrWhiteSpace(extra) ? texto : $"{texto}. {extra.Trim()}";
        }

        private static string MensajeDenegado(EstadoDeudaAdministrativo estado) => estado.Estado == "baja"
            ? "Acceso denegado. El jugador está dado de baja y la asistencia no fue registrada."
            : "Acceso denegado. El jugador está inhabilitado por deuda y la asistencia no fue registrada.";
    }
}
