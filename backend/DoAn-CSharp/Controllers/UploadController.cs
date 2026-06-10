using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class UploadController : ControllerBase
    {
        private readonly IUploadService _uploadService;

        public UploadController(IUploadService uploadService)
        {
            _uploadService = uploadService;
        }

        /// <summary>Upload ảnh địa điểm (Admin only)</summary>
        [HttpPost("image/poi")]
        public async Task<ActionResult<UploadResultDto>> UploadPoiImage(IFormFile file)
        {
            var result = await _uploadService.UploadImageAsync(file, "pois");
            return Ok(result);
        }

        /// <summary>Upload ảnh món ăn (Admin only)</summary>
        [HttpPost("image/menu")]
        public async Task<ActionResult<UploadResultDto>> UploadMenuImage(IFormFile file)
        {
            var result = await _uploadService.UploadImageAsync(file, "menu");
            return Ok(result);
        }

        /// <summary>Upload file audio thuyết minh (Admin only)</summary>
        [HttpPost("audio")]
        public async Task<ActionResult<UploadResultDto>> UploadAudio(IFormFile file)
        {
            var result = await _uploadService.UploadAudioAsync(file);
            return Ok(result);
        }

        /// <summary>Xóa file đã upload (Admin only)</summary>
        [HttpDelete]
        public async Task<IActionResult> DeleteFile([FromQuery] string filePath)
        {
            await _uploadService.DeleteFileAsync(filePath);
            return NoContent();
        }
    }
}
