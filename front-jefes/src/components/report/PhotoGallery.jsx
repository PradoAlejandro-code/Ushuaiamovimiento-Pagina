import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Image as ImageIcon, CheckCircle2, Calendar, Map,
    LayoutList, ChevronDown, Loader2
} from 'lucide-react';
import Card from '../ui/Card';
import { useInView } from 'react-intersection-observer';
import { getPhotos } from '../../api/report';
import { getSections, getAllSurveys, getRelevamiento } from '../../api/surveys';

const PhotoGallery = ({ selectedPhotoIds, onSelectionChange }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sections, setSections] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [filters, setFilters] = useState({
        seccion: '', barrio: '', fecha_desde: '', fecha_hasta: '', encuesta_id: ''
    });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const { ref, inView } = useInView({ threshold: 0.1 });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [sectionsRes, surveysRes, relevamientoRes] = await Promise.allSettled([
                    getSections(), getAllSurveys(1), getRelevamiento()
                ]);

                if (sectionsRes.status === 'fulfilled') setSections(sectionsRes.value.data || sectionsRes.value);

                let surveysList = [];
                if (surveysRes.status === 'fulfilled') {
                    const data = surveysRes.value.data || surveysRes.value;
                    surveysList = data.results || (Array.isArray(data) ? data : []);
                }
                if (relevamientoRes.status === 'fulfilled') {
                    const relData = relevamientoRes.value.data || relevamientoRes.value;
                    if (relData) surveysList = [relData, ...surveysList];
                }
                setSurveys(surveysList);
            } catch (error) { console.error("Error inicial:", error); }
        };
        fetchInitialData();
    }, []);

    const loadPhotos = useCallback(async (pageNum, isReset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await getPhotos({ ...filters, page: pageNum });
            const newPhotos = data.results || data;

            // Evitamos duplicados comparando IDs si no es un reset
            setPhotos(prev => {
                if (isReset) return newPhotos;
                const existingIds = new Set(prev.map(p => p.id));
                const filteredNew = newPhotos.filter(p => !existingIds.has(p.id));
                return [...prev, ...filteredNew];
            });

            setHasMore(!!data.next);
            setPage(pageNum + 1);
        } catch (error) {
            console.error("Error fetching photos:", error);
        } finally {
            setLoading(false);
        }
    }, [filters, loading]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        loadPhotos(1, true);
    }, [filters]);

    useEffect(() => {
        if (inView && hasMore && !loading && page > 1) {
            loadPhotos(page);
        }
    }, [inView, hasMore, loading, page, loadPhotos]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, ...(key === 'seccion' ? { barrio: '' } : {}) }));
    };

    const availableBarrios = useMemo(() => {
        if (!filters.seccion) return [];
        const section = sections.find(s => s.nombre === filters.seccion);
        return section ? section.barrios : [];
    }, [filters.seccion, sections]);

    return (
        /* ALTURA FIJA AQUÍ: h-[650px] */
        <Card className="flex flex-col h-[650px] !p-0 overflow-hidden shadow-2xl bg-surface-primary border-none">

            {/* Header / Filtros - shrink-0 para que no se achique */}
            <div className="p-6 border-b border-border-base/50 bg-surface-secondary/50 space-y-6 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-orange/10 rounded-lg"><ImageIcon size={20} className="text-brand-orange" /></div>
                        <h3 className="text-sm font-black uppercase text-content-primary tracking-widest">Galería de Fotos</h3>
                    </div>
                    <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-black px-4 py-2 rounded-xl border border-brand-orange/20 uppercase">
                        {selectedPhotoIds.length} Seleccionadas
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="relative">
                        <LayoutList className="absolute left-3 top-3 text-content-secondary" size={16} />
                        <select
                            className="w-full bg-surface-primary border border-border-base/30 rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-black uppercase appearance-none outline-none cursor-pointer"
                            value={filters.encuesta_id}
                            onChange={(e) => handleFilterChange('encuesta_id', e.target.value)}
                        >
                            <option value="">Todas las Encuestas</option>
                            {surveys.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-content-secondary pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                        <Map className="absolute left-3 top-3 text-content-secondary" size={16} />
                        <select
                            className="w-full bg-surface-primary border border-border-base/30 rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-black uppercase appearance-none outline-none cursor-pointer"
                            value={filters.seccion}
                            onChange={(e) => handleFilterChange('seccion', e.target.value)}
                        >
                            <option value="">Sección</option>
                            {sections.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-content-secondary pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                        <Map className="absolute left-3 top-3 text-content-secondary" size={16} />
                        <select
                            className="w-full bg-surface-primary border border-border-base/30 rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-black uppercase appearance-none outline-none cursor-pointer disabled:opacity-50"
                            value={filters.barrio}
                            onChange={(e) => handleFilterChange('barrio', e.target.value)}
                            disabled={!filters.seccion}
                        >
                            <option value="">Barrio</option>
                            {availableBarrios.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-content-secondary pointer-events-none" size={16} />
                    </div>

                    <div className="flex items-center gap-2 md:col-span-2">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-3 text-content-secondary" size={16} />
                            <input
                                type="date"
                                className="w-full bg-surface-primary border border-border-base/30 rounded-xl pl-10 pr-2 py-2.5 text-[11px] font-black outline-none color-scheme-dark cursor-pointer"
                                value={filters.fecha_desde}
                                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                                onClick={(e) => e.target.showPicker()}
                            />
                        </div>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-3 text-content-secondary" size={16} />
                            <input
                                type="date"
                                className="w-full bg-surface-primary border border-border-base/30 rounded-xl pl-10 pr-2 py-2.5 text-[11px] font-black outline-none color-scheme-dark cursor-pointer"
                                value={filters.fecha_hasta}
                                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                                onClick={(e) => e.target.showPicker()}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Galería - flex-1 para que ocupe el resto del h-[650px] y haga scroll */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface-secondary/10 custom-scrollbar">
                {photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {photos.map((photo) => {
                            const isSelected = selectedPhotoIds.includes(photo.id);
                            return (
                                <button
                                    key={photo.id}
                                    onClick={() => onSelectionChange(isSelected ? selectedPhotoIds.filter(id => id !== photo.id) : [...selectedPhotoIds, photo.id])}
                                    className={`group relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 ${isSelected ? 'border-brand-orange scale-95 shadow-lg shadow-orange-900/20' : 'border-transparent shadow-sm'}`}
                                >
                                    <img src={photo.archivo} alt="Fotos" className="w-full h-full object-cover" loading="lazy" />
                                    <div className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-orange/30 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                                        <div className={`p-2 rounded-full bg-white shadow-xl transition-transform ${isSelected ? 'scale-110 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100'}`}>
                                            <CheckCircle2 className="text-brand-orange" size={24} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-content-secondary opacity-30 italic">
                        <ImageIcon size={48} className="mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No hay fotos con estos filtros</p>
                    </div>
                )}

                {/* Centinela al final del scroll */}
                <div ref={ref} className="w-full h-24 flex items-center justify-center">
                    {loading && <Loader2 className="animate-spin text-brand-orange" size={32} />}
                </div>
            </div>
        </Card>
    );
};

export default PhotoGallery;