import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import MyButton from "./ui/MyButton";
import { login } from "../api";

const LoginSection = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

            // --- LÓGICA DE REDIRECCIÓN ESTRICTA ---

            // Detectar entorno
            const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
            const PROTOCOLO = window.location.protocol;
            const DOMINIO_RAIZ = isLocal ? 'localhost' : 'ushuaiamovimiento.com.ar';

            // Mapa de Puertos (Solo para Localhost)
            // Define aquí los puertos de tus frontends sectoriales
            const PUERTOS_LOCALES = {
                'barrios': '3010',        // Sector Barrios
                'stock': '3011',          // Sector Stock
                'default': '3010'         // Fallback por si creas un sector nuevo y no tienes puerto asignado aún
            };

            // 2. BUSCAR EL SECTOR REAL
            // Filtramos 'jefe' porque eso es un rol, no un lugar físico/digital.
            // Buscamos si tiene 'barrios', 'stock', 'logistica', etc.
            const sectorEspecifico = accesos.find(a => a !== 'jefe');

            // VALIDACIÓN: Si no hay sector, NO ENTRA (aunque sea Jefe)
            if (!sectorEspecifico) {
                throw new Error("No tienes un sector asignado para ingresar.");
            }

            // 3. CONSTRUCCIÓN DE LA URL
            let urlFinal = "";
            const destino = sectorEspecifico;

            if (isLocal) {
                // En local: Usamos el puerto mapeado o el default
                const puerto = PUERTOS_LOCALES[destino] || PUERTOS_LOCALES['default'];
                urlFinal = `${PROTOCOLO}//localhost:${puerto}`;
            } else {
                // En producción: Usamos subdominios dinámicos
                // Ejemplo: barrios.ushuaiamovimiento.com.ar
                urlFinal = `${PROTOCOLO}//${destino}.${DOMINIO_RAIZ}`;
            }

            // 4. VIAJE (Redirección con token)
            window.location.href = `${urlFinal}?token=${data.access}`;

        } catch (err) {
            console.error(err);
            // Mensaje amigable para el usuario
            setError(err.message || "Error de acceso o credenciales inválidas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <header className="mb-6 text-center">
                <h2 className="text-xl font-medium text-black mb-2">
                    Ingreso al Sistema
                </h2>
                <p className="text-sm text-gray-500">
                    Movimiento Popular Fueguino
                </p>
            </header>

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