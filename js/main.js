import { Engine } from './core/Engine.js';
import { Editor } from './studio/Editor.js';

const Axojita = new Engine('glCanvas');
const Studio = new Editor(Axojita);

Axojita.setUpdate((dt) => {
    const pool = Axojita.pool;
    const canvas = Axojita.canvas;
    const count = Studio.instances.length;

    for (let i = 0; i < count; i++) {
        const instance = Studio.instances[i];
        const index = instance.id;
        const i2 = index * 2;

        pool.positions[i2] += pool.velocities[i2] * dt;
        pool.positions[i2 + 1] += pool.velocities[i2 + 1] * dt;

        if (pool.positions[i2] < -100 || pool.positions[i2] > canvas.width + 100 ||
            pool.positions[i2 + 1] < -100 || pool.positions[i2 + 1] > canvas.height + 100) {
            
            pool.positions[i2] = canvas.width / 2;
            pool.positions[i2 + 1] = canvas.height / 2;
        }
    }
    
    if (Studio.selectedId !== null) {
        const px = document.getElementById('p-x');
        const py = document.getElementById('p-y');
        if (px && document.activeElement !== px) px.value = Math.round(pool.positions[Studio.selectedId * 2]);
        if (py && document.activeElement !== py) py.value = Math.round(pool.positions[Studio.selectedId * 2 + 1]);
    }
});

Axojita.draw();
