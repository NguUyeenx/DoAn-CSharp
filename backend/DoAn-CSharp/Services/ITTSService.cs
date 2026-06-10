using System.Threading.Tasks;

namespace DoAn_CSharp.Services
{
    public interface ITTSService
    {
        Task<string> GenerateAudioAsync(string text, string languageCode, int poiId);
    }
}
