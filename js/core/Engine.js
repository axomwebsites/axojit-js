import { Renderer2D } from '../renderer/Renderer2D.js';
import { MemoryPool } from './MemoryPool.js';

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.renderer = new Renderer2D(this.canvas);
        this.pool = new MemoryPool(25000);
        this.renderCache = new Float32Array(this.pool.size * 9);
        this.lastTime = 0;
        this.updateCallback = null;

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.renderer.resize(this.canvas.width, this.canvas.height);
    }

    setUpdate(callback) {
        this.updateCallback = callback;
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(currentTime) {
        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (dt > 0.1) dt = 0.1;

        if (this.updateCallback) {
            this.updateCallback(dt);
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    draw() {
        let renderCount = 0;
        const pool = this.pool;
        const cache = this.renderCache;
        const size = pool.size;

        for (let i = 0; i < size; i++) {
            if (pool.active[i] === 1) {
                const cacheOffset = renderCount * 9;
                const i2 = i * 2;
                const i4 = i * 4;

                cache[cacheOffset]     = pool.positions[i2];
                cache[cacheOffset + 1] = pool.positions[i2 + 1];
                cache[cacheOffset + 2] = pool.scales[i2];
                cache[cacheOffset + 3] = pool.scales[i2 + 1];
                cache[cacheOffset + 4] = pool.colors[i4];
                cache[cacheOffset + 5] = pool.colors[i4 + 1];
                cache[cacheOffset + 6] = pool.colors[i4 + 2];
                cache[cacheOffset + 7] = pool.colors[i4 + 3];
                cache[cacheOffset + 8] = pool.rotations[i];

                renderCount++;
            }
        }

        const slice = cache.subarray(0, renderCount * 9);
        this.renderer.render(renderCount, slice);
    }
            }
