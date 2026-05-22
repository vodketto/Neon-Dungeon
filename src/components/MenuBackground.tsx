import { useEffect, useRef, useMemo } from 'react';
import { generateDungeon } from '../lib/dungeonGenerator';

const GRID_SIZE = 40;

export default function MenuBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dungeon = useMemo(() => generateDungeon(30, 25, 1), []);
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const render = (time: number) => {
            timeRef.current = time / 1000;
            const t = timeRef.current;

            // Update canvas size
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Camera movement
            const camX = Math.sin(t * 0.2) * 100 + dungeon.grid[0].length * GRID_SIZE / 2 - canvas.width / 2;
            const camY = Math.cos(t * 0.15) * 80 + dungeon.grid.length * GRID_SIZE / 2 - canvas.height / 2;

            ctx.save();
            ctx.translate(-camX, -camY);

            // Render Grid
            dungeon.grid.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 0 || cell === 2) {
                        ctx.fillStyle = '#111';
                        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                        
                        // Brick pattern
                        ctx.fillStyle = '#1a1a2e'; 
                        ctx.fillRect(x * GRID_SIZE + 2, y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE / 2 - 4);
                        ctx.fillRect(x * GRID_SIZE + 2, y * GRID_SIZE + GRID_SIZE / 2 + 2, GRID_SIZE / 2 - 4, GRID_SIZE / 2 - 4);
                        ctx.fillRect(x * GRID_SIZE + GRID_SIZE / 2 + 2, y * GRID_SIZE + GRID_SIZE / 2 + 2, GRID_SIZE / 2 - 4, GRID_SIZE / 2 - 4);
                    } else {
                        const floorVar = (x * 17 + y * 31) % 15;
                        if (cell === 3) {
                            ctx.fillStyle = floorVar % 2 === 0 ? '#0a0a0f' : '#08080d';
                        } else {
                            if (floorVar === 0) ctx.fillStyle = '#1f1f1f';
                            else if (floorVar === 1) ctx.fillStyle = '#232323';
                            else if (floorVar === 2) ctx.fillStyle = '#212121';
                            else ctx.fillStyle = '#222';
                        }
                        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                    }
                });
            });

            // Torches
            dungeon.torches.forEach(torch => {
                const tx = torch.gridX * GRID_SIZE + GRID_SIZE / 2;
                const ty = torch.gridY * GRID_SIZE + GRID_SIZE / 2;
                const flicker = Math.sin(t * 10 + torch.phase) * 2;
                
                // Light glow
                const gradient = ctx.createRadialGradient(tx, ty, 5, tx, ty, 60 + flicker * 5);
                gradient.addColorStop(0, 'rgba(255, 120, 0, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 120, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(tx - 80, ty - 80, 160, 160);

                // Torch body
                ctx.fillStyle = '#442200';
                ctx.fillRect(tx - 2, ty - 5, 4, 15);
                
                // Flame
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(tx, ty - 8 + flicker, 4 + flicker, 0, Math.PI * 2);
                ctx.fill();
            });

            // Vignette / Darkness overlay
            ctx.restore();
            const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.2, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
            vignette.addColorStop(0, 'rgba(0,0,0,0.4)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.9)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrame);
    }, [dungeon]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ filter: 'blur(2px) contrast(1.2)' }}
        />
    );
}
