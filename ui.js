const ui = {
    explorer: document.getElementById('explorertree'),
    properties: document.getElementById('propertiesbody'),
    timeline: document.getElementById('timelinetracks'),
    ruler: document.getElementById('timelineruler'),
    fpsdisplay: document.getElementById('fpsdisplay'),
    entitycount: document.getElementById('entitycount'),
    modedisplay: document.getElementById('modedisplay'),
    viewportcoords: document.getElementById('viewportcoords'),
    viewportzoom: document.getElementById('viewportzoom'),
    tlscrubber: document.getElementById('tlscrubber'),
    tltime: document.getElementById('tltime'),
    btnplay: document.getElementById('btnplay'),
    btnstop: document.getElementById('btnstop'),
    btnselect: document.getElementById('btnselect'),
    btnmove: document.getElementById('btnmove'),
    btnrotate: document.getElementById('btnrotate'),
    btnscale: document.getElementById('btnscale'),
    btnnew: document.getElementById('btnnew'),
    btnsave: document.getElementById('btnsave'),
    btnload: document.getElementById('btnload'),
    btnaddentity: document.getElementById('btnaddentity'),
    btnaddgroup: document.getElementById('btnaddgroup'),
    btnduplicate: document.getElementById('btnduplicate'),
    btndelete: document.getElementById('btndelete'),
    tlplay: document.getElementById('tlplay'),
    tlstop: document.getElementById('tlstop'),
    tlloop: document.getElementById('tlloop'),
    selectednode: null,
    rebuild: function(engine) {
        const root = engine.getgroup(engine.scene.root);
        if (!root) return;
        const container = document.getElementById('scenechildren');
        container.innerHTML = '';
        this.buildnode(container, root, engine);
        this.updateproperties(engine);
        this.updatetimeline(engine);
    },
    buildnode: function(parent, group, engine) {
        for (let child of group.children) {
            if (engine.entities.has(child)) {
                const entity = engine.getentity(child);
                const div = document.createElement('div');
                div.className = 'treenode';
                div.dataset.id = child;
                div.innerHTML = '<span class="treetoggle">▶</span><span class="treelabel">' + entity.name + '</span>';
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectnode(div, engine);
                });
                parent.appendChild(div);
            } else if (engine.groups.has(child)) {
                const sub = engine.getgroup(child);
                const div = document.createElement('div');
                div.className = 'treenode';
                div.dataset.id = child;
                const toggle = document.createElement('span');
                toggle.className = 'treetoggle';
                toggle.textContent = '▼';
                const label = document.createElement('span');
                label.className = 'treelabel';
                label.textContent = sub.name;
                div.appendChild(toggle);
                div.appendChild(label);
                const childrenDiv = document.createElement('div');
                childrenDiv.className = 'treechildren';
                div.appendChild(childrenDiv);
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectnode(div, engine);
                });
                parent.appendChild(div);
                this.buildnode(childrenDiv, sub, engine);
            }
        }
    },
    selectnode: function(node, engine) {
        if (this.selectednode) this.selectednode.classList.remove('selected');
        this.selectednode = node;
        node.classList.add('selected');
        const id = parseInt(node.dataset.id);
        if (engine.entities.has(id)) {
            engine.selectedentity = id;
        } else {
            engine.selectedentity = null;
        }
        this.updateproperties(engine);
    },
    updateproperties: function(engine) {
        const body = this.properties;
        body.innerHTML = '';
        const id = engine.selectedentity;
        if (id === null || !engine.entities.has(id)) {
            body.innerHTML = '<div class="propertygroup"><div class="propertygrouplabel">No selection</div><div class="propertyrow"><span class="propertykey">Select an entity</span></div></div>';
            return;
        }
        const entity = engine.getentity(id);
        const t = entity.transform;
        const r = entity.renderable;
        const group = document.createElement('div');
        group.className = 'propertygroup';
        const label = document.createElement('div');
        label.className = 'propertygrouplabel';
        label.textContent = entity.name;
        group.appendChild(label);
        const props = [
            { key: 'x', value: t.x, step: 0.1 },
            { key: 'y', value: t.y, step: 0.1 },
            { key: 'rotation', value: t.rotation, step: 0.1 },
            { key: 'scalex', value: t.scalex, step: 0.1 },
            { key: 'scaley', value: t.scaley, step: 0.1 }
        ];
        if (r) {
            props.push({ key: 'color', value: r.color || '#ffffff', type: 'color' });
            props.push({ key: 'opacity', value: r.opacity || 1, step: 0.05, min: 0, max: 1 });
            if (r.type === 'rect') {
                props.push({ key: 'width', value: r.w || 20, step: 1 });
                props.push({ key: 'height', value: r.h || 20, step: 1 });
            } else if (r.type === 'circle') {
                props.push({ key: 'radius', value: r.radius || 10, step: 1 });
            }
        }
        for (let p of props) {
            const row = document.createElement('div');
            row.className = 'propertyrow';
            const key = document.createElement('span');
            key.className = 'propertykey';
            key.textContent = p.key;
            row.appendChild(key);
            const input = document.createElement('input');
            input.className = 'propertyvalue';
            if (p.type === 'color') {
                input.type = 'color';
                input.value = p.value;
            } else if (p.type === 'checkbox') {
                input.type = 'checkbox';
                input.checked = p.value;
            } else {
                input.type = 'number';
                input.step = p.step || 0.1;
                if (p.min !== undefined) input.min = p.min;
                if (p.max !== undefined) input.max = p.max;
                input.value = p.value;
            }
            input.addEventListener('input', () => {
                let val = input.type === 'checkbox' ? input.checked : parseFloat(input.value);
                if (isNaN(val) && input.type !== 'checkbox') return;
                if (p.key === 'x') t.x = val;
                else if (p.key === 'y') t.y = val;
                else if (p.key === 'rotation') t.rotation = val;
                else if (p.key === 'scalex') t.scalex = val;
                else if (p.key === 'scaley') t.scaley = val;
                else if (r) {
                    if (p.key === 'color') r.color = val;
                    else if (p.key === 'opacity') r.opacity = val;
                    else if (p.key === 'width') r.w = val;
                    else if (p.key === 'height') r.h = val;
                    else if (p.key === 'radius') r.radius = val;
                }
            });
            row.appendChild(input);
            group.appendChild(row);
        }
        body.appendChild(group);
    },
    updatetimeline: function(engine) {
        const container = this.timeline;
        container.innerHTML = '';
        for (let [id, entity] of engine.entities) {
            const tracks = animation.tracks.get(id);
            if (!tracks) continue;
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.padding = '2px 8px';
            div.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
            const name = document.createElement('span');
            name.style.width = '80px';
            name.style.fontSize = '11px';
            name.style.color = '#8888a0';
            name.textContent = entity.name;
            div.appendChild(name);
            const trackdiv = document.createElement('div');
            trackdiv.style.flex = '1';
            trackdiv.style.position = 'relative';
            trackdiv.style.height = '20px';
            trackdiv.style.background = 'rgba(255,255,255,0.03)';
            for (let prop in tracks) {
                const keyframes = tracks[prop];
                for (let kf of keyframes) {
                    const dot = document.createElement('div');
                    dot.style.position = 'absolute';
                    dot.style.left = (kf.time / animation.duration * 100) + '%';
                    dot.style.top = '2px';
                    dot.style.width = '8px';
                    dot.style.height = '8px';
                    dot.style.borderRadius = '50%';
                    dot.style.background = '#6a8ac0';
                    dot.style.cursor = 'pointer';
                    dot.title = prop + ' at ' + kf.time.toFixed(1) + 's';
                    trackdiv.appendChild(dot);
                }
            }
            div.appendChild(trackdiv);
            container.appendChild(div);
        }
        this.ruler.innerHTML = '';
        for (let i = 0; i <= 10; i++) {
            const mark = document.createElement('span');
            mark.style.position = 'absolute';
            mark.style.left = (i*10) + '%';
            mark.style.bottom = '0';
            mark.style.fontSize = '9px';
            mark.style.color = '#606070';
            mark.textContent = (i * animation.duration / 10).toFixed(1);
            this.ruler.appendChild(mark);
        }
    },
    updateinfo: function(engine) {
        this.fpsdisplay.textContent = 'FPS: ' + engine.fps;
        this.entitycount.textContent = 'Entities: ' + engine.entities.size;
        this.modedisplay.textContent = engine.iseditmode ? 'EDIT' : 'PLAY';
        this.modedisplay.className = 'toolbarlabel ' + (engine.iseditmode ? 'modeedit' : 'modeplay');
        const cam = engine.camera;
        const mx = engine.input.mouse.worldx || 0;
        const my = engine.input.mouse.worldy || 0;
        this.viewportcoords.textContent = 'X: ' + mx.toFixed(2) + ' Y: ' + my.toFixed(2);
        this.viewportzoom.textContent = 'Zoom: ' + Math.round(cam.zoom * 100) + '%';
    },
    settime: function(time) {
        this.tlscrubber.value = (time / animation.duration * 100);
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        const tenth = Math.floor((time - Math.floor(time)) * 10);
        this.tltime.textContent = mins + ':' + (secs<10?'0':'') + secs + '.' + tenth;
    },
    gettime: function() {
        return parseFloat(this.tlscrubber.value) / 100 * animation.duration;
    }
};
