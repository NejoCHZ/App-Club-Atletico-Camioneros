using CACC.Entities;

namespace CACC.DAO
{
    public interface IFichaMedicaDao
    {
        Task<FichaMedica?> ObtenerPorJugadorIdAsync(int idJugador);
        Task<bool> ActualizarAsync(FichaMedica ficha);
        Task<bool> CrearAsync(FichaMedica ficha);
    }
}