import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import MyButton from '../components/ui/MyButton';
import { ClipboardList, MapPin, UploadCloud } from 'lucide-react';
import { getActiveSurveys, getRelevamiento } from '../api';
import Card from '../components/ui/Card';
import SurveyViewer from './SurveyViewer';
import ImportSurvey from '../components/survey/ImportSurvey';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../components/ui/skeleton';

const Home = () => {
    // ESTADO DE SUB-TABS (Inicio Toolbar: 'relevamientos' | 'encuestas' | 'importar')
    const [subTab, setSubTab] = useState('relevamientos');

    // Data & Loading
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    // Get currentUser context from Layout
    const { currentUser } = useOutletContext(); 
    
    // Derived State
    const [relevamiento, setRelevamiento] = useState(null);
    const encuestas = surveys.filter(s => s.es_relevamiento === false);
    const rawRole = currentUser?.role || '';
    const isAdmin = rawRole && ['admin', 'administrador'].includes(String(rawRole).toLowerCase());

    // Fetch Surveys and Relevamientos Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [surveysData, relevamientoData] = await Promise.all([
                    getActiveSurveys(),
                    getRelevamiento().catch(() => null)
                ]);
                const rawData = surveysData.results || surveysData;
                setSurveys(Array.isArray(rawData) ? rawData : []);
                setRelevamiento(relevamientoData);
            } catch (error) {
                console.error("Error loading surveys:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="inicio-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-4"
            >
                {/* SUB-NAVBAR TOOLBAR (Relevamientos / Encuestas / Importar) */}
                <div className="bg-surface-primary/60 backdrop-blur-sm p-1 rounded-full flex gap-1 border border-border-base/50 relative shadow-sm">
                    {['relevamientos', 'encuestas'].map((tab) => {
                        const isActive = subTab === tab;
                        const label = tab === 'relevamientos' ? 'Relevamientos' : 'Encuestas';
                        const Icon = tab === 'relevamientos' ? MapPin : ClipboardList;
                        return (
                            <button
                                key={tab}
                                onClick={() => setSubTab(tab)}
                                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider z-10 transition-colors cursor-pointer ${
                                    isActive ? 'text-brand-blue' : 'text-content-secondary'
                                }`}
                            >
                                <Icon size={14} />
                                <span>{label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="subtab-active-pill"
                                        className="absolute inset-0 bg-surface-primary rounded-full shadow-sm border border-border-base/30 z-[-1]"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                    {isAdmin && (
                        <button
                            onClick={() => setSubTab('importar')}
                            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider z-10 transition-colors cursor-pointer ${
                                subTab === 'importar' ? 'text-brand-blue' : 'text-content-secondary'
                            }`}
                        >
                            <UploadCloud size={14} />
                            <span>Importar</span>
                            {subTab === 'importar' && (
                                <motion.div
                                    layoutId="subtab-active-pill"
                                    className="absolute inset-0 bg-surface-primary rounded-full shadow-sm border border-border-base/30 z-[-1]"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    )}
                </div>

                {/* Content for Sub-tabs */}
                <div className="space-y-4 pb-8">
                    {subTab === 'relevamientos' && (
                        loading ? (
                            <SurveyViewer loading={true} />
                        ) : relevamiento ? (
                            <SurveyViewer embeddedId={relevamiento.id} />
                        ) : (
                            <div className="text-center py-16 text-content-secondary bg-surface-primary/50 backdrop-blur-sm rounded-3xl border border-dashed border-border-base flex flex-col items-center justify-center">
                                <MapPin size={40} className="mb-2 opacity-25" />
                                <p className="text-xs font-bold uppercase tracking-wider">No hay relevamientos activos</p>
                            </div>
                        )
                    )}

                    {subTab === 'encuestas' && (
                        loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(n => (
                                    <Card key={n} className="border border-border-base/50 p-5 space-y-4 animate-pulse">
                                        <div className="flex justify-between items-start">
                                            <Skeleton className="w-40 h-4 rounded-md" />
                                            <Skeleton className="w-12 h-3.5 rounded-full" />
                                        </div>
                                        <Skeleton className="w-full h-8 rounded-md" />
                                        <Skeleton className="w-full h-[38px] rounded-xl" />
                                    </Card>
                                ))}
                            </div>
                        ) : encuestas.length > 0 ? (
                            encuestas.map(item => (
                                <Card key={item.id} className="mb-4 hover:border-brand-blue/30 transition-all shadow-sm rounded-2xl p-5 border border-border-base">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-content-primary leading-tight text-sm uppercase tracking-wide">{item.nombre || item.titulo}</h4>
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black border border-emerald-500/20 uppercase tracking-wider shrink-0">Activa</span>
                                    </div>
                                    <p className="text-xs text-content-secondary mb-4 leading-relaxed">{item.descripcion}</p>

                                    <Link to={`/encuesta/${item.id}`}>
                                        <MyButton className="bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 !py-2.5 !text-xs w-full border border-brand-blue/10 font-black uppercase tracking-wider rounded-xl transition-all">
                                            Responder Encuesta
                                        </MyButton>
                                    </Link>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-16 text-content-secondary bg-surface-primary/50 backdrop-blur-sm rounded-3xl border border-dashed border-border-base flex flex-col items-center justify-center">
                                <ClipboardList size={40} className="mb-2 opacity-25" />
                                <p className="text-xs font-bold uppercase tracking-wider">No hay encuestas disponibles</p>
                            </div>
                        )
                    )}

                    {subTab === 'importar' && isAdmin && (
                        <ImportSurvey surveys={surveys} relevamiento={relevamiento} />
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Home;