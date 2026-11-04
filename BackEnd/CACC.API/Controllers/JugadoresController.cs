using CACC.API.DTOs;
using CACC.API.Services;
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
        private readonly IEstadoDeudaClient _estadoDeuda;

        public JugadoresController(IJugadorDao jugadorDao, ICurrentUserAccess access, IEstadoDeudaClient estadoDeuda)
        {
            _jugadorDao = jugadorDao;
            _access = access;
            _estadoDeuda = estadoDeuda;
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

            // El estado de cuota lo informa el Portal Administrativo (una sola consulta para todo el listado).
            var lista = jugadoresDb.ToList();
            var estados = await _estadoDeuda.PorLoteAsync(lista.Select(j => j.Dni), HttpContext.RequestAborted);
            foreach (var j in lista)
            {
                j.EstadoCuota = EstadoCuotaTexto.De(estados is not null && estados.TryGetValue(j.Dni, out var e) ? e : null);
            }

            var response = lista.Select(j => new JugadorResponseDto
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

            if (!_access.PuedeAccederAlgunaCategoria(j.CategoriasIds))
            {
                return Forbid();
            }

            var consulta = await _estadoDeuda.PorDniAsync(j.Dni, HttpContext.RequestAborted);
            j.EstadoCuota = EstadoCuotaTexto.De(consulta.Resultado == ResultadoConsulta.Ok ? consulta.Estado : null);

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
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> ActualizarPerfil(int id, [FromBody] JugadorUpdateDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Datos de actualización inválidos." });
            }

            // El género nunca queda vacío: de él sale el arancel que se le cobra. Si no viene, se conserva el que ya tiene.
            if (dto.Genero != null && dto.Genero != "Masculino" && dto.Genero != "Femenino")
            {
                return BadRequest(new { message = "El género debe ser Masculino o Femenino." });
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
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> CrearJugador([FromBody] JugadorCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Dni))
            {
                return BadRequest(new { message = "El nombre y el DNI son obligatorios." });
            }

            // De estos dos datos sale el arancel que se le cobra al jugador: la base tambien los exige.
            if (dto.Genero != "Masculino" && dto.Genero != "Femenino")
            {
                return BadRequest(new { message = "El género es obligatorio (Masculino o Femenino): sin él no se sabe qué arancel cobrarle." });
            }
            if (!int.TryParse(dto.Categoria, out int idCategoria) || idCategoria <= 0)
            {
                return BadRequest(new { message = "La categoría es obligatoria." });
            }

            try
            {
                var jugadorAlta = new JugadorAlta
                {
                    Dni = dto.Dni,
                    Nombre = dto.Nombre,
                    Apellido = dto.Apellido,
                    FechaNacimiento = dto.FechaNacimiento,
                    Genero = dto.Genero,
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

                // La inscripción y la cuota del mes las genera el Portal Administrativo (contrato v1), con sus reglas. El alta ya
                // quedó hecha: si esa llamada falla no se deshace ni se rechaza; la cuota sale con la próxima generación mensual
                // y la inscripción al registrar el primer pago.
                var cargos = await _estadoDeuda.GenerarCargosDeAltaAsync(nuevoId, HttpContext.RequestAborted);
                bool cargosGenerados = cargos.Estado == EstadoCargosAlta.Generados;

                return StatusCode(201, new
                {
                    message = "Jugador creado con éxito.",
                    idJugador = nuevoId,
                    dni = dto.Dni,
                    nombre = dto.Nombre,
                    apellido = dto.Apellido,
                    cargosGenerados,
                    avisoCargos = cargosGenerados
                        ? null
                        : "El jugador se guardó, pero el Portal Administrativo todavía no generó su inscripción y su cuota. La cuota aparece en la próxima generación mensual y la inscripción al registrar el primer pago."
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
                var resultado = await _jugadorDao.EliminarAsync(id);
                return resultado switch
                {
                    ResultadoBajaJugador.NoEncontrado => NotFound(new { message = $"Jugador con ID {id} no encontrado." }),
                    ResultadoBajaJugador.Eliminado => Ok(new { message = "Jugador eliminado. No tenía pagos ni otro historial, así que se borró por completo y su DNI quedó libre.", eliminado = true }),
                    _ => Ok(new { message = "Jugador dado de baja correctamente. Su historial se conserva.", eliminado = false })
                };
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
