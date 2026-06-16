import { Engine } from './core/Engine.js';

const Axojita = new Engine('glCanvas');

const entityMeta = [];
const instanceCount = 10000;

for (let i = 0; i < instanceCount; i++) {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const sizeX = 8 + Math.random() * 16;
    const sizeY = 8 + Math.random() * 16;
    
    const r = 0.2 + Math.random() * 0.8;
    const g = 0.1 + Math.random() * 0.4;
    const b = 0.8 + Math.random() * 0.2;
    const a = 0.5 + Math.random() * 0.5;
    
    const rotation = Math.random() * Math.PI * 2;
    const vx = (Math.random() - 0.5) * 100;
    const vy = (Math.random() - 0.5) * 100;

    const memoryIndex = Axojita.pool.allocate(
        x, y, 
        sizeX, sizeY, 
        r, g, b, a, 
        rotation, 
        vx, vy
    );

    if (memoryIndex !== -1) {
        entityMeta.push({
            id: memoryIndex,
            rotSpeed: (Math.random() - 0.5) * 2
        });
    }
}

Axojita.setUpdate((dt) => {
    const pool = Axojita.pool;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = entityMeta.length;

    for (let i = 0; i < count; i++) {
        const entity = entityMeta[i];
        const index = entity.id;
        const i2 = index * 2;

        pool.positions[i2] += pool.velocities[i2] * dt;
        pool.positions[i2 + 1] += pool.velocities[i2 + 1] * dt;
        
        pool.rotations[index] += entity.rotSpeed * dt;

        if (pool.positions[i2] < -50) {
            pool.positions[i2] = width + 50;
        } else if (pool.positions[i2] > width + 50) {
            pool.positions[i2] = -50;
        }

        if (pool.positions[i2 + 1] < -50) {
            pool.positions[i2 + 1] = height + 50;
        } else if (pool.positions[i2 + 1] > height + 50) {
            pool.positions[i2 + 1] = -50;
        }
    }
});

Axojita.start();
