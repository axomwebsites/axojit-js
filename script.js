import * as three from 'three';
import { orbitcontrols } from 'threeaddons/controls/OrbitControls.js';
import { transformcontrols } from 'threeaddons/controls/TransformControls.js';
import { effectcomposer } from 'threeaddons/postprocessing/EffectComposer.js';
import { renderpass } from 'threeaddons/postprocessing/RenderPass.js';
import { unrealbloompass } from 'threeaddons/postprocessing/UnrealBloomPass.js';

let isthreed = true;
let isplaying = false;
let isdark = true;
let snapgrid = false;

let scene, cam, rend, ctrl, trans, comp;
let twocanvas, twoctx;
let mainreq;

let objs = [];
let selobjs = [];
let hist = [];
let histidx = -1;

let kfs = [];
let animtime = 0;

let drawmode = false;
let brushsize = 5;
let brushcol = "#ffffff";
let isdrawing = false;

let audctx;

function initengine() {
scene = new three.Scene();
scene.background = new three.Color(0x1e1e1e);
scene.fog = new three.Fog(0x1e1e1e, 10, 50);

cam = new three.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
cam.position.set(5, 5, 5);

rend = new three.WebGLRenderer({antialias:true});
document.getElementById('threecontainer').appendChild(rend.domElement);

comp = new effectcomposer(rend);
comp.addPass(new renderpass(scene, cam));
let bloom = new unrealbloompass(new three.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85);
comp.addPass(bloom);

ctrl = new orbitcontrols(cam, rend.domElement);
trans = new transformcontrols(cam, rend.domElement);
trans.addEventListener('dragging-changed', function(ev) { ctrl.enabled = !ev.value; });
scene.add(trans);

let grid = new three.GridHelper(20, 20);
scene.add(grid);
let amb = new three.AmbientLight(0xffffff, 0.4);
scene.add(amb);
let dir = new three.DirectionalLight(0xffffff, 0.8);
dir.position.set(10, 10, 10);
scene.add(dir);

twocanvas = document.getElementById('twocanvas');
twoctx = twocanvas.getContext('2d');

bindui();
resizeeng();
window.addEventListener('resize', resizeeng);
savehist();
mainloop();
}

function resizeeng() {
let w = document.getElementById('threecontainer').clientWidth;
let h = document.getElementById('threecontainer').clientHeight;
cam.aspect = w / h;
cam.updateProjectionMatrix();
rend.setSize(w, h);
comp.setSize(w, h);
twocanvas.width = w;
twocanvas.height = h;
}

function genid() {
return Math.random().toString(36).substr(2, 9);
}

function createobj(name, is2d) {
let o = {
id: genid(),
name: name,
is2d: is2d,
posx: 0, posy: 0, posz: 0,
rotx: 0, roty: 0, rotz: 0,
sclx: 1, scly: 1, sclz: 1,
pivx: 0.5, pivy: 0.5,
col: "#ffffff",
nine: false,
phys: false,
mass: 1,
nav: false,
script: "",
mesh: null,
children: [],
parent: null
};
if (!is2d) {
let geo = new three.BoxGeometry(1, 1, 1);
let mat = new three.MeshStandardMaterial({color: 0xffffff});
o.mesh = new three.Mesh(geo, mat);
o.mesh.userdata = {ref: o};
scene.add(o.mesh);
}
objs.push(o);
selobjs = [o];
updatescene();
updateui();
savehist();
}

function deleteobj() {
if (selobjs.length > 0) {
for (let s of selobjs) {
if (s.mesh) scene.remove(s.mesh);
objs = objs.filter(x => x.id !== s.id);
}
selobjs = [];
trans.detach();
updatescene();
updateui();
savehist();
}
}

function updatescene() {
for (let o of objs) {
if (!o.is2d && o.mesh) {
let px = o.posx;
let py = o.posy;
let pz = o.posz;
if (snapgrid) {
px = Math.round(px);
py = Math.round(py);
pz = Math.round(pz);
}
o.mesh.position.set(px, py, pz);
o.mesh.rotation.set(o.rotx, o.roty, o.rotz);
o.mesh.scale.set(o.sclx, o.scly, o.sclz);
o.mesh.material.color.set(o.col);
}
}
renderexplorer();
}

