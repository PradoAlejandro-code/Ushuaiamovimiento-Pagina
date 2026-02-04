import { useState } from 'react';
import { Mail, Lock, Store, Users, Package, BarChart3, Settings, X, Moon, Sun } from 'lucide-react';
import bannerImage from 'figma:asset/28c4590f0b7667bc4817d8efd20dadad944cc0de.png';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { icon: Store, label: 'Tienda Principal', description: 'Gestión de ventas y productos' },
    { icon: Users, label: 'Recursos Humanos', description: 'Personal y nóminas' },
    { icon: Package, label: 'Inventario', description: 'Control de stock' },
    { icon: BarChart3, label: 'Reportes', description: 'Estadísticas y análisis' },
    { icon: Settings, label: 'Administración', description: 'Configuración general' },
    { icon: Store, label: 'Sucursal Norte', description: 'Gestión sucursal norte' },
    { icon: Store, label: 'Sucursal Sur', description: 'Gestión sucursal sur' },
    { icon: Package, label: 'Almacén Central', description: 'Bodega principal' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  const handleMenuItemClick = (label: string) => {
    console.log('Navegando a:', label);
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: darkMode ? '#1B76BB' : '#FF9415' }}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl shadow-2xl overflow-hidden p-6" style={{ backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}>
          {/* Banner and Dark Mode Toggle */}
          <div className="w-full mb-6 relative">
            <img 
              src={bannerImage} 
              alt="MOPOF Banner" 
              className="w-full h-auto rounded-2xl"
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="absolute top-2 right-2 p-2 rounded-lg transition-colors"
              style={{ backgroundColor: darkMode ? '#FF9415' : '#1B76BB' }}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="px-2 h-[360px] flex flex-col">
            {!showMenu ? (
              <>
                {/* Title */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-1" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Log in</h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5" style={{ color: darkMode ? '#9ca3af' : '#9ca3af' }} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="khalil@gmail.com"
                        className="w-full pl-12 pr-4 py-3 border-0 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: darkMode ? '#2d2d2d' : '#f9fafb',
                          color: darkMode ? '#ffffff' : '#111827',
                          '--tw-ring-color': darkMode ? '#FF9415' : '#1B76BB'
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5" style={{ color: darkMode ? '#9ca3af' : '#9ca3af' }} />
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3 border-0 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: darkMode ? '#2d2d2d' : '#f9fafb',
                          color: darkMode ? '#ffffff' : '#111827',
                          '--tw-ring-color': darkMode ? '#FF9415' : '#1B76BB'
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <div className="relative flex items-center">
                      <input
                        id="remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 transition-all checked:border-transparent"
                        style={{ 
                          borderColor: darkMode ? '#4b5563' : '#d1d5db',
                          backgroundColor: darkMode ? '#2d2d2d' : '#ffffff'
                        }}
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity"
                        width="12"
                        height="10"
                        viewBox="0 0 12 10"
                        fill="none"
                      >
                        <path
                          d="M1 5L4.5 8.5L11 1.5"
                          stroke={darkMode ? '#FF9415' : '#1B76BB'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <label htmlFor="remember" className="ml-3 text-sm font-medium cursor-pointer" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                      Remember me
                    </label>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-full font-semibold text-white transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: darkMode ? '#1B76BB' : '#FF7B7B' }}
                  >
                    Log in
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Menu Header */}
                <div className="text-center mb-4 flex-shrink-0">
                  <h2 className="text-2xl font-bold" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Selecciona un sector</h2>
                  <p className="text-sm mt-1" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>¿A dónde deseas ir?</p>
                </div>

                {/* Scrolleable Menu Items */}
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-2">
                    {menuItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handleMenuItemClick(item.label)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left border"
                          style={{ 
                            backgroundColor: darkMode ? 'transparent' : 'transparent',
                            borderColor: darkMode ? '#374151' : '#f3f4f6',
                            '--hover-bg': darkMode ? '#2d2d2d' : '#f9fafb',
                            '--hover-border': darkMode ? '#FF9415' : '#93c5fd'
                          } as React.CSSProperties}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? '#2d2d2d' : '#f9fafb';
                            e.currentTarget.style.borderColor = darkMode ? '#FF9415' : '#93c5fd';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = darkMode ? '#374151' : '#f3f4f6';
                          }}
                        >
                          <div 
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: darkMode ? '#FF941520' : '#1B76BB20' }}
                          >
                            <Icon className="w-5 h-5" style={{ color: darkMode ? '#FF9415' : '#1B76BB' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: darkMode ? '#ffffff' : '#111827' }}>{item.label}</p>
                            <p className="text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>{item.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}