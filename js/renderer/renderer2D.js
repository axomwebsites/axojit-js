import { vertexShaderSource, fragmentShaderSource } from './Shaders.js';

export class Renderer2D {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: "high-performance" });
        if (!this.gl) {
            throw new Error();
        }
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.initProgram();
        this.initBuffers();
    }

    initProgram() {
        const gl = this.gl;
        const vs = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error();
        }

        this.resUniformLocation = gl.getUniformLocation(this.program, 'u_resolution');
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error();
        }
        return shader;
    }

    initBuffers() {
        const gl = this.gl;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const vertices = new Float32Array([
            -0.5, -0.5,
             0.5, -0.5,
            -0.5,  0.5,
            -0.5,  0.5,
             0.5, -0.5,
             0.5,  0.5
        ]);

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this.instanceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 0);
        gl.vertexAttribDivisor(1, 1);

        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 36, 8);
        gl.vertexAttribDivisor(2, 1);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 36, 16);
        gl.vertexAttribDivisor(3, 1);

        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 36, 32);
        gl.vertexAttribDivisor(4, 1);
    }

    resize(width, height) {
        this.gl.viewport(0, 0, width, height);
    }

    render(count, interleavedData) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (count === 0) return;

        gl.useProgram(this.program);
        gl.uniform2f(this.resUniformLocation, gl.canvas.width, gl.canvas.height);

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, interleavedData, gl.DYNAMIC_DRAW);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    }
                               }
