import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import type { Language } from '@/types/api';
import { Loader2 } from 'lucide-react';

export default function LanguagePage() {

  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLanguages = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getLanguages();
      setLanguages(data);
    } catch (err: any) {
      console.error('Failed to load languages:', err);
      // Fallback mocks for testing
      setLanguages([
        { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', isActive: true, isDefault: true, sortOrder: 1 },
        { code: 'en', name: 'English', nativeName: 'English', isActive: true, isDefault: false, sortOrder: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  if (loading && languages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading system languages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          System Languages
        </h2>
        <p className="text-xs text-text-secondary">
          Configure available systems translation locales and set fallback defaults
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                <th className="p-4">Locale Code</th>
                <th className="p-4">English Name</th>
                <th className="p-4">Native Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {languages.map((lang) => (
                <tr key={lang.code} className="hover:bg-surface-alt/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-primary uppercase">{lang.code}</td>
                  <td className="p-4 font-bold text-text-primary">{lang.name}</td>
                  <td className="p-4 text-text-secondary">{lang.nativeName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
