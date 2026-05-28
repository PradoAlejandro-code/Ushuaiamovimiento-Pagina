import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SurveyViewer from "./pages/SurveyViewer";
import Home from "./pages/Home";
import CarpetaPage from "./pages/CarpetaPage";
import CumplesPage from "./pages/CumplesPage";
import MainLayout from "./components/layout/MainLayout";
import { useSessionExtender } from './hooks/useSessionExtender';

// 1. Ruta Protegida (El Guardia)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Si no hay token, lo mandamos al Portero Principal
    window.location.href = 'https://ushuaiamovimiento.com.ar';
    return null;
  }
  return children;
};

function App() {
  // Activate Sliding Session Logic
  useSessionExtender();

  // 2. Estado de Carga (Para evitar el parpadeo o expulsión inmediata)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const iniciarApp = async () => {
      // A. Buscamos el token en la URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (token) {
        // B. Guardamos el token
        localStorage.setItem('access_token', token);

        // C. Limpiamos la URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // D. Terminamos de cargar
      setLoading(false);
    };

    iniciarApp();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando sector...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/carpeta" element={<CarpetaPage />} />
          <Route path="/cumpleanos" element={<CumplesPage />} />
        </Route>

        <Route path="/encuesta/:id" element={
          <ProtectedRoute>
            <SurveyViewer />
          </ProtectedRoute>
        } />

        {/* Cualquier otra cosa -> Al Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;