import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateSurveyPage from './pages/CreateSurveyPage';
import SurveyManagerPage from './pages/SurveyManagerPage';
import EditSurveyPage from './pages/EditSurveyPage';
import ContactViewerPage from './pages/ContactViewerPage';
import RespuestasDashboard from './pages/RespuestasDashboard';
import DashboardLayout from './layouts/DashboardLayout';

// 1. Escucha el token que viene de la redireccion
const TokenListener = () => {
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const tokenRecibido = queryParams.get("token");

        if (tokenRecibido) {
            localStorage.setItem("access_token", tokenRecibido);
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            window.location.reload();
        }
    }, []);
    return null;
};

// 2. Protege la ruta: Si no hay token, fuera.
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');

    // Check basico de existencia
    if (!token) {
        window.location.href = 'https://ushuaiamovimiento.com.ar/login';
        return null;
    }

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <TokenListener />
            <Routes>
                {/* Rutas con Sidebar (DashboardLayout) */}
                <Route element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create-survey" element={<CreateSurveyPage />} />

                    {/* Nuevas Rutas de Gestión */}
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
