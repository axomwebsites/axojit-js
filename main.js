import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1117);
scene.fog = new THREE.FogExp2(0x0f1117, 0.008);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(5, 4, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const container = document.getElementById('gameCanvasContainer');
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.enableZoom = true;
controls.target.set(0, 1, 0);

const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 5, 2);
dirLight.castShadow = true;
scene.add(dirLight);
const fillLight = new THREE.PointLight(0x4466cc, 0.4);
fillLight.position.set(-2, 1, 3);
scene.add(fillLight);
const backLight = new THREE.PointLight(0xffaa66, 0.3);
backLight.position.set(0, 2, -3);
scene.add(backLight);

const gridHelper = new THREE.GridHelper(12, 20, 0x88aaff, 0x335588);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

let selectedObject = null;
const objectsMap = new Map();
let objectIdCounter = 0;

function addToObjectList(obj, name) {
    const listDiv = document.getElementById('objectList');
    const item = document.createElement('div');
    item.className = 'asset-item';
    item.textContent = name;
    item.dataset.id = obj.userData.id;
    item.onclick = () => {
        document.querySelectorAll('#objectList .asset-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedObject = obj;
        updateTransformUI();
    };
    listDiv.appendChild(item);
}

function updateTransformUI() {
    if(selectedObject) {
        document.getElementById('posX').value = selectedObject.position.x.toFixed(2);
        document.getElementById('posY').value = selectedObject.position.y.toFixed(2);
        document.getElementById('posZ').value = selectedObject.position.z.toFixed(2);
    } else {
        document.getElementById('posX').value = '';
        document.getElementById('posY').value = '';
        document.getElementById('posZ').value = '';
    }
}

function createPrimitive(type, color, size = 1) {
    let geometry, material;
    if(type === 'cube') geometry = new THREE.BoxGeometry(size, size, size);
    else geometry = new THREE.SphereGeometry(size/2, 32, 32);
    material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.6 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { id: objectIdCounter++, type: 'primitive' };
    scene.add(mesh);
    const name = `${type}_${mesh.userData.id}`;
    objectsMap.set(mesh.userData.id, mesh);
    addToObjectList(mesh, name);
    if(!selectedObject) { selectedObject = mesh; updateTransformUI(); }
    return mesh;
}

document.getElementById('newCubeBtn').onclick = () => createPrimitive('cube', 0x66ccff, 1);
document.getElementById('newSphereBtn').onclick = () => createPrimitive('sphere', 0xff8866, 0.9);
document.getElementById('applyTransformBtn').onclick = () => {
    if(selectedObject) {
        selectedObject.position.x = parseFloat(document.getElementById('posX').value);
        selectedObject.position.y = parseFloat(document.getElementById('posY').value);
        selectedObject.position.z = parseFloat(document.getElementById('posZ').value);
        updateTransformUI();
        document.getElementById('statusMsg').innerText = 'Transform applied';
    }
};
document.getElementById('deleteSelectedBtn').onclick = () => {
    if(selectedObject) {
        scene.remove(selectedObject);
        const id = selectedObject.userData.id;
        objectsMap.delete(id);
        const items = document.querySelectorAll('#objectList .asset-item');
        items.forEach(item => { if(item.dataset.id == id) item.remove(); });
        selectedObject = null;
        updateTransformUI();
        document.getElementById('statusMsg').innerText = 'Object deleted';
    }
};

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
document.getElementById('import3DBtn').onclick = () => document.getElementById('modelFileInput').click();
document.getElementById('modelFileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const url = URL.createObjectURL(file);
    try {
        let model;
        if(ext === 'gltf' || ext === 'glb') {
            model = await gltfLoader.loadAsync(url);
            model = model.scene;
        } else if(ext === 'obj') {
            const text = await file.text();
            model = objLoader.parse(text);
        } else { alert('Unsupported format'); return; }
        model.userData = { id: objectIdCounter++, type: 'imported' };
        model.traverse(child => { if(child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        scene.add(model);
        objectsMap.set(model.userData.id, model);
        addToObjectList(model, file.name);
        selectedObject = model;
        updateTransformUI();
        document.getElementById('statusMsg').innerText = `Imported ${file.name}`;
    } catch(err) { console.error(err); alert('Failed to load model'); }
    URL.revokeObjectURL(url);
    e.target.value = '';
};

const mediaAssetsList = [];
document.getElementById('importImageBtn').onclick = () => document.getElementById('imageFileInput').click();
document.getElementById('imageFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    const div = document.createElement('div');
    div.className = 'asset-item';
    div.textContent = `📷 ${file.name}`;
    div.onclick = () => {
        const texture = new THREE.TextureLoader().load(url);
        const planeMat = new THREE.MeshStandardMaterial({ map: texture });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), planeMat);
        plane.userData = { id: objectIdCounter++, type: 'image' };
        plane.position.set(0, 1.5, 0);
        scene.add(plane);
        objectsMap.set(plane.userData.id, plane);
        addToObjectList(plane, file.name);
        document.getElementById('statusMsg').innerText = `Image asset added`;
    };
    document.getElementById('mediaAssets').appendChild(div);
    mediaAssetsList.push({name:file.name, url});
};

document.getElementById('importVideoBtn').onclick = () => document.getElementById('videoFileInput').click();
document.getElementById('videoFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.play();
    const texture = new THREE.VideoTexture(video);
    const planeMat = new THREE.MeshStandardMaterial({ map: texture });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), planeMat);
    plane.userData = { id: objectIdCounter++, type: 'video' };
    scene.add(plane);
    objectsMap.set(plane.userData.id, plane);
    addToObjectList(plane, file.name);
    document.getElementById('statusMsg').innerText = `Video playing`;
};

