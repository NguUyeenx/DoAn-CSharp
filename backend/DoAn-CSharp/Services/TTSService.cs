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

        public static int GetMp3Duration(string filePath)
        {
            if (!System.IO.File.Exists(filePath)) return 0;
            try
            {
                using (var fs = System.IO.File.OpenRead(filePath))
                {
                    return (int)System.Math.Round(GetMp3Duration(fs));
                }
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"Error calculating MP3 duration for {filePath}: {ex.Message}");
                return 0;
            }
        }

        private static double GetMp3Duration(System.IO.Stream stream)
        {
            double duration = 0;
            byte[] buffer = new byte[4];
            
            int[] bitratesV1L3 = { 0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0 };
            int[] bitratesV2L3 = { 0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0 };
            int[] sampleRatesV1 = { 44100, 48000, 32000, 0 };
            int[] sampleRatesV2 = { 22050, 24000, 16000, 0 };
            int[] sampleRatesV25 = { 11025, 12000, 8000, 0 };

            long fileLength = stream.Length;
            if (fileLength < 10) return 0;
            
            // Read 3 bytes to check for ID3 tag
            int read = 0;
            while (read < 3)
            {
                int r = stream.Read(buffer, read, 3 - read);
                if (r == 0) break;
                read += r;
            }

            if (read == 3 && buffer[0] == 0x49 && buffer[1] == 0x44 && buffer[2] == 0x33)
            {
                byte[] id3Header = new byte[7];
                int id3Read = 0;
                while (id3Read < 7)
                {
                    int r = stream.Read(id3Header, id3Read, 7 - id3Read);
                    if (r == 0) break;
                    id3Read += r;
                }
                int size = ((id3Header[3] & 0x7F) << 21) |
                           ((id3Header[4] & 0x7F) << 14) |
                           ((id3Header[5] & 0x7F) << 7) |
                           (id3Header[6] & 0x7F);
                stream.Seek(size, System.IO.SeekOrigin.Current);
            }
            else
            {
                stream.Seek(0, System.IO.SeekOrigin.Begin);
            }

            while (stream.Position < fileLength - 4)
            {
                long pos = stream.Position;
                int bytesRead = 0;
                while (bytesRead < 4)
                {
                    int r = stream.Read(buffer, bytesRead, 4 - bytesRead);
                    if (r == 0) break;
                    bytesRead += r;
                }
                if (bytesRead < 4) break;

                if (buffer[0] == 0xFF && (buffer[1] & 0xE0) == 0xE0)
                {
                    int mpegVer = (buffer[1] & 0x18) >> 3;
                    int layer = (buffer[1] & 0x06) >> 1;
                    int bitrateIdx = (buffer[2] & 0xF0) >> 4;
                    int srIdx = (buffer[2] & 0x0C) >> 2;
                    int padding = (buffer[2] & 0x02) >> 1;

                    int sr = 0;
                    int br = 0;
                    int samples = 0;

                    if (mpegVer == 3)
                    {
                        sr = sampleRatesV1[srIdx];
                        br = bitratesV1L3[bitrateIdx] * 1000;
                        samples = 1152;
                    }
                    else if (mpegVer == 2)
                    {
                        sr = sampleRatesV2[srIdx];
                        br = bitratesV2L3[bitrateIdx] * 1000;
                        samples = 576;
                    }
                    else if (mpegVer == 0)
                    {
                        sr = sampleRatesV25[srIdx];
                        br = bitratesV2L3[bitrateIdx] * 1000;
                        samples = 576;
                    }

                    if (sr == 0 || br == 0)
                    {
                        stream.Seek(pos + 1, System.IO.SeekOrigin.Begin);
                        continue;
                    }

                    int frameSize = 0;
                    if (mpegVer == 3)
                    {
                        frameSize = (144 * br) / sr + padding;
                    }
                    else
                    {
                        frameSize = (72 * br) / sr + padding;
                    }

                    duration += (double)samples / sr;
                    
                    if (frameSize > 0)
                    {
                        stream.Seek(pos + frameSize, System.IO.SeekOrigin.Begin);
                    }
                    else
                    {
                        stream.Seek(pos + 1, System.IO.SeekOrigin.Begin);
                    }
                }
                else
                {
                    stream.Seek(pos + 1, System.IO.SeekOrigin.Begin);
                }
            }

            return duration;
        }
    }
}
