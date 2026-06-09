class vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    norm() {
        let m = this.mag();
        if (m !== 0) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    }

    perp() {
        let temp = this.x;
        this.x = -this.y;
        this.y = temp;
        return this;
    }
}

class pool {
    constructor(type, size) {
        this.type = type;
        this.pool = [];
        for (let i = 0; i < size; i++) {
            this.pool.push(new type());
        }
    }

    get() {
        return this.pool.length > 0 ? this.pool.pop() : new this.type();
    }

    release(obj) {
        this.pool.push(obj);
    }
}

class quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.entities = [];
        this.divided = false;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }

    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;

        this.nw = new quadtree({ x: x - w, y: y - h, w: w, h: h }, this.capacity);
        this.ne = new quadtree({ x: x + w, y: y - h, w: w, h: h }, this.capacity);
        this.sw = new quadtree({ x: x - w, y: y + h, w: w, h: h }, this.capacity);
        this.se = new quadtree({ x: x + w, y: y + h, w: w, h: h }, this.capacity);
        this.divided = true;
    }

    insert(entity) {
        if (!this.contains(this.boundary, entity.pos)) {
            return false;
        }

        if (this.entities.length < this.capacity) {
            this.entities.push(entity);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.nw.insert(entity)) return true;
        if (this.ne.insert(entity)) return true;
        if (this.sw.insert(entity)) return true;
        if (this.se.insert(entity)) return true;

        return false;
    }

    query(range, found) {
        if (!this.intersects(this.boundary, range)) {
            return;
        }

        for (let e of this.entities) {
            if (this.contains(range, e.pos)) {
                found.push(e);
            }
        }

        if (this.divided) {
            this.nw.query(range, found);
            this.ne.query(range, found);
            this.sw.query(range, found);
            this.se.query(range, found);
        }
    }

    contains(rect, point) {
        return (
            point.x >= rect.x - rect.w &&
            point.x <= rect.x + rect.w &&
            point.y >= rect.y - rect.h &&
            point.y <= rect.y + rect.h
        );
    }

    intersects(rect, range) {
        return !(
            range.x - range.w > rect.x + rect.w ||
            range.x + range.w < rect.x - rect.w ||
            range.y - range.h > rect.y + rect.h ||
            range.y + range.h < rect.y - rect.h
        );
    }

    clear() {
        this.entities = [];
        if (this.divided) {
            this.nw.clear();
            this.ne.clear();
            this.sw.clear();
            this.se.clear();
            this.divided = false;
        }
    }
}

class component {
    constructor() {
        this.entity = null;
    }
    update(delta) {}
}

class entity {
    constructor(id) {
        this.id = id;
        this.pos = new vec2();
        this.size = new vec2(32, 32);
        this.vel = new vec2();
        this.angle = 0;
        this.static = false;
        this.components = [];
        this.points = [new vec2(), new vec2(), new vec2(), new vec2()];
    }

    addcomponent(c) {
        c.entity = this;
        this.components.push(c);
    }

    getpoints() {
        let cx = this.pos.x;
        let cy = this.pos.y;
        let hw = this.size.x / 2;
        let hh = this.size.y / 2;
        let cos = Math.cos(this.angle);
        let sin = Math.sin(this.angle);

        let localx = [-hw, hw, hw, -hw];
        let localy = [-hh, -hh, hh, hh];

        for (let i = 0; i < 4; i++) {
            this.points[i].x = cx + (localx[i] * cos - localy[i] * sin);
            this.points[i].y = cy + (localx[i] * sin + localy[i] * cos);
        }
        return this.points;
    }

    update(delta) {
        for (let c of this.components) {
            c.update(delta);
        }
    }
}

class audionetwork {
    constructor() {
        this.context = null;
        this.master = null;
        this.music = null;
        this.sfx = null;
    }

    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.context.createGain();
        this.music = this.context.createGain();
        this.sfx = this.context.createGain();

        this.master.connect(this.context.destination);
        this.music.connect(this.master);
        this.sfx.connect(this.master);
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}

