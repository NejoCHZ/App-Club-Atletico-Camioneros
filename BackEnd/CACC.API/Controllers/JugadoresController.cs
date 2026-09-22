using CACC.Entities;
using CACC.DAO;
using CACC.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/jugadores")]
    [Authorize]
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
            IEnumerable<JugadorDetalle> jugadores;

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

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarPerfil(int id, [FromBody] JugadorUpdateDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Datos de actualización inválidos." });
            }

            try
            {
                var jugador = new JugadorDetalle
                {
                    Nombre = dto.Nombre,
                    Apellido = dto.Apellido,
                    Dni = dto.Dni,
                    FechaDeNacimiento = dto.FechaDeNacimiento,
                    PosicionCancha = dto.Posicion,
                    Peso = dto.Peso,
                    Altura = dto.Altura,
                    PieHabil = dto.PieHabil,
                    FichaMedica = dto.FichaMedica == null ? null : new FichaMedicaDetalle
                    {
                        GrupoSanguineo = dto.FichaMedica.GrupoSanguineo,
                        Patologias = dto.FichaMedica.Patologias,
                        HistorialLesiones = dto.FichaMedica.HistorialLesiones,
                        Observaciones = dto.FichaMedica.Observaciones
                    },
                    Partidos = dto.Partidos?.Select(p => new PartidoDetalle
                    {
                        Fecha = p.Fecha,
                        Rival = p.Rival,
                        Minutos = p.Minutos
                    }).ToList() ?? new List<PartidoDetalle>()
                };

                var resultado = await _jugadorDao.ActualizarPerfilAsync(id, jugador);
                if (!resultado)
                {
                    return NotFound(new { message = $"Jugador con ID {id} no encontrado." });
                }

                return Ok(new { message = "Perfil actualizado correctamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno del servidor.", details = ex.Message });
            }
        }
    }
}