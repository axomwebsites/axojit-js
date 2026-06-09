import { allobjects, selectedobjects, addobject, removeobject, selectobject, savetohistory } from './shared.js';

let ctx, canvasw, canvash, camerax = 0, cameray = 0, zoom = 1;
let drawlayer = null, drawctx = null;

export async function init2d(canvas) {
  canvasw = canvas.clientWidth;
  canvash = canvas.clientHeight;
  canvas.width = canvasw;
  canvas.height = canvash;
  ctx = canvas.getContext('2d');
  drawlayer = document.createElement('canvas');
  drawlayer.width = canvasw;
  drawlayer.height = canvash;
  drawctx = drawlayer.getContext('2d');
  drawctx.fillStyle = '#2a2c36';
  drawctx.fillRect(0, 0, canvasw, canvash);

  const rect = { x: 200, y: 200, w: 80, h: 80, color: '#ff66aa', id: Date.now(), type: 'rect' };
  allobjects.push(rect);
  selectobject(rect);

  function render() {
    ctx.clearRect(0, 0, canvasw, canvash);
    ctx.fillStyle = '#1a1c22';
    ctx.fillRect(0, 0, canvasw, canvash);
    ctx.save();
    ctx.translate(camerax, cameray);
    ctx.scale(zoom, zoom);
    for (let obj of allobjects) {
      ctx.fillStyle = obj.color || '#88aaff';
      ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
      if (selectedobjects.includes(obj)) {
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
      }
    }
    ctx.drawImage(drawlayer, 0, 0);
    ctx.restore();
    requestAnimationFrame(render);
  }
  render();

  canvas.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasw / rect.width);
    const my = (e.clientY - rect.top) * (canvash / rect.height);
    for (let obj of allobjects) {
      if (mx >= obj.x && mx <= obj.x + obj.w && my >= obj.y && my <= obj.y + obj.h) {
        selectobject(obj);
        break;
      }
    }
  };

  window.add2drect = (x, y, w, h, color) => {
    const obj = { x, y, w, h, color, id: Date.now(), type: 'rect' };
    allobjects.push(obj);
    selectobject(obj);
    savetohistory();
    if (window.refreshui) window.refreshui();
  };

  return { destroy: () => {} };
}
