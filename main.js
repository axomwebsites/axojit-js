import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
scene.fog = new THREE.FogExp2(0x111122, 0.008);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(5, 4, 6);
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(2, 5, 3);
scene.add(dirLight);
const backLight = new THREE.PointLight(0x4466cc, 0.5);
backLight.position.set(-2, 1, -3);
scene.add(backLight);
const fillLight = new THREE.PointLight(0xffaa66, 0.4);
fillLight.position.set(1, 2, 2);
scene.add(fillLight);

const gridHelper = new THREE.GridHelper(15, 20, 0x88aaff, 0x335588);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

let gameObjects = [];
let selectedObject = null;
let animationId = null;
let scriptFunction = null;
let lastTimestamp = 0;

const assetStore = { images: [], videos: [], sounds: [] };
const soundPlayers = new Map();

function addDefaultObjects() {
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0xe34234, roughness: 0.3, metalness: 0.1 });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.name = "Red Cube";
    cube.position.set(0, 0.5, 0);
    scene.add(cube);
    gameObjects.push(cube);
    
    const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x44aa88, metalness: 0.7 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.name = "Metal Sphere";
    sphere.position.set(1.8, 0.6, -1.2);
    scene.add(sphere);
    gameObjects.push(sphere);
    
    const planeGeo = new THREE.PlaneGeometry(3, 3);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.name = "Background Plane";
    plane.position.set(-1.5, 0.2, -2);
    plane.rotation.x = -Math.PI / 3;
    scene.add(plane);
    gameObjects.push(plane);
}
addDefaultObjects();

function updateHierarchy() {
    const container = document.getElementById('hierarchyList');
    container.innerHTML = '';
    gameObjects.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'hierarchy-item' + (selectedObject === obj ? ' selected' : '');
        item.innerHTML = `<span>${obj.name}</span><span style="color:#aaa;">📦</span>`;
        item.onclick = (e) => {
            e.stopPropagation();
            selectedObject = obj;
            updatePropertiesUI();
            updateHierarchy();
        };
        container.appendChild(item);
    });
}

function updatePropertiesUI() {
    if (!selectedObject) {
        document.getElementById('objName').value = '';
        return;
    }
    document.getElementById('objName').value = selectedObject.name;
    document.getElementById('posX').value = selectedObject.position.x;
    document.getElementById('posY').value = selectedObject.position.y;
    document.getElementById('posZ').value = selectedObject.position.z;
    document.getElementById('rotX').value = (selectedObject.rotation.x * 180 / Math.PI).toFixed(1);
    document.getElementById('rotY').value = (selectedObject.rotation.y * 180 / Math.PI).toFixed(1);
    document.getElementById('rotZ').value = (selectedObject.rotation.z * 180 / Math.PI).toFixed(1);
    document.getElementById('sclX').value = selectedObject.scale.x;
    document.getElementById('sclY').value = selectedObject.scale.y;
    document.getElementById('sclZ').value = selectedObject.scale.z;
}

function applyTransformFromUI() {
    if (!selectedObject) return;
    selectedObject.name = document.getElementById('objName').value;
    selectedObject.position.set(
        parseFloat(document.getElementById('posX').value),
        parseFloat(document.getElementById('posY').value),
        parseFloat(document.getElementById('posZ').value)
    );
    selectedObject.rotation.set(
        parseFloat(document.getElementById('rotX').value) * Math.PI / 180,
        parseFloat(document.getElementById('rotY').value) * Math.PI / 180,
        parseFloat(document.getElementById('rotZ').value) * Math.PI / 180
    );
    selectedObject.scale.set(
        parseFloat(document.getElementById('sclX').value),
        parseFloat(document.getElementById('sclY').value),
        parseFloat(document.getElementById('sclZ').value)
    );
    updateHierarchy();
}

