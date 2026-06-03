import { add3dobject, getselectedmesh, recolorobject, selectobject } from './engine3d.js';

let modelmanifest = null;

export async function initaisystem() {
    appendchatmessage('system', 'ai ready (beta). ask me to create or modify objects like "big red wooden house"');
    await loadmanifest();
}

async function loadmanifest() {
    try {
        const response = await fetch('manifest.json');
        if (response.ok) {
            modelmanifest = await response.json();
            appendchatmessage('system', `loaded ${modelmanifest.models?.length || 0} local models from manifest.json`);
        } else {
            appendchatmessage('system', 'no manifest.json found at root, using primitives');
        }
    } catch(e) {
        appendchatmessage('system', 'manifest load failed, using primitives');
    }
}

function appendchatmessage(role, text) {
    const log = document.getElementById('aichatlog');
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'chatmessage';
    div.innerHTML = `<span style="color:${role === 'user' ? '#ffaa66' : '#88ffaa'}">${role === 'user' ? 'you' : 'ai'}:</span> ${text}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

export async function processaiprompt(prompt) {
    appendchatmessage('user', prompt);
    const lower = prompt.toLowerCase();
    const parsed = parseprompt(lower);
    
    if (parsed.objecttype) {
        if (modelmanifest && modelmanifest.models) {
            const match = findmodelmatch(parsed.objecttype, lower);
            if (match) {
                await loadlocalmodel(match, parsed.color, parsed.material, parsed.size);
                return;
            }
        }
        createfallbackobject(parsed);
    } else if (getselectedmesh()) {
        if (parsed.color) {
            recolorobject(getselectedmesh(), parsed.color);
            appendchatmessage('ai', `changed selected object color to ${parsed.color}`);
        }
        if (parsed.material) {
            applymaterial(getselectedmesh(), parsed.material);
            appendchatmessage('ai', `applied ${parsed.material} material`);
        }
        if (parsed.size) {
            scaleselected(parsed.size);
            appendchatmessage('ai', `adjusted size to ${parsed.size}`);
        }
    } else {
        appendchatmessage('ai', 'no object selected. try "create a big red wooden house"');
    }
}

function parseprompt(text) {
    let result = { objecttype: null, color: null, material: null, size: 'normal' };
    const typemap = {
        house: 'house', home: 'house', building: 'house', cottage: 'house', mansion: 'house', villa: 'house',
        car: 'car', vehicle: 'car', truck: 'car', van: 'car', suv: 'car', sportscar: 'car', racecar: 'car',
        tree: 'tree', plant: 'tree', bush: 'tree', flower: 'tree', palm: 'tree', oak: 'tree', pine: 'tree',
        table: 'table', desk: 'table', counter: 'table', diningtable: 'table',
        chair: 'chair', stool: 'chair', throne: 'chair', bench: 'chair',
        box: 'cube', crate: 'cube', container: 'cube', chest: 'cube',
        sphere: 'sphere', ball: 'sphere', orb: 'sphere', globe: 'sphere',
        cylinder: 'cylinder', pillar: 'cylinder', column: 'cylinder', pipe: 'cylinder',
        plane: 'plane', ground: 'plane', floor: 'plane', platform: 'plane',
        pyramid: 'pyramid', obelisk: 'pyramid', tent: 'pyramid',
        torus: 'torus', ring: 'torus', donut: 'torus',
        wall: 'wall', fence: 'wall', barrier: 'wall',
        window: 'window', door: 'door', roof: 'roof', chimney: 'chimney',
        stair: 'stair', staircase: 'stair', ramp: 'stair',
        lamp: 'lamp', light: 'lamp', torch: 'lamp', lantern: 'lamp',
        statue: 'statue', sculpture: 'statue', monument: 'statue',
        fountain: 'fountain', pond: 'fountain', pool: 'fountain',
        bridge: 'bridge', arch: 'bridge', tunnel: 'bridge',
        tower: 'tower', skyscraper: 'tower', lighthouse: 'tower', spire: 'tower',
        castle: 'castle', fortress: 'castle', palace: 'castle',
        tent: 'tent', canopy: 'tent', umbrella: 'tent',
        bed: 'bed', couch: 'couch', sofa: 'couch', wardrobe: 'wardrobe', shelf: 'shelf',
        computer: 'computer', monitor: 'computer', screen: 'computer',
        phone: 'phone', mobile: 'phone', tablet: 'phone',
        weapon: 'weapon', sword: 'weapon', gun: 'weapon', axe: 'weapon', bow: 'weapon',
        shield: 'shield', armor: 'shield', helmet: 'shield',
        gem: 'gem', crystal: 'gem', diamond: 'gem', ruby: 'gem', emerald: 'gem', sapphire: 'gem',
        rock: 'rock', stone: 'rock', boulder: 'rock', pebble: 'rock',
        cloud: 'cloud', smoke: 'cloud', fog: 'cloud',
        star: 'star', sun: 'star', moon: 'star', planet: 'star'
    };
    for (let [keyword, type] of Object.entries(typemap)) {
        if (text.includes(keyword)) { result.objecttype = type; break; }
    }
    const colormap = {
        red: '#ff3333', blue: '#3366ff', green: '#33cc33', yellow: '#ffcc00',
        orange: '#ff8833', purple: '#aa44ff', pink: '#ff66cc', black: '#222222',
        white: '#eeeeee', gray: '#888888', brown: '#8b4513', cyan: '#00cccc',
        magenta: '#ff44ff', lime: '#88ff44', teal: '#008080', gold: '#ffcc44',
        silver: '#c0c0c0', bronze: '#cd7f32', copper: '#b87333', brass: '#b5a642',
        wood: '#a56b3a', oak: '#7a5c3a', walnut: '#5c3a1a', mahogany: '#4a2512',
        stone: '#9a9a9a', marble: '#e8e4d8', granite: '#808080', concrete: '#666666',
        metal: '#aaaaaa', iron: '#6e6e6e', steel: '#b0b5b9', aluminium: '#c0c0c0',
        glass: '#aaffffcc', water: '#3399ffcc', ice: '#88ccffcc', fire: '#ff6633'
    };
    for (let [colorname, hex] of Object.entries(colormap)) {
        if (text.includes(colorname)) { result.color = hex; break; }
    }
    const materialmap = {
        wood: 'wood', wooden: 'wood', oak: 'wood', walnut: 'wood', mahogany: 'wood',
        metal: 'metal', iron: 'metal', steel: 'metal', aluminium: 'metal', gold: 'metal', silver: 'metal', copper: 'metal', brass: 'metal',
        stone: 'stone', marble: 'stone', granite: 'stone', concrete: 'stone', rock: 'stone',
        glass: 'glass', crystal: 'glass', diamond: 'glass',
        water: 'water', ice: 'ice', fire: 'fire', lava: 'fire',
        fabric: 'fabric', cloth: 'fabric', leather: 'fabric', rubber: 'fabric',
        plastic: 'plastic', rubber: 'plastic',
        gem: 'gem', emerald: 'gem', ruby: 'gem', sapphire: 'gem'
    };
    for (let [matkeyword, mat] of Object.entries(materialmap)) {
        if (text.includes(matkeyword)) { result.material = mat; break; }
    }
    if (text.includes('big') || text.includes('large') || text.includes('huge') || text.includes('giant')) result.size = 'big';
    if (text.includes('small') || text.includes('tiny') || text.includes('little')) result.size = 'small';
    if (text.includes('tall')) result.size = 'tall';
    if (text.includes('wide')) result.size = 'wide';
    return result;
}

function findmodelmatch(objecttype, fulltext) {
    if (!modelmanifest || !modelmanifest.models) return null;
    for (let model of modelmanifest.models) {
        const name = model.name.toLowerCase();
        const tags = (model.tags || []).join(' ').toLowerCase();
        if (name.includes(objecttype) || tags.includes(objecttype)) {
            return model;
        }
    }
    return null;
}

async function loadlocalmodel(modelinfo, colorhex, material, size) {
    try {
        const url = `models/${modelinfo.file}`;
        appendchatmessage('ai', `loading ${modelinfo.name} from local library...`);
        const { loadmodelfromurl } = await import('./engine3d.js');
        loadmodelfromurl(url, modelinfo.name);
        setTimeout(() => {
            const obj = getselectedmesh();
            if (obj) {
                if (colorhex) recolorobject(obj, colorhex);
                if (material) applymaterial(obj, material);
                if (size) scalesize(obj, size);
            }
        }, 500);
    } catch(e) {
        appendchatmessage('ai', `could not load local model, creating primitive instead`);
        createfallbackobject({ objecttype: modelinfo.name, color: colorhex, material: material, size: size });
    }
}

function applymaterial(obj, materialtype) {
    if (!obj || !obj.material) return;
    const mat = obj.material;
    switch(materialtype) {
        case 'wood': mat.color.setHex(0xa56b3a); mat.roughness = 0.7; mat.metalness = 0.05; break;
        case 'metal': mat.color.setHex(0xaaaaaa); mat.roughness = 0.3; mat.metalness = 0.9; break;
        case 'stone': mat.color.setHex(0x9a9a9a); mat.roughness = 0.8; mat.metalness = 0.1; break;
        case 'glass': mat.color.setHex(0xaaffff); mat.roughness = 0.1; mat.metalness = 0.9; mat.transparent = true; mat.opacity = 0.6; break;
        case 'water': mat.color.setHex(0x3399ff); mat.roughness = 0.2; mat.metalness = 0.8; mat.transparent = true; mat.opacity = 0.7; break;
        case 'ice': mat.color.setHex(0x88ccff); mat.roughness = 0.15; mat.metalness = 0.3; mat.transparent = true; mat.opacity = 0.8; break;
        case 'fire': mat.color.setHex(0xff6633); mat.roughness = 0.4; mat.metalness = 0.0; mat.emissive = new THREE.Color(0xff3300); mat.emissiveIntensity = 0.8; break;
        case 'fabric': mat.color.setHex(0xaa8866); mat.roughness = 0.9; mat.metalness = 0.0; break;
        case 'plastic': mat.color.setHex(0xdd44cc); mat.roughness = 0.4; mat.metalness = 0.0; break;
        case 'gem': mat.color.setHex(0x44aaff); mat.roughness = 0.2; mat.metalness = 0.3; mat.emissive = new THREE.Color(0x2266aa); mat.emissiveIntensity = 0.3; break;
        default: return;
    }
    mat.needsupdate = true;
}

function scalesize(obj, size) {
    if (!obj) return;
    let sx = 1, sy = 1, sz = 1;
    if (size === 'big') { sx = 1.5; sy = 1.5; sz = 1.5; }
    else if (size === 'small') { sx = 0.6; sy = 0.6; sz = 0.6; }
    else if (size === 'tall') { sx = 0.8; sy = 2.0; sz = 0.8; }
    else if (size === 'wide') { sx = 2.0; sy = 0.8; sz = 1.0; }
    obj.scale.set(sx, sy, sz);
}

function scaleselected(size) {
    const obj = getselectedmesh();
    if (obj) scalesize(obj, size);
}

function createfallbackobject(parsed) {
    let mesh = null;
    const objecttype = parsed.objecttype;
    const colorhex = parsed.color;
    const material = parsed.material;
    const size = parsed.size;
    
    if (objecttype === 'house') {
        mesh = add3dobject('cube', colorhex ? parseInt(colorhex.slice(1), 16) : 0xcc8866);
        mesh.scale.set(1.2, 1, 1.2);
        const roofgeo = new THREE.ConeGeometry(0.9, 0.8, 4);
        const roofmat = new THREE.MeshStandardMaterial({ color: 0xaa6644 });
        const roof = new THREE.Mesh(roofgeo, roofmat);
        roof.position.y = 0.6;
        mesh.add(roof);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}house`);
    } else if (objecttype === 'car') {
        mesh = add3dobject('cube', colorhex ? parseInt(colorhex.slice(1), 16) : 0x3366ff);
        mesh.scale.set(1.2, 0.4, 0.8);
        const topgeo = new THREE.BoxGeometry(0.8, 0.3, 0.6);
        const topmat = new THREE.MeshStandardMaterial({ color: 0x88aaff });
        const top = new THREE.Mesh(topgeo, topmat);
        top.position.y = 0.25;
        mesh.add(top);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}car`);
    } else if (objecttype === 'tree') {
        mesh = add3dobject('cylinder', colorhex ? parseInt(colorhex.slice(1), 16) : 0x88aa44);
        mesh.scale.set(0.4, 0.8, 0.4);
        const foliagegeo = new THREE.SphereGeometry(0.5, 8, 8);
        const foliagemat = new THREE.MeshStandardMaterial({ color: 0x44aa44 });
        const foliage = new THREE.Mesh(foliagegeo, foliagemat);
        foliage.position.y = 0.6;
        mesh.add(foliage);
        appendchatmessage('ai', `created a ${size} ${colorhex ? colorhex + ' ' : ''}tree`);
    } else if (objecttype === 'table') {
        mesh = add3dobject('cube', colorhex ? parseInt(colorhex.slice(1), 16) : 0xaa8866);
        mesh.scale.set(1.2, 0.2, 0.8);
        const leggeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const legmat = new THREE.MeshStandardMaterial({ color: 0x886644 });
        const leg1 = new THREE.Mesh(leggeo, legmat); leg1.position.set(-0.5, -0.3, -0.3); mesh.add(leg1);
        const leg2 = new THREE.Mesh(leggeo, legmat); leg2.position.set(0.5, -0.3, -0.3); mesh.add(leg2);
        const leg3 = new THREE.Mesh(leggeo, legmat); leg3.position.set(-0.5, -0.3, 0.3); mesh.add(leg3);
        const leg4 = new THREE.Mesh(leggeo, legmat); leg4.position.set(0.5, -0.3, 0.3); mesh.add(leg4);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}table`);
    } else if (objecttype === 'chair') {
        mesh = add3dobject('cube', colorhex ? parseInt(colorhex.slice(1), 16) : 0xaa8866);
        mesh.scale.set(0.6, 0.2, 0.6);
        const backgeo = new THREE.BoxGeometry(0.6, 0.5, 0.1);
        const backmat = new THREE.MeshStandardMaterial({ color: 0x886644 });
        const back = new THREE.Mesh(backgeo, backmat);
        back.position.set(0, 0.3, -0.25);
        mesh.add(back);
        const leggeo = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const legmat = new THREE.MeshStandardMaterial({ color: 0x664422 });
        const leg1 = new THREE.Mesh(leggeo, legmat); leg1.position.set(-0.25, -0.2, -0.25); mesh.add(leg1);
        const leg2 = new THREE.Mesh(leggeo, legmat); leg2.position.set(0.25, -0.2, -0.25); mesh.add(leg2);
        const leg3 = new THREE.Mesh(leggeo, legmat); leg3.position.set(-0.25, -0.2, 0.25); mesh.add(leg3);
        const leg4 = new THREE.Mesh(leggeo, legmat); leg4.position.set(0.25, -0.2, 0.25); mesh.add(leg4);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}chair`);
    } else if (objecttype === 'tower') {
        mesh = add3dobject('cylinder', colorhex ? parseInt(colorhex.slice(1), 16) : 0x99aacc);
        mesh.scale.set(0.8, 2.0, 0.8);
        const spiregeo = new THREE.ConeGeometry(0.5, 0.8, 8);
        const spiremat = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
        const spire = new THREE.Mesh(spiregeo, spiremat);
        spire.position.y = 1.2;
        mesh.add(spire);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}tower`);
    } else if (objecttype === 'wall') {
        mesh = add3dobject('cube', colorhex ? parseInt(colorhex.slice(1), 16) : 0xaaaaff);
        mesh.scale.set(2.0, 0.8, 0.2);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}wall`);
    } else if (objecttype === 'window') {
        mesh = add3dobject('cube', colorhex ? parseInt(colorhex.slice(1), 16) : 0x88ccff);
        mesh.scale.set(1.0, 0.8, 0.1);
        mesh.material.transparent = true;
        mesh.material.opacity = 0.6;
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}window`);
    } else if (objecttype === 'door') {
        mesh = add3dobject('cube', colorhex ? parseInt(colorhex.slice(1), 16) : 0xaa8866);
        mesh.scale.set(0.6, 1.2, 0.1);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}door`);
    } else if (objecttype === 'lamp') {
        mesh = add3dobject('cylinder', colorhex ? parseInt(colorhex.slice(1), 16) : 0xddccaa);
        mesh.scale.set(0.3, 0.6, 0.3);
        const lampgeo = new THREE.SphereGeometry(0.25, 16, 16);
        const lampmat = new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0xff6633, emissiveIntensity: 0.5 });
        const lamp = new THREE.Mesh(lampgeo, lampmat);
        lamp.position.y = 0.45;
        mesh.add(lamp);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}lamp`);
    } else if (objecttype === 'fountain') {
        mesh = add3dobject('cylinder', colorhex ? parseInt(colorhex.slice(1), 16) : 0x88aacc);
        mesh.scale.set(1.2, 0.3, 1.2);
        const poolgeo = new THREE.CylinderGeometry(0.8, 1.2, 0.2, 16);
        const poolmat = new THREE.MeshStandardMaterial({ color: 0x66aaff, metalness: 0.8, roughness: 0.2 });
        const pool = new THREE.Mesh(poolgeo, poolmat);
        pool.position.y = 0.2;
        mesh.add(pool);
        appendchatmessage('ai', `created a ${size} ${colorhex ? 'colored ' : ''}fountain`);
    } else {
        let primitive = 'cube';
        if (objecttype === 'sphere') primitive = 'sphere';
        else if (objecttype === 'cylinder') primitive = 'cylinder';
        else if (objecttype === 'plane') primitive = 'plane';
        else if (objecttype === 'pyramid') primitive = 'pyramid';
        else if (objecttype === 'torus') primitive = 'torus';
        mesh = add3dobject(primitive, colorhex ? parseInt(colorhex.slice(1), 16) : 0x88aa44);
        appendchatmessage('ai', `created a ${size} ${colorhex ? colorhex + ' ' : ''}${objecttype || primitive}`);
    }
    if (mesh) {
        if (colorhex) recolorobject(mesh, colorhex);
        if (material) applymaterial(mesh, material);
        if (size) scalesize(mesh, size);
    }
        }
