using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using System.Threading.Tasks;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/admin/languages")]
    [Authorize(Roles = "admin")]
    public class LanguageController : ControllerBase
    {
        private readonly AppDbContext _context;
        public LanguageController(AppDbContext context) => _context = context;

        [HttpGet]
        [AllowAnonymous] // Cho phép client lấy danh sách ngôn ngữ để render UI
        public async Task<IActionResult> GetLanguages()
        {
            var langs = await _context.Languages.ToListAsync();
            return Ok(langs);
        }

        [HttpPut("{code}/status")]
        public async Task<IActionResult> ToggleStatus(string code, [FromBody] bool isActive)
        {
            var lang = await _context.Languages.FindAsync(code);
            if (lang == null) return NotFound();
            lang.IsActive = isActive;
            await _context.SaveChangesAsync();
            return Ok(lang);
        }

        [HttpPut("{code}/default")]
        public async Task<IActionResult> SetDefault(string code)
        {
            var lang = await _context.Languages.FindAsync(code);
            if (lang == null) return NotFound();

            var all = await _context.Languages.ToListAsync();
            foreach (var l in all) l.IsDefault = (l.Code == code);
            
            await _context.SaveChangesAsync();
            return Ok(lang);
        }
    }
}
