import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MyButton from '../components/ui/MyButton';
import Navbar from '../components/Navbar';
import NavTabs from '../components/NavTabs';
import { ClipboardList, MapPin } from 'lucide-react';
import { getActiveSurveys, getRelevamiento } from '../api';
import Card from '../components/ui/Card';
import SurveyViewer from './SurveyViewer';

const Home = () => {
    // ESTADO
    // Tabs state: 'relevamientos' | 'encuestas'
    const [activeTab, setActiveTab] = useState('relevamientos');

    // Data State
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);

    // Theme State
    const [theme, setTheme] = useState(() => {
        // Prioritize Cookie for cross-domain sync
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        };
        return getCookie('theme') || localStorage.getItem('theme') || 'light';
    });

    // Derived State
    const [relevamiento, setRelevamiento] = useState(null);
    const encuestas = surveys.filter(s => s.es_relevamiento === false);

    // --- ¡ZONA SEGURA! ---
    // No hay useEffects mirando el 'role'. Aquí eres bienvenido seas Jefe o Empleado.

    // Theme Logic Effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            // 1. Local Storage
            localStorage.setItem('theme', newTheme);
            // 2. Global Cookie for Subdomains
            document.cookie = `theme=${newTheme}; path=/; domain=.ushuaiamovimiento.com.ar; max-age=31536000; SameSite=Lax`;
            return newTheme;
        });
    };

    // Data Fetching Logic
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargamos datos. Si la API da error, lo capturamos, pero no redirigimos.
                const [surveysData, relevamientoData] = await Promise.all([
                    getActiveSurveys(),
                    getRelevamiento().catch(() => null)
                ]);
                setSurveys(surveysData || []);
                setRelevamiento(relevamientoData);
            } catch (error) {
                console.error("Error cargando datos:", error);
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
        localStorage.removeItem('accesos');
        // Recargamos y el App.jsx se encargará de mandar al login principal
        window.location.reload();
    }



    return (
        <div className="min-h-screen bg-surface-secondary pb-20 font-sans transition-colors duration-200">

            {/* Navbar */}
            <Navbar theme={theme} toggleTheme={toggleTheme} logout={logout} />

            {/* Navbar / Tabs Centered */}
            <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Content Area */}
            <div className="max-w-md mx-auto mt-6 px-4 space-y-4">

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue"></div>
                    </div>
                ) : (
                    <>
                        {/* Tab Relevamientos */}
                        {activeTab === 'relevamientos' && (
                            relevamiento ? (
                                <SurveyViewer embeddedId={relevamiento.id} />
                            ) : (
                                <div className="text-center py-12 text-content-secondary bg-surface-primary rounded-xl mx-4 shadow-sm border border-dashed border-border-base">
                                    <MapPin size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>No hay relevamientos activos.</p>
                                </div>
                            )
                        )}

                        {/* Tab Encuestas */}
                        {activeTab === 'encuestas' && (
                            <div>
                                {encuestas.length > 0 ? encuestas.map(item => (
                                    <Card key={item.id} className="mb-4 hover:border-brand-blue/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-content-primary leading-tight">{item.nombre || item.titulo}</h4>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;