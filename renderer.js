const renderer = {
    canvas: null,
    ctx: null,
    gl: null,
    usewebgl: false,
    width: 0,
    height: 0,
    init: function(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        try {
            this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (this.gl) {
                this.usewebgl = true;
                this.gl.viewport(0, 0, this.width, this.height);
                this.gl.clearColor(0.09, 0.09, 0.12, 1);
            } else throw new Error('no webgl');
        } catch(e) {
            this.usewebgl = false;
            this.ctx = canvas.getContext('2d');
        }
        this.resize(this.width, this.height);
    },
    resize: function(w, h) {
        this.width = w;
        this.height = h;
        if (this.canvas) {
            this.canvas.width = w;
            this.canvas.height = h;
            if (this.gl) this.gl.viewport(0, 0, w, h);
        }
    },
    clear: function() {
        if (this.usewebgl) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        } else {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    },
    drawentity: function(entity, cam) {
        if (!entity.renderable) return;
        const t = entity.transform;
        const r = entity.renderable;
        const cx = cam.x;
        const cy = cam.y;
        const cz = cam.zoom;
        const px = (t.x - cx) * cz + this.width/2;
        const py = (t.y - cy) * cz + this.height/2;
        const sx = t.scalex * cz;
        const sy = t.scaley * cz;
        const opacity = r.opacity !== undefined ? r.opacity : 1;
        if (this.usewebgl) {
            this.webgldraw(px, py, t.rotation, sx, sy, r, opacity);
        } else {
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.translate(px, py);
            this.ctx.rotate(t.rotation);
            this.ctx.scale(sx, sy);
            if (r.type === 'rect') {
                this.ctx.fillStyle = r.color || '#ffffff';
                this.ctx.fillRect(-r.w/2, -r.h/2, r.w, r.h);
                if (r.border) {
                    this.ctx.strokeStyle = r.border;
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(-r.w/2, -r.h/2, r.w, r.h);
                }
            } else if (r.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r.radius || 10, 0, Math.PI*2);
                this.ctx.fillStyle = r.color || '#ffffff';
                this.ctx.fill();
                if (r.border) {
                    this.ctx.strokeStyle = r.border;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            } else if (r.type === 'image') {
                if (r.image && r.image.complete) {
                    this.ctx.drawImage(r.image, -r.w/2, -r.h/2, r.w, r.h);
                }
            } else if (r.type === 'text') {
                this.ctx.fillStyle = r.color || '#ffffff';
                this.ctx.font = (r.fontsize || 16) + 'px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(r.text || '', 0, 0);
            } else if (r.type === 'polygon') {
                this.ctx.beginPath();
                const pts = r.points || [{x:-10,y:-10},{x:10,y:-10},{x:0,y:10}];
                for (let i = 0; i < pts.length; i++) {
                    if (i === 0) this.ctx.moveTo(pts[i].x, pts[i].y);
                    else this.ctx.lineTo(pts[i].x, pts[i].y);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = r.color || '#ffffff';
                this.ctx.fill();
                if (r.border) {
                    this.ctx.strokeStyle = r.border;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
            this.ctx.restore();
        }
    },
    webgldraw: function(px, py, rot, sx, sy, r, opacity) {
        const gl = this.gl;
        if (!gl) return;
        const program = this.getprogram();
        gl.useProgram(program);
        const pos = gl.getAttribLocation(program, 'position');
        const col = gl.getUniformLocation(program, 'color');
        const mat = gl.getUniformLocation(program, 'matrix');
        const m = new Float32Array(16);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        m[0] = sx * cos; m[1] = sx * sin; m[4] = -sy * sin; m[5] = sy * cos;
        m[12] = px; m[13] = py; m[15] = 1;
        gl.uniformMatrix4fv(mat, false, m);
        let color = r.color || '#ffffff';
        let r2=1,g2=1,b2=1;
        if (color.startsWith('#')) {
            const c = parseInt(color.slice(1), 16);
            r2 = ((c>>16)&0xff)/255; g2 = ((c>>8)&0xff)/255; b2 = (c&0xff)/255;
        }
        gl.uniform4f(col, r2, g2, b2, opacity);
        const w = r.w || 20;
        const h = r.h || 20;
        const vertices = new Float32Array([
            -w/2, -h/2,  w/2, -h/2,  w/2, h/2,
            -w/2, -h/2,  w/2, h/2,  -w/2, h/2
        ]);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.deleteBuffer(buf);
    },
    getprogram: function() {
        const gl = this.gl;
        if (!this._program) {
            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, 'attribute vec2 position; uniform mat4 matrix; void main(){ gl_Position = matrix * vec4(position,0,1); }');
            gl.compileShader(vs);
            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, 'precision mediump float; uniform vec4 color; void main(){ gl_FragColor = color; }');
            gl.compileShader(fs);
            const prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            this._program = prog;
        }
        return this._program;
    }
};