document.getElementById('objName').addEventListener('change', applyTransformFromUI);
document.getElementById('posX').addEventListener('input', applyTransformFromUI);
document.getElementById('posY').addEventListener('input', applyTransformFromUI);
document.getElementById('posZ').addEventListener('input', applyTransformFromUI);
document.getElementById('rotX').addEventListener('input', applyTransformFromUI);
document.getElementById('rotY').addEventListener('input', applyTransformFromUI);
document.getElementById('rotZ').addEventListener('input', applyTransformFromUI);
document.getElementById('sclX').addEventListener('input', applyTransformFromUI);
document.getElementById('sclY').addEventListener('input', applyTransformFromUI);
document.getElementById('sclZ').addEventListener('input', applyTransformFromUI);

document.getElementById('deleteSelectedBtn').onclick = () => {
    if (selectedObject) {
        scene.remove(selectedObject);
        gameObjects = gameObjects.filter(obj => obj !== selectedObject);
        selectedObject = null;
        updateHierarchy();
        updatePropertiesUI();
    }
};
document.getElementById('duplicateSelectedBtn').onclick = () => {
    if (selectedObject) {
        const clone = selectedObject.clone();
        clone.name = selectedObject.name + "_copy";
        clone.position.x += 0.5;
        scene.add(clone);
        gameObjects.push(clone);
        selectedObject = clone;
        updateHierarchy();
        updatePropertiesUI();
    }
};
document.getElementById('addCubeBtn').onclick = () => {
    const geom = new THREE.BoxGeometry(1,1,1);
    const mat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const cube = new THREE.Mesh(geom, mat);
    cube.name = `Cube_${gameObjects.length}`;
    cube.position.set(Math.random()*3-1.5, 0.5, Math.random()*3-1.5);
    scene.add(cube);
    gameObjects.push(cube);
    updateHierarchy();
};
document.getElementById('addPlaneBtn').onclick = () => {
    const geom = new THREE.PlaneGeometry(2,2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x77aaff, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geom, mat);
    plane.name = `Plane_${gameObjects.length}`;
    plane.position.set(Math.random()*3-1, 0.2, Math.random()*3-1);
    scene.add(plane);
    gameObjects.push(plane);
    updateHierarchy();
};
document.getElementById('addLightBtn').onclick = () => {
    const light = new THREE.PointLight(0xffaa66, 0.8, 10);
    light.name = `Light_${gameObjects.length}`;
    light.position.set(2, 3, 2);
    scene.add(light);
    gameObjects.push(light);
    updateHierarchy();
};

