using CACC.API.Services;
using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CACC.API.Security;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/credenciales")]
    [Authorize(Roles = AppRoles.Administradores)]
    public class CredencialesController : ControllerBase
    {
        private readonly IQrService _qrService;
        private readonly ICredentialDao _credentialDao;
        private readonly ICredentialTokenService _tokenService;
        private readonly ICredentialPdfService _pdfService;

        public CredencialesController(
            IQrService qrService,
            ICredentialDao credentialDao,
            ICredentialTokenService tokenService,
            ICredentialPdfService pdfService)
        {
            _qrService = qrService;
            _credentialDao = credentialDao;
            _tokenService = tokenService;
            _pdfService = pdfService;
        }

        [HttpGet("jugador/{idJugador}/pdf")]
        public async Task<IActionResult> DescargarCredencialJugador(int idJugador)
        {
            var cancellationToken = HttpContext?.RequestAborted ?? CancellationToken.None;
            var jugador = await _credentialDao.GetPlayerAsync(idJugador, cancellationToken);
            if (jugador == null)
            {
                return NotFound(new { message = "Jugador no encontrado para generar credencial." });
            }

            var credentialId = await _credentialDao.GetOrCreateActiveCredentialForPlayerAsync(
                idJugador, cancellationToken);
            if (credentialId is null)
            {
                return NotFound(new { message = "No se encontró la persona asociada al jugador." });
            }

            var qrBytes = _qrService.GenerarQrCodePng(_tokenService.Create(credentialId.Value));
            byte[] pdfBytes = _pdfService.Generate(new CredentialPdfData(
                jugador.FirstName, jugador.LastName, jugador.Dni, qrBytes));
            string fileName = BuildCredentialFileName("jugador", jugador.FirstName, jugador.LastName);

            return File(pdfBytes, "application/pdf", fileName);
        }

        [HttpGet("staff/{idStaff}/pdf")]
        public async Task<IActionResult> DescargarCredencialStaff(int idStaff)
        {
            var cancellationToken = HttpContext?.RequestAborted ?? CancellationToken.None;
            var staff = await _credentialDao.GetStaffAsync(idStaff, cancellationToken);
            if (staff == null)
            {
                return NotFound(new { message = "Colaborador no encontrado para generar credencial." });
            }

            var credentialId = await _credentialDao.GetOrCreateActiveCredentialForStaffAsync(
                idStaff, cancellationToken);
            if (credentialId is null)
            {
                return NotFound(new { message = "No se encontró la persona asociada al colaborador." });
            }

            var qrBytes = _qrService.GenerarQrCodePng(_tokenService.Create(credentialId.Value));
            byte[] pdfBytes = _pdfService.Generate(new CredentialPdfData(
                staff.FirstName, staff.LastName, staff.Dni, qrBytes));

            return File(pdfBytes, "application/pdf", BuildCredentialFileName("staff", staff.FirstName, staff.LastName));
        }

        private static string BuildCredentialFileName(string type, params string[] nameParts)
        {
            var fullName = string.Join(" ", nameParts.Where(part => !string.IsNullOrWhiteSpace(part))).Trim();
            var invalidChars = Path.GetInvalidFileNameChars();
            var safeName = new string(fullName
                .Select(character => invalidChars.Contains(character) ? '_' : character)
                .ToArray());
            safeName = string.Join("_", safeName.Split(' ', StringSplitOptions.RemoveEmptyEntries));

            return $"credencial_{type}_{(string.IsNullOrWhiteSpace(safeName) ? "sin_nombre" : safeName)}.pdf";
        }
    }
}
