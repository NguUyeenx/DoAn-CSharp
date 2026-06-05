import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Edit, 
  Trash2, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Undo, 
  MapPin, 
  Clock, 
  Footprints,
  X
} from 'lucide-react';

import { api } from '../../services/api';
import type { POIListDto, TourDto, TourListDto } from '../../types/poi';

interface TourStopFormInput {
  poiId: number;
  stopOrder: number;
  transitionNote: string;
}

interface TourFormInput {
  name: string;
  description: string;
  estimatedMinutes: number;
  distanceKm: number;
  stops: TourStopFormInput[];
}

export default function ToursPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  
  const [form, setForm] = useState<TourFormInput>({
    name: '',
    description: '',
    estimatedMinutes: 30,
    distanceKm: 1.0,
    stops: []
  });

  // Fetch all active tours
  const { data: tours = [], isLoading: isLoadingTours } = useQuery<TourListDto[]>({
    queryKey: ['adminTours'],
    queryFn: () => api.get<TourListDto[]>('/tours?lang=vi')
  });

  // Fetch all active POIs to add to the tour stop options
  const { data: pois = [] } = useQuery<POIListDto[]>({
    queryKey: ['adminPoisList'],
    queryFn: () => api.get<POIListDto[]>('/pois?lang=vi')
  });

  // Mutation to create a tour
  const createTourMutation = useMutation({
    mutationFn: (newTour: TourFormInput) => api.post<TourDto>('/admin/tours', newTour),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] });
      resetForm();
    }
  });

  // Mutation to update a tour
  const updateTourMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TourFormInput }) => 
      api.put<TourDto>(`/admin/tours/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] });
      resetForm();
    }
  });

  // Mutation to delete a tour
  const deleteTourMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/tours/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] });
    }
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      estimatedMinutes: 30,
      distanceKm: 1.0,
      stops: []
    });
    setSelectedTourId(null);
    setView('list');
  };

  const handleCreateNew = () => {
    resetForm();
    setView('edit');
  };

  const handleEditTour = async (tour: TourListDto) => {
    setSelectedTourId(tour.id);
    try {
      // Fetch full details of the tour (including stops)
      const detail = await api.get<TourDto>(`/tours/${tour.id}?lang=vi`);
      setForm({
        name: detail.name,
        description: detail.description,
        estimatedMinutes: detail.estimatedMinutes,
        distanceKm: detail.distanceKm,
        stops: detail.stops.map(s => ({
          poiId: s.poiId,
          stopOrder: s.stopOrder,
          transitionNote: s.transitionNote || ''
        }))
      });
      setView('edit');
    } catch (err) {
      console.error('Failed to load tour details:', err);
    }
  };

  const handleDeleteTour = (id: number) => {
    if (window.confirm('Are you sure you want to delete this walking tour?')) {
      deleteTourMutation.mutate(id);
    }
  };

  const handleAddStop = () => {
    if (pois.length === 0) return;
    const defaultPoiId = pois[0].id;
    
    setForm({
      ...form,
      stops: [
        ...form.stops,
        {
          poiId: defaultPoiId,
          stopOrder: form.stops.length + 1,
          transitionNote: ''
        }
      ]
    });
  };

  const handleRemoveStop = (index: number) => {
    const updatedStops = form.stops.filter((_, i) => i !== index).map((s, idx) => ({
      ...s,
      stopOrder: idx + 1
    }));
    
    setForm({
      ...form,
      stops: updatedStops
    });
  };

  const handleStopChange = (index: number, field: keyof TourStopFormInput, value: number | string) => {
    const updatedStops = [...form.stops];
    updatedStops[index] = {
      ...updatedStops[index],
      [field]: value
    } as TourStopFormInput;
    
    setForm({
      ...form,
      stops: updatedStops
    });
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === form.stops.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedStops = [...form.stops];
    
    // Swap stops
    const temp = updatedStops[index];
    updatedStops[index] = updatedStops[targetIndex];
    updatedStops[targetIndex] = temp;

    // Recalculate stop orders sequentially
    const reorderedStops = updatedStops.map((s, idx) => ({
      ...s,
      stopOrder: idx + 1
    }));

    setForm({
      ...form,
      stops: reorderedStops
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      alert('Please fill in Tour Name and Description.');
      return;
    }

    if (selectedTourId !== null) {
      updateTourMutation.mutate({ id: selectedTourId, data: form });
    } else {
      createTourMutation.mutate(form);
    }
  };

  return (
    <div className="p-6 text-white min-h-screen">
      {view === 'list' ? (
        <>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">Walking Tours Builder</h1>
              <p className="text-xs text-zinc-400">Manage admin curated public walking tours on Vinh Khanh street.</p>
            </div>
            <button 
              onClick={handleCreateNew}
              className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 text-zinc-950"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Tour</span>
            </button>
          </div>

          {/* List View */}
          {isLoadingTours ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-emerald-500 border-zinc-800 rounded-full animate-spin"></div>
            </div>
          ) : tours.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center flex flex-col gap-2">
              <span className="text-3xl">🧭</span>
              <h3 className="font-bold text-zinc-300">No Walking Tours Found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">Create a food exploration walk route or sightseeing path for visitors here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tours.map((tour) => (
                <div 
                  key={tour.id}
                  className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-5 shadow-lg flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-base text-zinc-200">{tour.name}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{tour.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditTour(tour)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700/50 text-zinc-300 hover:text-white transition-all"
                        title="Edit Tour"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTour(tour.id)}
                        className="p-2 bg-red-950/20 hover:bg-red-950/40 rounded-lg border border-red-900/20 text-red-400 hover:text-red-300 transition-all"
                        title="Delete Tour"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 border-t border-zinc-900 pt-3.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{tour.stopCount} stops</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{tour.estimatedMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-amber-500" />
                      <span>{tour.distanceKm.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedTourId ? 'Edit Walking Tour' : 'Build Custom Tour'}
              </h1>
              <p className="text-xs text-zinc-400">Design routes, order stop sequences, and write walking tips.</p>
            </div>
            <button 
              onClick={resetForm}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 text-zinc-300"
            >
              <Undo className="w-4 h-4" />
              <span>Back to List</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 max-w-4xl">
            {/* Left side settings */}
            <div className="flex-1 flex flex-col gap-4 bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl h-fit">
              <h2 className="text-sm font-bold text-zinc-400 tracking-wider uppercase border-b border-zinc-850 pb-2">Tour Overview Details</h2>
              
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tour Name</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Vinh Khanh Seafood Crawl"
                  className="px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-sm placeholder-zinc-650 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. A guided walk through the most popular culinary delights..."
                  rows={3}
                  className="px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-sm placeholder-zinc-650 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-white resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated Minutes</label>
                  <input 
                    type="number" 
                    value={form.estimatedMinutes}
                    onChange={(e) => setForm({ ...form, estimatedMinutes: parseInt(e.target.value, 10) || 0 })}
                    className="px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Distance (KM)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={form.distanceKm}
                    onChange={(e) => setForm({ ...form, distanceKm: parseFloat(e.target.value) || 0 })}
                    className="px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Walking Tour</span>
              </button>
            </div>

            {/* Right side POI Stops configurer */}
            <div className="flex-[1.2] flex flex-col gap-4 bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                <h2 className="text-sm font-bold text-zinc-400 tracking-wider uppercase">Configure Stop Stops</h2>
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold rounded-lg text-emerald-400 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stop</span>
                </button>
              </div>

              {form.stops.length === 0 ? (
                <div className="py-12 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-xs flex flex-col gap-1 items-center justify-center">
                  <span>No stops defined yet.</span>
                  <span>Click "Add Stop" to start curating.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {form.stops.map((stop, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col gap-3 relative shadow-inner"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold bg-zinc-900 border border-zinc-850 text-emerald-400 px-2 py-0.5 rounded-md">
                          Stop #{stop.stopOrder}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveStop(idx, 'up')}
                            className="p-1 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-20 transition-all"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === form.stops.length - 1}
                            onClick={() => handleMoveStop(idx, 'down')}
                            className="p-1 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 rounded text-zinc-400 disabled:opacity-20 transition-all"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(idx)}
                            className="p-1 bg-red-950/10 border border-red-900/10 hover:bg-red-950/30 rounded text-red-400 transition-all ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select POI Destination</label>
                        <select
                          value={stop.poiId}
                          onChange={(e) => handleStopChange(idx, 'poiId', parseInt(e.target.value, 10))}
                          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 text-left"
                        >
                          {pois.map((poi) => (
                            <option key={poi.id} value={poi.id}>
                              {poi.name} ({poi.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Transition Navigation Tips</label>
                        <input
                          type="text"
                          value={stop.transitionNote}
                          onChange={(e) => handleStopChange(idx, 'transitionNote', e.target.value)}
                          placeholder="e.g. Cross the street and walk left towards the green sign"
                          className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs placeholder-zinc-650 focus:outline-none focus:border-emerald-500/50 text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
