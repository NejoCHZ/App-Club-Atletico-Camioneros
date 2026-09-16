using CACC.API.DTOs;
using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/jugadores")]
    [Authorize] // Requiere estar autenticado mediante JWT
    public class JugadoresController : ControllerBase
    {
        private readonly IJugadorDao _jugadorDao;

        public JugadoresController(IJugadorDao jugadorDao)
        {
            _jugadorDao = jugadorDao;
        }

        [HttpGet]
        public async Task<IActionResult> GetJugadores([FromQuery] int? categoriaId)
        {
            // Si el cliente envía una categoría, filtramos. Si no, devolvemos todos.
            IEnumerable<CACC.Entities.Jugador> jugadores;

            if (categoriaId.HasValue)
            {
                jugadores = await _jugadorDao.ObtenerPorCategoriaAsync(categoriaId.Value);
            }
            else
            {
                jugadores = await _jugadorDao.ObtenerTodosAsync();
            }

            return Ok(jugadores);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJugadorPorId(int id)
        {
            var jugador = await _jugadorDao.ObtenerPorIdAsync(id);
            if (jugador == null)
            {
                return NotFound(new { message = "Jugador no encontrado." });
            }

            return Ok(jugador);
        }
    }
}