function setupDrawing() {
    const drawCanvas = document.getElementById('drawingCanvas');
    const ctx = drawCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    let currentTool = 'brush';
    let drawing = false;
    const tools = { brush: true, eraser: false, fill: false, rect: false, circle: false };
    let startPos = null;
    
    function setTool(tool) {
        Object.keys(tools).forEach(k => tools[k] = false);
        tools[tool] = true;
        document.querySelectorAll('.draw-tool').forEach(btn => btn.classList.remove('active'));
        if(tool === 'brush') document.getElementById('brushTool').classList.add('active');
        if(tool === 'eraser') document.getElementById('eraserTool').classList.add('active');
        if(tool === 'fill') document.getElementById('fillTool').classList.add('active');
        if(tool === 'rect') document.getElementById('rectTool').classList.add('active');
        if(tool === 'circle') document.getElementById('circleTool').classList.add('active');
    }
    document.getElementById('brushTool').onclick = () => setTool('brush');
    document.getElementById('eraserTool').onclick = () => setTool('eraser');
    document.getElementById('fillTool').onclick = () => setTool('fill');
    document.getElementById('rectTool').onclick = () => setTool('rect');
    document.getElementById('circleTool').onclick = () => setTool('circle');
    const colorPicker = document.getElementById('drawColor');
    const brushSize = document.getElementById('brushSize');
    const sizeLabel = document.getElementById('sizeLabel');
    brushSize.addEventListener('input', () => sizeLabel.innerText = brushSize.value);
    
    function drawPoint(x, y) {
        ctx.save();
        ctx.globalCompositeOperation = tools.eraser ? 'destination-out' : 'source-over';
        ctx.fillStyle = tools.eraser ? '#ffffff' : colorPicker.value;
        ctx.beginPath();
        ctx.arc(x, y, parseInt(brushSize.value)/2, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    drawCanvas.addEventListener('mousedown', (e) => {
        drawing = true;
        const rect = drawCanvas.getBoundingClientRect();
        const scaleX = drawCanvas.width / rect.width;
        const scaleY = drawCanvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        if(tools.fill) {
            ctx.fillStyle = colorPicker.value;
            ctx.fillRect(0,0,drawCanvas.width,drawCanvas.height);
            return;
        }
        if(tools.rect || tools.circle) startPos = {x: mouseX, y: mouseY};
        else drawPoint(mouseX, mouseY);
    });
    drawCanvas.addEventListener('mousemove', (e) => {
        if(!drawing) return;
        const rect = drawCanvas.getBoundingClientRect();
        const scaleX = drawCanvas.width / rect.width;
        const scaleY = drawCanvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        if(tools.rect || tools.circle) return;
        drawPoint(mouseX, mouseY);
    });
    drawCanvas.addEventListener('mouseup', (e) => {
        if((tools.rect || tools.circle) && startPos) {
            const rect = drawCanvas.getBoundingClientRect();
            const scaleX = drawCanvas.width / rect.width;
            const scaleY = drawCanvas.height / rect.height;
            const endX = (e.clientX - rect.left) * scaleX;
            const endY = (e.clientY - rect.top) * scaleY;
            ctx.beginPath();
            ctx.fillStyle = colorPicker.value;
            if(tools.rect) ctx.fillRect(startPos.x, startPos.y, endX-startPos.x, endY-startPos.y);
            if(tools.circle) {
                const radius = Math.hypot(endX-startPos.x, endY-startPos.y);
                ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI*2);
                ctx.fill();
            }
            startPos = null;
        }
        drawing = false;
    });
    document.getElementById('clearCanvasBtn').onclick = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,drawCanvas.width,drawCanvas.height);
    };
    let layers = ['Layer1'];
    let currentLayer = 0;
    function updateLayerSelect() {
        const sel = document.getElementById('layerSelect');
        sel.innerHTML = '';
        layers.forEach((l,idx) => { let opt = document.createElement('option'); opt.value=idx; opt.text=l; sel.appendChild(opt); });
    }
    document.getElementById('addLayerBtn').onclick = () => { layers.push(`Layer${layers.length+1}`); updateLayerSelect(); };
    document.getElementById('removeLayerBtn').onclick = () => { if(layers.length>1) layers.pop(); updateLayerSelect(); };
    updateLayerSelect();
    
    document.getElementById('exportSpriteBtn').onclick = () => {
        if(!selectedObject) { alert('Select an object first'); return; }
        const texture = new THREE.CanvasTexture(drawCanvas);
        if(selectedObject.isMesh) {
            selectedObject.material.map = texture;
            selectedObject.material.needsUpdate = true;
        }
    };
}
setupDrawing();

const loaderGLTF = new GLTFLoader();
const loaderOBJ = new OBJLoader();
document.getElementById('importModelBtn').onclick = () => document.getElementById('modelImport').click();
document.getElementById('modelImport').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const url = URL.createObjectURL(file);
    if(ext === 'glb' || ext === 'gltf') {
        loaderGLTF.load(url, (gltf) => {
            const model = gltf.scene;
            model.name = file.name;
            scene.add(model);
            gameObjects.push(model);
            updateHierarchy();
            URL.revokeObjectURL(url);
        });
    } else if(ext === 'obj') {
        fetch(url).then(r=>r.text()).then(txt => {
            const obj = loaderOBJ.parse(txt);
            obj.name = file.name;
            scene.add(obj);
            gameObjects.push(obj);
            updateHierarchy();
            URL.revokeObjectURL(url);
        });
    }
};

