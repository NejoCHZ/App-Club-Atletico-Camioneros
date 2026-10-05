using CACC.API.DTOs;
using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/categorias")]
    [Authorize]
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
            var categoriasConConteo = await _categoriaDao.ObtenerTodasConConteoAsync();

            var response = categoriasConConteo.Select(c => new CategoriaResponseDto
            {
                IdCategoria = c.IdCategoria,
                NombreCategoria = c.NombreCategoria,
                CantidadJugadores = c.CantidadJugadores
            });

            return Ok(response);
        }

        [HttpGet("simple")]
        public async Task<IActionResult> GetCategoriasSimple()
        {
            var categorias = await _categoriaDao.ObtenerTodasAsync();
            return Ok(categorias);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoriaPorId(int id)
        {
            var cat = await _categoriaDao.ObtenerPorIdAsync(id);
            if (cat == null)
            {
                return NotFound(new { message = $"Categoría con ID {id} no encontrada." });
            }

            return Ok(new CategoriaResponseDto
            {
                IdCategoria = cat.IdCategoria,
                NombreCategoria = cat.NombreCategoria
            });
        }

        [HttpPost]
        [Authorize(Roles = "Administrador (Tesorero),Tesorero")]
        public async Task<IActionResult> CrearCategoria([FromBody] CategoriaCreateUpdateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.NombreCategoria))
            {
                return BadRequest(new { message = "El nombre de la categoría es obligatorio." });
            }

            int idNueva = await _categoriaDao.CrearAsync(dto.NombreCategoria);
            return StatusCode(201, new { idCategoria = idNueva, nombreCategoria = dto.NombreCategoria.Trim() });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador (Tesorero),Tesorero")]
        public async Task<IActionResult> ActualizarCategoria(int id, [FromBody] CategoriaCreateUpdateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.NombreCategoria))
            {
                return BadRequest(new { message = "El nombre de la categoría es obligatorio." });
            }

            bool actualizado = await _categoriaDao.ActualizarAsync(id, dto.NombreCategoria);
            if (!actualizado)
            {
                return NotFound(new { message = $"Categoría con ID {id} no encontrada." });
            }

            return Ok(new { message = "Categoría actualizada con éxito." });
        }

        [HttpGet("{id}/jugadores")]
        public async Task<IActionResult> GetJugadoresPlantel(int id)
        {
            var plantel = await _categoriaDao.ObtenerJugadoresPorCategoriaAsync(id);

            var response = plantel.Select(j => new JugadorPlantelDto
            {
                IdJugador = j.IdJugador,
                NombreCompleto = j.NombreCompleto,
                Dni = j.Dni,
                PosicionCancha = j.PosicionCancha,
                FechaNacimiento = j.FechaNacimiento
            });

            return Ok(response);
        }

        [HttpGet("{id}/jugadores-disponibles")]
        public async Task<IActionResult> GetJugadoresDisponibles(int id, [FromQuery] string? q)
        {
            var disponibles = await _categoriaDao.ObtenerJugadoresDisponiblesAsync(id, q);

            var response = disponibles.Select(j => new JugadorPlantelDto
            {
                IdJugador = j.IdJugador,
                NombreCompleto = j.NombreCompleto,
                Dni = j.Dni,
                PosicionCancha = j.PosicionCancha,
                FechaNacimiento = j.FechaNacimiento
            });

            return Ok(response);
        }

        [HttpPost("{id}/jugadores")]
        [Authorize(Roles = "Administrador (Tesorero),Tesorero")]
        public async Task<IActionResult> AsignarJugador(int id, [FromBody] AsignarJugadorCategoriaDto dto)
        {
            if (dto == null || dto.IdJugador <= 0)
            {
                return BadRequest(new { message = "Debe especificar un jugador válido." });
            }

            await _categoriaDao.AsignarJugadorAsync(id, dto.IdJugador);
            return Ok(new { message = "Jugador asignado a la categoría exitosamente." });
        }

        [HttpDelete("{id}/jugadores/{idJugador}")]
        [Authorize(Roles = "Administrador (Tesorero),Tesorero")]
        public async Task<IActionResult> QuitarJugador(int id, int idJugador)
        {
            await _categoriaDao.QuitarJugadorAsync(id, idJugador);
            return Ok(new { message = "Jugador desvinculado de la categoría." });
        }
    }
}