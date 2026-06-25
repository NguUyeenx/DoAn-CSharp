using System.Threading.Tasks;

namespace DoAn_CSharp.Services
{
    public class TTSResult
    {
        public string Url { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
    }

    public interface ITTSService
    {
        Task<TTSResult> GenerateAudioAsync(string text, string languageCode, int poiId);
    }
}
