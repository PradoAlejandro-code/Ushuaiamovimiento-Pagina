import { Chart } from 'chart.js';
import { Tooltip } from 'chart.js';

// Configuración del Tooltip que sigue al mouse
Tooltip.positioners.followMouse = function (elements, eventPosition) {
    if (!elements.length) {
        return false;
    }
    return {
        x: eventPosition.x,
        y: eventPosition.y
    };
};

// Helper para URLs de imágenes
export const getAvatarUrl = (path) => {
    if (!path) return null;
    const API_BASE_URL = "https://api.ushuaiamovimiento.com.ar";
    let finalUrl = path;
    if (!path.startsWith('http')) {
        finalUrl = `${API_BASE_URL}${path}`;
    }
    // Forzar HTTPS si es nuestro dominio para evitar Mixed Content
    if (finalUrl.startsWith('http://api.ushuaiamovimiento.com.ar')) {
        return finalUrl.replace('http://', 'https://');
    }
    return finalUrl;
};

// Generador de Opciones Dinámico (Para adaptarse al Tema y Tipo de Gráfico)
export const getChartOptions = (isDark, isUsersChart, isPie) => {
    const textColor = isDark ? '#9CA3AF' : '#4B5563'; // gray-400 : gray-600
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                bottom: isUsersChart ? 40 : 0 // Espacio extra solo si hay avatares
            }
        },
        plugins: {
            legend: {
                display: isPie, // Solo mostrar leyenda en gráficos de torta
                position: 'top',
                labels: { color: textColor }
            },
            tooltip: {
                position: 'followMouse',
                yAlign: 'bottom', // El tooltip aparece arriba del cursor
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                titleColor: isDark ? '#f8fafc' : '#1e293b',
                bodyColor: isDark ? '#cbd5e1' : '#475569',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 4
            }
        },
        scales: isPie ? {} : { // Los gráficos de torta no tienen ejes X/Y
            y: {
                beginAtZero: true,
                grid: { color: gridColor },
                border: { display: false },
                ticks: {
                    color: textColor,
                    font: { size: 11 },
                    // CORRECCIÓN: Forzar números enteros
                    stepSize: 1,
                    precision: 0
                }
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    display: !isUsersChart, // Ocultar etiquetas de texto si mostramos avatares
                    color: textColor
                }
            }
        }
    };
};

// Plugin para dibujar avatares en el eje X
export const avatarAxisPlugin = {
    id: 'avatarAxis',
    afterDraw: (chart) => {
        // Solo ejecutar si el dataset tiene la propiedad userImages
        const dataset = chart.data.datasets[0];
        if (!dataset.userImages || dataset.userImages.length === 0) return;

        const ctx = chart.ctx;
        const xAxis = chart.scales.x;

        // Si no hay eje X (ej. Pie Chart), salir
        if (!xAxis) return;

        const imagesUrl = dataset.userImages;

        xAxis.ticks.forEach((value, index) => {
            const x = xAxis.getPixelForTick(index);
            const y = xAxis.bottom;
            const imageUrl = imagesUrl[index];
            const size = 30; // Tamaño del avatar

            if (imageUrl) {
                const img = new Image();
                img.src = imageUrl;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y + 20, size / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();

                // Intento de dibujo seguro
                try { ctx.drawImage(img, x - size / 2, y + 5, size, size); } catch (e) { }

                // Borde suave
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();
            } else {
                // Fallback: Círculo con inicial
                ctx.save();
                ctx.fillStyle = '#cbd5e1'; // Slate-300
                ctx.beginPath();
                ctx.arc(x, y + 20, size / 2, 0, Math.PI * 2, true);
                ctx.fill();

                ctx.fillStyle = '#475569'; // Slate-600
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                const name = chart.data.labels[index] || "?";
                ctx.fillText(name.charAt(0).toUpperCase(), x, y + 24);
                ctx.restore();
            }
        });
    }
};