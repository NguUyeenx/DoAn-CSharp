import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '@/api/owner';
import { ArrowLeft, Save, Loader2, MapPin } from 'lucide-react';
import MapView from '@/components/map/MapView';
import POIMarker from '@/components/map/POIMarker';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = ['Ốc', 'Lẩu', 'Đồ nướng', 'Ăn vặt', 'Bánh mì', 'Đồ uống', 'Khác'];

export default function POIFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { success, error: toastError } = useToast();
  
  const isEditMode = !!id;
  const poiId = id ? parseInt(id, 10) : null;

  // Form states
  const [name, setName] = useState('');
  const [slugForm, setSlugForm] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [audioText, setAudioText] = useState('');
  const [latitude, setLatitude] = useState(10.758); // default center latitude
  const [longitude, setLongitude] = useState(106.699); // default center longitude
  const [triggerRadiusMeters, setTriggerRadiusMeters] = useState(50);
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-generate slug from name in Create Mode
  useEffect(() => {
    if (!isEditMode && name) {
      const generatedSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlugForm(generatedSlug);
    }
  }, [name, isEditMode]);

  // Load POI details in Edit Mode
  useEffect(() => {
    if (!isEditMode || !poiId) return;

    let isSubscribed = true;
    const fetchPOIDetails = async () => {
      setLoading(true);
      try {
        const { data } = await ownerApi.getMyPOI(poiId, i18n.language);
        if (isSubscribed && data) {
          setName(data.name);
          setSlugForm(data.slug);
          setCategory(data.category);
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setShortDescription(data.shortDescription || '');
          setFullDescription(data.fullDescription || '');
          setAudioText(data.audioText || '');
          setLatitude(data.latitude);
          setLongitude(data.longitude);
          setTriggerRadiusMeters(data.triggerRadiusMeters);
          setImageUrl(data.imageUrl || '');
        }
      } catch (err: any) {
        console.error('Failed to load owner POI details:', err);
        toastError(t('owner.pois.loadSingleError', 'Không thể tải chi tiết địa điểm'));
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchPOIDetails();

    return () => {
      isSubscribed = false;
    };
  }, [poiId, isEditMode, i18n.language, t, toastError]);

  const handleMapClick = (lngLat: [number, number]) => {
    setLongitude(lngLat[0]);
    setLatitude(lngLat[1]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError(t('owner.pois.nameRequired', 'Vui lòng nhập tên địa điểm'));
      return;
    }
    if (!latitude || !longitude) {
      toastError(t('owner.pois.coordsRequired', 'Vui lòng chấm tọa độ trên bản đồ'));
      return;
    }

    const payload = {
      name,
      slug: slugForm,
      category,
      address,
      phone,
      shortDescription,
      fullDescription,
      audioText,
      latitude,
      longitude,
      triggerRadiusMeters,
      imageUrl,
    };

    setSaving(true);
    try {
      if (isEditMode && poiId) {
        await ownerApi.updatePOI(poiId, payload);
        success(t('owner.pois.updateSuccess', 'Cập nhật địa điểm thành công! Chờ ban quản trị duyệt lại nếu có thay đổi quan trọng.'));
      } else {
        await ownerApi.createPOI(payload);
        success(t('owner.pois.createSuccess', 'Đăng ký địa điểm mới thành công! Địa điểm ở trạng thái chờ duyệt.'));
      }
      navigate('/owner/pois');
    } catch (err: any) {
      console.error('Failed to save POI:', err);
      const errMsg = err.response?.data?.message || t('owner.pois.saveFailed', 'Lưu địa điểm thất bại.');
      toastError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Mock list item representation for markers previewing
  const mockPoiListItem = useMemo(() => {
    return {
      id: poiId || -99,
      name: name || t('owner.pois.newSpot', 'Cửa hàng mới'),
      slug: slugForm,
      latitude,
      longitude,
      category,
      imageUrl,
      shortDescription,
      approvalStatus: 'approved',
      isFavorite: false,
      rating: 5,
      reviewCount: 0,
    };
  }, [poiId, name, slugForm, latitude, longitude, category, imageUrl, shortDescription, t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">{t('common.loading', 'Loading form...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/owner/pois"
          className="p-1.5 rounded-full hover:bg-card border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {isEditMode ? t('owner.pois.editTitle', 'Chỉnh Sửa Địa Điểm') : t('owner.pois.createTitle', 'Đăng Ký Cửa Hàng Mới')}
          </h2>
          <p className="text-xs text-text-secondary">
            {t('owner.pois.formDesc', 'Vui lòng điền đầy đủ và chính xác các thông tin để ban quản trị duyệt')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: Fields */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
          {/* Store Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.pois.fieldName', 'Tên cửa hàng / Địa điểm')} *
            </label>
            <input
              type="text"
              disabled={saving}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ốc Khánh..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Slug (URL path)
            </label>
            <input
              type="text"
              disabled={saving}
              value={slugForm}
              onChange={(e) => setSlugForm(e.target.value)}
              placeholder="e.g. oc-khanh"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Grid Category + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {t('owner.pois.fieldCategory', 'Danh mục')} *
              </label>
              <select
                disabled={saving}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {t('owner.pois.fieldPhone', 'Số điện thoại')}
              </label>
              <input
                type="text"
                disabled={saving}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0901234567..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.pois.fieldAddress', 'Địa chỉ')}
            </label>
            <input
              type="text"
              disabled={saving}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 200 Vĩnh Khánh, Quận 4, TP. HCM..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Cover Photo URL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.pois.fieldCoverUrl', 'Link ảnh bìa đại diện')}
            </label>
            <input
              type="url"
              disabled={saving}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Short Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.pois.fieldShortDesc', 'Mô tả ngắn (Hiển thị ở danh sách card)')}
            </label>
            <textarea
              disabled={saving}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Quán chuyên các món ốc xào, luộc ngon bổ rẻ..."
              rows={2}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
            />
          </div>

          {/* Full Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.pois.fieldFullDesc', 'Mô tả chi tiết')}
            </label>
            <textarea
              disabled={saving}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="e.g. Nhập giới thiệu chi tiết về quán, món ăn đặc sắc, không gian quán..."
              rows={4}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-y"
            />
          </div>

          {/* TTS text */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.pois.fieldAudioText', 'Văn bản thuyết minh (Sẽ tự động chuyển thành giọng nói AI)')}
            </label>
            <textarea
              disabled={saving}
              value={audioText}
              onChange={(e) => setAudioText(e.target.value)}
              placeholder="e.g. Chào mừng các bạn đến với Ốc Khánh. Hãy thử món ốc len xào dừa đặc sản tại đây..."
              rows={3}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-y"
            />
          </div>
        </div>

        {/* RIGHT PANEL: Map coordinates picker */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm flex-1 min-h-[400px]">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm sm:text-base text-text-primary">
                  {t('owner.pois.pickerTitle', 'Chấm Vị Trí Trên Bản Đồ')}
                </h3>
                <p className="text-[10px] text-text-secondary">
                  {t('owner.pois.pickerDesc', 'Click trực tiếp vào vị trí cửa hàng để lấy tọa độ tự động')}
                </p>
              </div>
              <MapPin className="text-primary animate-bounce" size={20} />
            </div>

            {/* Map Picker viewport */}
            <div className="flex-1 h-64 lg:h-auto rounded-xl overflow-hidden border border-border shadow-inner relative">
              <MapView onMapClick={handleMapClick}>
                <POIMarker
                  poi={mockPoiListItem}
                  isSelected={true}
                  onDetailClick={() => {}}
                />
              </MapView>
            </div>

            {/* Coordinate numbers */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-secondary mt-1">
              <div className="p-3 bg-surface-alt border border-border rounded-xl">
                <span className="text-[9px] uppercase text-text-muted tracking-wider block mb-0.5">Latitude</span>
                <span className="text-text-primary text-xs font-mono">{latitude.toFixed(6)}</span>
              </div>
              <div className="p-3 bg-surface-alt border border-border rounded-xl">
                <span className="text-[9px] uppercase text-text-muted tracking-wider block mb-0.5">Longitude</span>
                <span className="text-text-primary text-xs font-mono">{longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full rounded-2xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-md cursor-pointer outline-none shrink-0"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Save size={16} />
                <span>{t('common.save', 'Lưu địa điểm')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
