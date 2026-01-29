// src/sections/LoginSection.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import LoginButton from "../components/LoginButton";
import { login } from "../api";

const LoginSection = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      if (data.user?.is_staff) {
        navigate("/admin/forms");
      } else {
        navigate("/forms");
      }
    } catch (err) {
      setError("No se pudo iniciar sesión. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      <header className="mb-6 text-center">
        <h2 className="text-xl font-medium text-black mb-2">
          Iniciar sesión
        </h2>
        <p className="text-sm text-gray-500">
          Accede para completar o administrar encuestas
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-sm text-black mb-2"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
            placeholder="admin@ejemplo.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm text-black mb-2"
          >
            Contraseña
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <LoginButton disabled={loading}>
          {loading ? "Ingresando..." : "Entrar"}
        </LoginButton>
      </form>
    </section>
  );
};

export default LoginSection;
