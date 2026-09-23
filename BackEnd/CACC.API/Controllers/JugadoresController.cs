using CACC.Entities;
using CACC.DAO;
using CACC.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient; 

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

        [HttpPost]
        public async Task<IActionResult> CrearJugador([FromBody] JugadorCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Dni))
            {
                return BadRequest(new { message = "El nombre y el DNI son obligatorios." });
            }

            try
            {
                // Mapeo del DTO de la API hacia la Entidad del DAO
                var jugadorAlta = new JugadorAlta
                {
                    Dni = dto.Dni,
                    Nombre = dto.Nombre,
                    Apellido = dto.Apellido,
                    FechaNacimiento = dto.FechaNacimiento,
                    Categoria = dto.Categoria,
                    Posicion = dto.Posicion,
                    ClubOrigen = dto.ClubOrigen,
                    AptoFisico = dto.AptoFisico,
                    Tutor = dto.Tutor == null ? null : new TutorAlta
                    {
                        Dni = dto.Tutor.Dni,
                        Nombre = dto.Tutor.Nombre,
                        Apellido = dto.Tutor.Apellido,
                        Telefono = dto.Tutor.Telefono,
                        Email = dto.Tutor.Email
                    }
                };

                // Le enviamos la entidad mapeada al DAO
                int nuevoId = await _jugadorDao.CrearAsync(jugadorAlta);

                return StatusCode(201, new
                {
                    message = "Jugador creado con éxito.",
                    idJugador = nuevoId,
                    dni = dto.Dni,
                    nombre = dto.Nombre,
                    apellido = dto.Apellido
                });
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                return StatusCode(409, new { message = "Ya existe un jugador con ese DNI." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno al crear el jugador.", details = ex.Message });
            }
        }
    }
}