using QRCoder;

namespace CACC.API.Services
{
    public interface IQrService
    {
        byte[] GenerarQrCodePng(string dni);
    }

    public class QrService : IQrService
    {
        public byte[] GenerarQrCodePng(string dni)
        {
            // El QR se genera dinámicamente a partir del DNI de la persona
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(dni, QRCodeGenerator.ECCLevel.Q);

            // Usamos PngByteQRCode tal como exigen las convenciones del proyecto
            using var qrCode = new PngByteQRCode(qrCodeData);
            return qrCode.GetGraphic(20); // Tamaño de píxeles por módulo
        }
    }
}