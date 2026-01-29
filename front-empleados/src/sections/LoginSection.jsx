import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import MyButton from "../components/ui/MyButton";
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

            // Guardar tokens y datos
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('role', data.role);
            localStorage.setItem('user_name', data.name);

            // Redirección por Rol
            if (data.role === 'admin') {
                window.location.href = `https://admins.ushuaiamovimiento.com.ar?token=${data.access}`;
            } else if (data.role === 'jefe') {
                window.location.href = `https://jefes.ushuaiamovimiento.com.ar?token=${data.access}`;
            } else {
                // Empleado
                window.location.href = "/"; // O '/dashboard'
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
