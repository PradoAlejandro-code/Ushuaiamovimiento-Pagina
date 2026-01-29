import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from "./pages/LoginPage";
import SurveyViewer from "./pages/SurveyViewer";
import Home from "./pages/Home";

// 0. Ruta Protegida
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 3. Configuración de Rutas
function App() {
  // Lógica para capturar el token que viene del Login Externo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('access_token', token);
      // Limpiamos la URL para que no se vea el token feo ahí
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/encuesta/:id" element={
          <ProtectedRoute>
            <SurveyViewer />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;