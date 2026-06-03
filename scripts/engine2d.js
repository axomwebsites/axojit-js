let fabriccanvas = null;
let isbrushmode = false;
let currentcolor = '#ff8844';
let containerdiv = null;
let selected2dobject = null;

export function init2dengine(containerid) {
    containerdiv = document.getelementbyid(containerid);
    const canvaselem = document.createelement('canvas');
    canvaselem.id = 'fabriccanvas';
    canvaselem.width = containerdiv.clientwidth;
    canvaselem.height = containerdiv.clientheight;
    containerdiv.appendchild(canvaselem);
    fabriccanvas = new fabric.canvas('fabriccanvas');
    fabriccanvas.setbackgroundcolor('#f0f2f5', fabriccanvas.renderall.bind(fabriccanvas));
    fabriccanvas.freedrawingbrush.color = currentcolor;
    fabriccanvas.freedrawingbrush.width = 5;
    fabriccanvas.isdrawingmode = false;
    fabriccanvas.on('selection:created', (e) => { selected2dobject = e.selected[0]; });
    fabriccanvas.on('selection:updated', (e) => { selected2dobject = e.selected[0]; });
    fabriccanvas.on('selection:cleared', () => { selected2dobject = null; });
    window.addeventlistener('resize', () => resizecanvas());
    resizecanvas();
}

function resizecanvas() {
    if (!fabriccanvas) return;
    const rect = containerdiv.getboundingclientrect();
    fabriccanvas.setwidth(rect.width);
    fabriccanvas.setheight(rect.height);
    fabriccanvas.renderall();
}

export function addrectangle() {
    const rect = new fabric.rect({ width: 80, height: 80, fill: currentcolor, left: 50, top: 50 });
    fabriccanvas.add(rect);
    fabriccanvas.renderall();
}

export function addcircle() {
    const circle = new fabric.circle({ radius: 40, fill: currentcolor, left: 150, top: 100 });
    fabriccanvas.add(circle);
    fabriccanvas.renderall();
}

export function addtriangle() {
    const triangle = new fabric.triangle({ width: 80, height: 80, fill: currentcolor, left: 250, top: 60 });
    fabriccanvas.add(triangle);
    fabriccanvas.renderall();
}

export function setbrushmode(active) {
    isbrushmode = active;
    fabriccanvas.isdrawingmode = active;
    fabriccanvas.freedrawingbrush.color = currentcolor;
}

export function setcolor2d(color) {
    currentcolor = color;
    if (fabriccanvas.isdrawingmode) fabriccanvas.freedrawingbrush.color = color;
}

export function getselected2dobject() { return selected2dobject; }

export function update2dobject(obj, prop, value) {
    if (!obj) return;
    if (prop === 'position') { obj.left = value.x; obj.top = value.y; obj.setcoords(); }
    else if (prop === 'rotation') obj.angle = value.z * 180 / math.pi;
    else if (prop === 'scale') { obj.scalex = value.x; obj.scaley = value.y; }
    else if (prop === 'color') obj.set('fill', value.hex);
    fabriccanvas.renderall();
}