const assetContainer = document.getElementById('assetList');
const soundListDiv = document.getElementById('soundList');
document.getElementById('uploadAssetBtn').onclick = () => document.getElementById('assetUpload').click();
document.getElementById('assetUpload').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const type = file.type;
    const url = URL.createObjectURL(file);
    if(type.startsWith('image/')) {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            const texture = new THREE.CanvasTexture(img);
            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item';
            assetItem.innerHTML = `<img src="${url}" width="80"><div>${file.name}</div>`;
            assetItem.onclick = () => {
                if(selectedObject && selectedObject.isMesh) {
                    selectedObject.material.map = texture;
                    selectedObject.material.needsUpdate = true;
                }
            };
            assetContainer.appendChild(assetItem);
        };
    } else if(type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.loop = true;
        video.muted = false;
        video.autoplay = false;
        const texture = new THREE.VideoTexture(video);
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';
        assetItem.innerHTML = `<video src="${url}" style="width:80px;"></video><div>${file.name}</div>`;
        assetItem.onclick = () => {
            if(selectedObject && selectedObject.isMesh) {
                selectedObject.material.map = texture;
                selectedObject.material.needsUpdate = true;
                video.play();
            }
        };
        assetContainer.appendChild(assetItem);
    } else if(type.startsWith('audio/')) {
        const audio = new Audio(url);
        assetStore.sounds.push({name: file.name, audio});
        const soundDiv = document.createElement('div');
        soundDiv.className = 'sound-item';
        soundDiv.innerHTML = `<span>🔊 ${file.name}</span><span>▶️</span>`;
        soundDiv.onclick = () => { audio.play(); };
        soundListDiv.appendChild(soundDiv);
    }
};

function runScript() {
    const scriptText = document.getElementById('codeEditor').value;
    try {
        const func = new Function('deltaTime', 'selectedObj', 'gameObjects', 'scene', 'createCube', scriptText + '\nif(typeof onUpdate === "function") return onUpdate;');
        const customUpdate = func(0, selectedObject, gameObjects, scene, (name, pos) => {
            const geom = new THREE.BoxGeometry(1,1,1);
            const mat = new THREE.MeshStandardMaterial({ color: 0x77ff77 });
            const cube = new THREE.Mesh(geom, mat);
            cube.name = name;
            cube.position.set(pos.x, pos.y, pos.z);
            scene.add(cube);
            gameObjects.push(cube);
            updateHierarchy();
            return cube;
        });
        if(typeof customUpdate === 'function') scriptFunction = customUpdate;
        else scriptFunction = null;
        document.getElementById('statusBar').innerText = 'Script applied successfully';
    } catch(e) { console.error(e); document.getElementById('statusBar').innerText = 'Script error'; }
}
document.getElementById('applyScriptBtn').onclick = runScript;
document.getElementById('resetScriptBtn').onclick = () => {
    document.getElementById('codeEditor').value = `function onUpdate(deltaTime) {\n    if(selectedObj) {\n        selectedObj.rotation.y += deltaTime;\n    }\n}`;
    scriptFunction = null;
};

let gameLoopRunning = false;
function animate(time) {
    const delta = Math.min(0.033, (time - lastTimestamp) / 1000);
    lastTimestamp = time;
    if(gameLoopRunning && scriptFunction) {
        try { scriptFunction(delta); }
        catch(e) { console.warn(e); }
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

document.getElementById('runGameBtn').onclick = () => {
    gameLoopRunning = true;
    document.getElementById('statusBar').innerText = 'Game running (script active)';
};
document.getElementById('stopGameBtn').onclick = () => {
    gameLoopRunning = false;
    document.getElementById('statusBar').innerText = 'Game stopped';
};

function resize() {
    const width = document.querySelector('.center-panel').clientWidth;
    const height = document.querySelector('.game-canvas').clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
setTimeout(resize, 100);
updateHierarchy();
