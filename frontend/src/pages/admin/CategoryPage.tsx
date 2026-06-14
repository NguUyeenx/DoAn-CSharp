import { useEffect, useState } from 'react';
import { poisApi } from '@/api/pois';
import { FolderTree, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function CategoryPage() {
  const { error: toastError } = useToast();

  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    const fetchAndExtractCategories = async () => {
      setLoading(true);
      try {
        const { data } = await poisApi.getAll();
        if (isSubscribed) {
          // Extract unique categories and count their occurrences
          const counts: Record<string, number> = {};
          data.forEach((poi) => {
            const cat = poi.category || 'Khác';
            counts[cat] = (counts[cat] || 0) + 1;
          });

          const categoryList = Object.keys(counts).map((name) => ({
            name,
            count: counts[name],
          }));

          setCategories(categoryList);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        toastError('Could not load categories.');
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchAndExtractCategories();

    return () => {
      isSubscribed = false;
    };
  }, [toastError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          Food Spot Categories
        </h2>
        <p className="text-xs text-text-secondary">
          Overview of categories dynamically aggregated from all active food spot listings
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-text-muted">
          No categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-xs hover:border-border-hover transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <FolderTree size={18} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-text-primary capitalize">{cat.name}</h4>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">POI Category</span>
                </div>
              </div>

              <div className="px-2.5 py-1 bg-surface-alt border border-border rounded-lg text-xs font-bold text-text-primary">
                {cat.count} spots
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
