import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toursApi } from '@/api/tours';
import type { TourListItem } from '@/types/api';
import { Plus, Edit3, Trash2, Loader2, Compass } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function TourListPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { success, error: toastError } = useToast();

  const [tours, setTours] = useState<TourListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTours = async () => {
    setLoading(true);
    try {
      const { data } = await toursApi.getAll(i18n.language);
      setTours(data);
    } catch (err: any) {
      console.error('Failed to load tours:', err);
      toastError('Could not load food tours.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTours();
  }, [i18n.language]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this food tour route?')) return;
    try {
      await toursApi.adminDelete(id);
      success('Food tour deleted successfully!');
      loadTours();
    } catch (err) {
      console.error('Failed to delete tour:', err);
      toastError('Delete failed.');
    }
  };

  if (loading && tours.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading walking tours...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Add Tour */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            Manage Walking Tours
          </h2>
          <p className="text-xs text-text-secondary">
            Configure preset route itineraries, ordering stops, and walking duration guidelines
          </p>
        </div>

        <Link
          to="/admin/tours/new"
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none shrink-0"
        >
          <Plus size={16} />
          <span>Add Tour</span>
        </Link>
      </div>

      {tours.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <Compass size={20} />
          </div>
          <h3 className="font-display font-extrabold text-base text-text-primary">No tours found</h3>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Distance</th>
                  <th className="p-4">Stops count</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4 font-bold text-text-primary">{tour.name}</td>
                    <td className="p-4 text-text-secondary max-w-xs truncate">{tour.description}</td>
                    <td className="p-4 font-semibold">{tour.estimatedMinutes} mins</td>
                    <td className="p-4 font-semibold">{tour.distanceKm} km</td>
                    <td className="p-4 font-display font-bold text-accent">{tour.stopCount} stops</td>
                    <td className="p-4 text-right flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => navigate(`/admin/tours/${tour.id}/edit`)}
                        className="p-2 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none"
                        title="Edit Tour & Stops"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(tour.id)}
                        className="p-2 border border-border bg-card text-danger hover:border-danger/40 hover:bg-danger/5 rounded-lg transition-colors cursor-pointer outline-none"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
