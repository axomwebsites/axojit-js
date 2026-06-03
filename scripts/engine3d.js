import * as THREE from 'three';
import { orbitcontrols } from 'three/addons/controls/orbitcontrols.js';
import { transformcontrols } from 'three/addons/controls/transformcontrols.js';
import { gltfloader } from 'three/addons/loaders/gltfloader.js';

let scene, camera, renderer, controls, transformcontrol, selectedobject = null;
let containerid = null;

export function init3dengine(containeridparam) {
    containerid = containeridparam;
    const container = document.getelementbyid(containerid);
    scene = new THREE.scene();
    scene.background = new THREE.color(0x1a1a2a);
    scene.fog = new THREE.fogexp2(0x1a1a2a, 0.008);
    camera = new THREE.perspectivecamera(45, container.clientwidth / container.clientheight, 0.1, 500);
    camera.position.set(5, 4, 6);
    renderer = new THREE.webglrenderer({ antialias: true });
    renderer.setsize(container.clientwidth, container.clientheight);
    renderer.shadowmap.enabled = true;
    container.appendchild(renderer.domelement);
    controls = new orbitcontrols(camera, renderer.domelement);
    controls.enabledamping = true;
    transformcontrol = new transformcontrols(camera, renderer.domelement);
    transformcontrol.addeventlistener('draggingchanged', (e) => { controls.enabled = !e.value; });
    scene.add(transformcontrol);
    addlights();
    addhelpers();
    window.addeventlistener('resize', () => onresize(container));
    animate();
}

function addlights() {
    const ambient = new THREE.ambientlight(0x404060);
    scene.add(ambient);
    const dirlight = new THREE.directionallight(0xfff5e0, 1.2);
    dirlight.position.set(3, 5, 2);
    dirlight.castshadow = true;
    scene.add(dirlight);
    const fill = new THREE.pointlight(0x88aaff, 0.5);
    fill.position.set(-2, 1, 3);
    scene.add(fill);
}

function addhelpers() {
    const grid = new THREE.gridhelper(12, 20, 0x88aaff, 0x446688);
    grid.position.y = -0.8;
    scene.add(grid);
}

function animate() {
    requestanimationframe(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onresize(container) {
    const width = container.clientwidth;
    const height = container.clientheight;
    camera.aspect = width / height;
    camera.updateprojectionmatrix();
    renderer.setsize(width, height);
}

export function add3dobject(type, color = 0xffaa66) {
    let geometry;
    if (type === 'cube') geometry = new THREE.boxgeometry(1, 1, 1);
    else if (type === 'sphere') geometry = new THREE.spheregeometry(0.6, 48, 48);
    else if (type === 'cylinder') geometry = new THREE.cylindergeometry(0.6, 0.6, 1, 32);
    else geometry = new THREE.planegeometry(1.2, 1.2);
    const material = new THREE.meshstandardmaterial({ color, roughness: 0.3, metalness: 0.1 });
    const mesh = new THREE.mesh(geometry, material);
    mesh.castshadow = true;
    mesh.receiveshadow = true;
    mesh.position.set(0, 0.2, 0);
    scene.add(mesh);
    selectobject(mesh);
    return mesh;
}

export function selectobject(obj) {
    if (selectedobject) transformcontrol.detach();
    selectedobject = obj;
    transformcontrol.attach(selectedobject);
    updatepropertypanel();
}

export function getselectedmesh() { return selectedobject; }

function updatepropertypanel() {
    const panel = document.getelementbyid('proppanel');
    if (!selectedobject) { panel.innerhtml = 'no selection'; return; }
    panel.innerhtml = `
        <div>position: ${selectedobject.position.x.tofixed(2)}, ${selectedobject.position.y.tofixed(2)}, ${selectedobject.position.z.tofixed(2)}</div>
        <input type="color" id="matcolor" value="#${selectedobject.material.color.gethexstring()}">
        <input type="range" id="rough" min="0" max="1" step="0.01" value="${selectedobject.material.roughness}">
        <button id="applymat">apply</button>
    `;
    document.getelementbyid('matcolor')?.addeventlistener('change', (e) => {
        selectedobject.material.color.set(e.target.value);
    });
    document.getelementbyid('rough')?.addeventlistener('input', (e) => {
        selectedobject.material.roughness = parsefloat(e.target.value);
    });
}

export function loadmodelfromurl(url, name) {
    const loader = new gltfloader();
    loader.load(url, (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => { if(child.ismesh) { child.castshadow = true; child.receiveshadow = true; } });
        scene.add(model);
        selectobject(model);
    }, undefined, (err) => console.warn(err));
}

export function recolorobject(obj, colorhex) {
    if (!obj) return;
    if (obj.ismesh && obj.material) {
        obj.material.color.set(colorhex);
    } else {
        obj.traverse((child) => {
            if (child.ismesh && child.material) child.material.color.set(colorhex);
        });
    }
}

export function updateobjecttransform(obj, prop, value) {
    if (!obj) return;
    if (prop === 'position') obj.position.set(value.x, value.y, value.z);
    else if (prop === 'rotation') obj.rotation.set(value.x, value.y, value.z);
    else if (prop === 'scale') obj.scale.set(value.x, value.y, value.z);
    else if (prop === 'color' && obj.material) obj.material.color.set(value.hex);
      }
