using CACC.API.DTOs;
using CACC.API.Utils;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using CACC.API.Security;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/jugadores")]
    [Authorize(Roles = AppRoles.LecturaDeportiva)]
    public class JugadoresController : ControllerBase
    {
        private readonly IJugadorDao _jugadorDao;
        private readonly ICurrentUserAccess _access;

        public JugadoresController(IJugadorDao jugadorDao, ICurrentUserAccess access)
        {
            _jugadorDao = jugadorDao;
            _access = access;
        }

        [HttpGet]
        public async Task<IActionResult> GetJugadores([FromQuery] int? categoriaId)
        {
            IEnumerable<JugadorDetalle> jugadoresDb;

            if (_access.IsCategoryScoped)
            {
                if (categoriaId.HasValue && categoriaId.Value > 0)
                {
                    if (!_access.PuedeAccederCategoria(categoriaId.Value))
                    {
                        return Forbid();
                    }

                    jugadoresDb = await _jugadorDao.ObtenerPorCategoriaAsync(categoriaId.Value);
                }
                else
                {
                    var jugadoresAsignados = new List<JugadorDetalle>();
                    foreach (var idCategoria in _access.CategoriaIds)
                    {
                        jugadoresAsignados.AddRange(await _jugadorDao.ObtenerPorCategoriaAsync(idCategoria));
                    }

                    jugadoresDb = jugadoresAsignados.DistinctBy(j => j.IdJugador);
                }
            }
            else if (categoriaId.HasValue && categoriaId.Value > 0)
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
                    Dni = j.Tutor.Dni,
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

            if (!_access.PuedeAccederAlgunaCategoria(j.CategoriasIds))
            {
                return Forbid();
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
                    Dni = j.Tutor.Dni,
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
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> ActualizarPerfil(int id, [FromBody] JugadorUpdateDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Datos de actualización inválidos." });
            }

            if (!PlayerPositionNormalizer.TryNormalize(dto.Posicion, out var posicionNormalizada))
            {
                return BadRequest(new { message = "La posición debe ser Arquero, Defensor, Mediocampista o Delantero." });
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
                    PosicionCancha = posicionNormalizada,
                    Peso = dto.Peso,
                    Altura = dto.Altura,
                    PieHabil = dto.PieHabil,
                    FichaMedicaLiga = dto.AptoFisico,
                    Tutor = dto.Tutor == null ? null : new TutorDetalle
                    {
                        Dni = dto.Tutor.Dni,
                        Nombre = dto.Tutor.Nombre,
                        Apellido = dto.Tutor.Apellido,
                        Telefono = dto.Tutor.Telefono,
                        Email = dto.Tutor.Email,
                        Parentesco = dto.Tutor.Parentesco
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

        [HttpPut("{id}/datos-fisicos")]
        [Authorize(Roles = AppRoles.EscrituraMedica)]
        public async Task<IActionResult> ActualizarDatosFisicos(int id, [FromBody] JugadorDatosFisicosUpdateDto dto)
        {
            if (dto.Peso is < 0 or > 500)
            {
                return BadRequest(new { message = "El peso debe estar entre 0 y 500 kg." });
            }

            if (dto.Altura is < 0 or > 3)
            {
                return BadRequest(new { message = "La altura debe estar entre 0 y 3 metros." });
            }

            var pieHabil = string.IsNullOrWhiteSpace(dto.PieHabil) ? null : dto.PieHabil.Trim();
            var actualizado = await _jugadorDao.ActualizarDatosFisicosAsync(id, dto.Peso, dto.Altura, pieHabil);
            return actualizado
                ? Ok(new { message = "Datos físicos actualizados correctamente." })
                : NotFound(new { message = $"Jugador con ID {id} no encontrado." });
        }

        [HttpPut("{id}/datos-medicos")]
        [Authorize(Roles = AppRoles.EscrituraMedica)]
        public async Task<IActionResult> ActualizarDatosMedicos(int id, [FromBody] JugadorDatosMedicosUpdateDto dto)
        {
            if (dto.Peso is < 0 or > 500)
            {
                return BadRequest(new { message = "El peso debe estar entre 0 y 500 kg." });
            }

            if (dto.Altura is < 0 or > 3)
            {
                return BadRequest(new { message = "La altura debe estar entre 0 y 3 metros." });
            }

            var ficha = new FichaMedica
            {
                IdJugador = id,
                GrupoSanguineo = string.IsNullOrWhiteSpace(dto.GrupoSanguineo) ? null : dto.GrupoSanguineo.Trim(),
                AntecedentesSalud = dto.AntecedentesSalud,
                HistorialLesiones = dto.HistorialLesiones,
                Observaciones = dto.Observaciones,
            };
            var pieHabil = string.IsNullOrWhiteSpace(dto.PieHabil) ? null : dto.PieHabil.Trim();
            var actualizado = await _jugadorDao.ActualizarDatosMedicosAsync(id, dto.Peso, dto.Altura, pieHabil, ficha);
            return actualizado
                ? Ok(new { message = "Datos médicos actualizados correctamente." })
                : NotFound(new { message = $"Jugador con ID {id} no encontrado." });
        }

        [HttpPost]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> CrearJugador([FromBody] JugadorCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Dni))
            {
                return BadRequest(new { message = "El nombre y el DNI son obligatorios." });
            }

            if (!PlayerPositionNormalizer.TryNormalize(dto.Posicion, out var posicionNormalizada))
            {
                return BadRequest(new { message = "La posición debe ser Arquero, Defensor, Mediocampista o Delantero." });
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
                    Posicion = posicionNormalizada,
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
        [Authorize(Roles = AppRoles.Administradores)]
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
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> GuardarTutor(int id, [FromBody] GuardarTutorDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Dni) || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Apellido) || string.IsNullOrWhiteSpace(dto.Telefono))
            {
                return BadRequest(new { message = "DNI, nombre, apellido y teléfono del tutor son obligatorios." });
            }

            bool ok = await _jugadorDao.GuardarTutorAsync(
                id,
                dto.Dni.Trim(),
                dto.Nombre.Trim(),
                dto.Apellido.Trim(),
                string.IsNullOrWhiteSpace(dto.Parentesco) ? "Padre" : dto.Parentesco.Trim(),
                dto.Telefono.Trim(),
                dto.Email?.Trim()
            );

            if (!ok)
            {
                return NotFound(new { message = $"Jugador con ID {id} no encontrado." });
            }

            return Ok(new { message = "Tutor guardado y vinculado con éxito." });
        }
        [HttpGet("tutores/{dni}")]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> BuscarTutorPorDni(string dni)
        {
            if (string.IsNullOrWhiteSpace(dni))
            {
                return BadRequest(new { message = "El DNI del tutor es obligatorio." });
            }

            var tutor = await _jugadorDao.BuscarTutorPorDniAsync(dni.Trim());
            if (tutor == null)
            {
                return NotFound(new { message = "No se encontró ningún tutor registrado con ese DNI." });
            }

            return Ok(new TutorDto
            {
                Dni = tutor.Dni,
                Nombre = tutor.Nombre,
                Apellido = tutor.Apellido,
                Telefono = tutor.Telefono,
                Email = tutor.Email,
                Parentesco = tutor.Parentesco
            });
        }
    }
}
