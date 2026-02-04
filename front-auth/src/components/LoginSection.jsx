import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import MyButton from "./MyButton";
import { login, redirectUser } from "../api";

const LoginSection = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Nuevo estado para selección de sectores
    const [showSectorSelection, setShowSectorSelection] = useState(false);
    const [sectors, setSectors] = useState([]);
    const [authData, setAuthData] = useState(null); // Guardar datos para usar al seleccionar

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await login(email, password);

            // 1. Guardar datos básicos
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('role', data.role);
            localStorage.setItem('user_name', data.name);

            const accesos = data.accesos || [];
            localStorage.setItem('accesos', JSON.stringify(accesos));

            // 2. SECTORES (Sin filtrar por rol, el usuario indicó que todo cuenta)
            const validSectors = accesos;

            if (!validSectors || validSectors.length === 0) {
                throw new Error("No tienes un sector asignado para ingresar.");
            }

            // 3. DECISIÓN: UN SOLO SECTOR O MÚLTIPLES
            if (validSectors.length === 1) {
                // Caso simple: Redirección directa
                redirectUser(validSectors[0], data.access);
            } else {
                // Caso múltiple: Mostrar pantalla de selección
                setSectors(validSectors);
                setAuthData(data);
                setShowSectorSelection(true);
                setLoading(false); // Detenemos carga para mostrar UI
            }

        } catch (err) {
            console.error(err);
            setError(err.message || "Error de acceso o credenciales inválidas.");
            setLoading(false);
        }
    };

    if (showSectorSelection) {
        return (
            <section className="w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 animate-in fade-in zoom-in duration-300">
                <div className="pt-2"></div>

                <div className="space-y-3">
                    {sectors.map((sector) => (
                        <button
                            key={sector}
                            onClick={() => redirectUser(sector, authData.access)}
                            className="w-full p-4 text-left border rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all group"
                        >
                            <span className="block font-medium text-gray-900 group-hover:text-purple-600 capitalize">
                                {sector}
                            </span>
                            <span className="text-xs text-gray-500">
                                Ingresar al sistema de {sector}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <button
                        onClick={() => {
                            setShowSectorSelection(false);
                            setSectors([]);
                            setAuthData(null);
                        }}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="pt-2"></div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm text-black mb-2">
                        Correo electrónico
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                        placeholder="usuario@ejemplo.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-black mb-2">
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <MyButton
                    disabled={loading}
                    className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white w-full"
                >
                    {loading ? "Verificando..." : "Ingresar"}
                </MyButton>
            </form>
        </section>
    );
};

export default LoginSection;