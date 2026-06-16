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

            // Write text to a temporary file in UTF-8 without BOM to avoid argument length, character encoding, and edge-tts BOM parsing errors on Windows
            string tempTextFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.txt");
            await File.WriteAllTextAsync(tempTextFile, text, new UTF8Encoding(false));

            Console.WriteLine($"[TTSService] voice={voice}, tempFile={tempTextFile}, filePath={filePath}, textLength={text.Length}");
            Console.WriteLine($"[TTSService] fileExists={File.Exists(tempTextFile)}, content='{await File.ReadAllTextAsync(tempTextFile)}'");

            var processInfo = new ProcessStartInfo
            {
                FileName = "edge-tts",
                Arguments = $"--voice {voice} --file \"{tempTextFile}\" --write-media \"{filePath}\"",
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
            finally
            {
                try
                {
                    if (File.Exists(tempTextFile))
                    {
                        File.Delete(tempTextFile);
                    }
                }
                catch
                {
                    // Ignore temp file deletion errors
                }
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
                "fr" => "fr-FR-DeniseNeural",
                "es" => "es-ES-ElviraNeural",
                "de" => "de-DE-KatjaNeural",
                "it" => "it-IT-ElsaNeural",
                "ru" => "ru-RU-SvetlanaNeural",
                "pt" => "pt-PT-RaquelNeural",
                "th" => "th-TH-NiwatNeural",
                "id" => "id-ID-GadisNeural",
                "ms" => "ms-MY-YasminNeural",
                "hi" => "hi-IN-SwaraNeural",
                "ar" => "ar-EG-SalmaNeural",
                "nl" => "nl-NL-ColetteNeural",
                "pl" => "pl-PL-ZofiaNeural",
                "tr" => "tr-TR-EmelNeural",
                "sv" => "sv-SE-SofieNeural",
                "fil" => "fil-PH-BlessicaNeural",
                "km" => "km-KH-SreymomNeural",
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
