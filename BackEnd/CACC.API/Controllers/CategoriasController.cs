using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/categorias")]
    [Authorize] // Protegido por JWT
    public class CategoriasController : ControllerBase
    {
        private readonly ICategoriaDao _categoriaDao;

        public CategoriasController(ICategoriaDao categoriaDao)
        {
            _categoriaDao = categoriaDao;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategorias()
        {
            var categorias = await _categoriaDao.ObtenerTodasAsync();
            return Ok(categorias);
        }
    }
}