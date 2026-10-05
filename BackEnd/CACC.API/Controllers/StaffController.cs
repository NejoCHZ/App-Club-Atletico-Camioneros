using System;
using System.Linq;
using System.Threading.Tasks;
using CACC.API.DTOs;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/staff")]
    [Authorize]
    public class StaffController : ControllerBase
    {
        private readonly IStaffDao _staffDao;

        public StaffController(IStaffDao staffDao)
        {
            _staffDao = staffDao;
        }

        [HttpGet]
        public async Task<IActionResult> GetStaff()
        {
            var staffDb = await _staffDao.ObtenerTodosAsync();

            var response = staffDb.Select(s => new StaffResponseDto
            {
                IdStaff = s.IdStaff,
                IdUsuario = s.IdUsuario,
                Nombre = s.Nombre,
                Apellido = s.Apellido,
                NombreCompleto = $"{s.Nombre} {s.Apellido}".Trim(),
                Dni = s.Dni,
                FechaDeNacimiento = s.FechaDeNacimiento,
                Domicilio = s.Domicilio,
                Email = s.Email,
                IdRol = s.IdRol,
                Rol = s.Rol,
                IdCategoriaAsignada = s.IdCategoriaAsignada,
                CategoriaAsignada = s.CategoriaAsignada,
                Activo = s.Activo
            });

            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStaffPorId(int id)
        {
            var s = await _staffDao.ObtenerPorIdAsync(id);
            if (s == null)
            {
                return NotFound(new { message = $"Colaborador con ID {id} no encontrado." });
            }

            var response = new StaffResponseDto
            {
                IdStaff = s.IdStaff,
                IdUsuario = s.IdUsuario,
                Nombre = s.Nombre,
                Apellido = s.Apellido,
                NombreCompleto = $"{s.Nombre} {s.Apellido}".Trim(),
                Dni = s.Dni,
                FechaDeNacimiento = s.FechaDeNacimiento,
                Domicilio = s.Domicilio,
                Email = s.Email,
                IdRol = s.IdRol,
                Rol = s.Rol,
                IdCategoriaAsignada = s.IdCategoriaAsignada,
                CategoriaAsignada = s.CategoriaAsignada,
                Activo = s.Activo
            };

            return Ok(response);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador (Tesorero),Tesorero")]
        public async Task<IActionResult> CrearStaff([FromBody] StaffCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Dni) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Contrasenia))
            {
                return BadRequest(new { message = "Nombre, DNI, Email y Contraseña son obligatorios." });
            }

            try
            {
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasenia);

                int idRol = dto.IdRol ?? 4;
                if (!string.IsNullOrWhiteSpace(dto.Rol))
                {
                    var r = dto.Rol.ToUpper();
                    if (r.Contains("TESORERO") || r.Contains("ADMINISTRADOR")) idRol = 1;
                    else if (r.Contains("ADMINISTRATIVO")) idRol = 2;
                    else if (r.Contains("MÉDICO") || r.Contains("MEDICO")) idRol = 3;
                    else if (r.Contains("TÉCNICO") || r.Contains("TECNICO") || r.Contains("DT")) idRol = 4;
                    else if (r.Contains("QR")) idRol = 5;
                    else if (r.Contains("FÍSICO") || r.Contains("FISICO") || r.Contains("PF")) idRol = 6;
                    else if (r.Contains("COORDINADOR")) idRol = 7;
                }

                DateTime? fecha = null;
                if (!string.IsNullOrWhiteSpace(dto.FechaNacimiento))
                {
                    if (DateTime.TryParse(dto.FechaNacimiento, out var f))
                        fecha = f;
                }

                var staffAlta = new StaffAlta
                {
                    Nombre = dto.Nombre.Trim(),
                    Apellido = dto.Apellido.Trim(),
                    Dni = dto.Dni.Trim(),
                    FechaNacimiento = fecha,
                    Genero = dto.Genero,
                    Domicilio = dto.Domicilio,
                    Email = dto.Email.Trim(),
                    ContraseniaHasheada = passwordHash,
                    IdRol = idRol,
                    IdCategoria = dto.IdCategoria
                };

                int nuevoIdStaff = await _staffDao.CrearAsync(staffAlta);

                return StatusCode(201, new
                {
                    message = "Colaborador de staff registrado con éxito.",
                    idStaff = nuevoIdStaff,
                    nombreCompleto = $"{dto.Nombre} {dto.Apellido}".Trim()
                });
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                return StatusCode(409, new { message = "Ya existe un registro con ese DNI o Email en el sistema." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno al crear el staff.", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador (Tesorero),Tesorero")]
        public async Task<IActionResult> ActualizarStaff(int id, [FromBody] StaffUpdateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Dni) || string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Nombre, DNI y Email son campos obligatorios." });
            }

            try
            {
                int idRol = dto.IdRol ?? 4;
                if (!string.IsNullOrWhiteSpace(dto.Rol))
                {
                    var r = dto.Rol.ToUpper();
                    if (r.Contains("TESORERO") || r.Contains("ADMINISTRADOR")) idRol = 1;
                    else if (r.Contains("ADMINISTRATIVO")) idRol = 2;
                    else if (r.Contains("MÉDICO") || r.Contains("MEDICO")) idRol = 3;
                    else if (r.Contains("TÉCNICO") || r.Contains("TECNICO") || r.Contains("DT")) idRol = 4;
                    else if (r.Contains("QR")) idRol = 5;
                    else if (r.Contains("FÍSICO") || r.Contains("FISICO") || r.Contains("PF")) idRol = 6;
                    else if (r.Contains("COORDINADOR")) idRol = 7;
                }

                DateTime? fecha = null;
                if (!string.IsNullOrWhiteSpace(dto.FechaNacimiento))
                {
                    if (DateTime.TryParse(dto.FechaNacimiento, out var f))
                        fecha = f;
                }

                string? passwordHash = null;
                if (!string.IsNullOrWhiteSpace(dto.Contrasenia))
                {
                    passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasenia.Trim());
                }

                var staffEdicion = new StaffEdicion
                {
                    IdStaff = id,
                    Nombre = dto.Nombre.Trim(),
                    Apellido = dto.Apellido.Trim(),
                    Dni = dto.Dni.Trim(),
                    FechaNacimiento = fecha,
                    Domicilio = dto.Domicilio,
                    Genero = dto.Genero,
                    Email = dto.Email.Trim(),
                    ContraseniaHasheada = passwordHash,
                    IdRol = idRol,
                    IdCategoria = dto.IdCategoria,
                    Activo = dto.Activo
                };

                bool actualizado = await _staffDao.ActualizarAsync(staffEdicion);

                if (!actualizado)
                {
                    return NotFound(new { message = $"No se encontró el colaborador con ID {id} para actualizar." });
                }

                return Ok(new { message = "Ficha de trabajador actualizada con éxito." });
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                return StatusCode(409, new { message = "Conflicto: Ya existe otro registro con ese DNI o Email en el club." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno al actualizar la ficha del staff.", details = ex.Message });
            }
        }
    }
}