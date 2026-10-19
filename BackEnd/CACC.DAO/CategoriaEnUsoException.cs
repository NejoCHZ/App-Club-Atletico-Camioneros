namespace CACC.DAO
{
    // La categoría no se puede borrar porque hay jugadores o aranceles que dependen de ella.
    public class CategoriaEnUsoException : InvalidOperationException
    {
        public int Jugadores { get; }
        public int Aranceles { get; }

        public CategoriaEnUsoException(int jugadores, int aranceles)
            : base(Armar(jugadores, aranceles))
        {
            Jugadores = jugadores;
            Aranceles = aranceles;
        }

        private static string Armar(int jugadores, int aranceles)
        {
            var motivos = new List<string>();
            if (jugadores > 0) motivos.Add(jugadores == 1 ? "1 jugador" : $"{jugadores} jugadores");
            if (aranceles > 0) motivos.Add(aranceles == 1 ? "1 arancel" : $"{aranceles} aranceles");
            return $"No se puede eliminar la categoría: tiene {string.Join(" y ", motivos)}. Pasá los jugadores a otra categoría antes de eliminarla.";
        }
    }
}
