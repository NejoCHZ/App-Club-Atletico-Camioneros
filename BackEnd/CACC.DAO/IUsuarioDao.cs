using CACC.Entities;

namespace CACC.DAO
{
    public interface IUsuarioDao
    {
        Task<UsuarioAuthData?> ObtenerUsuarioParaAuthAsync(string email);
    }
}