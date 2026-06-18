import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '@/api/owner';
import { menuApi } from '@/api/menu';
import { uploadApi } from '@/api/upload';
import type { MenuItem, POI } from '@/types/poi';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, Save, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { formatPrice } from '@/utils/format';

export default function MenuListPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { success, error: toastError } = useToast();

  const poiId = id ? parseInt(id, 10) : 0;

  const [poi, setPoi] = useState<POI | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(35000);
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastError(t('owner.menu.imageTypeError', 'Chỉ hỗ trợ ảnh dạng JPEG, PNG hoặc WebP'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError(t('owner.menu.imageSizeError', 'Kích thước ảnh tối đa là 5MB'));
      return;
    }

    setUploadingImage(true);
    try {
      const { data } = await uploadApi.uploadMenuImage(file);
      setImageUrl(data.url);
      success(t('owner.menu.imageUploadSuccess', 'Tải lên hình ảnh món ăn thành công!'));
    } catch (err: any) {
      console.error('Failed to upload menu image:', err);
      toastError(t('owner.menu.imageUploadError', 'Tải lên hình ảnh thất bại.'));
    } finally {
      setUploadingImage(false);
    }
  };

  // 1. Fetch POI and Menu items
  const loadData = async () => {
    if (!poiId) return;
    setLoading(true);
    try {
      const [poiRes, menuRes] = await Promise.all([
        ownerApi.getMyPOI(poiId, i18n.language),
        menuApi.getByPOI(poiId, i18n.language).catch((e) => {
          console.warn('Menu API failed, defaulting to empty list:', e);
          return { data: [] };
        }),
      ]);
      setPoi(poiRes.data);
      setItems(menuRes.data);
    } catch (err: any) {
      console.error('Failed to load menu details:', err);
      toastError(t('owner.menu.loadError', 'Không thể tải thực đơn'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [poiId, i18n.language]);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setPrice(35000);
    setImageUrl('');
    setIsAvailable(true);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price);
    setImageUrl(item.imageUrl || '');
    setIsAvailable(item.isAvailable);
    setIsModalOpen(true);
  };

  // Delete item
  const handleDelete = async (itemId: number) => {
    if (!window.confirm(t('owner.menu.deleteConfirm', 'Bạn chắc chắn muốn xoá món ăn này khỏi thực đơn?'))) return;
    try {
      await ownerApi.deleteMenuItem(itemId);
      success(t('owner.menu.deleteSuccess', 'Đã xoá món ăn thành công.'));
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete menu item:', err);
      toastError(t('owner.menu.deleteError', 'Xoá món ăn thất bại'));
    }
  };

  // Toggle availability state
  const handleToggleAvailability = async (item: MenuItem) => {
    const newStatus = !item.isAvailable;
    try {
      await ownerApi.toggleMenuAvailability(item.id, newStatus);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i))
      );
      success(
        newStatus
          ? t('owner.menu.activated', 'Món ăn đã có sẵn hàng')
          : t('owner.menu.deactivated', 'Món ăn tạm thời hết hàng')
      );
    } catch (err) {
      console.error('Failed to toggle menu status:', err);
      toastError(t('owner.menu.toggleError', 'Thay đổi trạng thái món ăn thất bại'));
    }
  };

  // Form submit handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError(t('owner.menu.nameRequired', 'Vui lòng điền tên món ăn'));
      return;
    }

    if (!imageUrl) {
      toastError(t('owner.menu.imageRequired', 'Vui lòng tải lên hình ảnh món ăn của quán từ máy của bạn'));
      return;
    }

    const payload = {
      poiId,
      name,
      price,
      currency: 'VND',
      imageUrl,
      isAvailable,
      displayOrder: editingItem ? editingItem.displayOrder : items.length + 1,
    };

    setSaving(true);
    try {
      if (editingItem) {
        const { data } = await ownerApi.updateMenuItem(editingItem.id, payload);
        success(t('owner.menu.updateSuccess', 'Cập nhật món ăn thành công!'));
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? data : i)));
      } else {
        const { data } = await ownerApi.createMenuItem(payload);
        success(t('owner.menu.createSuccess', 'Thêm món ăn mới thành công!'));
        setItems((prev) => [...prev, data]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save menu item:', err);
      toastError(t('owner.menu.saveError', 'Lưu món ăn thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">{t('common.loading', 'Loading menu items...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/owner/pois"
            className="p-1.5 rounded-full hover:bg-card border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
              {t('owner.menu.title', 'Thực Đơn Món Ăn')}
            </h2>
            <p className="text-xs text-text-secondary">
              {t('owner.menu.desc', 'Quản lý danh sách món ăn cho quán: {{poiName}}', { poiName: poi?.name })}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md cursor-pointer outline-none"
        >
          <Plus size={16} />
          <span>{t('owner.menu.add', 'Thêm món ăn')}</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <Plus size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-extrabold text-base text-text-primary">
              {t('owner.menu.emptyTitle', 'Chưa có thực đơn')}
            </h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              {t('owner.menu.emptyDesc', 'Bắt đầu đăng tải món ăn kèm hình ảnh và giá cả hấp dẫn để thu hút khách du lịch.')}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 transition-all outline-none"
          >
            {t('owner.menu.addNow', 'Thêm món ăn đầu tiên')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`
                bg-card border rounded-2xl p-4 flex gap-4 transition-all duration-300 relative overflow-hidden select-none
                ${item.isAvailable ? 'border-border hover:border-border-hover shadow-xs' : 'border-dashed border-border opacity-70'}
              `}
            >
              {/* Item Thumbnail */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-alt shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-xl font-bold">
                    🍜
                  </div>
                )}
              </div>

              {/* Details & Actions */}
              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-text-primary leading-tight truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs font-bold text-primary font-mono leading-none">
                    {formatPrice(item.price)}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-2 gap-4">
                  {/* Availability Toggle */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
                  >
                    {item.isAvailable ? (
                      <ToggleRight className="text-accent stroke-[2.5px]" size={22} />
                    ) : (
                      <ToggleLeft className="text-text-muted stroke-[2.5px]" size={22} />
                    )}
                    <span>{item.isAvailable ? 'Còn món' : 'Hết món'}</span>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover transition-all cursor-pointer outline-none"
                      title="Edit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg border border-border bg-card text-danger hover:border-danger-light hover:bg-danger/5 transition-all cursor-pointer outline-none"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD MODAL FOR ADD/EDIT MENU ITEM */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('owner.menu.editItem', 'Sửa Món Ăn') : t('owner.menu.addItem', 'Thêm Món Ăn Mới')}
        size="sm"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.menu.fieldName', 'Tên món ăn')} *
            </label>
            <input
              type="text"
              disabled={saving}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ốc len xào dừa..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.menu.fieldPrice', 'Giá cả (VND)')} *
            </label>
            <input
              type="number"
              disabled={saving}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              placeholder="35000"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
              required
            />
          </div>

          {/* Image Upload box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.menu.fieldImage', 'Hình ảnh món ăn')} *
            </label>
            
            {imageUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-surface-alt flex items-center justify-center group shadow-sm">
                <img src={imageUrl} alt="Menu Item Preview" className="w-full h-full object-cover" />
                {uploadingImage ? (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span className="text-[11px] font-semibold">Đang tải ảnh...</span>
                  </div>
                ) : (
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-1.5 transition-all cursor-pointer">
                    <Upload size={18} />
                    <span className="text-[11px] font-bold">Thay đổi hình ảnh</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingImage || saving}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl p-6 transition-all text-text-secondary select-none relative cursor-pointer min-h-[120px]">
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span className="text-xs font-semibold">Đang tải ảnh lên...</span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                    <Upload size={24} className="text-text-muted" />
                    <span className="text-xs font-bold text-primary">Tải lên hình ảnh món ăn</span>
                    <span className="text-[10px] text-text-muted">Chấp nhận JPG, PNG, WebP (Tối đa 5MB)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingImage || saving}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Available Checkbox */}
          <label className="flex items-center gap-2.5 mt-1 select-none cursor-pointer">
            <input
              type="checkbox"
              disabled={saving}
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4.5 h-4.5 text-primary border-border bg-card rounded-md focus:ring-primary/10 accent-primary cursor-pointer"
            />
            <span className="text-xs font-semibold text-text-secondary">
              {t('owner.menu.fieldAvailable', 'Có sẵn phục vụ tại cửa hàng')}
            </span>
          </label>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 mt-4 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-xl hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>{t('common.save', 'Lưu món')}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
