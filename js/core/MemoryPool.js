export class MemoryPool {
    constructor(initialSize = 25000) {
        this.size = initialSize;
        this.positions = new Float32Array(this.size * 2);
        this.scales = new Float32Array(this.size * 2);
        this.colors = new Float32Array(this.size * 4);
        this.rotations = new Float32Array(this.size);
        this.velocities = new Float32Array(this.size * 2);
        this.active = new Uint8Array(this.size);
        this.count = 0;
    }

    allocate(x, y, sx, sy, r, g, b, a, rot = 0, vx = 0, vy = 0) {
        for (let i = 0; i < this.size; i++) {
            if (this.active[i] === 0) {
                this.active[i] = 1;
                
                const i2 = i * 2;
                const i4 = i * 4;

                this.positions[i2] = x;
                this.positions[i2 + 1] = y;
                
                this.scales[i2] = sx;
                this.scales[i2 + 1] = sy;
                
                this.colors[i4] = r;
                this.colors[i4 + 1] = g;
                this.colors[i4 + 2] = b;
                this.colors[i4 + 3] = a;

                this.rotations[i] = rot;
                
                this.velocities[i2] = vx;
                this.velocities[i2 + 1] = vy;

                this.count++;
                return i;
            }
        }
        return -1;
    }

    free(index) {
        if (index >= 0 && index < this.size && this.active[index] === 1) {
            this.active[index] = 0;
            this.count--;
        }
    }

    clear() {
        this.positions.fill(0);
        this.scales.fill(0);
        this.colors.fill(0);
        this.rotations.fill(0);
        this.velocities.fill(0);
        this.active.fill(0);
        this.count = 0;
    }
              }
