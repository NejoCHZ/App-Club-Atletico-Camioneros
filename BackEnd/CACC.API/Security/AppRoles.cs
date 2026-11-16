namespace CACC.API.Security;

public static class AppRoles
{
    public const string Administrador = "Administrador (Tesorero)";
    public const string Tesorero = "Tesorero";
    public const string Coordinador = "Coordinador";
    public const string Medico = "Médico";
    public const string DirectorTecnico = "Director Técnico";
    public const string PreparadorFisico = "Preparador Físico";
    public const string DonQr = "Don QR";

    public const string Administradores = Administrador + "," + Tesorero;
    public const string EscrituraMedica = Administradores + "," + Medico;
    public const string LecturaDeportiva = Administrador + "," + Tesorero + "," + Coordinador + "," + Medico + "," + DirectorTecnico + "," + PreparadorFisico;
    public const string LecturaGeneral = Administrador + "," + Tesorero + "," + Coordinador + "," + Medico;
}
