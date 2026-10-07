namespace CACC.Entities
{
    public class CategoriaConConteo
    {
        public int IdCategoria { get; set; }
        public string NombreCategoria { get; set; } = string.Empty;
        public string Asociacion { get; set; } = "Liga Cordobesa";
        public int CantidadJugadores { get; set; }
        public int CantidadStaff { get; set; }
    }
}