class inputmanager {
    constructor() {
        this.actions = {};
        this.bindings = {};
        this.mouse = new vec2();
        this.touches = {};
        this.gamepads = [];

        window.addEventListener('keydown', (e) => this.handlekey(e, true));
        window.addEventListener('keyup', (e) => this.handlekey(e, false));
        window.addEventListener('mousemove', (e) => this.handlemouse(e));
        window.addEventListener('touchmove', (e) => this.handletouch(e), { passive: false });
        window.addEventListener('touchstart', (e) => this.handletouch(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handletouch(e), { passive: false });
    }

    bind(key, action) {
        this.bindings[key] = action;
        this.actions[action] = false;
    }

    handlekey(e, isdown) {
        if (this.bindings[e.key] !== undefined) {
            this.actions[this.bindings[e.key]] = isdown;
            e.preventDefault();
        }
    }

    handlemouse(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    handletouch(e) {
        this.touches = e.touches;
        if (e.cancelable) e.preventDefault();
    }

    update() {
        let pads = navigator.getGamepads ? navigator.getGamepads() : [];
        this.gamepads = [];
        for (let p of pads) {
            if (p) this.gamepads.push(p);
        }
    }
}

class netchan {
    constructor() {
        this.ws = null;
        this.rtc = null;
        this.channel = null;
    }

    connectws(url) {
        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';
    }

    initrtc() {
        this.rtc = new RTCPeerConnection();
        this.channel = this.rtc.createDataChannel('sendChannel', { ordered: false, maxRetransmits: 0 });
        this.channel.binaryType = 'arraybuffer';
    }
}

class core {
    constructor(canvasid, headless = false) {
        this.headless = headless;
        this.entities = [];
        this.entitymap = new Map();
        this.vecpool = new pool(vec2, 200);
        this.timestep = 1 / 60;
        this.accumulator = 0;
        this.lasttime = 0;
        this.gravity = new vec2(0, 500);
        this.nextid = 1;

        this.input = new inputmanager();
        this.audio = new audionetwork();
        this.net = new netchan();
        
        let w = typeof window !== 'undefined' ? window.innerWidth : 800;
        let h = typeof window !== 'undefined' ? window.innerHeight : 600;
        this.qtree = new quadtree({ x: w / 2, y: h / 2, w: w / 2, h: h / 2 }, 4);

        if (!this.headless) {
            this.canvas = document.getElementById(canvasid);
            this.gl = this.canvas.getContext('webgl2');
            this.initrenderer();
            window.addEventListener('click', () => {
                this.audio.init();
                this.audio.resume();
            });
            window.addEventListener('resize', () => this.resize());
        }
    }

    initrenderer() {
        let gl = this.gl;
        let vs = `#version 300 es
        in vec2 position;
        in vec2 texcoord;
        out vec2 v_texcoord;
        uniform vec2 u_resolution;
        void main() {
            vec2 zeroToOne = position / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            v_texcoord = texcoord;
        }`;

        let fs = `#version 300 es
        precision highp float;
        in vec2 v_texcoord;
        out vec4 outColor;
        uniform sampler2D u_texture;
        void main() {
            outColor = texture(u_texture, v_texcoord);
        }`;

        let vshader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vshader, vs);
        gl.compileShader(vshader);

        let fshader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fshader, fs);
        gl.compileShader(fshader);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vshader);
        gl.attachShader(this.program, fshader);
        gl.linkProgram(this.program);

