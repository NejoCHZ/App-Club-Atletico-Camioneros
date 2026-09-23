using CACC.API.Services;
using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/credenciales")]
    [Authorize]
    public class CredencialesController : ControllerBase
    {
        private readonly IQrService _qrService;
        private readonly IJugadorDao _jugadorDao;

        public CredencialesController(IQrService qrService, IJugadorDao jugadorDao)
        {
            _qrService = qrService;
            _jugadorDao = jugadorDao;

            // Configuramos la licencia community de QuestPDF
            QuestPDF.Settings.License = LicenseType.Community;
        }

        [HttpGet("jugador/{idJugador}/pdf")]
        [Authorize(Roles = "Tesorero,Coordinador")]
        public async Task<IActionResult> DescargarCredencialJugador(int idJugador)
        {
            var jugador = await _jugadorDao.ObtenerPorIdAsync(idJugador);
            if (jugador == null)
            {
                return NotFound(new { message = "Jugador no encontrado para generar credencial." });
            }

            string nombre = "Nombre";
            string apellido = "Apellido";
            string dni = "12345678";

            var qrBytes = _qrService.GenerarQrCodePng(dni);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    // Usamos 'f' para pasar float en lugar de double
                    page.Size(85.6f, 54f, Unit.Millimetre);
                    page.Margin(4, Unit.Millimetre);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                    page.Content().Column(col =>
                    {
                        // Espaciado uniforme en la columna
                        col.Spacing(2);

                        col.Item().Text("CLUB ATLÉTICO CAMIONEROS").Bold().FontSize(9).AlignCenter();

                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Spacing(2);
                                c.Item().Text($"{apellido}, {nombre}").Bold().FontSize(11);
                                c.Item().Text($"DNI: {dni}").FontSize(9);
                                c.Item().Text("CATEGORÍA: Oficial").FontSize(8);
                            });

                            row.ConstantItem(35, Unit.Millimetre).Image(qrBytes);
                        });
                    });
                });
            });

            byte[] pdfBytes = document.GeneratePdf();
            string fileName = $"credencial_jugador_{idJugador}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
    }
}