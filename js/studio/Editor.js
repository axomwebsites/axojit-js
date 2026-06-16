export class Editor {
    constructor(engine) {
        this.engine = engine;
        this.selectedId = null;
        this.instances = [];

        this.explorerTree = document.getElementById('explorer-tree');
        this.propertiesList = document.getElementById('properties-list');
        this.btnPlay = document.getElementById('btn-play');
        this.btnStop = document.getElementById('btn-stop');
        this.btnSpawn = document.getElementById('btn-spawn');

        this.initEvents();
    }

    initEvents() {
        this.btnSpawn.addEventListener('click', () => this.spawnPart());
        
        this.btnPlay.addEventListener('click', () => {
            this.btnPlay.disabled = true;
            this.btnStop.disabled = false;
            this.engine.start();
        });

        this.btnStop.addEventListener('click', () => {
            this.btnPlay.disabled = false;
            this.btnStop.disabled = true;
            this.engine.stop();
        });
    }

    spawnPart() {
        const viewport = document.getElementById('glCanvas');
        const x = viewport.clientWidth / 2;
        const y = viewport.clientHeight / 2;
        
        const id = this.engine.pool.allocate(
            x, y,
            50, 50,
            1, 1, 1, 1,
            0,
            0, 0
        );

        if (id !== -1) {
            const item = {
                id: id,
                name: `Part_${id}`,
                rotSpeed: 0
            };
            this.instances.push(item);
            this.addTreeItem(item);
            this.engine.draw();
        }
    }

    addTreeItem(item) {
        const div = document.createElement('div');
        div.className = 'tree-item child';
        div.innerText = item.name;
        div.dataset.id = item.id;
        
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            this.selectObject(item.id);
        });

        this.explorerTree.appendChild(div);
    }

    selectObject(id) {
        this.selectedId = id;
        const pool = this.engine.pool;
        const i2 = id * 2;
        const i4 = id * 4;

        this.propertiesList.innerHTML = `
            <div class="prop-row"><div class="prop-label">ID</div><input class="prop-value" type="text" value="${id}" disabled></div>
            <div class="prop-row"><div class="prop-label">Position.X</div><input class="prop-value" type="number" id="p-x" value="${pool.positions[i2]}"></div>
            <div class="prop-row"><div class="prop-label">Position.Y</div><input class="prop-value" type="number" id="p-y" value="${pool.positions[i2+1]}"></div>
            <div class="prop-row"><div class="prop-label">Size.X</div><input class="prop-value" type="number" id="s-x" value="${pool.scales[i2]}"></div>
            <div class="prop-row"><div class="prop-label">Size.Y</div><input class="prop-value" type="number" id="s-y" value="${pool.scales[i2+1]}"></div>
            <div class="prop-row"><div class="prop-label">Color.R</div><input class="prop-value" type="number" step="0.1" id="c-r" value="${pool.colors[i4]}"></div>
            <div class="prop-row"><div class="prop-label">Velocity.X</div><input class="prop-value" type="number" id="v-x" value="${pool.velocities[i2]}"></div>
            <div class="prop-row"><div class="prop-label">Velocity.Y</div><input class="prop-value" type="number" id="v-y" value="${pool.velocities[i2+1]}"></div>
        `;

        this.bindPropertyInputs();
    }

    bindPropertyInputs() {
        const updateField = (id, callback) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    if (this.selectedId !== null) {
                        callback(parseFloat(e.target.value) || 0);
                        this.engine.draw();
                    }
                });
            }
        };

        const pool = this.engine.pool;
        updateField('p-x', (v) => pool.positions[this.selectedId * 2] = v);
        updateField('p-y', (v) => pool.positions[this.selectedId * 2 + 1] = v);
        updateField('s-x', (v) => pool.scales[this.selectedId * 2] = v);
        updateField('s-y', (v) => pool.scales[this.selectedId * 2 + 1] = v);
        updateField('c-r', (v) => pool.colors[this.selectedId * 4] = v);
        updateField('v-x', (v) => pool.velocities[this.selectedId * 2] = v);
        updateField('v-y', (v) => pool.velocities[this.selectedId * 2 + 1] = v);
    }
              }
