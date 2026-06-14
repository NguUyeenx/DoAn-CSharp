import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toursApi } from '@/api/tours';
import { poisApi } from '@/api/pois';
import type { TourStop } from '@/types/api';
import type { POIListItem } from '@/types/poi';
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function TourFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { success, error: toastError } = useToast();

  const isEditMode = !!id;
  const tourId = id ? parseInt(id, 10) : null;

  // Tour Meta form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [distanceKm, setDistanceKm] = useState(1.5);
  const [isActive, setIsActive] = useState(true);

  // Tour stops list
  const [stops, setStops] = useState<TourStop[]>([]);
  const [pois, setPois] = useState<POIListItem[]>([]);

  // Add Stop form
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [transitionNote, setTransitionNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingStop, setAddingStop] = useState(false);

  // 1. Fetch Tour info & POIs list
  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        const { data } = await poisApi.getAll();
        setPois(data);
        if (data.length > 0) {
          setSelectedPoiId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load POIs:', err);
      }
    };

    fetchPOIs();
  }, []);

  useEffect(() => {
    if (!isEditMode || !tourId) return;

    let isSubscribed = true;
    const fetchTourDetails = async () => {
      setLoading(true);
      try {
        const { data } = await toursApi.getById(tourId, i18n.language);
        if (isSubscribed && data) {
          setName(data.name);
          setDescription(data.description);
          setEstimatedMinutes(data.estimatedMinutes);
          setDistanceKm(data.distanceKm);
          setIsActive(data.isActive);
          setStops(data.stops || []);
        }
      } catch (err) {
        console.error('Failed to load tour details:', err);
        toastError('Failed to fetch tour route details.');
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchTourDetails();

    return () => {
      isSubscribed = false;
    };
  }, [tourId, isEditMode, i18n.language, toastError]);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Tour name is required.');
      return;
    }

    const payload = {
      name,
      description,
      estimatedMinutes,
      distanceKm,
      isActive,
    };

    setSaving(true);
    try {
      if (isEditMode && tourId) {
        await toursApi.adminUpdate(tourId, payload);
        success('Tour info updated successfully!');
      } else {
        const { data } = await toursApi.adminCreate(payload);
        success('Tour created successfully! You can now configure itinerary stops.');
        navigate(`/admin/tours/${data.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to save tour metadata:', err);
      toastError('Failed to save tour information.');
    } finally {
      setSaving(false);
    }
  };

  // Add stop
  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourId || !selectedPoiId) return;

    const stopOrder = stops.length + 1;
    setAddingStop(true);
    try {
      await toursApi.adminAddStop(tourId, {
        poiId: selectedPoiId,
        stopOrder,
        transitionNote,
      });

      success('Stop added to tour route!');
      setTransitionNote('');
      
      // reload stops
      const { data } = await toursApi.getById(tourId, i18n.language);
      setStops(data.stops || []);
    } catch (err) {
      console.error('Failed to add stop:', err);
      toastError('Failed to add stop.');
    } finally {
      setAddingStop(false);
    }
  };

  // Remove stop
  const handleRemoveStop = async (poiId: number) => {
    if (!tourId) return;
    if (!window.confirm('Remove this stop from the walking tour?')) return;

    try {
      await toursApi.adminRemoveStop(tourId, poiId);
      success('Stop removed.');
      setStops((prev) => prev.filter((s) => s.poiId !== poiId));
    } catch (err) {
      console.error('Failed to remove stop:', err);
      toastError('Failed to remove stop.');
    }
  };

  // Reordering: swap stop order indices
  const handleMoveStop = async (index: number, direction: 'up' | 'down') => {
    if (!tourId) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stops.length - 1) return;

    const newStops = [...stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    // Reset stopOrder index numbers
    const updatedOrders = newStops.map((stop, i) => ({
      poiId: stop.poiId,
      stopOrder: i + 1,
    }));

    try {
      await toursApi.adminReorderStops(tourId, updatedOrders);
      // Re-update local state with proper order index
      setStops(
        newStops.map((s, i) => ({
          ...s,
          stopOrder: i + 1,
        }))
      );
      success('Route stops reordered!');
    } catch (err) {
      console.error('Failed to reorder stops:', err);
      toastError('Failed to save route stops ordering.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading tour form...</span>
      </div>
    );
  }

  const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/tours"
          className="p-1.5 rounded-full hover:bg-card border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {isEditMode ? 'Edit Tour & Itinerary' : 'Create Walking Tour'}
          </h2>
          <p className="text-xs text-text-secondary">
            Configure metadata, estimated durations, and order points of interest stops
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: Meta info */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm h-fit">
          <h3 className="font-display font-bold text-sm sm:text-base text-text-primary border-b border-border/40 pb-2.5">
            Tour Information
          </h3>

          <form onSubmit={handleSaveMeta} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tour Name *</label>
              <input
                type="text"
                disabled={saving}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Seafood Lovers Trail..."
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Description</label>
              <textarea
                disabled={saving}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary introducing the trail to tourists..."
                rows={4}
                className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-y"
              />
            </div>

            {/* Grid Mins + Km */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Duration (Minutes)</label>
                <input
                  type="number"
                  disabled={saving}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Distance (Km)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={saving}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
                />
              </div>
            </div>

            {/* Active Checkbox */}
            <label className="flex items-center gap-2.5 mt-1 select-none cursor-pointer">
              <input
                type="checkbox"
                disabled={saving}
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4.5 h-4.5 text-primary border-border bg-card rounded-md focus:ring-primary/10 accent-primary cursor-pointer"
              />
              <span className="text-xs font-semibold text-text-secondary">Visible to public visitors</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 h-10 w-full rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-md cursor-pointer outline-none"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save Tour Details</span>
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: Stops Manager */}
        <div className="flex flex-col gap-4">
          {isEditMode ? (
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="font-display font-bold text-sm sm:text-base text-text-primary border-b border-border/40 pb-2.5">
                Itinerary Route Stops
              </h3>

              {/* Add stop Form */}
              <form onSubmit={handleAddStop} className="flex flex-col gap-3 bg-surface-alt border border-border p-3 rounded-xl text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase tracking-wider">Select Food Spot</label>
                  <select
                    disabled={addingStop}
                    value={selectedPoiId || ''}
                    onChange={(e) => setSelectedPoiId(parseInt(e.target.value) || null)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-card text-xs focus:border-primary outline-none cursor-pointer"
                  >
                    {pois.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-text-secondary uppercase tracking-wider">Transition Guide / Advice</label>
                  <input
                    type="text"
                    disabled={addingStop}
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                    placeholder="e.g. Walk 50m north then cross the intersection..."
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-card text-xs focus:border-primary outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingStop}
                  className="h-8 rounded-lg bg-accent text-white font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
                >
                  {addingStop ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  <span>Add Stop</span>
                </button>
              </form>

              {/* Stops list with reorder Up/Down arrows */}
              <div className="space-y-2.5 mt-2">
                <h4 className="font-display font-bold text-xs uppercase text-text-muted tracking-wider">Itinerary Route Checklist</h4>
                {sortedStops.length === 0 ? (
                  <div className="text-center py-6 text-xs text-text-muted">No stops added to this tour route yet.</div>
                ) : (
                  sortedStops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="p-3 bg-surface-alt border border-border rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-primary text-white font-display font-bold text-[10px] flex items-center justify-center border border-white shrink-0 mt-0.5">
                          {stop.stopOrder}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-text-primary leading-tight truncate">{stop.poiName}</h5>
                          {stop.transitionNote && (
                            <p className="text-[10px] text-primary italic font-medium leading-normal mt-0.5 line-clamp-1">
                              {stop.transitionNote}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls: Up, Down, Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveStop(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-md transition-all disabled:opacity-40 outline-none"
                          title="Move Up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStop(index, 'down')}
                          disabled={index === sortedStops.length - 1}
                          className="p-1.5 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-md transition-all disabled:opacity-40 outline-none"
                          title="Move Down"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(stop.poiId)}
                          className="p-1.5 border border-border bg-card text-danger hover:border-danger/40 hover:bg-danger/5 rounded-md transition-all outline-none"
                          title="Remove Stop"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-text-muted text-xs leading-relaxed">
              Create the basic walking tour first. Once saved, you can add and sequence points of interest stops.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
