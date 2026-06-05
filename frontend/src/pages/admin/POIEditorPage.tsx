import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Edit, 
  Trash2, 
  QrCode, 
  Languages, 
  Save, 
  RefreshCw,
  FolderOpen,
  MapPin,
  X
} from 'lucide-react';

import { api } from '../../services/api';
import type { POIListDto, POI, TranslationDto } from '../../types/poi';

interface POIFormInput {
  name: string;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  category: string;
  priority: number;
  imageUrl?: string;
  googleMapsUrl?: string;
}

interface TranslationFormInput {
  poiId: number;
  languageCode: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  audioText: string;
}

export default function POIEditorPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'list' | 'translation' | 'qr'>('list');

  // Form states
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [poiForm, setPoiForm] = useState<POIFormInput>({
    name: '',
    latitude: 10.7568,
    longitude: 106.7021,
    triggerRadiusMeters: 30,
    category: 'restaurant',
    priority: 5,
    imageUrl: '',
    googleMapsUrl: ''
  });

  const [translationForm, setTranslationForm] = useState<TranslationFormInput>({
    poiId: 0,
    languageCode: 'en',
    name: '',
    shortDescription: '',
    fullDescription: '',
    audioText: ''
  });

  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  // Fetch active POI list
  const { data: pois = [], isLoading } = useQuery<POIListDto[]>({
    queryKey: ['adminPois'],
    queryFn: () => api.get<POIListDto[]>('/pois?lang=vi') // Vietnamese list for admin base
  });

  // Mutators
  const createPoiMutation = useMutation({
    mutationFn: (newPoi: POIFormInput) => api.post<POI>('/admin/pois', newPoi),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPois'] });
      resetPoiForm();
    }
  });

  const updatePoiMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: POIFormInput }) => 
      api.put<POI>(`/admin/pois/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPois'] });
      resetPoiForm();
    }
  });

  const deletePoiMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/pois/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPois'] });
    }
  });

  const upsertTranslationMutation = useMutation({
    mutationFn: (trans: TranslationFormInput) => 
      api.post<TranslationDto>('/admin/translations', trans),
    onSuccess: () => {
      alert('Translation saved successfully!');
      resetTranslationForm();
    }
  });

  const generateQrMutation = useMutation({
    mutationFn: (poiId: number) => 
      api.post<{ qrImageUrl: string }>(`/admin/qr/generate/${poiId}`, {}),
    onSuccess: (res) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL 
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') 
        : 'http://localhost:5011';
      setQrImageUrl(`${baseUrl}${res.qrImageUrl}`);
    },
    onError: (err) => {
      console.error('QR generation error:', err);
      alert('Failed to generate QR Code. Verify directory exists.');
    }
  });

  // Helper actions
  const resetPoiForm = () => {
    setPoiForm({
      name: '',
      latitude: 10.7568,
      longitude: 106.7021,
      triggerRadiusMeters: 30,
      category: 'restaurant',
      priority: 5,
      imageUrl: '',
      googleMapsUrl: ''
    });
    setIsEditing(false);
    setSelectedPoiId(null);
  };

  const resetTranslationForm = () => {
    setTranslationForm({
      poiId: 0,
      languageCode: 'en',
      name: '',
      shortDescription: '',
      fullDescription: '',
      audioText: ''
    });
  };

  const handleEditClick = async (poi: POIListDto) => {
    try {
      const detail = await api.get<POI>(`/pois/${poi.id}?lang=vi`);
      setSelectedPoiId(poi.id);
      setPoiForm({
        name: detail.name,
        latitude: detail.latitude,
        longitude: detail.longitude,
        triggerRadiusMeters: detail.triggerRadiusMeters,
        category: detail.category,
        priority: detail.priority,
        imageUrl: detail.imageUrl || '',
        googleMapsUrl: detail.googleMapsUrl || ''
      });
      setIsEditing(true);
    } catch (err) {
      console.error('Failed to fetch POI detail for edit:', err);
    }
  };

  const handleSavePoi = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedPoiId !== null) {
      updatePoiMutation.mutate({ id: selectedPoiId, data: poiForm });
    } else {
      createPoiMutation.mutate(poiForm);
    }
  };

  const handleSaveTranslation = (e: React.FormEvent) => {
    e.preventDefault();
    if (translationForm.poiId === 0) {
      alert('Please select a Point of Interest first.');
      return;
    }
    upsertTranslationMutation.mutate(translationForm);
  };

  const handleGenerateQR = (poiId: number) => {
    setSelectedPoiId(poiId);
    setQrImageUrl(null);
    generateQrMutation.mutate(poiId);
    setActiveTab('qr');
  };

  const handleTranslationSelectPoi = async (poiId: number) => {
    if (poiId === 0) return;
    
    // Load existing translation if available
    try {
      const lang = translationForm.languageCode;
      const res = await api.get<TranslationDto>(`/translations/${poiId}/${lang}`);
      setTranslationForm({
        poiId,
        languageCode: lang,
        name: res.name,
        shortDescription: res.shortDescription,
        fullDescription: res.fullDescription,
        audioText: res.audioText
      });
    } catch {
      // Fallback empty translation
      setTranslationForm(prev => ({
        ...prev,
        poiId,
        name: '',
        shortDescription: '',
        fullDescription: '',
        audioText: ''
      }));
    }
  };

  return (
    <div className="p-6 text-white flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">POI CMS Editor</h1>
          <p className="text-xs text-zinc-400">
            Create, update, translate, or generate signs for walking tour destinations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-900 pb-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'list' 
              ? 'bg-zinc-900 border border-zinc-800 text-emerald-400' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>POI CRUD List</span>
        </button>

        <button
          onClick={() => setActiveTab('translation')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'translation' 
              ? 'bg-zinc-900 border border-zinc-800 text-emerald-400' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>Translation Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'qr' 
              ? 'bg-zinc-900 border border-zinc-800 text-emerald-400' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Image CMS</span>
        </button>
      </div>

      {/* Content Render panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tab 1: POI List & CRUD Editor */}
        {activeTab === 'list' && (
          <>
            {/* List side */}
            <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl flex flex-col gap-4">
              <h3 className="font-bold text-base border-b border-zinc-900 pb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>Active Point of Interest Destinations</span>
              </h3>

              {isLoading ? (
                <div className="text-zinc-500 py-8 text-center text-xs">Loading CMS list...</div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto custom-scrollbar">
                  {pois.map((poi) => (
                    <div 
                      key={poi.id}
                      className="flex items-center justify-between p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-all text-sm"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-zinc-200">{poi.name}</span>
                        <span className="text-[10px] text-zinc-500 capitalize">{poi.category} • priority: {pois.indexOf(poi) + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(poi)}
                          className="p-1.5 hover:bg-zinc-850 rounded border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Edit POI"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateQR(poi.id)}
                          className="p-1.5 hover:bg-zinc-850 rounded border border-zinc-800 text-amber-400 hover:text-amber-300 transition-colors"
                          title="Generate QR Sign"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Soft delete POI: ${poi.name}?`)) {
                              deletePoiMutation.mutate(poi.id);
                            }
                          }}
                          className="p-1.5 hover:bg-zinc-850 rounded border border-zinc-800 text-red-500 hover:text-red-400 transition-colors"
                          title="Soft Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form side */}
            <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex flex-col gap-4">
              <h3 className="font-bold text-base border-b border-zinc-900 pb-2">
                {isEditing ? 'Update Spot Details' : 'Create New Spot'}
              </h3>
              <form onSubmit={handleSavePoi} className="flex flex-col gap-3 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Spot Name</label>
                  <input
                    type="text"
                    required
                    value={poiForm.name}
                    onChange={(e) => setPoiForm({ ...poiForm, name: e.target.value })}
                    className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={poiForm.latitude}
                      onChange={(e) => setPoiForm({ ...poiForm, latitude: parseFloat(e.target.value) })}
                      className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={poiForm.longitude}
                      onChange={(e) => setPoiForm({ ...poiForm, longitude: parseFloat(e.target.value) })}
                      className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Geofence (m)</label>
                    <input
                      type="number"
                      required
                      value={poiForm.triggerRadiusMeters}
                      onChange={(e) => setPoiForm({ ...poiForm, triggerRadiusMeters: parseInt(e.target.value) })}
                      className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Priority</label>
                    <input
                      type="number"
                      required
                      value={poiForm.priority}
                      onChange={(e) => setPoiForm({ ...poiForm, priority: parseInt(e.target.value) })}
                      className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Category</label>
                  <select
                    value={poiForm.category}
                    onChange={(e) => setPoiForm({ ...poiForm, category: e.target.value })}
                    className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="temple">Temple</option>
                    <option value="market">Market</option>
                    <option value="park">Park</option>
                    <option value="landmark">Landmark</option>
                    <option value="street_art">Street Art</option>
                    <option value="street_food">Street Food</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Image Relative URL</label>
                  <input
                    type="text"
                    value={poiForm.imageUrl}
                    onChange={(e) => setPoiForm({ ...poiForm, imageUrl: e.target.value })}
                    className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Google Maps URL</label>
                  <input
                    type="text"
                    value={poiForm.googleMapsUrl}
                    onChange={(e) => setPoiForm({ ...poiForm, googleMapsUrl: e.target.value })}
                    className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Spot</span>
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetPoiForm}
                      className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold rounded-xl text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}

        {/* Tab 2: Translation Editor Form */}
        {activeTab === 'translation' && (
          <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-bold text-base border-b border-zinc-900 pb-2 flex items-center gap-2">
              <Languages className="w-5 h-5 text-emerald-400" />
              <span>Bilingual Translation Editor Form</span>
            </h3>

            <form onSubmit={handleSaveTranslation} className="flex flex-col gap-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Select Target Spot</label>
                  <select
                    value={translationForm.poiId}
                    onChange={(e) => handleTranslationSelectPoi(parseInt(e.target.value))}
                    className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  >
                    <option value={0}>-- Select a Point of Interest --</option>
                    {pois.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Translation Language</label>
                  <select
                    value={translationForm.languageCode}
                    onChange={(e) => {
                      setTranslationForm(prev => ({ ...prev, languageCode: e.target.value }));
                      if (translationForm.poiId !== 0) {
                        handleTranslationSelectPoi(translationForm.poiId);
                      }
                    }}
                    className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="en">English (en)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="ko">Korean (ko)</option>
                    <option value="zh">Chinese (zh)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Translated Localized Name</label>
                <input
                  type="text"
                  required
                  value={translationForm.name}
                  onChange={(e) => setTranslationForm({ ...translationForm, name: e.target.value })}
                  className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none"
                  placeholder="e.g. Ba Lan Broken Rice"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Short Description (Summary Card)</label>
                <textarea
                  required
                  rows={2}
                  value={translationForm.shortDescription}
                  onChange={(e) => setTranslationForm({ ...translationForm, shortDescription: e.target.value })}
                  className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none resize-none"
                  placeholder="Summary shown in the discover explorer map sheets"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Full Description (Sight Details)</label>
                <textarea
                  required
                  rows={4}
                  value={translationForm.fullDescription}
                  onChange={(e) => setTranslationForm({ ...translationForm, fullDescription: e.target.value })}
                  className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none"
                  placeholder="Full historical context and specialties detail descriptions"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 tracking-wide uppercase">Audio Narration Script (Web Speech Text)</label>
                <textarea
                  required
                  rows={3}
                  value={translationForm.audioText}
                  onChange={(e) => setTranslationForm({ ...translationForm, audioText: e.target.value })}
                  className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none"
                  placeholder="Audio narrator voice script spoken by browser synthesis upon trigger"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors max-w-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Bilingual Translation</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: QR Code Generator display */}
        {activeTab === 'qr' && (
          <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex flex-col gap-5 items-center">
            <div className="w-full border-b border-zinc-900 pb-2 text-left">
              <h3 className="font-bold text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span>QR Sign Render Panel</span>
              </h3>
            </div>

            {generateQrMutation.isPending ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-zinc-500">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="text-xs font-semibold">Generating physical QR sign...</span>
              </div>
            ) : qrImageUrl ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="p-4 bg-white rounded-3xl shadow-xl border border-zinc-200">
                  <img
                    src={qrImageUrl}
                    alt="Generated QR Sign"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <div className="text-center flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-zinc-200">VKE-POI-{selectedPoiId?.toString().padStart(3, '0')} Sign rendered</span>
                  <span className="text-[10px] text-zinc-500 italic max-w-sm leading-normal">
                    This file is rendered statically at wwwroot/qrcodes/ and maps to the scanned walkthrough bottom sheet trigger.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setQrImageUrl(null);
                    setActiveTab('list');
                  }}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Return to CMS List
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-500 flex flex-col items-center gap-2">
                <X className="w-12 h-12 text-zinc-650" />
                <span className="text-xs font-medium">No active QR sign loaded in viewer.</span>
                <span className="text-[10px] text-zinc-600 max-w-xs">Click the QR icon next to any Point of Interest in the CRUD List tab to render one statically.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
