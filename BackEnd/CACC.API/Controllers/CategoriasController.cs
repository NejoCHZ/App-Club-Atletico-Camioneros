using CACC.API.DTOs;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CACC.API.Security;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/categorias")]
    [Authorize(Roles = AppRoles.LecturaDeportiva)]
    public class CategoriasController : ControllerBase
    {
        private readonly ICategoriaDao _categoriaDao;
        private readonly ICurrentUserAccess _access;

        public CategoriasController(ICategoriaDao categoriaDao, ICurrentUserAccess access)
        {
            _categoriaDao = categoriaDao;
            _access = access;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategorias()
        {
            var categoriasConConteo = await _categoriaDao.ObtenerTodasConConteoAsync();

            if (_access.IsCategoryScoped)
            {
                categoriasConConteo = categoriasConConteo.Where(c => _access.CategoriaIds.Contains(c.IdCategoria));
            }

            var response = categoriasConConteo.Select(c => new CategoriaResponseDto
            {
                IdCategoria = c.IdCategoria,
                NombreCategoria = c.NombreCategoria,
                Asociacion = c.Asociacion,
                CantidadJugadores = c.CantidadJugadores,
                CantidadStaff = c.CantidadStaff
            });

            return Ok(response);
        }

        [HttpGet("simple")]
        public async Task<IActionResult> GetCategoriasSimple()
        {
            var categorias = await _categoriaDao.ObtenerTodasAsync();
            if (_access.IsCategoryScoped)
            {
                categorias = categorias.Where(c => _access.CategoriaIds.Contains(c.IdCategoria));
            }
            return Ok(categorias);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoriaPorId(int id)
        {
            if (!_access.PuedeAccederCategoria(id)) return Forbid();
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
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> CrearCategoria([FromBody] CategoriaCreateUpdateDto dto)
        {
            var nombreNormalizado = CategoriaIdentity.NormalizeName(dto?.NombreCategoria);
            if (dto == null || string.IsNullOrWhiteSpace(nombreNormalizado))
            {
                return BadRequest(new { message = "El nombre de la categoría es obligatorio." });
            }

            try
            {
                int idNueva = await _categoriaDao.CrearAsync(nombreNormalizado, dto.Asociacion);
                return StatusCode(201, new { idCategoria = idNueva, nombreCategoria = nombreNormalizado, asociacion = dto.Asociacion });
            }
            catch (CategoriaDuplicadaException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> ActualizarCategoria(int id, [FromBody] CategoriaCreateUpdateDto dto)
        {
            var nombreNormalizado = CategoriaIdentity.NormalizeName(dto?.NombreCategoria);
            if (dto == null || string.IsNullOrWhiteSpace(nombreNormalizado))
            {
                return BadRequest(new { message = "El nombre de la categoría es obligatorio." });
            }

            try
            {
                bool actualizado = await _categoriaDao.ActualizarAsync(id, nombreNormalizado, dto.Asociacion);
                if (!actualizado)
                {
                    return NotFound(new { message = $"Categoría con ID {id} no encontrada." });
                }

                return Ok(new { message = "Categoría actualizada con éxito." });
            }
            catch (CategoriaDuplicadaException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> EliminarCategoria(int id)
        {
            bool ok = await _categoriaDao.EliminarAsync(id);
            if (!ok)
            {
                return NotFound(new { message = $"Categoría con ID {id} no encontrada para eliminar." });
            }

            return Ok(new { message = "Categoría y sus asignaciones eliminadas con éxito." });
        }

        // ==========================================
        // ENDPOINTS: PLANTEL DE JUGADORES
        // ==========================================

        [HttpGet("{id}/jugadores")]
        public async Task<IActionResult> GetJugadoresPlantel(int id)
        {
            if (!_access.PuedeAccederCategoria(id)) return Forbid();
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
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.Coordinador)]
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
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.Coordinador)]
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
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.Coordinador)]
        public async Task<IActionResult> QuitarJugador(int id, int idJugador)
        {
            await _categoriaDao.QuitarJugadorAsync(id, idJugador);
            return Ok(new { message = "Jugador desvinculado de la categoría." });
        }

        // ==========================================
        // ENDPOINTS: CUERPO TÉCNICO (DT / PF)
        // ==========================================

        [HttpGet("{id}/staff")]
        public async Task<IActionResult> GetStaffPlantel(int id)
        {
            if (!_access.PuedeAccederCategoria(id)) return Forbid();
            var staff = await _categoriaDao.ObtenerStaffPorCategoriaAsync(id);

            var response = staff.Select(s => new StaffPlantelDto
            {
                IdStaff = s.IdStaff,
                NombreCompleto = s.NombreCompleto,
                Dni = s.Dni,
                Rol = s.Rol,
                Email = s.Email
            });

            return Ok(response);
        }

        [HttpGet("{id}/staff-disponibles")]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> GetStaffDisponibles(int id, [FromQuery] string? q)
        {
            var disponibles = await _categoriaDao.ObtenerStaffDisponibleAsync(id, q);

            var response = disponibles.Select(s => new StaffPlantelDto
            {
                IdStaff = s.IdStaff,
                NombreCompleto = s.NombreCompleto,
                Dni = s.Dni,
                Rol = s.Rol,
                Email = s.Email
            });

            return Ok(response);
        }

        [HttpPost("{id}/staff")]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> AsignarStaff(int id, [FromBody] AsignarStaffCategoriaDto dto)
        {
            if (dto == null || dto.IdStaff <= 0)
            {
                return BadRequest(new { message = "Debe especificar un miembro del staff válido." });
            }

            await _categoriaDao.AsignarStaffAsync(id, dto.IdStaff);
            return Ok(new { message = "Miembro del cuerpo técnico asignado a la categoría exitosamente." });
        }

        [HttpDelete("{id}/staff/{idStaff}")]
        [Authorize(Roles = AppRoles.Administradores)]
        public async Task<IActionResult> QuitarStaff(int id, int idStaff)
        {
            await _categoriaDao.QuitarStaffAsync(id, idStaff);
            return Ok(new { message = "Miembro del cuerpo técnico desvinculado de la categoría." });
        }

        // ==========================================
        // ENDPOINTS: HISTORIAL DE PARTIDOS
        // ==========================================

        [HttpGet("{id}/partidos")]
        public async Task<IActionResult> GetPartidos(int id)
        {
            if (!_access.PuedeAccederCategoria(id)) return Forbid();
            var partidos = await _categoriaDao.ObtenerPartidosPorCategoriaAsync(id);
            var response = partidos.Select(p => new PartidoResponseDto
            {
                IdPartido = p.IdPartido,
                IdCategoria = p.IdCategoria,
                Categoria = p.Categoria,
                Fecha = p.Fecha,
                Rival = p.Rival,
                Resultado = p.Resultado,
                Condicion = p.Condicion
            });
            return Ok(response);
        }

        [HttpPost("{id}/partidos")]
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.DirectorTecnico)]
        public async Task<IActionResult> CrearPartido(int id, [FromBody] PartidoCreateDto dto)
        {
            if (!_access.PuedeAccederCategoria(id)) return Forbid();

            if (dto == null || string.IsNullOrWhiteSpace(dto.Rival) || string.IsNullOrWhiteSpace(dto.Resultado) || string.IsNullOrWhiteSpace(dto.FechaPartido))
            {
                return BadRequest(new { message = "Fecha, rival y resultado son obligatorios." });
            }

            if (!DateTime.TryParse(dto.FechaPartido, out var fecha))
            {
                return BadRequest(new { message = "Formato de fecha inválido." });
            }

            var errorParticipaciones = ValidarParticipaciones(dto.JugadoresMinutos);
            if (errorParticipaciones != null)
            {
                return BadRequest(new { message = errorParticipaciones });
            }

            if (!await JugadoresPertenecenCategoriaAsync(id, dto.JugadoresMinutos))
            {
                return BadRequest(new { message = "Todos los jugadores del partido deben pertenecer a la categoría." });
            }

            var partidoAlta = new PartidoAlta
            {
                IdCategoria = id,
                FechaPartido = fecha,
                Rival = dto.Rival.Trim(),
                CondicionLocalia = dto.CondicionLocalia.Trim(),
                Resultado = dto.Resultado.Trim(),
                Observaciones = dto.Observaciones?.Trim(),
                JugadoresMinutos = dto.JugadoresMinutos?.Select(jm => new JugadorMinutoAlta
                {
                    IdJugador = jm.IdJugador,
                    MinutosJugados = jm.MinutosJugados
                }).ToList() ?? new List<JugadorMinutoAlta>()
            };

            try
            {
                int nuevoId = await _categoriaDao.RegistrarPartidoAsync(partidoAlta);
                return StatusCode(201, new { idPartido = nuevoId, message = "Partido registrado con éxito." });
            }
            catch (PartidoDuplicadoException)
            {
                return StatusCode(409, new { message = "Ya existe un partido para la misma categoría, fecha, rival y condición." });
            }
            catch (ParticipacionPartidoDuplicadaException ex)
            {
                return StatusCode(409, new { message = ex.Message });
            }
            catch (ParticipacionPartidoInvalidaException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpGet("{id}/partidos/{idPartido}")]
        public async Task<IActionResult> GetPartidoPorId(int id, int idPartido)
        {
            if (!_access.PuedeAccederCategoria(id)) return Forbid();
            var p = await _categoriaDao.ObtenerPartidoPorIdAsync(idPartido);
            if (p == null || p.IdCategoria != id)
                return NotFound(new { message = $"Partido con ID {idPartido} no encontrado." });

            return Ok(p);
        }

        [HttpPut("{id}/partidos/{idPartido}")]
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.DirectorTecnico)]
        public async Task<IActionResult> ActualizarPartido(int id, int idPartido, [FromBody] PartidoCreateDto dto)
        {
            var partidoActual = await _categoriaDao.ObtenerPartidoPorIdAsync(idPartido);
            if (partidoActual == null)
                return NotFound(new { message = $"Partido con ID {idPartido} no encontrado." });
            if (!_access.PuedeAccederCategoria(partidoActual.IdCategoria)) return Forbid();
            if (partidoActual.IdCategoria != id)
                return NotFound(new { message = $"Partido con ID {idPartido} no encontrado." });

            if (dto == null || string.IsNullOrWhiteSpace(dto.Rival) || string.IsNullOrWhiteSpace(dto.Resultado) || string.IsNullOrWhiteSpace(dto.FechaPartido))
            {
                return BadRequest(new { message = "Fecha, rival y resultado son obligatorios." });
            }

            if (!DateTime.TryParse(dto.FechaPartido, out var fecha))
            {
                return BadRequest(new { message = "Formato de fecha inválido." });
            }

            var errorParticipaciones = ValidarParticipaciones(dto.JugadoresMinutos);
            if (errorParticipaciones != null)
            {
                return BadRequest(new { message = errorParticipaciones });
            }

            if (!await JugadoresPertenecenCategoriaAsync(partidoActual.IdCategoria, dto.JugadoresMinutos))
            {
                return BadRequest(new { message = "Todos los jugadores del partido deben pertenecer a la categoría." });
            }

            var partidoEdicion = new PartidoEdicion
            {
                IdPartido = idPartido,
                IdCategoria = id,
                FechaPartido = fecha,
                Rival = dto.Rival.Trim(),
                CondicionLocalia = dto.CondicionLocalia.Trim(),
                Resultado = dto.Resultado.Trim(),
                Observaciones = dto.Observaciones?.Trim(),
                JugadoresMinutos = dto.JugadoresMinutos?.Select(jm => new JugadorMinutoAlta
                {
                    IdJugador = jm.IdJugador,
                    MinutosJugados = jm.MinutosJugados
                }).ToList() ?? new List<JugadorMinutoAlta>()
            };

            try
            {
                bool ok = await _categoriaDao.ActualizarPartidoAsync(partidoEdicion);
                if (!ok)
                    return NotFound(new { message = "No se pudo actualizar el partido especificado." });

                return Ok(new { message = "Partido actualizado con éxito." });
            }
            catch (PartidoDuplicadoException)
            {
                return StatusCode(409, new { message = "Ya existe un partido para la misma categoría, fecha, rival y condición." });
            }
            catch (ParticipacionPartidoDuplicadaException ex)
            {
                return StatusCode(409, new { message = ex.Message });
            }
            catch (ParticipacionPartidoInvalidaException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}/partidos/{idPartido}")]
        [Authorize(Roles = AppRoles.Administradores + "," + AppRoles.DirectorTecnico)]
        public async Task<IActionResult> EliminarPartido(int id, int idPartido)
        {
            var partidoActual = await _categoriaDao.ObtenerPartidoPorIdAsync(idPartido);
            if (partidoActual == null)
                return NotFound(new { message = $"Partido con ID {idPartido} no encontrado." });
            if (!_access.PuedeAccederCategoria(partidoActual.IdCategoria)) return Forbid();
            if (partidoActual.IdCategoria != id)
                return NotFound(new { message = $"Partido con ID {idPartido} no encontrado." });

            bool ok = await _categoriaDao.EliminarPartidoAsync(idPartido);
            if (!ok)
                return NotFound(new { message = "No se encontró el partido a eliminar." });

            return Ok(new { message = "Partido eliminado exitosamente." });
        }

        private async Task<bool> JugadoresPertenecenCategoriaAsync(int idCategoria, IEnumerable<JugadorMinutoDto>? jugadores)
        {
            var idsJugadores = jugadores?
                .Select(jugador => jugador.IdJugador)
                .Distinct()
                .ToArray() ?? Array.Empty<int>();

            if (idsJugadores.Length == 0) return true;

            var plantel = await _categoriaDao.ObtenerJugadoresPorCategoriaAsync(idCategoria);
            var idsPlantel = plantel.Select(jugador => jugador.IdJugador).ToHashSet();
            return idsJugadores.All(idsPlantel.Contains);
        }

        private static string? ValidarParticipaciones(IEnumerable<JugadorMinutoDto>? jugadores)
        {
            return PartidoParticipationRules.Validate(jugadores?.Select(jugador => new JugadorMinutoAlta
            {
                IdJugador = jugador.IdJugador,
                MinutosJugados = jugador.MinutosJugados
            }));
        }
    }
}
