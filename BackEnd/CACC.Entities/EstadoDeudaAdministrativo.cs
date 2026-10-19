namespace CACC.Entities
{
    // Estado de habilitación de un jugador tal como lo informa el Portal Administrativo (api/integracion/v1/estado-deuda).
    // Ese portal es la única fuente de verdad de la deuda: acá no se calcula nada y NO se recibe ningún monto ni cantidad de
    // cuotas (contrato v1: solo el estado).
    public class EstadoDeudaAdministrativo
    {
        public string Dni { get; set; } = string.Empty;
        public int IdJugador { get; set; }

        // "habilitado", "solo_entrenamientos", "inhabilitado" o "baja".
        public string Estado { get; set; } = string.Empty;
        public bool AccesoPermitido { get; set; }
        public string? FechaBaja { get; set; }
    }
}
