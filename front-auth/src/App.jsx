import { useState, useEffect } from 'react';
import { Mail, Lock, ChartBar, Loader2 } from 'lucide-react';
import Card from './components/Card';
import MyButton from './components/MyButton';
import CheckBox from './components/CheckBox';
import { login } from './api';

// Banner
const bannerImage = '/mopof-banner.png';

export default function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // State for logic
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [sectors, setSectors] = useState([]);
    const [token, setToken] = useState(null);

    // Load email from local storage on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const getRedirectUrl = (sector, token) => {
        const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');

        // Logic restored: sector.domain (e.g. barrio.ushuaiamovimiento.com.ar)
        if (isLocal) {
            // Localhost mappings (Keeping these as simple fallbacks for now)
            if (sector === 'jefe') return `http://localhost:5174?token=${token}`;
            return `http://localhost:5175?token=${token}`;
        }

        // Production: dynamic subdomain
        // 'jefe' -> jefes.ushuaiamovimiento.com.ar
        // 'barrio' -> barrio.ushuaiamovimiento.com.ar
        const subdomain = sector === 'jefe' ? 'jefes' : sector;
        return `https://${subdomain}.ushuaiamovimiento.com.ar?token=${token}`;
    };

    const redirect = (sector, tokenToUse) => {
        const url = getRedirectUrl(sector, tokenToUse);
        window.location.href = url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(email, password);
            // data: { access, refresh, accesos: ['ventas', 'jefe'], ... }

            const userSectors = data.accesos || [];
            const accessToken = data.access;

            // "Remember Me" Logic: Save or Remove email
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            if (userSectors.length === 0) {
                setError('No tienes sectores asignados.');
                setLoading(false);
                return;
            }

            setToken(accessToken);
            setSectors(userSectors);

            if (userSectors.length === 1) {
                // Redirect immediately if only one sector
                redirect(userSectors[0], accessToken);
            } else {
                // Show selection menu
                setShowMenu(true);
                setLoading(false);
            }

        } catch (err) {
            console.error(err);
            // Now we rely on the specific message thrown by api.js
            setError(err.message || 'Credenciales inválidas o error de conexión.');
            setLoading(false);
        }
    };

    const handleSectorClick = (sector) => {
        if (!token) return;
        redirect(sector, token);
    };

    // Capitalize helper
    const formatSectorName = (name) => {
        if (name === 'jefe') return 'Panel de Jefes';
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-primary transition-colors duration-300">
            <div className="w-full max-w-md">
                <Card className="min-h-[500px]">
                    {/* Banner */}
                    <div className="w-full mb-6 relative">
                        <img
                            src={bannerImage}
                            alt="MOPOF Banner"
                            className="w-full h-auto rounded-2xl"
                        />
                    </div>

                    {/* Content */}
                    <div className="px-2 flex flex-col">
                        {!showMenu ? (
                            <>
                                {/* Title */}
                                {/* Header removed as requested */}
                                <div className="mt-2"></div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-2 p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                                    {/* Email Field */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="khalil@gmail.com"
                                                className="w-full pl-12 pr-4 py-3 border-0 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-input text-input-foreground"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-semibold mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-12 pr-4 py-3 border-0 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-input text-input-foreground"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center justify-between">
                                        <CheckBox
                                            id="remember"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            label="Recordar"
                                        />
                                    </div>

                                    {/* Login Button */}
                                    <MyButton type="submit" disabled={loading}>
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Cargando...
                                            </span>
                                        ) : (
                                            "Log in"
                                        )}
                                    </MyButton>
                                </form>
                            </>
                        ) : (
                            <>
                                {/* Menu Header */}
                                <div className="text-center mb-4 flex-shrink-0">
                                    <h2 className="text-2xl font-bold text-foreground">Selecciona un sector</h2>
                                    <p className="text-sm mt-1 text-muted-foreground">¿A dónde deseas ir?</p>
                                </div>

                                {/* Dynamic Menu Items */}
                                <div className="flex-1 overflow-y-auto pr-2 max-h-[400px]">
                                    <div className="space-y-2">
                                        {sectors.map((sector, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSectorClick(sector)}
                                                className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left border border-transparent hover:bg-input hover:border-active group bg-card/50"
                                            >
                                                {/* 
                                                    Reverted to 'active' color (Blue in Light Mode) as requested.
                                                */}
                                                <div className="p-3 rounded-lg flex-shrink-0 bg-active/10 text-active transition-colors">
                                                    <ChartBar className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-lg text-foreground group-hover:text-active transition-colors">{formatSectorName(sector)}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Acceder al panel de {sector}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowMenu(false)}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                                    >
                                        Volver al login
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