        this.positionloc = gl.getAttribLocation(this.program, 'position');
        this.texcoordloc = gl.getAttribLocation(this.program, 'texcoord');
        this.resloc = gl.getUniformLocation(this.program, 'u_resolution');

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.posbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuffer);
        gl.enableVertexAttribArray(this.positionloc);
        gl.vertexAttribPointer(this.positionloc, 2, gl.FLOAT, false, 0, 0);

        this.texbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texcoordloc);
        gl.vertexAttribPointer(this.texcoordloc, 2, gl.FLOAT, false, 0, 0);

        this.resize();
    }

    resize() {
        if (this.headless) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    spawn() {
        let e = new entity(this.nextid++);
        this.entities.push(e);
        this.entitymap.set(e.id, e);
        return e;
    }

    destroy(e) {
        this.entities = this.entities.filter(item => item !== e);
        this.entitymap.delete(e.id);
    }

    start() {
        if (typeof window !== 'undefined') {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    loop(time) {
        let delta = (time - this.lasttime) / 1000;
        if (delta > 0.25) delta = 0.25;
        this.lasttime = time;

        this.accumulator += delta;
        this.input.update();

        while (this.accumulator >= this.timestep) {
            this.fixedupdate(this.timestep);
            this.accumulator -= this.timestep;
        }

        if (!this.headless) {
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    fixedupdate(delta) {
        this.qtree.clear();
        for (let e of this.entities) {
            if (!e.static) {
                let f = this.vecpool.get().set(this.gravity.x, this.gravity.y).mult(delta);
                e.vel.add(f);
                this.vecpool.release(f);

                let d = this.vecpool.get().set(e.vel.x, e.vel.y).mult(delta);
                e.pos.add(d);
                this.vecpool.release(d);
            }
            e.update(delta);
            this.qtree.insert(e);
        }
        this.physics();
    }

    physics() {
        let targets = [];
        let axis = this.vecpool.get();
        let edge = this.vecpool.get();
        let mtv = this.vecpool.get();

        for (let e1 of this.entities) {
            if (e1.static) continue;
            targets.length = 0;
            
            let range = { x: e1.pos.x, y: e1.pos.y, w: e1.size.x * 2, h: e1.size.y * 2 };
            this.qtree.query(range, targets);

            for (let e2 of targets) {
                if (e1 === e2) continue;

                let overlap = this.sat(e1, e2, axis, edge, mtv);
                if (overlap) {
                    if (e2.static) {
                        e1.pos.sub(mtv);
                        let normal = this.vecpool.get().set(mtv.x, mtv.y).norm();
                        let sepvel = e1.vel.dot(normal);
                        if (sepvel > 0) {
                            let impulse = this.vecpool.get().set(normal.x, normal.y).mult(sepvel);
                            e1.vel.sub(impulse);
                            this.vecpool.release(impulse);
                        }
                        this.vecpool.release(normal);
                    } else {
                        let shift = this.vecpool.get().set(mtv.x, mtv.y).mult(0.5);
                        e1.pos.sub(shift);
                        e2.pos.add(shift);
                        this.vecpool.release(shift);
                    }
                }
            }
        }
        this.vecpool.release(axis);
        this.vecpool.release(edge);
        this.vecpool.release(mtv);
    }

    sat(e1, e2, axis, edge, mtv) {
        let p1 = e1.getpoints();
        let p2 = e2.getpoints();
        let minoverlap = Infinity;
        let smallestx = 0;
        let smallesty = 0;

        for (let shape of [p1, p2]) {
            for (let i = 0; i < 4; i++) {
                let n1 = shape[i];
                let n2 = shape[(i + 1) % 4];
                edge.set(n2.x - n1.x, n2.y - n1.y);
                axis.set(edge.x, edge.y).perp().norm();

                let min1 = Infinity, max1 = -Infinity;
                for (let p of p1) {
                    let dot = p.x * axis.x + p.y * axis.y;
                    if (dot < min1) min1 = dot;
                    if (dot > max1) max1 = dot;
                }

                let min2 = Infinity, max2 = -Infinity;
                for (let p of p2) {
                    let dot = p.x * axis.x + p.y * axis.y;
                    if (dot < min2) min2 = dot;
                    if (dot > max2) max2 = dot;
                }

                if (max1 < min2 || max2 < min1) {
                    return null;
                }

                let o = Math.min(max1, max2) - Math.max(min1, min2);
                if (o < minoverlap) {
                    minoverlap = o;
                    smallestx = axis.x;
                    smallesty = axis.y;
                }
            }
        }

        let dx = e2.pos.x - e1.pos.x;
        let dy = e2.pos.y - e1.pos.y;
        if (dx * smallestx + dy * smallesty < 0) {
            smallestx = -smallestx;
            smallesty = -smallesty;
        }

        mtv.set(smallestx * minoverlap, smallesty * minoverlap);
        return mtv;
    }

    draw() {
        let gl = this.gl;
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.uniform2f(this.resloc, this.canvas.width, this.canvas.height);
        gl.bindVertexArray(this.vao);

        let positions = [];
        let texcoords = [];

        for (let e of this.entities) {
            let pts = e.getpoints();
            positions.push(
                pts[0].x, pts[0].y,
                pts[1].x, pts[1].y,
                pts[2].x, pts[2].y,
                pts[0].x, pts[0].y,
                pts[2].x, pts[2].y,
                pts[3].x, pts[3].y
            );
            texcoords.push(
                0,0, 1,0, 1,1,
                0,0, 1,1, 0,1
            );
        }

        if (positions.length === 0) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.DYNAMIC_DRAW);

        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
    }

    serialize() {
        let data = [];
        for (let e of this.entities) {
            data.push({
                id: e.id,
                px: e.pos.x,
                py: e.pos.y,
                vx: e.vel.x,
                vy: e.vel.y,
                sx: e.size.x,
                sy: e.size.y,
                a: e.angle,
                s: e.static
            });
        }
        return JSON.stringify(data);
    }

    deserialize(str) {
        let data = JSON.parse(str);
        this.entities = [];
        this.entitymap.clear();
        for (let d of data) {
            let e = new entity(d.id);
            e.pos.set(d.px, d.py);
            e.vel.set(d.vx, d.vy);
            e.size.set(d.sx, d.sy);
            e.angle = d.a;
            e.static = d.s;
            this.entities.push(e);
            this.entitymap.set(e.id, e);
        }
    }
}

class controller extends component {
    update(delta) {
        let input = this.entity.pos.x;
        if (typeof window !== 'undefined') {
            let mainengine = window.instance;
            if (mainengine.input.actions['jump']) {
                this.entity.vel.y = -300;
            }
            if (mainengine.input.actions['left']) {
                this.entity.vel.x = -150;
            } else if (mainengine.input.actions['right']) {
                this.entity.vel.x = 150;
            } else {
                this.entity.vel.x = 0;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    let maininstance = new core('game');
    window.instance = maininstance;
    maininstance.input.bind(' ', 'jump');
    maininstance.input.bind('ArrowLeft', 'left');
    maininstance.input.bind('ArrowRight', 'right');

    let ground = maininstance.spawn();
    ground.pos.set(window.innerWidth / 2, window.innerHeight - 50);
    ground.size.set(window.innerWidth, 100);
    ground.static = true;

    let character = maininstance.spawn();
    character.pos.set(200, 200);
    character.addcomponent(new controller());

    maininstance.start();
}
