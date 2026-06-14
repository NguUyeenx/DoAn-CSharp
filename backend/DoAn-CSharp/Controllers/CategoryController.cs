using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using System.Threading.Tasks;
using System.Linq;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoryController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>Lấy danh sách tất cả danh mục hoạt động</summary>
        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var dbCategories = await _context.POICategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ToListAsync();

            var result = dbCategories.Select(c => new
            {
                id = c.Slug,
                name = c.Name,
                nameEn = GetEnglishName(c.Slug)
            });

            return Ok(result);
        }

        private static string GetEnglishName(string slug)
        {
            return slug.ToLowerInvariant() switch
            {
                "seafood" => "Seafood",
                "restaurant" => "Restaurant",
                "bbq" => "BBQ & Hotpot",
                "vietnamese_food" => "Vietnamese Food",
                "cafe" => "Cafe & Dessert",
                _ => System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(slug.Replace("_", " ").Replace("-", " "))
            };
        }
    }
}
