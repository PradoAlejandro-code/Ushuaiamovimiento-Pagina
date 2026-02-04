import { useEffect, useState } from 'react'; // <--- IMPORTANTE: useState
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateSurveyPage from './pages/CreateSurveyPage';
import SurveyManagerPage from './pages/SurveyManagerPage';
import EditSurveyPage from './pages/EditSurveyPage';
import ContactViewerPage from './pages/ContactViewerPage';
import RespuestasDashboard from './pages/RespuestasDashboard';
import DashboardLayout from './layouts/DashboardLayout';
import { useSessionExtender } from './hooks/useSessionExtender';

// Componente que protege la ruta
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');

    // Si no hay token, te manda al Login Principal (no al relativo /login)
    if (!token) {
        window.location.href = 'https://ushuaiamovimiento.com.ar';
        return null;
    }

    return children;
};

function App() {
    // Activate Sliding Session Logic
    useSessionExtender();

    // ESTADO DE CARGA: Esto es lo que falta en tu código actual
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const capturarToken = () => {
            // 1. Buscamos el token en la URL
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (token) {
                // 2. Si existe, lo guardamos
                localStorage.setItem('access_token', token);
                console.log("Token guardado con éxito");

                // 3. Limpiamos la URL visualmente
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // 4. FINALIZAMOS LA CARGA: Ahora sí dejamos que React pinte la pantalla
            setLoading(false);
        };

        capturarToken();
    }, []);

    // SI ESTÁ CARGANDO, MOSTRAMOS UN MENSAJE Y NO DEJAMOS ENTRAR AL GUARDIA AÚN
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="text-xl font-semibold text-gray-600">
                    Verificando credenciales...
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas con Sidebar */}
                <Route element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create-survey" element={<CreateSurveyPage />} />

                    {/* Rutas de Gestión */}
                    <Route path="/relevamiento" element={<EditSurveyPage isRelevamiento={true} />} />
                    <Route path="/surveys" element={<SurveyManagerPage />} />
                    <Route path="/surveys/edit/:id" element={<EditSurveyPage />} />
                    <Route path="/surveys/contacts/:id" element={<ContactViewerPage />} />
                    <Route path="/contacts" element={<ContactViewerPage />} />
                    <Route path="/analytics" element={<RespuestasDashboard />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
