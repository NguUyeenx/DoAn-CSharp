import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { poisApi } from '@/api/pois';
import { adminApi } from '@/api/admin';
import type { POIListItem } from '@/types/poi';
import { Plus, Edit3, Trash2, RotateCcw, Loader2, Image, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

export default function POIListPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { success, error: toastError } = useToast();

  const [pois, setPois] = useState<POIListItem[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and Pagination State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reassign Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignPoiId, setReassignPoiId] = useState<number | null>(null);
  const [reassignPoiName, setReassignPoiName] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('null');
  const [reassignSaving, setReassignSaving] = useState(false);

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

  const loadOwners = async () => {
    try {
      const { data } = await adminApi.getAllOwners();
      // Only approved owners are eligible to own POIs
      setOwners(data.filter((o: any) => o.ownerStatus === 'approved'));
    } catch (err) {
      console.error('Failed to load owners directory:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await adminApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    loadPOIs();
    loadOwners();
    loadCategories();
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

  const handleOpenReassign = (poiId: number, name: string, currentOwnerId: number | null) => {
    setReassignPoiId(poiId);
    setReassignPoiName(name);
    setSelectedOwnerId(currentOwnerId ? currentOwnerId.toString() : 'null');
    setIsReassignModalOpen(true);
  };

  const handleReassignSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignPoiId) return;

    setReassignSaving(true);
    try {
      const ownerId = selectedOwnerId === 'null' ? null : parseInt(selectedOwnerId, 10);
      await adminApi.updatePOIOwner(reassignPoiId, { ownerId });
      success('Chuyển quyền sở hữu địa điểm thành công!');
      setIsReassignModalOpen(false);
      loadPOIs();
    } catch (err) {
      console.error('Failed to reassign POI owner:', err);
      toastError('Chuyển quyền sở hữu thất bại.');
    } finally {
      setReassignSaving(false);
    }
  };

  // Filter POIs
  const filteredPois = pois.filter((poi) => {
    const matchesCategory = selectedCategory === 'all' || 
      poi.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStatus = selectedStatus === 'all' || 
      poi.approvalStatus === selectedStatus;

    return matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPois.length / itemsPerPage);
  const paginatedPois = filteredPois.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            Quản Lý Địa Điểm (POIs)
          </h2>
          <p className="text-xs text-text-secondary">
            Thêm mới, sửa đổi thông tin, gán chủ sở hữu hoặc khôi phục các địa điểm đã xóa mềm
          </p>
        </div>

        <Link
          to="/admin/pois/new"
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none shrink-0"
        >
          <Plus size={16} />
          <span>Thêm địa điểm</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Lọc theo Danh mục</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-xl border border-border bg-surface-alt text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[180px]">
          <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Lọc theo Trạng thái</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-xl border border-border bg-surface-alt text-xs font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Hoạt động</option>
            <option value="pending">Chờ duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
              setCurrentPage(1);
            }}
            className="mt-auto h-9 px-4 rounded-xl border border-border bg-surface-alt hover:bg-surface-alt/80 hover:text-text-primary text-text-secondary text-xs font-bold transition-all cursor-pointer outline-none flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>

      {pois.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <Plus size={20} />
          </div>
          <h3 className="font-display font-extrabold text-base text-text-primary">Không tìm thấy địa điểm nào</h3>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {filteredPois.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <span className="text-sm font-semibold text-text-secondary">Không tìm thấy địa điểm nào khớp với bộ lọc</span>
              <button 
                onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); setCurrentPage(1); }} 
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Xóa các bộ lọc để hiển thị lại
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                      <th className="p-4">Ảnh bìa</th>
                      <th className="p-4">Tên địa điểm</th>
                      <th className="p-4">Danh mục</th>
                      <th className="p-4">Chủ sở hữu (Owner)</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedPois.map((poi) => (
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
                        <td className="p-4">
                          <button
                            onClick={() => handleOpenReassign(poi.id, poi.name, poi.ownerId ?? null)}
                            className="font-semibold text-primary hover:underline cursor-pointer outline-none bg-transparent border-0 p-0 text-left text-xs flex items-center gap-1 group"
                            title="Click để đổi quyền sở hữu"
                          >
                            <User size={12} className="text-text-muted group-hover:text-primary transition-colors" />
                            <span>
                              {poi.ownerId
                                ? (owners.find((o) => o.id === poi.ownerId)?.displayName || `Đối tác #${poi.ownerId}`)
                                : 'Quản trị viên / Hệ thống'}
                            </span>
                          </button>
                        </td>
                        <td className="p-4">
                          <span
                            className={`
                              px-2.5 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wider
                              ${
                                poi.approvalStatus === 'approved'
                                  ? 'bg-accent/10 border-accent/20 text-accent'
                                  : poi.approvalStatus === 'pending'
                                  ? 'bg-secondary/10 border-secondary/20 text-secondary-light animate-pulse'
                                  : 'bg-danger/10 border-danger/20 text-danger'
                              }
                            `}
                          >
                            {poi.approvalStatus === 'approved' ? 'Hoạt động' : poi.approvalStatus === 'pending' ? 'Chờ duyệt' : poi.approvalStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2.5">
                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/admin/pois/${poi.id}/edit`)}
                            className="p-2 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete / Restore */}
                          {poi.approvalStatus === 'deleted' ? (
                            <button
                              onClick={() => handleRestore(poi.id)}
                              className="p-2 border border-border bg-card text-accent hover:border-accent/40 hover:bg-accent/5 rounded-lg transition-colors cursor-pointer outline-none"
                              title="Khôi phục địa điểm"
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(poi.id)}
                              className="p-2 border border-border bg-card text-danger hover:border-danger/40 hover:bg-danger/5 rounded-lg transition-colors cursor-pointer outline-none"
                              title="Xóa địa điểm"
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-surface-alt px-4 py-3.5 border-t border-border flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary select-none">
                  <div>
                    Hiển thị {Math.min(filteredPois.length, (currentPage - 1) * itemsPerPage + 1)} đến{' '}
                    {Math.min(filteredPois.length, currentPage * itemsPerPage)} trong tổng số {filteredPois.length} địa điểm
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="p-2 rounded-lg border border-border bg-card hover:bg-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {getPaginationRange(currentPage, totalPages).map((page, index) => {
                      if (page === '...') {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="w-8 h-8 flex items-center justify-center text-text-muted select-none font-medium"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={`page-${page}`}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer outline-none ${
                            currentPage === page
                              ? 'border-primary bg-primary text-white shadow-sm'
                              : 'border-border bg-card hover:bg-surface text-text-secondary'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="p-2 rounded-lg border border-border bg-card hover:bg-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* REASSIGN POI OWNER MODAL */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title={`Chuyển quyền sở hữu: ${reassignPoiName}`}
        size="sm"
      >
        <form onSubmit={handleReassignSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Chọn chủ sở hữu mới *
            </label>
            <select
              disabled={reassignSaving}
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
            >
              <option value="null">Quản trị viên / Hệ thống (Không gán đối tác)</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id.toString()}>
                  {owner.displayName} ({owner.username})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setIsReassignModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-xl hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={reassignSaving}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {reassignSaving ? <Loader2 className="animate-spin" size={14} /> : <Users size={14} />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 2; // Number of pages to show on either side of current page
  const range: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
    return range;
  }

  // Always show page 1
  range.push(1);

  const left = currentPage - delta;
  const right = currentPage + delta;

  if (left > 2) {
    range.push('...');
  }

  // Add middle pages
  const start = Math.max(2, left);
  const end = Math.min(totalPages - 1, right);
  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (right < totalPages - 1) {
    range.push('...');
  } else if (right === totalPages - 1) {
    range.push(totalPages - 1);
  }

  // Always show last page
  range.push(totalPages);
  return range;
}
