using System;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;

namespace DoAn_CSharp.Services
{
    public class TTSService : ITTSService
    {
        private readonly IWebHostEnvironment _env;
        
        public TTSService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string> GenerateAudioAsync(string text, string languageCode, int poiId)
        {
            string voice = GetVoiceForLanguage(languageCode);
            string textHash = ComputeMd5Hash(text);
            string fileName = $"poi_{poiId}_{languageCode}_{textHash}.mp3";
            string uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "audio");
            
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }
            
            string filePath = Path.Combine(uploadDir, fileName);

            if (File.Exists(filePath) && new FileInfo(filePath).Length > 0)
            {
                return $"/audio/{fileName}";
            }

            var processInfo = new ProcessStartInfo
            {
                FileName = "edge-tts",
                Arguments = $"--voice {voice} --text \"{text.Replace("\"", "\\\"")}\" --write-media \"{filePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            try
            {
                using var process = Process.Start(processInfo);
                if (process != null)
                {
                    await process.WaitForExitAsync();
                    if (process.ExitCode != 0)
                    {
                        var error = await process.StandardError.ReadToEndAsync();
                        throw new Exception($"TTS Generation failed: {error}");
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Could not run edge-tts. Make sure it is installed. Error: {ex.Message}");
            }
            
            return $"/audio/{fileName}";
        }

        private string GetVoiceForLanguage(string langCode)
        {
            return langCode.ToLower() switch
            {
                "vi" => "vi-VN-HoaiMyNeural",
                "en" => "en-US-AriaNeural",
                "ja" => "ja-JP-NanamiNeural",
                "ko" => "ko-KR-SunHiNeural",
                "zh" => "zh-CN-XiaoxiaoNeural",
                _ => "en-US-AriaNeural"
            };
        }

        private string ComputeMd5Hash(string input)
        {
            using (var md5 = MD5.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(input);
                byte[] hashBytes = md5.ComputeHash(inputBytes);
                
                var sb = new StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    sb.Append(hashBytes[i].ToString("x2"));
                }
                return sb.ToString();
            }
        }
    }
}