const soundsMap = new Map();
document.getElementById('importSoundBtn').onclick = () => document.getElementById('soundFileInput').click();
document.getElementById('soundFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    soundsMap.set(file.name, audio);
    const div = document.createElement('div');
    div.className = 'asset-item';
    div.textContent = `🔊 ${file.name}`;
    div.onclick = () => { audio.play(); document.getElementById('statusMsg').innerText = `Playing ${file.name}`; };
    document.getElementById('soundAssets').appendChild(div);
};

const paintCanvas = document.getElementById('paintCanvas');
const ctx = paintCanvas.getContext('2d');
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
let painting = false, tool = 'pen', startX, startY;
document.getElementById('penTool').onclick = () => setTool('pen');
document.getElementById('eraserTool').onclick = () => setTool('eraser');
document.getElementById('rectTool').onclick = () => setTool('rect');
document.getElementById('circleTool').onclick = () => setTool('circle');
document.getElementById('fillTool').onclick = () => setTool('fill');
function setTool(t) { tool = t; document.querySelectorAll('.paint-toolbar button').forEach(btn => btn.classList.remove('tool-active')); if(t==='pen') document.getElementById('penTool').classList.add('tool-active'); if(t==='eraser') document.getElementById('eraserTool').classList.add('tool-active'); if(t==='rect') document.getElementById('rectTool').classList.add('tool-active'); if(t==='circle') document.getElementById('circleTool').classList.add('tool-active'); if(t==='fill') document.getElementById('fillTool').classList.add('tool-active'); }
const colorPicker = document.getElementById('paintColor');
const sizeSlider = document.getElementById('paintSize');
document.getElementById('sizeLabel').innerText = sizeSlider.value;
sizeSlider.oninput = () => document.getElementById('sizeLabel').innerText = sizeSlider.value;
function draw(e) {
    if(tool !== 'pen' && tool !== 'eraser') return;
    const rect = paintCanvas.getBoundingClientRect();
    const scaleX = paintCanvas.width / rect.width;
    const scaleY = paintCanvas.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;
    x = Math.min(Math.max(0, x), paintCanvas.width);
    y = Math.min(Math.max(0, y), paintCanvas.height);
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = colorPicker.value;
    ctx.beginPath();
    ctx.arc(x, y, parseInt(sizeSlider.value), 0, Math.PI*2);
    ctx.fill();
}
paintCanvas.addEventListener('mousedown', (e) => { painting = true; if(tool === 'fill') { const rect = paintCanvas.getBoundingClientRect(); const x = (e.clientX - rect.left) * (paintCanvas.width/rect.width); const y = (e.clientY - rect.top) * (paintCanvas.height/rect.height); const imageData = ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height); const targetColor = getPixelColor(imageData, x, y); const fillColor = hexToRgb(colorPicker.value); floodFill(x, y, targetColor, fillColor); return; } if(tool === 'rect') { startX = (e.clientX - rect.left) * scaleX; startY = (e.clientY - rect.top) * scaleY; } else if(tool === 'circle') { startX = (e.clientX - rect.left) * scaleX; startY = (e.clientY - rect.top) * scaleY; } else { draw(e); } });
paintCanvas.addEventListener('mousemove', (e) => { if(painting && (tool === 'pen' || tool === 'eraser')) draw(e); });
paintCanvas.addEventListener('mouseup', () => { if(painting && (tool === 'rect' || tool === 'circle')) { const rect = paintCanvas.getBoundingClientRect(); const scaleX = paintCanvas.width / rect.width; const scaleY = paintCanvas.height / rect.height; const endX = (e.clientX - rect.left) * scaleX; const endY = (e.clientY - rect.top) * scaleY; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = colorPicker.value; if(tool === 'rect') { const x = Math.min(startX, endX); const y = Math.min(startY, endY); const w = Math.abs(endX - startX); const h = Math.abs(endY - startY); ctx.fillRect(x, y, w, h); } else if(tool === 'circle') { const radius = Math.hypot(endX - startX, endY - startY); ctx.beginPath(); ctx.arc(startX, startY, radius, 0, Math.PI*2); ctx.fill(); } } painting = false; });
function getPixelColor(imageData, x, y) { const idx = (Math.floor(y) * imageData.width + Math.floor(x)) * 4; return { r: imageData.data[idx], g: imageData.data[idx+1], b: imageData.data[idx+2], a: imageData.data[idx+3] }; }
function hexToRgb(hex) { const r = parseInt(hex.slice(1,3), 16); const g = parseInt(hex.slice(3,5), 16); const b = parseInt(hex.slice(5,7), 16); return { r, g, b, a: 255 }; }
function colorsMatch(c1, c2) { return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a; }
function floodFill(x, y, targetColor, fillColor) { if(colorsMatch(targetColor, fillColor)) return; const stack = [{x: Math.floor(x), y: Math.floor(y)}]; const imageData = ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height); const width = imageData.width; const height = imageData.height; while(stack.length) { const {x: sx, y: sy} = stack.pop(); if(sx < 0 || sx >= width || sy < 0 || sy >= height) continue; const idx = (sy * width + sx) * 4; const current = { r: imageData.data[idx], g: imageData.data[idx+1], b: imageData.data[idx+2], a: imageData.data[idx+3] }; if(!colorsMatch(current, targetColor)) continue; imageData.data[idx] = fillColor.r; imageData.data[idx+1] = fillColor.g; imageData.data[idx+2] = fillColor.b; imageData.data[idx+3] = fillColor.a; stack.push({x: sx+1, y: sy}); stack.push({x: sx-1, y: sy}); stack.push({x: sx, y: sy+1}); stack.push({x: sx, y: sy-1}); } ctx.putImageData(imageData, 0, 0); }
document.getElementById('clearCanvasBtn').onclick = () => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height); };
document.getElementById('applyTextureToSelected').onclick = () => { if(selectedObject && selectedObject.isMesh) { const texture = new THREE.CanvasTexture(paintCanvas); selectedObject.material.map = texture; selectedObject.material.needsUpdate = true; document.getElementById('statusMsg').innerText = 'Texture applied'; } else { document.getElementById('statusMsg').innerText = 'Select a 3D object first'; } };
document.getElementById('createSpriteFromPaint').onclick = () => { const texture = new THREE.CanvasTexture(paintCanvas); const material = new THREE.MeshStandardMaterial({ map: texture }); const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material); plane.userData = { id: objectIdCounter++, type: 'sprite' }; plane.position.set(0, 1.8, 0); scene.add(plane); objectsMap.set(plane.userData.id, plane); addToObjectList(plane, `sprite_${plane.userData.id}`); selectedObject = plane; updateTransformUI(); document.getElementById('statusMsg').innerText = '2D sprite created'; };
document.getElementById('exportDrawingAsset').onclick = () => { const link = document.createElement('a'); link.download = 'texture.png'; link.href = paintCanvas.toDataURL(); link.click(); };
document.getElementById('outlinePlugin').onclick = () => { ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; const imgData = ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height); ctx.putImageData(imgData, 0, 0); ctx.stroke(); ctx.restore(); };
document.getElementById('pixelatePlugin').onclick = () => { const w = paintCanvas.width, h = paintCanvas.height; const size = 8; const tempCanvas = document.createElement('canvas'); tempCanvas.width = w; tempCanvas.height = h; const tempCtx = tempCanvas.getContext('2d'); tempCtx.drawImage(paintCanvas, 0, 0); ctx.clearRect(0, 0, w, h); for(let y=0; y<h; y+=size) { for(let x=0; x<w; x+=size) { const color = tempCtx.getImageData(x, y, 1, 1).data; ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`; ctx.fillRect(x, y, size, size); } } };
document.getElementById('gradientFillPlugin').onclick = () => { const grad = ctx.createLinearGradient(0, 0, paintCanvas.width, paintCanvas.height); grad.addColorStop(0, '#ff00cc'); grad.addColorStop(1, '#333399'); ctx.fillStyle = grad; ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height); };
document.getElementById('patternPlugin').onclick = () => { const patternCanvas = document.createElement('canvas'); patternCanvas.width = 20; patternCanvas.height = 20; const pCtx = patternCanvas.getContext('2d'); pCtx.fillStyle = '#ffaa44'; pCtx.fillRect(0,0,10,10); pCtx.fillStyle = '#44aaff'; pCtx.fillRect(10,10,10,10); const pattern = ctx.createPattern(patternCanvas, 'repeat'); ctx.fillStyle = pattern; ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height); };

let engineAPI = null;
function setupEngine() {
    const startCallbacks = [];
    const updateCallbacks = [];
    let lastTime = performance.now();
    let isRunning = false;
    const api = {
        objects: objectsMap,
        createCube: (size, color) => createPrimitive('cube', color, size),
        createSphere: (radius, color) => createPrimitive('sphere', color, radius*2),
        playSound: (name) => { if(soundsMap.has(name)) soundsMap.get(name).play(); else console.warn('sound not found'); },
        sounds: soundsMap,
        onStart: (cb) => { startCallbacks.push(cb); },
        onUpdate: (cb) => { updateCallbacks.push(cb); },
        startEngine: () => {
            if(isRunning) return;
            isRunning = true;
            startCallbacks.forEach(cb => cb());
            function gameLoop() {
                if(!isRunning) return;
                const now = performance.now();
                let dt = Math.min(0.033, (now - lastTime) / 1000);
                lastTime = now;
                updateCallbacks.forEach(cb => cb(dt));
                requestAnimationFrame(gameLoop);
            }
            requestAnimationFrame(gameLoop);
        }
    };
    return api;
}
document.getElementById('evalScriptBtn').onclick = () => {
    try {
        if(engineAPI) engineAPI = null;
        engineAPI = setupEngine();
        const userScript = document.getElementById('codeEditor').value;
        const fn = new Function('engine', userScript);
        fn(engineAPI);
        engineAPI.startEngine();
        document.getElementById('statusMsg').innerText = 'Game script running';
    } catch(e) { console.error(e); document.getElementById('statusMsg').innerText = 'Script error'; }
};
document.getElementById('resetScriptBtn').onclick = () => {
    document.getElementById('codeEditor').value = `// Axojita Game Engine API
let rotator = null;
engine.onStart(() => {
    rotator = engine.createCube(1, 0x44aa88);
    rotator.position.set(0, 1, 0);
    if(engine.sounds.size > 0) engine.playSound(Array.from(engine.sounds.keys())[0]);
});
engine.onUpdate((deltaTime) => {
    if(rotator) rotator.rotation.y += 1.5 * deltaTime;
});`;
};
document.getElementById('runScriptBtn').onclick = () => document.getElementById('evalScriptBtn').click();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
setTimeout(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}, 100);
