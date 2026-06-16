import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import { Loader2, Plus, Edit2, Trash2, Save, FolderTree } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

interface AdminCategory {
  id: number;
  slug: string;
  name: string;
  iconUrl: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  poiCount: number;
}

export default function CategoryPage() {
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      toastError('Could not load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s_]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(generateSlug(val));
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIconUrl('');
    setColor('#4F46E5');
    setSortOrder(0);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIconUrl(cat.iconUrl || '');
    setColor(cat.color || '#4F46E5');
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
      await adminApi.deleteCategory(id);
      success('Xóa danh mục thành công!');
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      const errMsg = err.response?.data || 'Không thể xóa danh mục. Có thể danh mục này đang chứa địa điểm hoạt động.';
      toastError(errMsg);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      slug,
      iconUrl: iconUrl || null,
      color: color || null,
      sortOrder,
      isActive,
    };

    setSaving(true);
    try {
      if (editingCategory) {
        const { data } = await adminApi.updateCategory(editingCategory.id, payload);
        success('Cập nhật danh mục thành công!');
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data } : c))
        );
      } else {
        await adminApi.createCategory(payload);
        success('Thêm danh mục thành công!');
        fetchCategories();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save category:', err);
      toastError('Lưu danh mục thất bại. Vui lòng kiểm tra lại dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Đang tải danh mục...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            Quản lý Danh mục Địa điểm
          </h2>
          <p className="text-xs text-text-secondary">
            Thêm, chỉnh sửa và quản lý các danh mục của địa điểm ẩm thực, văn hóa
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none cursor-pointer shrink-0 align-self-start"
        >
          <Plus size={16} />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-text-muted">
          Không tìm thấy danh mục nào.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Tên danh mục</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Màu sắc</th>
                  <th className="p-4">Thứ tự sắp xếp</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Số địa điểm</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4 font-bold text-text-primary flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}35`,
                          color: cat.color || '#4F46E5',
                        }}
                      >
                        <FolderTree size={16} />
                      </div>
                      <span>{cat.name}</span>
                    </td>
                    <td className="p-4 text-text-secondary font-mono">{cat.slug}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-border shadow-xs"
                          style={{ backgroundColor: cat.color || '#4F46E5' }}
                        />
                        <span className="text-[10px] text-text-muted font-mono">{cat.color || '#4F46E5'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary">{cat.sortOrder}</td>
                    <td className="p-4">
                      {cat.isActive ? (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/25 rounded-md font-semibold text-[10px] uppercase">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-500/10 text-gray-500 border border-gray-500/25 rounded-md font-semibold text-[10px] uppercase">
                          Khóa
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-surface-alt border border-border rounded-lg font-bold text-text-primary">
                        {cat.poiCount} spots
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none"
                        title="Sửa"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 border border-border bg-card text-danger hover:border-danger/45 hover:bg-danger/5 rounded-lg transition-colors cursor-pointer outline-none"
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL FORM */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
        size="md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tên danh mục *</label>
              <input
                type="text"
                disabled={saving}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Nhà hàng, Cà phê..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required
              />
            </div>

            {/* Slug */}
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Slug *</label>
              <input
                type="text"
                disabled={saving}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="nha_hang, ca_phe..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Color */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Màu chủ đề</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  disabled={saving}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 p-1 rounded-xl border border-border bg-card cursor-pointer outline-none"
                />
                <input
                  type="text"
                  disabled={saving}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#4F46E5"
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
                />
              </div>
            </div>

            {/* IconUrl */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Icon URL (tùy chọn)</label>
              <input
                type="text"
                disabled={saving}
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="Url ảnh icon..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* SortOrder */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Thứ tự hiển thị</label>
              <input
                type="number"
                disabled={saving}
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            {/* IsActive */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Trạng thái</label>
              <select
                disabled={saving}
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
              >
                <option value="true">Hoạt động</option>
                <option value="false">Khóa</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-xl hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>Lưu danh mục</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
