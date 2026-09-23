using CACC.Entities;

namespace CACC.DAO
{
    public interface ICategoriaDao
    {
        Task<IEnumerable<Categoria>> ObtenerTodasAsync();
    }
}