function renderexplorer() {
let el = document.getElementById('explorerlist');
el.innerHTML = "";
for (let o of objs) {
let d = document.createElement('div');
d.className = 'treeitem';
if (selobjs.includes(o)) d.className += ' treeitemsel';
d.innerHTML = `<i class="fas fa-${o.is2d ? 'square' : 'cube'}"></i> ${o.name}`;
d.onclick = () => {
selobjs = [o];
if (!o.is2d) trans.attach(o.mesh);
updateui();
renderexplorer();
};
el.appendChild(d);
}
}

function updateui() {
if (selobjs.length === 1) {
let o = selobjs[0];
document.getElementById('propname').value = o.name;
document.getElementById('propposx').value = o.posx;
document.getElementById('propposy').value = o.posy;
document.getElementById('propposz').value = o.posz;
document.getElementById('proprotx').value = o.rotx;
document.getElementById('proproty').value = o.roty;
document.getElementById('proprotz').value = o.rotz;
document.getElementById('propsclx').value = o.sclx;
document.getElementById('propscly').value = o.scly;
document.getElementById('propsclz').value = o.sclz;
document.getElementById('propcolor').value = o.col;
document.getElementById('proppivx').value = o.pivx;
document.getElementById('proppivy').value = o.pivy;
document.getElementById('propnine').checked = o.nine;
document.getElementById('propphysics').checked = o.phys;
document.getElementById('propmass').value = o.mass;
document.getElementById('propnav').checked = o.nav;
document.getElementById('scripteditor').value = o.script;
}
}

function applyprops() {
if (selobjs.length === 1) {
let o = selobjs[0];
o.name = document.getElementById('propname').value;
o.posx = parseFloat(document.getElementById('propposx').value);
o.posy = parseFloat(document.getElementById('propposy').value);
o.posz = parseFloat(document.getElementById('propposz').value);
o.rotx = parseFloat(document.getElementById('proprotx').value);
o.roty = parseFloat(document.getElementById('proproty').value);
o.rotz = parseFloat(document.getElementById('proprotz').value);
o.sclx = parseFloat(document.getElementById('propsclx').value);
o.scly = parseFloat(document.getElementById('propscly').value);
o.sclz = parseFloat(document.getElementById('propsclz').value);
o.col = document.getElementById('propcolor').value;
o.pivx = parseFloat(document.getElementById('proppivx').value);
o.pivy = parseFloat(document.getElementById('proppivy').value);
o.nine = document.getElementById('propnine').checked;
o.phys = document.getElementById('propphysics').checked;
o.mass = parseFloat(document.getElementById('propmass').value);
o.nav = document.getElementById('propnav').checked;
o.script = document.getElementById('scripteditor').value;
updatescene();
savehist();
}
}

function savehist() {
let h = objs.map(o => ({...o, children: [], mesh: null}));
hist = hist.slice(0, histidx + 1);
hist.push(JSON.stringify(h));
histidx++;
}

function doundo() {
if (histidx > 0) {
histidx--;
loadhist(hist[histidx]);
}
}

function doredo() {
if (histidx < hist.length - 1) {
histidx++;
loadhist(hist[histidx]);
}
}

function loadhist(str) {
let h = JSON.parse(str);
for (let o of objs) if (o.mesh) scene.remove(o.mesh);
objs = [];
selobjs = [];
trans.detach();
for (let d of h) {
let o = {...d};
if (!o.is2d) {
let geo = new three.BoxGeometry(1, 1, 1);
let mat = new three.MeshStandardMaterial({color: o.col});
o.mesh = new three.Mesh(geo, mat);
o.mesh.userdata = {ref: o};
scene.add(o.mesh);
}
objs.push(o);
}
updatescene();
updateui();
}

function dogroup() {
if (selobjs.length > 1) {
let p = createobj("group", isthreed ? false : true);
p = objs[objs.length-1];
for (let s of selobjs) {
if (s.id !== p.id) {
s.parent = p;
p.children.push(s);
}
}
selobjs = [p];
updatescene();
}
}

