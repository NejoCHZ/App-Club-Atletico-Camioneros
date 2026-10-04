using CACC.API.DTOs;
using CACC.DAO;
using CACC.Entities;
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
            IEnumerable<JugadorDetalle> jugadoresDb;

            if (categoriaId.HasValue && categoriaId.Value > 0)
            {
                jugadoresDb = await _jugadorDao.ObtenerPorCategoriaAsync(categoriaId.Value);
            }
            else
            {
                jugadoresDb = await _jugadorDao.ObtenerTodosAsync();
            }

            var response = jugadoresDb.Select(j => new JugadorResponseDto
            {
                IdJugador = j.IdJugador,
                Nombre = j.Nombre,
                Apellido = j.Apellido,
                Dni = j.Dni,
                Genero = j.Genero,
                FechaDeNacimiento = j.FechaDeNacimiento,
                Domicilio = j.Domicilio,
                IdCategoria = j.IdCategoria,
                NombreCategoria = j.NombreCategoria,
                ClubOrigen = j.ClubOrigen,
                FichaMedicaLiga = j.FichaMedicaLiga,
                PosicionCancha = j.PosicionCancha,
                Peso = j.Peso,
                Altura = j.Altura,
                PieHabil = j.PieHabil,
                EstadoCuota = j.EstadoCuota,
                Tutor = j.Tutor == null ? null : new TutorDto
                {
                    Nombre = j.Tutor.Nombre,
                    Apellido = j.Tutor.Apellido,
                    Telefono = j.Tutor.Telefono ?? string.Empty,
                    Email = j.Tutor.Email,
                    Parentesco = j.Tutor.Parentesco
                }
            });

            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJugadorPorId(int id)
        {
            var j = await _jugadorDao.ObtenerPorIdAsync(id);
            if (j == null)
            {
                return NotFound(new { message = "Jugador no encontrado." });
            }

            var response = new JugadorResponseDto
            {
                IdJugador = j.IdJugador,
                Nombre = j.Nombre,
                Apellido = j.Apellido,
                Dni = j.Dni,
                Genero = j.Genero,
                FechaDeNacimiento = j.FechaDeNacimiento,
                Domicilio = j.Domicilio,
                IdCategoria = j.IdCategoria,
                NombreCategoria = j.NombreCategoria,
                ClubOrigen = j.ClubOrigen,
                FichaMedicaLiga = j.FichaMedicaLiga,
                PosicionCancha = j.PosicionCancha,
                Peso = j.Peso,
                Altura = j.Altura,
                PieHabil = j.PieHabil,
                EstadoCuota = j.EstadoCuota,
                Tutor = j.Tutor == null ? null : new TutorDto
                {
                    Nombre = j.Tutor.Nombre,
                    Apellido = j.Tutor.Apellido,
                    Telefono = j.Tutor.Telefono ?? string.Empty,
                    Email = j.Tutor.Email,
                    Parentesco = j.Tutor.Parentesco
                },
                FichaMedica = j.FichaMedica == null ? null : new FichaMedicaDto
                {
                    GrupoSanguineo = j.FichaMedica.GrupoSanguineo,
                    Patologias = j.FichaMedica.Patologias,
                    HistorialLesiones = j.FichaMedica.HistorialLesiones,
                    Observaciones = j.FichaMedica.Observaciones
                },
                Partidos = j.Partidos?.Select(p => new PartidoDto
                {
                    Fecha = p.Fecha,
                    Rival = p.Rival,
                    Resultado = p.Resultado,
                    Condicion = p.Condicion,
                    Minutos = p.Minutos
                }).ToList() ?? new List<PartidoDto>()
            };

            return Ok(response);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Tesorero")]
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
                    Genero = dto.Genero,
                    FechaDeNacimiento = dto.FechaDeNacimiento,
                    Domicilio = dto.Domicilio,
                    IdCategoria = dto.IdCategoria,
                    ClubOrigen = dto.ClubOrigen,
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
        [Authorize(Roles = "Tesorero")]
        public async Task<IActionResult> CrearJugador([FromBody] JugadorCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Dni))
            {
                return BadRequest(new { message = "El nombre y el DNI son obligatorios." });
            }

            try
            {
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
                        Email = dto.Tutor.Email,
                        Parentesco = dto.Tutor.Parentesco
                    }
                };

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

        [HttpDelete("{id}")]
        [Authorize(Roles = "Tesorero")]
        public async Task<IActionResult> EliminarJugador(int id)
        {
            try
            {
                var eliminado = await _jugadorDao.EliminarAsync(id);
                if (!eliminado)
                {
                    return NotFound(new { message = $"Jugador con ID {id} no encontrado." });
                }

                return Ok(new { message = "Jugador eliminado correctamente del club." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno al eliminar el jugador.", details = ex.Message });
            }
        }

        [HttpPut("{id}/tutor")]
        [Authorize(Roles = "Tesorero")]
        public async Task<IActionResult> GuardarTutor(int id, [FromBody] TutorDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Telefono))
            {
                return BadRequest(new { message = "Nombre y teléfono del tutor son requeridos." });
            }

            try
            {
                var guardado = await _jugadorDao.GuardarTutorAsync(
                    id,
                    dto.Nombre,
                    dto.Apellido,
                    dto.Parentesco ?? "Padre",
                    dto.Telefono,
                    dto.Email
                );

                if (!guardado)
                {
                    return NotFound(new { message = $"Jugador con ID {id} no encontrado." });
                }

                return Ok(new { message = "Datos del tutor guardados correctamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno al guardar los datos del tutor.", details = ex.Message });
            }
        }
    }
}