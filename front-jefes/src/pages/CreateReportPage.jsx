import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPhotos, createInforme } from '../services/reportService';

import { Save, Image as ImageIcon, MapPin, Loader, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar/api';

const CreateReportPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [sections, setSections] = useState([]);
    const [availableBarrios, setAvailableBarrios] = useState([]);

    // Form State
    const [titulo, setTitulo] = useState('');
    const [descripcionBreve, setDescripcionBreve] = useState('');
    const [cuerpo, setCuerpo] = useState('');
    const [selectedSeccion, setSelectedSeccion] = useState('');
    const [selectedBarrio, setSelectedBarrio] = useState('');
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [photosRes, sectionsData] = await Promise.all([
                    getPhotos(),
                    fetch(`${API_URL}/surveys/locations/`, config).then(res => {
                        if (!res.ok) throw new Error("Error loading locations");
                        return res.json();
                    })
                ]);

                setPhotos(photosRes);
                setSections(sectionsData);
            } catch (error) {
                console.error("Error loading data:", error);
                alert("Error cargando recursos. Por favor recarga la página.");
            } finally {
                setFetching(false);
            }
        };
        loadInitialData();
    }, []);

    // Update available barrios when section changes
    useEffect(() => {
        if (selectedSeccion) {
            const section = sections.find(s => s.id.toString() === selectedSeccion);
            setAvailableBarrios(section ? section.barrios : []);
            setSelectedBarrio(''); // Reset barrio on section change
        } else {
            setAvailableBarrios([]);
            setSelectedBarrio('');
        }
    }, [selectedSeccion, sections]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            titulo,
            descripcion_breve: descripcionBreve,
            cuerpo,
            seccion: selectedSeccion || null,
            barrio: selectedBarrio || null,
            foto: selectedPhotoId
        };

        try {
            await createInforme(payload);
            navigate('/surveys'); // Redirect to dashboard or list
        } catch (error) {
            console.error("Error submiting report:", error);
            alert("Error al crear el informe. Verifica los datos.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="animate-spin text-brand-orange" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Crear Nuevo Informe</h1>
                <p className="text-gray-500 dark:text-gray-400">Redacta un informe y asócialo a una evidencia fotográfica existente.</p>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Text Content */}
                <div className="lg:col-span-2 space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <span className="bg-brand-orange/10 text-brand-orange p-2 rounded-lg">1</span>
                        Contenido del Informe
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                            <input
                                type="text"
                                required
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                                placeholder="Ej: Relevamiento de baches en B° San Martín"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción Breve (Opcional)</label>
                            <input
                                type="text"
                                value={descripcionBreve}
                                onChange={e => setDescripcionBreve(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                                placeholder="Resumen corto..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuerpo del Informe</label>
                            <textarea
                                required
                                value={cuerpo}
                                onChange={e => setCuerpo(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all resize-none"
                                placeholder="Escribe aquí el detalle completo..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-brand-blue" />
                            Ubicación (Opcional)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sección</label>
                                <select
                                    value={selectedSeccion}
                                    onChange={e => setSelectedSeccion(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                                >
                                    <option value="">Seleccionar Sección...</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barrio</label>
                                <select
                                    value={selectedBarrio}
                                    onChange={e => setSelectedBarrio(e.target.value)}
                                    disabled={!selectedSeccion}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all disabled:opacity-50"
                                >
                                    <option value="">Seleccionar Barrio...</option>
                                    {availableBarrios.map(b => (
                                        <option key={b.id} value={b.id}>{b.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Photo Gallery */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200 mb-4">
                            <span className="bg-brand-blue/10 text-brand-blue p-2 rounded-lg">2</span>
                            Evidencia Fotográfica
                        </h2>

                        <p className="text-sm text-gray-500 mb-4">Selecciona una foto de la galería de relevamientos recientes.</p>

                        <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            {photos.length > 0 ? photos.map(foto => (
                                <div
                                    key={foto.id}
                                    onClick={() => setSelectedPhotoId(foto.id)}
                                    className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden group transition-all border-2 ${selectedPhotoId === foto.id
                                        ? 'border-brand-orange ring-2 ring-brand-orange/30'
                                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                >
                                    <img
                                        src={foto.imagen}
                                        alt="Evidencia"
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {selectedPhotoId === foto.id && (
                                        <div className="absolute inset-0 bg-brand-orange/20 flex items-center justify-center">
                                            <CheckCircle className="text-white drop-shadow-md" size={32} fill="#F97316" />
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="col-span-3 py-10 text-center text-gray-400 text-sm">
                                    No hay fotos disponibles.
                                </div>
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader className="animate-spin" /> : <Save size={20} />}
                                {loading ? 'Creando Informe...' : 'Publicar Informe'}
                            </button>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default CreateReportPage;
