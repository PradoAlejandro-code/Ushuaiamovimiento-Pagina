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

            // 1. Guardar tokens y datos básicos
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('role', data.role);
            localStorage.setItem('user_name', data.name);

            // Guardamos los accesos (la lista de sectores permitidos)
            // Si el backend aún no lo manda, usamos un array vacío para no romper nada
            const accesos = data.accesos || [];
            localStorage.setItem('accesos', JSON.stringify(accesos));

            // 2. Preparar la URL base (Detecta si es Local o Producción)
            const isLocal = window.location.hostname.includes('localhost');
            // En local asumimos puerto 5173 para Vite, en prod nada.
            const DOMINIO_BASE = isLocal ? 'localhost:5173' : 'ushuaiamovimiento.com.ar';
            const PROTOCOLO = window.location.protocol;

            // 3. Lógica de Redirección (El semáforo)

            // CASO A: Es Jefe (o tiene permiso de jefe/jefes) -> Va a Administración
            if (data.role === 'jefe' || accesos.includes('jefe') || accesos.includes('jefes')) {
                // NOTA: Cambiamos 'jefes' por 'administracion' como pediste
                window.location.href = `${PROTOCOLO}//administracion.${DOMINIO_BASE}?token=${data.access}`;

                // CASO B: Es Empleado del sector Barrios -> Va a Barrios
            } else if (accesos.includes('barrios')) {
                window.location.href = `${PROTOCOLO}//barrios.${DOMINIO_BASE}?token=${data.access}`;

                // CASO C: Tiene otros sectores (Genérico)
            } else if (accesos.length > 0) {
                // Si tiene otro sector (ej: logistica), lo mandamos al primero que tenga
                // Nos aseguramos que NUNCA vaya a 'jefes' por error
                const sector = accesos[0] === 'jefes' ? 'administracion' : accesos[0];
                window.location.href = `${PROTOCOLO}//${sector}.${DOMINIO_BASE}?token=${data.access}`;

                // CASO D: Login correcto pero sin sector asignado
            } else {
                // Fallback por si acaso: si es empleado sin grupo, lo dejamos en el dashboard general
                window.location.href = "/";
            }

        } catch (err) {
            console.error(err);
            setError("Credenciales inválidas o error en el servidor");
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
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
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
                        placeholder="usuario@ejemplo.com"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm text-black mb-2"
                    >
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={passwordVisible ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                            placeholder="••••••••"
                            autoComplete="current-password"
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
                    className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                >
                    {loading ? "Ingresando..." : "Entrar"}
                </MyButton>
            </form>
        </section>
    );
};

export default LoginSection;
