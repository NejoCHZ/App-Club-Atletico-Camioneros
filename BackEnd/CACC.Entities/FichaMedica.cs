namespace CACC.Entities
{
    public class FichaMedica
    {
        public int IdFichaMedica { get; set; }
        public int IdJugador { get; set; }
        public string? ObraSocial { get; set; }
        public int? NumeroAfiliadoOs { get; set; }
        public string? GrupoSanguineo { get; set; }
        public string? Factor { get; set; }
        public string? AntecedentesSalud { get; set; }
        public string? MedicamentosCronicos { get; set; }
        public string? CondicionesCronicas { get; set; }
        public DateTime? AptoFisicoVencimiento { get; set; }
        public string? Observaciones { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}