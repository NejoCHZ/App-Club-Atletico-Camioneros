using CACC.DAO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/staff")]
    [Authorize(Roles = "Tesorero,Coordinador")] // Solo Tesorero y Coordinador pueden ver el listado de staff
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
            var staff = await _staffDao.ObtenerStaffGeneralAsync();
            return Ok(staff);
        }
    }
}