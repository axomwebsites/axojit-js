import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { allobjects, selectedobjects, addobject, removeobject, selectobject, savetohistory } from './shared.js';

let scene, camera, renderer, controls, transformcontrols, composer, bloompass;
let currentobject = null;

export async function init3d(canvas) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);
  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
  camera.position.set(6, 5, 8);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  transformcontrols = new TransformControls(camera, renderer.domElement);
  transformcontrols.addEventListener('dragging-changed', (e) => { controls.enabled = !e.value; });
  scene.add(transformcontrols);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloompass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.3, 0.2);
  composer.addPass(bloompass);

  const hemi = new THREE.HemisphereLight(0x8a9bb5, 0x2a3a4a, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff5dd, 1.3);
  dir.position.set(3, 5, 2);
  dir.castShadow = true;
  scene.add(dir);

  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7aa9dd });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.userData = { type: 'cube', id: Date.now() };
  scene.add(mesh);
  allobjects.push(mesh);
  selectobject(mesh);
  transformcontrols.attach(mesh);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
  }
  animate();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  });

  window.add3dprimitive = (type) => {
    let geom;
    if (type === 'cube') geom = new THREE.BoxGeometry(1,1,1);
    else if (type === 'sphere') geom = new THREE.SphereGeometry(0.65,48,48);
    else geom = new THREE.PlaneGeometry(1.2,1.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x7aa9dd });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.userData = { type, id: Date.now() };
    scene.add(mesh);
    allobjects.push(mesh);
    selectobject(mesh);
    transformcontrols.attach(mesh);
    savetohistory();
    if (window.refreshui) window.refreshui();
  };

  return {
    destroy: () => { scene = null; renderer.dispose(); },
    addcube: () => window.add3dprimitive('cube'),
    addsphere: () => window.add3dprimitive('sphere'),
    addplane: () => window.add3dprimitive('plane')
  };
}
