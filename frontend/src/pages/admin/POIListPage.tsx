import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { poisApi } from '@/api/pois';
import { adminApi } from '@/api/admin';
import type { POIListItem } from '@/types/poi';
import { Plus, Edit3, Trash2, RotateCcw, Loader2, Image } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function POIListPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { success, error: toastError } = useToast();

  const [pois, setPois] = useState<POIListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPOIs = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPOIs({ lang: i18n.language });
      setPois(data);
    } catch (err: any) {
      console.error('Failed to load POIs:', err);
      toastError(t('admin.poisLoadError', 'Could not load food spots'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOIs();
  }, [i18n.language]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('admin.deleteConfirm', 'Are you sure you want to delete this food spot listing?'))) return;
    try {
      await poisApi.delete(id);
      success(t('admin.deleteSuccess', 'Food spot deleted successfully!'));
      loadPOIs(); // refresh list
    } catch (err) {
      console.error('Failed to delete POI:', err);
      toastError('Delete failed.');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await poisApi.restore(id);
      success(t('admin.restoreSuccess', 'Food spot restored successfully!'));
      loadPOIs(); // refresh list
    } catch (err) {
      console.error('Failed to restore POI:', err);
      toastError('Restore failed.');
    }
  };

  if (loading && pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">{t('common.loading', 'Loading food spots...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Add POI button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            Manage Food Spots (POIs)
          </h2>
          <p className="text-xs text-text-secondary">
            Create, update, soft-delete, or restore points of interest in Vinh Khanh
          </p>
        </div>

        <Link
          to="/admin/pois/new"
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none shrink-0"
        >
          <Plus size={16} />
          <span>Add Food Spot</span>
        </Link>
      </div>

      {pois.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <Plus size={20} />
          </div>
          <h3 className="font-display font-extrabold text-base text-text-primary">No spots found</h3>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Cover</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Owner ID</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pois.map((poi) => (
                  <tr key={poi.id} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4 shrink-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-alt border border-border flex items-center justify-center">
                        {poi.imageUrl ? (
                          <img src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover" />
                        ) : (
                          <Image size={16} className="text-primary opacity-40" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-text-primary">{poi.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-surface-alt text-text-secondary text-[10px] font-bold rounded capitalize border border-border">
                        {poi.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{poi.ownerId ?? 'System / Admin'}</td>
                    <td className="p-4">
                      <span
                        className={`
                          px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider
                          ${
                            poi.approvalStatus === 'approved'
                              ? 'bg-accent/10 border-accent/20 text-accent'
                              : poi.approvalStatus === 'pending'
                              ? 'bg-secondary/10 border-secondary/20 text-secondary-light animate-pulse'
                              : 'bg-danger/10 border-danger/20 text-danger'
                          }
                        `}
                      >
                        {poi.approvalStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2.5">
                      {/* Edit */}
                      <button
                        onClick={() => navigate(`/admin/pois/${poi.id}/edit`)}
                        className="p-2 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none"
                        title="Edit Details"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Delete / Restore */}
                      {poi.approvalStatus === 'deleted' ? (
                        <button
                          onClick={() => handleRestore(poi.id)}
                          className="p-2 border border-border bg-card text-accent hover:border-accent/40 hover:bg-accent/5 rounded-lg transition-colors cursor-pointer outline-none"
                          title="Restore"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(poi.id)}
                          className="p-2 border border-border bg-card text-danger hover:border-danger/40 hover:bg-danger/5 rounded-lg transition-colors cursor-pointer outline-none"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
