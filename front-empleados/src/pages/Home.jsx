import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MyButton from '../components/ui/MyButton';
import SurveyViewer from './SurveyViewer';
import { ClipboardList, MapPin, Sun, Moon, LogOut } from 'lucide-react';
import { getActiveSurveys, getRelevamiento } from '../api';
import Card from '../components/ui/Card'; // Importamos Card

const Home = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    // Tabs state: 'relevamientos' | 'encuestas'
    const [activeTab, setActiveTab] = useState('relevamientos');

    // Data State
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    // Theme State
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    // Derived State
    const [relevamiento, setRelevamiento] = useState(null);
    const encuestas = surveys.filter(s => s.es_relevamiento === false);

    // Redirection Logic
    useEffect(() => {
        if (role === 'admin') {
            window.location.href = "https://admins.ushuaiamovimiento.com.ar";
        } else if (role === 'jefe') {
            window.location.href = "https://jefes.ushuaiamovimiento.com.ar";
        }
    }, [role]);

    // Theme Logic Effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Fetch Surveys
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [surveysData, relevamientoData] = await Promise.all([
                    getActiveSurveys(),
                    getRelevamiento().catch(() => null)
                ]);
                setSurveys(surveysData);
                setRelevamiento(relevamientoData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_name');
        window.location.reload();
    }

    if (role === 'admin' || role === 'jefe') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-surface-secondary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mb-4"></div>
                <h2 className="text-xl font-semibold text-content-primary">Redirigiendo a tu panel...</h2>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-surface-secondary">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-secondary pb-20 font-sans">

            {/* Top Bar: Botones */}
            <div className="sticky top-0 z-20 bg-surface-secondary/95 backdrop-blur-sm pt-4 pb-2 flex justify-center items-center gap-3 border-b border-transparent">

                {/* Botón Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-surface-primary border border-border-base text-content-secondary hover:text-brand-blue shadow-sm transition-colors"
                    title="Cambiar tema"
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                {/* Botón Logout */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm font-medium text-red-500 bg-surface-primary border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 px-5 py-2 rounded-full shadow-sm transition-colors"
                >
                    <LogOut size={16} />
                    <span>Salir</span>
                </button>
            </div>

            {/* Navbar / Tabs Centered */}
            <div className="flex justify-center mt-2 px-4">
                <div className="bg-surface-primary/60 backdrop-blur-sm p-1.5 rounded-full flex gap-1 shadow-sm max-w-sm w-full border border-border-base">
                    <button
                        onClick={() => setActiveTab('relevamientos')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-semibold transition-all ease-out ${activeTab === 'relevamientos'
                            ? 'bg-surface-primary text-brand-blue shadow-md transform scale-[1.02] ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/50'
                            }`}
                    >
                        <MapPin size={18} strokeWidth={2} className={activeTab === 'relevamientos' ? 'text-brand-blue' : 'text-content-secondary'} />
                        Relevamientos
                    </button>
                    <button
                        onClick={() => setActiveTab('encuestas')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-semibold transition-all ease-out ${activeTab === 'encuestas'
                            ? 'bg-surface-primary text-brand-blue shadow-md transform scale-[1.02] ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/50'
                            }`}
                    >
                        <ClipboardList size={18} strokeWidth={2} className={activeTab === 'encuestas' ? 'text-brand-blue' : 'text-content-secondary'} />
                        Encuestas
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-md mx-auto mt-6 px-4 space-y-4">

                {activeTab === 'relevamientos' ? (
                    <div className="-mx-4 md:mx-0">
                        {relevamiento ? (
                            <SurveyViewer embeddedId={relevamiento.id} />
                        ) : (
                            <div className="text-center py-12 text-content-secondary bg-surface-primary rounded-xl mx-4 shadow-sm border border-dashed border-border-base">
                                <MapPin size={48} className="mx-auto mb-2 opacity-20" />
                                <p>No hay relevamientos activos.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {encuestas.length > 0 ? encuestas.map(item => (
                            <Card key={item.id} className="mb-4 hover:border-brand-blue/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-content-primary leading-tight">{item.nombre}</h4>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-medium border border-emerald-500/20">Activa</span>
                                </div>
                                <p className="text-sm text-content-secondary mb-4">{item.descripcion}</p>

                                <Link to={`/encuesta/${item.id}`}>
                                    <MyButton className="bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 !py-2 !text-sm w-full md:w-auto border border-brand-blue/10">
                                        Responder Encuesta
                                    </MyButton>
                                </Link>
                            </Card>
                        )) : (
                            <div className="text-center py-12 text-content-secondary bg-surface-primary rounded-xl shadow-sm border border-dashed border-border-base">
                                <ClipboardList size={48} className="mx-auto mb-2 opacity-20" />
                                <p>No hay encuestas disponibles por ahora.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;