import { useEffect } from 'react';
import { extendSession } from '../api';

export const useSessionExtender = () => {
    useEffect(() => {
        let lastActivity = Date.now();

        const handleActivity = () => {
            lastActivity = Date.now();
        };

        // Escuchamos movimientos o teclas para saber si está trabajando
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keypress', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('click', handleActivity);

        // CONFIGURACIÓN DE TIEMPOS (Igual que Empleados)
        const TIMEOUT_MS = 3600 * 1000;      // 1 hora
        const CHECK_INTERVAL = 1000;         // Chequeo cada segundo
        const PING_INTERVAL = 15 * 60 * 1000; // Ping al servidor cada 15 minutos

        // 1. Loop Principal (Chequeo de Inactividad)
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;

            // A. AUTO-LOGOUT
            if (timeSinceLastActivity > TIMEOUT_MS) {
                console.warn("Inactividad detectada (Frontend - Jefes). Cerrando sesión...");
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('role');
                localStorage.removeItem('user_name');
                // Redirección forzada al Login Principal
                window.location.href = 'https://ushuaiamovimiento.com.ar';
                return;
            }
        }, CHECK_INTERVAL);

        // 2. Loop Secundario (Heartbeat / Ping)
        const pingInterval = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity < PING_INTERVAL) {
                // Solo extendemos si el usuario está activo recientemente
                extendSession().catch(() => { });
            }
        }, PING_INTERVAL);

        return () => {
            clearInterval(interval);
            clearInterval(pingInterval);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keypress', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, []);
};
