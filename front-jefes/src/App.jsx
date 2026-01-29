import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateSurveyPage from './pages/CreateSurveyPage';
import SurveyManagerPage from './pages/SurveyManagerPage';
import EditSurveyPage from './pages/EditSurveyPage';
import ContactViewerPage from './pages/ContactViewerPage';
import RespuestasDashboard from './pages/RespuestasDashboard';
import DashboardLayout from './layouts/DashboardLayout';

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
    // --- LÓGICA DE TOKEN (Solicitada por el usuario) ---
    useEffect(() => {
        // 1. Buscamos si hay un token en la URL (?token=...)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            // 2. Si existe, lo guardamos para que el resto del front pueda usarlo
            localStorage.setItem('access_token', token);

            // 3. Limpiamos la URL (quitamos el ?token=...) para que no quede expuesto
            window.history.replaceState({}, document.title, window.location.pathname);

            // Recargamos para limpiar limpio el estado o asegurar auth
            // (El usuario no lo puso en su snippet, pero en la version anterior estaba. 
            //  Seguiré su snippet ESTRICTAMENTE como pidió: "Sigue estos paso no inventes nada")
            //  El snippet del usuario NO tiene reload, solo log.
            console.log("Token capturado y guardado correctamente.");
        }
    }, []);
    // ----------------------------------------------------

    return (
        <BrowserRouter>
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
