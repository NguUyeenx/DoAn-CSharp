using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/pois/{poiId:int}/menu")]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMenu(int poiId, [FromQuery] string lang = "en")
        {
            var menu = await _menuService.GetMenuByPOIAsync(poiId, lang);
            return Ok(menu);
        }
    }
}
