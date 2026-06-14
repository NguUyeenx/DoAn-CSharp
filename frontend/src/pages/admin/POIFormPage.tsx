import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { poisApi } from '@/api/pois';
import { api } from '@/api/client';
import { ArrowLeft, Save, Loader2, MapPin } from 'lucide-react';
import MapView from '@/components/map/MapView';
import POIMarker from '@/components/map/POIMarker';
import { useToast } from '@/components/ui/Toast';

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
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [audioText, setAudioText] = useState('');
  const [latitude, setLatitude] = useState(10.758);
  const [longitude, setLongitude] = useState(106.699);
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
        const { data } = await poisApi.getById(poiId, i18n.language);
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
  }, [poiId, isEditMode, i18n.language, toastError]);

  const handleMapClick = (lngLat: [number, number]) => {
    setLongitude(lngLat[0]);
    setLatitude(lngLat[1]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('POI name is required');
      return;
    }
    if (!latitude || !longitude) {
      toastError('Coordinates are required');
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
      isActive: true,
      approvalStatus: 'approved',
    };

    setSaving(true);
    try {
      if (isEditMode && poiId) {
        await poisApi.update(poiId, payload);
        success('POI updated successfully!');
      } else {
        await poisApi.create(payload);
        success('New POI created successfully!');
      }
      navigate('/admin/pois');
    } catch (err: any) {
      console.error('Failed to save POI:', err);
      toastError('Failed to save details.');
    } finally {
      setSaving(false);
    }
  };

  const mockPoiListItem = useMemo(() => {
    return {
      id: poiId || -99,
      name: name || 'Preview Spot',
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
  }, [poiId, name, slugForm, latitude, longitude, category, imageUrl, shortDescription]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading details...</span>
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
            {isEditMode ? 'Edit Food Spot' : 'Add Food Spot'}
          </h2>
          <p className="text-xs text-text-secondary">
            Configure metadata, geographic pins, PWA cover images, and audio transcriptions
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: Fields */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Name *</label>
            <input
              type="text"
              disabled={saving}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oc Oanh..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Slug</label>
            <input
              type="text"
              disabled={saving}
              value={slugForm}
              onChange={(e) => setSlugForm(e.target.value)}
              placeholder="e.g. oc-oanh"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Category & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Category *</label>
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
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Phone</label>
              <input
                type="text"
                disabled={saving}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Address</label>
            <input
              type="text"
              disabled={saving}
              value={address}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Cover Image URL</label>
            <input
              type="url"
              disabled={saving}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Short Desc */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Short Description</label>
            <textarea
              disabled={saving}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
            />
          </div>

          {/* Full Desc */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Full Description</label>
            <textarea
              disabled={saving}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-y"
            />
          </div>

          {/* Audio Text */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Audio Text (for TTS)</label>
            <textarea
              disabled={saving}
              value={audioText}
              onChange={(e) => setAudioText(e.target.value)}
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
                <h3 className="font-display font-extrabold text-sm sm:text-base text-text-primary">Geographic Coordinates</h3>
                <p className="text-[10px] text-text-secondary">Click on the map to automatically position the marker</p>
              </div>
              <MapPin className="text-primary animate-bounce" size={20} />
            </div>

            <div className="flex-1 h-64 lg:h-auto rounded-xl overflow-hidden border border-border shadow-inner relative">
              <MapView onMapClick={handleMapClick}>
                <POIMarker
                  poi={mockPoiListItem}
                  isSelected={true}
                  onDetailClick={() => {}}
                />
              </MapView>
            </div>

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

          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full rounded-2xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-md cursor-pointer outline-none shrink-0"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Save Location</span>
          </button>
        </div>
      </form>
    </div>
  );
}
