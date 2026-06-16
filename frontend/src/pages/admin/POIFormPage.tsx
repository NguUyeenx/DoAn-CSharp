import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { poisApi } from '@/api/pois';
import { adminApi } from '@/api/admin';
import { uploadApi } from '@/api/upload';
import { api } from '@/api/client';
import { ArrowLeft, Save, Loader2, MapPin, Upload, Play, Check, ImagePlus, X, AlertCircle, Link as LinkIcon } from 'lucide-react';
import MapView from '@/components/map/MapView';
import POIMarker from '@/components/map/POIMarker';
import { useToast } from '@/components/ui/Toast';

interface OperatingHourItem {
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, i) => ({
  day: i,
  open: '08:00',
  close: '22:00',
  closed: false,
}));

export default function POIFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { success, error: toastError } = useToast();
  
  const isEditMode = !!id;
  const poiId = id ? parseInt(id, 10) : null;

  // Form states
  const [categories, setCategories] = useState<{ id: string; name: string; nameEn: string }[]>([]);
  const [name, setName] = useState('');
  const [slugForm, setSlugForm] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [priceRange, setPriceRange] = useState('1');
  const [latitude, setLatitude] = useState(10.758);
  const [longitude, setLongitude] = useState(106.699);
  const [triggerRadiusMeters, setTriggerRadiusMeters] = useState(50);
  const [imageUrl, setImageUrl] = useState('');
  const [operatingHours, setOperatingHours] = useState<OperatingHourItem[]>(DEFAULT_HOURS);

  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSource, setImageSource] = useState<'upload' | 'url' | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Translation state (Tabs)
  const [activeLangTab, setActiveLangTab] = useState<'vi' | 'en'>('vi');
  const [translations, setTranslations] = useState({
    vi: { name: '', shortDescription: '', fullDescription: '', audioText: '', audioUrl: '' },
    en: { name: '', shortDescription: '', fullDescription: '', audioText: '', audioUrl: '' },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Fetch dynamic categories
  useEffect(() => {
    api.get<any[]>('/categories')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          if (!isEditMode) {
            setCategory(res.data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
        toastError('Failed to load categories.');
      });
  }, [isEditMode, toastError]);

  // Auto-generate slug from Vietnamese name in Create Mode
  useEffect(() => {
    if (!isEditMode && translations.vi.name) {
      const generatedSlug = translations.vi.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlugForm(generatedSlug);
      setName(translations.vi.name);
    }
  }, [translations.vi.name, isEditMode]);

  // Load POI details in Edit Mode
  useEffect(() => {
    if (!isEditMode || !poiId) return;

    let isSubscribed = true;
    const fetchPOIDetails = async () => {
      setLoading(true);
      try {
        const { data } = await poisApi.getById(poiId, 'en');
        if (!isSubscribed || !data) return;

        setName(data.name);
        setSlugForm(data.slug);
        setCategory(data.category);
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setPriceRange(data.priceRange || '1');
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setTriggerRadiusMeters(data.triggerRadiusMeters);
        setImageUrl(data.imageUrl || '');
        if (data.imageUrl) {
          setImageSource(data.imageUrl.startsWith('/') ? 'upload' : 'url');
        }
        if (data.operatingHours) {
          try {
            setOperatingHours(JSON.parse(data.operatingHours));
          } catch {
            setOperatingHours(DEFAULT_HOURS);
          }
        }

        // Fetch translations
        const [viTransRes, enTransRes] = await Promise.all([
          api.get(`/translations/${poiId}/vi`).catch(() => ({ data: null })),
          api.get(`/translations/${poiId}/en`).catch(() => ({ data: null })),
        ]);

        // Fetch custom audios
        const audiosRes = await adminApi.getAudioFiles().catch(() => ({ data: [] }));
        const customAudios = audiosRes.data.filter((a: any) => a.poiId === poiId && a.audioType === 'custom');
        const viAudio = customAudios.find((a: any) => a.languageCode === 'vi')?.filePath || '';
        const enAudio = customAudios.find((a: any) => a.languageCode === 'en')?.filePath || '';

        setTranslations({
          vi: {
            name: viTransRes.data?.name || data.name,
            shortDescription: viTransRes.data?.shortDescription || '',
            fullDescription: viTransRes.data?.fullDescription || '',
            audioText: viTransRes.data?.audioText || '',
            audioUrl: viAudio,
          },
          en: {
            name: enTransRes.data?.name || data.name,
            shortDescription: enTransRes.data?.shortDescription || '',
            fullDescription: enTransRes.data?.fullDescription || '',
            audioText: enTransRes.data?.audioText || '',
            audioUrl: enAudio,
          },
        });
      } catch (err: any) {
        console.error('Failed to load POI details:', err);
        toastError('Could not load POI details.');
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchPOIDetails();

    return () => {
      isSubscribed = false;
    };
  }, [poiId, isEditMode, toastError]);

  const handleMapClick = (lngLat: [number, number]) => {
    setLongitude(lngLat[0]);
    setLatitude(lngLat[1]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setImageError('Chỉ hỗ trợ định dạng JPEG, PNG, WebP, GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Ảnh không được lớn hơn 5MB');
      return;
    }

    setUploadingImage(true);
    setImageError('');
    try {
      const { data } = await uploadApi.uploadPOIImage(file);
      setImageUrl(data.url);
      setImageSource('upload');
      setShowUrlInput(false);
      success('Tải lên ảnh đại diện thành công!');
    } catch {
      setImageError('Tải lên ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!url) { resolve(false); return; }
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleImageUrlChange = async (url: string) => {
    setImageUrl(url);
    setImageError('');
    if (!url) {
      setImageSource(null);
      return;
    }
    try {
      new URL(url);
    } catch {
      setImageError('URL không đúng định dạng');
      return;
    }
    const valid = await validateImageUrl(url);
    if (valid) {
      setImageSource('url');
      setImageError('');
    } else {
      setImageError('Link ảnh không hợp lệ hoặc không thể tải');
      setImageSource(null);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageSource(null);
    setImageError('');
    setShowUrlInput(false);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    try {
      const { data } = await uploadApi.uploadAudio(file);
      
      // Update local state
      setTranslations(prev => ({
        ...prev,
        [activeLangTab]: {
          ...prev[activeLangTab],
          audioUrl: data.url
        }
      }));
      success('Audio file uploaded successfully!');
    } catch (err) {
      console.error('Failed to upload audio:', err);
      toastError('Audio file upload failed.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = translations.vi.name || translations.en.name || name;
    if (!finalName.trim()) {
      toastError('POI name is required');
      return;
    }
    if (!latitude || !longitude) {
      toastError('Coordinates are required');
      return;
    }

    const payload = {
      name: finalName,
      slug: slugForm,
      category,
      address,
      phone,
      priceRange,
      latitude,
      longitude,
      triggerRadiusMeters,
      imageUrl,
      operatingHours: JSON.stringify(operatingHours),
      isActive: true,
      approvalStatus: 'approved',
    };

    setSaving(true);
    try {
      let savedPoiId = poiId;
      if (isEditMode && poiId) {
        await poisApi.update(poiId, payload);
      } else {
        const { data } = await poisApi.create(payload);
        savedPoiId = data.id;
      }

      if (savedPoiId) {
        // Upsert translations
        await Promise.all([
          api.post('/translations', {
            poiId: savedPoiId,
            languageCode: 'vi',
            name: translations.vi.name || finalName,
            shortDescription: translations.vi.shortDescription || 'Mô tả đang được cập nhật',
            fullDescription: translations.vi.fullDescription || 'Thông tin mô tả chi tiết đang được cập nhật.',
            audioText: translations.vi.audioText || (translations.vi.name || finalName),
          }),
          api.post('/translations', {
            poiId: savedPoiId,
            languageCode: 'en',
            name: translations.en.name || translations.vi.name || finalName,
            shortDescription: translations.en.shortDescription || translations.vi.shortDescription || 'Description will be updated soon.',
            fullDescription: translations.en.fullDescription || translations.vi.fullDescription || 'Detailed description will be updated soon.',
            audioText: translations.en.audioText || translations.vi.audioText || (translations.en.name || finalName),
          }),
        ]);

        // Save custom audios
        const audioPromises = [];
        if (translations.vi.audioUrl) {
          audioPromises.push(adminApi.saveCustomAudio(savedPoiId, {
            languageCode: 'vi',
            filePath: translations.vi.audioUrl,
            durationSeconds: 120, // default estimation
          }));
        }
        if (translations.en.audioUrl) {
          audioPromises.push(adminApi.saveCustomAudio(savedPoiId, {
            languageCode: 'en',
            filePath: translations.en.audioUrl,
            durationSeconds: 120,
          }));
        }
        await Promise.all(audioPromises);
      }

      success(isEditMode ? 'POI updated successfully!' : 'POI created successfully!');
      navigate('/admin/pois');
    } catch (err: any) {
      console.error('Failed to save POI:', err);
      toastError('Failed to save details.');
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[day];
  };

  const mockPoiListItem = useMemo(() => {
    return {
      id: poiId || -99,
      name: translations.vi.name || name || 'Preview Spot',
      slug: slugForm,
      latitude,
      longitude,
      category,
      imageUrl,
      shortDescription: translations.vi.shortDescription || '',
      approvalStatus: 'approved',
      isFavorite: false,
      rating: 5,
      reviewCount: 0,
      priceRange: priceRange,
    };
  }, [poiId, translations.vi.name, name, slugForm, latitude, longitude, category, imageUrl, translations.vi.shortDescription, priceRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading form...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/pois"
          className="p-1.5 rounded-full hover:bg-card border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {isEditMode ? 'Chỉnh Sửa Địa Điểm' : 'Thêm Địa Điểm Mới'}
          </h2>
          <p className="text-xs text-text-secondary">
            Cấu hình siêu dữ liệu, tọa độ bản đồ, bản dịch đa ngôn ngữ và audio thuyết minh
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: Fields */}
        <div className="flex flex-col gap-6">
          {/* Core Info card */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="font-display font-bold text-xs uppercase text-text-primary tracking-wider border-b border-border/40 pb-2">
              Thông tin chung
            </h3>
            
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
                placeholder="e.g. oc-oanh"
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            {/* Grid Category + Phone + Price Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Danh mục *
                </label>
                <select
                  disabled={saving}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {i18n.language === 'vi' ? cat.name : cat.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Mức giá *
                </label>
                <select
                  disabled={saving}
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                >
                  <option value="1">Bình dân</option>
                  <option value="2">Trung bình</option>
                  <option value="3">Khá</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Số điện thoại
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
                Địa chỉ
              </label>
              <input
                type="text"
                disabled={saving}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 53 Vĩnh Khánh, Quận 4, TP. HCM..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            {/* Cover Photo - Upload + URL + Preview */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Ảnh đại diện địa điểm
              </label>

              {/* Preview / Upload Area */}
              {imageUrl && imageSource ? (
                <div className="relative group rounded-xl overflow-hidden border border-border bg-surface-alt">
                  <img
                    src={imageUrl}
                    alt="Ảnh đại diện"
                    className="w-full h-40 object-cover"
                    onError={() => setImageError('Không thể hiển thị ảnh')}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="p-2 bg-white/90 text-text-primary rounded-full hover:bg-white transition-colors cursor-pointer" title="Đổi ảnh">
                      <Upload size={16} />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={uploadingImage || saving}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-semibold rounded-md">
                    {imageSource === 'upload' ? '📤 Đã tải lên' : '🔗 Từ link'}
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-surface-alt/50 hover:bg-surface-alt transition-all cursor-pointer group">
                  {uploadingImage ? (
                    <Loader2 className="animate-spin text-primary" size={28} />
                  ) : (
                    <>
                      <ImagePlus size={28} className="text-text-muted group-hover:text-primary transition-colors" />
                      <span className="text-xs text-text-secondary mt-2 font-semibold">Click để chọn ảnh từ máy</span>
                      <span className="text-[10px] text-text-muted mt-0.5">JPEG, PNG, WebP, GIF — tối đa 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadingImage || saving}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Toggle URL input */}
              {!imageSource && (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-primary font-semibold transition-colors cursor-pointer self-start"
                >
                  <LinkIcon size={12} />
                  <span>{showUrlInput ? 'Ẩn gắn link' : 'Hoặc gắn link ảnh'}</span>
                </button>
              )}

              {/* URL Input */}
              {showUrlInput && !imageSource && (
                <input
                  type="url"
                  disabled={saving}
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                />
              )}

              {/* Image Error */}
              {imageError && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-semibold">
                  <AlertCircle size={12} />
                  <span>{imageError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Translations section */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h3 className="font-display font-bold text-xs uppercase text-text-primary tracking-wider">
                Quản lý bản dịch & Audio
              </h3>
              {/* Language Switcher Tabs */}
              <div className="flex bg-surface-alt p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setActiveLangTab('vi')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeLangTab === 'vi' ? 'bg-card text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  🇻🇳 Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeLangTab === 'en' ? 'bg-card text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Store Name translation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Tên cửa hàng ({activeLangTab.toUpperCase()}) *
              </label>
              <input
                type="text"
                disabled={saving}
                value={translations[activeLangTab].name}
                onChange={(e) => {
                  const val = e.target.value;
                  setTranslations(prev => ({
                    ...prev,
                    [activeLangTab]: { ...prev[activeLangTab], name: val }
                  }));
                }}
                placeholder="Tên cửa hàng..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required={activeLangTab === 'vi'}
              />
            </div>

            {/* Short Description translation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Mô tả ngắn ({activeLangTab.toUpperCase()})
              </label>
              <textarea
                disabled={saving}
                value={translations[activeLangTab].shortDescription}
                onChange={(e) => {
                  const val = e.target.value;
                  setTranslations(prev => ({
                    ...prev,
                    [activeLangTab]: { ...prev[activeLangTab], shortDescription: val }
                  }));
                }}
                placeholder="Mô tả ngắn hiển thị ở card bản đồ..."
                rows={2}
                className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
              />
            </div>

            {/* Full Description translation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Mô tả chi tiết ({activeLangTab.toUpperCase()})
              </label>
              <textarea
                disabled={saving}
                value={translations[activeLangTab].fullDescription}
                onChange={(e) => {
                  const val = e.target.value;
                  setTranslations(prev => ({
                    ...prev,
                    [activeLangTab]: { ...prev[activeLangTab], fullDescription: val }
                  }));
                }}
                placeholder="Giới thiệu chi tiết địa điểm..."
                rows={4}
                className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-y"
              />
            </div>

            {/* Audio text translation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Văn bản thuyết minh ({activeLangTab.toUpperCase()})
              </label>
              <textarea
                disabled={saving}
                value={translations[activeLangTab].audioText}
                onChange={(e) => {
                  const val = e.target.value;
                  setTranslations(prev => ({
                    ...prev,
                    [activeLangTab]: { ...prev[activeLangTab], audioText: val }
                  }));
                }}
                placeholder="Văn bản thuyết minh dành cho giọng đọc AI..."
                rows={3}
                className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-y"
              />
            </div>

            {/* Audio thuyết minh riêng upload */}
            <div className="flex flex-col gap-1.5 p-4 bg-surface-alt border border-border rounded-xl mt-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                Audio thuyết minh riêng ({activeLangTab.toUpperCase()})
              </label>
              <p className="text-[10px] text-text-secondary leading-snug">
                Tải lên file ghi âm thuyết minh riêng (.mp3, .wav) để thay thế cho giọng đọc AI mặc định.
              </p>
              
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold hover:bg-border transition-colors cursor-pointer select-none">
                  {uploadingAudio ? (
                    <Loader2 className="animate-spin text-primary" size={14} />
                  ) : (
                    <Upload size={14} className="text-text-secondary" />
                  )}
                  <span>Chọn file tải lên</span>
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={uploadingAudio || saving}
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </label>

                {translations[activeLangTab].audioUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-teal-600 font-bold">
                    <Check size={14} />
                    <span>Đã tải lên audio custom</span>
                    <a 
                      href={translations[activeLangTab].audioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-1 hover:bg-teal-50 border border-teal-200 rounded text-teal-700 ml-1.5"
                    >
                      <Play size={10} className="fill-current" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Map coordinates picker & Operating Hours */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm min-h-[350px]">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm sm:text-base text-text-primary">
                  Chấm Vị Trí Trên Bản Đồ
                </h3>
                <p className="text-[10px] text-text-secondary">
                  Click trực tiếp vào bản đồ để lấy tọa độ chính xác của địa điểm
                </p>
              </div>
              <MapPin className="text-primary animate-bounce" size={20} />
            </div>

            {/* Map Picker viewport */}
            <div className="h-64 rounded-xl overflow-hidden border border-border shadow-inner relative">
              <MapView onMapClick={handleMapClick}>
                <POIMarker
                  poi={mockPoiListItem}
                  isSelected={true}
                  onDetailClick={() => {}}
                />
              </MapView>
            </div>

            {/* Coordinate numbers */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-secondary">
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

          {/* Operating hours card */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="font-display font-bold text-xs uppercase text-text-primary tracking-wider border-b border-border/40 pb-2">
              Thời gian hoạt động (Operating Hours)
            </h3>
            
            <div className="flex flex-col gap-3.5">
              {operatingHours.map((item, index) => (
                <div key={item.day} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold w-20 text-text-secondary">{getDayName(item.day)}</span>
                  
                  <div className="flex items-center gap-1.5 flex-1 justify-center">
                    <input
                      type="text"
                      disabled={item.closed || saving}
                      value={item.open}
                      onChange={(e) => {
                        const updated = [...operatingHours];
                        updated[index].open = e.target.value;
                        setOperatingHours(updated);
                      }}
                      placeholder="08:00"
                      className="w-16 h-8 text-center rounded-lg border border-border bg-card font-mono text-xs focus:border-primary focus:outline-none"
                    />
                    <span className="text-text-muted">-</span>
                    <input
                      type="text"
                      disabled={item.closed || saving}
                      value={item.close}
                      onChange={(e) => {
                        const updated = [...operatingHours];
                        updated[index].close = e.target.value;
                        setOperatingHours(updated);
                      }}
                      placeholder="22:00"
                      className="w-16 h-8 text-center rounded-lg border border-border bg-card font-mono text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-text-secondary">
                    <input
                      type="checkbox"
                      checked={item.closed}
                      disabled={saving}
                      onChange={(e) => {
                        const updated = [...operatingHours];
                        updated[index].closed = e.target.checked;
                        setOperatingHours(updated);
                      }}
                      className="rounded text-primary focus:ring-primary/20 w-4 h-4"
                    />
                    <span>Đóng cửa</span>
                  </label>
                </div>
              ))}
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
                <span>Lưu địa điểm</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
