import { Chart } from 'chart.js';
import { Tooltip } from 'chart.js';

const imageCache = new Map();

Tooltip.positioners.followMouse = function (elements, eventPosition) {
    if (!elements.length) return false;
    return { x: eventPosition.x, y: eventPosition.y };
};

export const getAvatarUrl = (path) => {
    if (!path) return null;
    const API_BASE_URL = "https://api.ushuaiamovimiento.com.ar";
    let finalUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    if (finalUrl.startsWith('http://api.ushuaiamovimiento.com.ar')) {
        return finalUrl.replace('http://', 'https://');
    }
    return finalUrl;
};

export const getChartOptions = (isDark, isUsersChart, isPie) => {
    const textColor = isDark ? '#9CA3AF' : '#4B5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: isUsersChart ? 50 : 0 } },
        plugins: {
            legend: {
                display: isPie,
                position: 'top',
                labels: { color: textColor }
            },
            tooltip: {
                position: 'followMouse',
                yAlign: 'bottom',
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
        scales: isPie ? {} : {
            y: {
                beginAtZero: true,
                grid: { color: gridColor },
                border: { display: false },
                ticks: {
                    color: textColor,
                    font: { size: 11 },
                    stepSize: 1,
                    precision: 0
                }
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    display: !isUsersChart,
                    color: textColor
                }
            }
        }
    };
};

export const avatarAxisPlugin = {
    id: 'avatarAxis',
    afterDraw: (chart) => {
        const dataset = chart.data.datasets[0];
        if (!dataset.userImages || dataset.userImages.length === 0) return;

        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        if (!xAxis) return;

        const imagesUrl = dataset.userImages;

        xAxis.ticks.forEach((value, index) => {
            const x = xAxis.getPixelForTick(index);
            const y = xAxis.bottom;
            const imageUrl = imagesUrl[index];
            const size = 50;

            if (imageUrl) {
                let img = imageCache.get(imageUrl);

                if (!img) {
                    img = new Image();
                    img.src = imageUrl;
                    img.onload = () => chart.draw();
                    imageCache.set(imageUrl, img);
                }

                if (img.complete && img.naturalWidth !== 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y + 25, size / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();

                    try {
                        const imgRatio = img.width / img.height;
                        let drawWidth, drawHeight, offsetX, offsetY;

                        if (imgRatio > 1) {
                            drawWidth = size * imgRatio;
                            drawHeight = size;
                            offsetX = x - drawWidth / 2;
                            offsetY = y + 25 - size / 2;
                        } else {
                            drawWidth = size;
                            drawHeight = size / imgRatio;
                            offsetX = x - size / 2;
                            offsetY = (y + 25) - (drawHeight / 2);
                        }

                        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    } catch (e) { }

                    ctx.restore();
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y + 25, size / 2, 0, Math.PI * 2, true);
                    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                }
            } else {
                ctx.save();
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.arc(x, y + 25, size / 2, 0, Math.PI * 2, true);
                ctx.fill();
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                const name = chart.data.labels[index] || "?";
                ctx.fillText(name.charAt(0).toUpperCase(), x, y + 30);
                ctx.restore();
            }
        });
    }
};