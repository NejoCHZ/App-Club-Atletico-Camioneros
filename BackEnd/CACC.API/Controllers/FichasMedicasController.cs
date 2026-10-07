using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/fichas-medicas")]
    [Authorize]
    public class FichasMedicasController : ControllerBase
    {
        private readonly IFichaMedicaDao _fichaMedicaDao;

        public FichasMedicasController(IFichaMedicaDao fichaMedicaDao)
        {
            _fichaMedicaDao = fichaMedicaDao;
        }

        [HttpGet("jugador/{idJugador}")]
        public async Task<IActionResult> GetFichaPorJugador(int idJugador)
        {
            var ficha = await _fichaMedicaDao.ObtenerPorJugadorIdAsync(idJugador);
            if (ficha == null)
            {
                return NotFound(new { message = "Ficha médica no encontrada para este jugador." });
            }

            return Ok(ficha);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Tesorero,Coordinador,Médico")] // Solo roles autorizados para modificar salud
        public async Task<IActionResult> ActualizarFicha(int id, [FromBody] FichaMedica ficha)
        {
            if (id != ficha.IdFichaMedica)
            {
                return BadRequest(new { message = "El ID de la ficha no coincide." });
            }

            var actualizada = await _fichaMedicaDao.ActualizarAsync(ficha);
            if (!actualizada)
            {
                return NotFound(new { message = "No se pudo actualizar la ficha médica." });
            }

            return Ok(new { message = "Ficha médica actualizada correctamente." });
        }
    }
}