import { useEffect } from 'react';
import { useExtendSessionMutation } from '@/queries/useAuth';

export const useSessionExtender = () => {
    const { mutate: pingServer } = useExtendSessionMutation();

    useEffect(() => {
        let lastActivity = Date.now();

        const handleActivity = () => {
            lastActivity = Date.now();
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keypress', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('click', handleActivity);

        const TIMEOUT_MS = 3600 * 1000;
        const CHECK_INTERVAL = 1000;
        const PING_INTERVAL = 15 * 60 * 1000;

        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;

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

        const pingInterval = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity < PING_INTERVAL) {
                pingServer();
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
