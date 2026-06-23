import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '@/api/owner';
import { uploadApi } from '@/api/upload';
import { api } from '@/api/client';
import { ArrowLeft, Save, Loader2, MapPin, Upload, Play, Check, ImagePlus, X, Search, Link as LinkIcon, AlertCircle } from 'lucide-react';
import MapView from '@/components/map/MapView';
import { useToast } from '@/components/ui/Toast';
import { useMap } from '@/contexts/MapContext';
import { MAPBOX_TOKEN } from '@/utils/constants';

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

const normalizeAddressQuery = (query: string): string => {
  let normalized = query;
  // Replace "đường/duong [số]" with "đường số / duong so [số]"
  normalized = normalized.replace(/(đường|duong)\s+(\d+)\b/gi, (_, p1, p2) => {
    const isNoAccent = p1.toLowerCase() === 'duong';
    return isNoAccent ? `duong so ${p2}` : `đường số ${p2}`;
  });
  // Replace "đ. [số]" or "d. [số]" with "đường số [số]"
  normalized = normalized.replace(/(đ\.|d\.)\s*(\d+)\b/gi, 'đường số $2');
  return normalized;
};

export default function POIFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { success, error: toastError } = useToast();
  
  const isEditMode = !!id;
  const poiId = id ? parseInt(id, 10) : null;

  // Form states
  const [categories, setCategories] = useState<{ id: string; name: string; nameEn: string }[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [priceRange, setPriceRange] = useState('1');
  const [latitude, setLatitude] = useState(10.758);
  const [longitude, setLongitude] = useState(106.699);
  const [triggerRadiusMeters, setTriggerRadiusMeters] = useState(50);
  const [imageUrl, setImageUrl] = useState('');
  const [operatingHours, setOperatingHours] = useState<OperatingHourItem[]>(DEFAULT_HOURS);

  // Translation state (Tabs)
  const [activeLangTab, setActiveLangTab] = useState<'vi' | 'en'>('vi');
  const [translations, setTranslations] = useState({
    vi: { name: '', shortDescription: '', fullDescription: '', audioText: '', audioUrl: '' },
    en: { name: '', shortDescription: '', fullDescription: '', audioText: '', audioUrl: '' },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSource, setImageSource] = useState<'upload' | 'url' | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Space photos states
  const [spacePhotos, setSpacePhotos] = useState<{ id: number; imageUrl: string }[]>([]);
  const [uploadingSpacePhoto, setUploadingSpacePhoto] = useState(false);

  // Address geocoding states
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isProgrammaticCenterRef = useRef(false);

  // Map context for flyTo
  const { map } = useMap();

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



  // Load POI details
  useEffect(() => {
    if (!isEditMode || !poiId) return;

    let isSubscribed = true;
    const fetchPOIDetails = async () => {
      setLoading(true);
      try {
        const { data } = await ownerApi.getMyPOI(poiId, 'en');
        if (!isSubscribed || !data) return;

        setName(data.name);
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
        if (data.images) {
          setSpacePhotos(data.images.map((img: any) => ({ id: img.id, imageUrl: img.imageUrl })));
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

        // Fetch custom audios if any
        const audiosRes = await api.get<any[]>(`/owner/pois/${poiId}/audio`).catch(() => ({ data: [] }));
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
  }, [poiId, isEditMode]);

  // Close address suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressContainerRef.current && !addressContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Reverse geocode ──────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=vi&limit=1`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        setAddress(data.features[0].place_name);
      }
    } catch {
      // silently fail
    }
  }, []);

  const handleMapClick = (lngLat: [number, number]) => {
    if (map) {
      map.easeTo({ center: lngLat, duration: 400 });
    }
  };

  // Listen to map move events to update coordinates and reverse geocode
  useEffect(() => {
    if (!map) return;

    const onMove = () => {
      const center = map.getCenter();
      setLongitude(center.lng);
      setLatitude(center.lat);
    };

    const onMoveEnd = () => {
      if (isProgrammaticCenterRef.current) {
        isProgrammaticCenterRef.current = false;
        return;
      }
      const center = map.getCenter();
      reverseGeocode(center.lng, center.lat);
    };

    map.on('move', onMove);
    map.on('moveend', onMoveEnd);

    return () => {
      map.off('move', onMove);
      map.off('moveend', onMoveEnd);
    };
  }, [map, reverseGeocode]);

  // Center map on POI coordinates when editing or when coordinates load initially
  useEffect(() => {
    if (map && isEditMode && latitude && longitude) {
      isProgrammaticCenterRef.current = true;
      map.setCenter([longitude, latitude]);
    }
  }, [map, isEditMode]);

  // ─── Address geocoding ────────────────────────────────────────────
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchingAddress(true);
    try {
      const normalizedQuery = normalizeAddressQuery(query);
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?access_token=${MAPBOX_TOKEN}&country=VN&language=vi&limit=5&types=address,poi,locality,neighborhood,place&proximity=${longitude},${latitude}`
      );
      const data = await res.json();
      setAddressSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  }, [longitude, latitude]);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(() => searchAddress(value), 400);
  };

  const handleAddressSelect = (feature: any) => {
    setAddress(feature.place_name);
    setLongitude(feature.center[0]);
    setLatitude(feature.center[1]);
    setShowSuggestions(false);
    if (map) {
      isProgrammaticCenterRef.current = true;
      map.flyTo({ center: [feature.center[0], feature.center[1]], zoom: 17, duration: 1500 });
    }
  };

  // ─── Image handlers ───────────────────────────────────────────────
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
      success(t('owner.pois.imageUploaded', 'Tải lên ảnh đại diện thành công!'));
    } catch {
      setImageError(t('owner.pois.imageUploadFailed', 'Tải lên ảnh thất bại. Vui lòng thử lại.'));
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

  const handleSpacePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    setUploadingSpacePhoto(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const { data: uploadRes } = await uploadApi.uploadPOIImage(file);
        urls.push(uploadRes.url);
      }
      
      if (poiId) {
        await ownerApi.addPOIImages(poiId, urls);
        const { data: poiRes } = await ownerApi.getMyPOI(poiId, 'en');
        if (poiRes.images) {
          setSpacePhotos(poiRes.images.map((img: any) => ({ id: img.id, imageUrl: img.imageUrl })));
        }
      } else {
        setSpacePhotos((prev) => [
          ...prev,
          ...urls.map((url, idx) => ({ id: -Math.random() - idx, imageUrl: url }))
        ]);
      }
      success(t('owner.pois.photosUploaded', 'Tải lên ảnh không gian thành công!'));
    } catch (err) {
      console.error('Failed to upload space photos:', err);
      toastError(t('owner.pois.photosUploadFailed', 'Tải ảnh không gian thất bại.'));
    } finally {
      setUploadingSpacePhoto(false);
    }
  };

  const handleDeleteSpacePhoto = async (photoId: number, imageUrl: string) => {
    if (!window.confirm(t('owner.pois.deletePhotoConfirm', 'Xác nhận xoá ảnh này khỏi album?'))) return;
    
    try {
      if (photoId > 0 && poiId) {
        await ownerApi.deletePOIImage(poiId, photoId);
        setSpacePhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        setSpacePhotos((prev) => prev.filter((p) => p.id !== photoId || p.imageUrl !== imageUrl));
      }
      success(t('owner.pois.photoDeleted', 'Đã xoá ảnh thành công.'));
    } catch (err) {
      console.error('Failed to delete space photo:', err);
      toastError(t('owner.pois.photoDeleteFailed', 'Xoá ảnh thất bại.'));
    }
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
      success(t('owner.pois.audioUploaded', 'Tải lên âm thanh thành công!'));
    } catch (err) {
      console.error('Failed to upload audio:', err);
      toastError(t('owner.pois.audioUploadFailed', 'Tải lên âm thanh thất bại.'));
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = translations.vi.name || translations.en.name || name;
    if (!finalName.trim()) {
      toastError(t('owner.pois.nameRequired', 'Vui lòng nhập tên địa điểm'));
      return;
    }
    if (phone.trim() !== '') {
      const phoneRegex = /^(?:\+84|0)\d{9,10}$/;
      if (!phoneRegex.test(phone.trim().replace(/\s+/g, ''))) {
        toastError(t('owner.pois.invalidPhone', 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại gồm 10-11 chữ số bắt đầu bằng 0 hoặc +84.'));
        return;
      }
    }
    if (!latitude || !longitude) {
      toastError(t('owner.pois.coordsRequired', 'Vui lòng chấm tọa độ trên bản đồ'));
      return;
    }

    const payload = {
      name: finalName,
      slug: '', // Auto-generated by backend
      category,
      address,
      phone,
      priceRange,
      latitude,
      longitude,
      triggerRadiusMeters,
      imageUrl,
      operatingHours: JSON.stringify(operatingHours),
    };

    setSaving(true);
    try {
      let savedPoiId = poiId;
      if (isEditMode && poiId) {
        await ownerApi.updatePOI(poiId, payload);
      } else {
        const { data } = await ownerApi.createPOI(payload);
        savedPoiId = data.id;
        if (savedPoiId && spacePhotos.length > 0) {
          const tempUrls = spacePhotos.map(p => p.imageUrl);
          await ownerApi.addPOIImages(savedPoiId, tempUrls);
        }
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
          audioPromises.push(ownerApi.saveCustomAudio(savedPoiId, {
            languageCode: 'vi',
            filePath: translations.vi.audioUrl,
            durationSeconds: 120, // default estimation
          }));
        }
        if (translations.en.audioUrl) {
          audioPromises.push(ownerApi.saveCustomAudio(savedPoiId, {
            languageCode: 'en',
            filePath: translations.en.audioUrl,
            durationSeconds: 120,
          }));
        }
        await Promise.all(audioPromises);
      }

      success(isEditMode 
        ? t('owner.pois.updateSuccess', 'Cập nhật địa điểm thành công! Chờ duyệt lại.') 
        : t('owner.pois.createSuccess', 'Đăng ký địa điểm mới thành công! Chờ duyệt.')
      );
      navigate('/owner/pois');
    } catch (err: any) {
      console.error('Failed to save POI:', err);
      toastError(t('owner.pois.saveFailed', 'Lưu địa điểm thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (day: number, t: any) => {
    const days = [
      t('days.sunday', 'Chủ Nhật'),
      t('days.monday', 'Thứ Hai'),
      t('days.tuesday', 'Thứ Ba'),
      t('days.wednesday', 'Thứ Tư'),
      t('days.thursday', 'Thứ Năm'),
      t('days.friday', 'Thứ Sáu'),
      t('days.saturday', 'Thứ Bảy')
    ];
    return days[day];
  };



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
        <div className="flex flex-col gap-6">
          {/* Core Info card */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="font-display font-bold text-xs uppercase text-text-primary tracking-wider border-b border-border/40 pb-2">
              Thông tin chung
            </h3>

            {/* Grid Category + Phone + Price Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {i18n.language === 'vi' ? cat.name : cat.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {t('poi.priceRange', 'Mức giá')} *
                </label>
                <select
                  disabled={saving}
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                >
                  <option value="1">{t('filter.priceBudget', 'Bình dân')}</option>
                  <option value="2">{t('filter.priceMidrange', 'Trung bình')}</option>
                  <option value="3">{t('filter.priceUpscale', 'Khá')}</option>
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

            {/* Address with Geocoding Autocomplete */}
            <div className="flex flex-col gap-1" ref={addressContainerRef}>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {t('owner.pois.fieldAddress', 'Địa chỉ')}
              </label>
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    disabled={saving}
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                    placeholder="Nhập địa chỉ để tìm kiếm..."
                    className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  />
                  {searchingAddress && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />
                  )}
                </div>

                {/* Address Suggestions Dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {addressSuggestions.map((feature, idx) => (
                      <button
                        key={feature.id || idx}
                        type="button"
                        onClick={() => handleAddressSelect(feature)}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors cursor-pointer border-b border-border/30 last:border-b-0"
                      >
                        <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">{feature.text}</p>
                          <p className="text-[10px] text-text-secondary truncate">{feature.place_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">
                Nhập địa chỉ để xem gợi ý, hoặc click trên bản đồ để chọn vị trí
              </p>
            </div>

            {/* Cover Photo - Upload + URL + Preview */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {t('owner.pois.fieldCoverUrl', 'Ảnh đại diện cửa hàng')}
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
                  VN Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeLangTab === 'en' ? 'bg-card text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  EN English
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
                placeholder="Văn bản cho hướng dẫn viên AI đọc thuyết minh..."
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
                Tải lên file ghi âm thuyết minh riêng của quán (.mp3, .wav) để thay thế cho giọng đọc AI mặc định.
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
                  {t('owner.pois.pickerTitle', 'Chấm Vị Trí Trên Bản Đồ')}
                </h3>
                <p className="text-[10px] text-text-secondary">
                  {t('owner.pois.pickerDesc', 'Click trực tiếp vào vị trí cửa hàng để lấy tọa độ tự động')}
                </p>
              </div>
              <MapPin className="text-primary animate-bounce" size={20} />
            </div>

            {/* Map Picker viewport */}
            <div className="h-64 rounded-xl overflow-hidden border border-border shadow-inner relative flex items-center justify-center">
              <MapView onMapClick={handleMapClick} />
              
              {/* Static Center Pin Overlay (Grab/Uber Style) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 flex flex-col items-center">
                {/* Tooltip instruction */}
                <div className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap mb-1">
                  📍 Vị trí cửa hàng
                </div>
                {/* Pin Icon */}
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary border-2 border-white shadow-xl text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                {/* Little pointer triangle */}
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-primary -mt-0.5"></div>
              </div>
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
                  <span className="font-bold w-20 text-text-secondary">{getDayName(item.day, t)}</span>
                  
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
                    <span>{t('owner.pois.closed', 'Đóng cửa')}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Space Photos Gallery Card */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="font-display font-bold text-xs uppercase text-text-primary tracking-wider border-b border-border/40 pb-2">
              📸 Album ảnh Không gian quán
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {spacePhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-video rounded-xl overflow-hidden border border-border group bg-surface-alt">
                  <img src={photo.imageUrl} alt="Space" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteSpacePhoto(photo.id, photo.imageUrl)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-danger text-white rounded-full transition-colors cursor-pointer outline-none opacity-0 group-hover:opacity-100"
                    title="Xoá ảnh"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Upload Trigger */}
              <label className="aspect-video border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-text-secondary select-none">
                {uploadingSpacePhoto ? (
                  <Loader2 className="animate-spin text-primary" size={18} />
                ) : (
                  <>
                    <ImagePlus size={20} className="text-text-muted" />
                    <span className="text-[10px] font-semibold">{t('owner.pois.addPhoto', 'Thêm ảnh')}</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingSpacePhoto || saving}
                  onChange={handleSpacePhotoUpload}
                  className="hidden"
                />
              </label>
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
