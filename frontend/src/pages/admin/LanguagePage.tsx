import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import type { Language } from '@/types/api';
import { Loader2, Star } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LanguagePage() {
  const { success, error: toastError } = useToast();

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

  const handleToggleStatus = async (code: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      await adminApi.toggleLanguageStatus(code, newStatus);
      setLanguages((prev) =>
        prev.map((l) => (l.code === code ? { ...l, isActive: newStatus } : l))
      );
      success(`Language ${code.toUpperCase()} status updated!`);
    } catch (err) {
      console.error('Failed to toggle language status:', err);
      toastError('Update status failed.');
    }
  };

  const handleSetDefault = async (code: string) => {
    try {
      await adminApi.setDefaultLanguage(code);
      setLanguages((prev) =>
        prev.map((l) => ({
          ...l,
          isDefault: l.code === code,
          isActive: l.code === code ? true : l.isActive, // default language must be active
        }))
      );
      success(`Language ${code.toUpperCase()} is now set as the default system language!`);
    } catch (err) {
      console.error('Failed to set default language:', err);
      toastError('Failed to change default language.');
    }
  };

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
                <th className="p-4">Status</th>
                <th className="p-4">Default</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {languages.map((lang) => (
                <tr key={lang.code} className="hover:bg-surface-alt/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-primary uppercase">{lang.code}</td>
                  <td className="p-4 font-bold text-text-primary">{lang.name}</td>
                  <td className="p-4 text-text-secondary">{lang.nativeName}</td>
                  <td className="p-4">
                    <span
                      onClick={() => handleToggleStatus(lang.code, lang.isActive)}
                      className={`
                        px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider cursor-pointer select-none transition-all
                        ${
                          lang.isActive
                            ? 'bg-accent/10 border-accent/20 text-accent'
                            : 'bg-danger/10 border-danger/20 text-danger opacity-60'
                        }
                      `}
                    >
                      {lang.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    {lang.isDefault ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-primary">
                        <Star size={13} className="fill-current text-secondary-light" />
                        <span>Default</span>
                      </span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {!lang.isDefault && (
                      <button
                        onClick={() => handleSetDefault(lang.code)}
                        className="h-8 px-2.5 rounded-lg border border-border bg-card text-text-primary font-semibold text-[11px] hover:bg-surface-alt active:scale-95 transition-all outline-none cursor-pointer"
                      >
                        Set Default
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
