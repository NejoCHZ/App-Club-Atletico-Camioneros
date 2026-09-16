namespace CACC.Entities
{
    public class EstadoDeuda
    {
        public int IdJugador { get; set; }
        public decimal DeudaTotal { get; set; }
        public int CantidadCuotasVencidas { get; set; }
    }
}