function bindui() {
document.getElementById('btntogglemoded').onclick = () => {
isthreed = !isthreed;
document.getElementById('threecontainer').classList.toggle('hidden', !isthreed);
document.getElementById('twocanvas').classList.toggle('hidden', isthreed);
};
document.getElementById('btnthemetoggle').onclick = () => {
isdark = !isdark;
document.getElementById('bodytheme').className = isdark ? 'themedark' : 'themelight';
scene.background = new three.Color(isdark ? 0x1e1e1e : 0xf3f3f3);
};
document.getElementById('btnaddpart').onclick = () => createobj("part", !isthreed);
document.getElementById('btnundo').onclick = doundo;
document.getElementById('btnredo').onclick = doredo;
document.getElementById('btngroup').onclick = dogroup;
document.getElementById('btntranslate').onclick = () => trans.setMode('translate');
document.getElementById('btnrotate').onclick = () => trans.setMode('rotate');
document.getElementById('btnscale').onclick = () => trans.setMode('scale');
document.getElementById('btnsnap').onclick = () => { snapgrid = !snapgrid; trans.setTranslationSnap(snapgrid ? 1 : null); trans.setRotationSnap(snapgrid ? Math.PI/8 : null); };
document.getElementById('btnplay').onclick = () => isplaying = true;
document.getElementById('btnstop').onclick = () => isplaying = false;
let pinputs = document.querySelectorAll('.propsgrid input');
for (let pi of pinputs) pi.addEventListener('change', applyprops);
let tbtns = document.querySelectorAll('.tabbtn');
let tbodys = document.querySelectorAll('.tabcontent');
for (let i=0; i<tbtns.length; i++) {
tbtns[i].onclick = () => {
for(let b of tbtns) b.classList.remove('active');
for(let c of tbodys) c.classList.add('hidden');
tbtns[i].classList.add('active');
tbodys[i].classList.remove('hidden');
};
}
window.addEventListener('keydown', e => {
if (e.key === 'Delete') deleteobj();
if (e.ctrlKey && e.key === 'z') doundo();
if (e.ctrlKey && e.key === 'y') doredo();
});
twocanvas.addEventListener('mousedown', startdraw);
twocanvas.addEventListener('mousemove', dodraw);
twocanvas.addEventListener('mouseup', stopdraw);
document.getElementById('btndrawbrush').onclick = () => drawmode = true;
}

function startdraw(e) {
if (!drawmode || isthreed) return;
isdrawing = true;
let r = twocanvas.getBoundingClientRect();
twoctx.beginPath();
twoctx.moveTo(e.clientX - r.left, e.clientY - r.top);
}

function dodraw(e) {
if (!isdrawing || isthreed) return;
let r = twocanvas.getBoundingClientRect();
let c = document.getElementById('drawcolor').value;
let s = document.getElementById('drawsize').value;
twoctx.lineTo(e.clientX - r.left, e.clientY - r.top);
twoctx.strokeStyle = c;
twoctx.lineWidth = s;
twoctx.lineCap = 'round';
twoctx.stroke();
}

function stopdraw() {
isdrawing = false;
}

function runphysics() {
if (!isplaying) return;
for (let o of objs) {
if (o.phys) {
o.posy -= 0.1 * o.mass;
if (o.posy < 0) o.posy = 0;
}
if (o.script !== "") {
try {
let f = new Function('obj', o.script);
f(o);
} catch(e) {}
}
}
updatescene();
}

function drawtwoscene() {
if (isthreed) return;
twoctx.clearRect(0,0,twocanvas.width,twocanvas.height);
for (let o of objs) {
if (o.is2d) {
twoctx.save();
twoctx.translate(twocanvas.width/2 + o.posx, twocanvas.height/2 - o.posy);
twoctx.rotate(o.rotx);
twoctx.scale(o.sclx, o.scly);
twoctx.fillStyle = o.col;
let w = 50, h = 50;
let px = w * o.pivx, py = h * o.pivy;
if (o.nine) {
twoctx.strokeStyle = o.col;
twoctx.lineWidth = 4;
twoctx.strokeRect(-px, -py, w, h);
} else {
twoctx.fillRect(-px, -py, w, h);
}
if (selobjs.includes(o)) {
twoctx.strokeStyle = '#ffff00';
twoctx.lineWidth = 2;
twoctx.strokeRect(-px-2, -py-2, w+4, h+4);
}
twoctx.restore();
}
}
}

function mainloop() {
mainreq = requestAnimationFrame(mainloop);
if (isthreed) {
ctrl.update();
comp.render();
if (trans.dragging && selobjs.length === 1) {
let o = selobjs[0];
if (!o.is2d && o.mesh) {
o.posx = o.mesh.position.x;
o.posy = o.mesh.position.y;
o.posz = o.mesh.position.z;
o.rotx = o.mesh.rotation.x;
o.roty = o.mesh.rotation.y;
o.rotz = o.mesh.rotation.z;
o.sclx = o.mesh.scale.x;
o.scly = o.mesh.scale.y;
o.sclz = o.mesh.scale.z;
updateui();
}
}
} else {
drawtwoscene();
}
if (isplaying) {
animtime += 0.016;
runphysics();
}
}

initengine();
