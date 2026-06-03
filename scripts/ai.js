import { add3dobject, getselectedmesh, recolorobject, selectobject } from './engine3d.js';

let modelmanifest = null;

export async function initaisystem() {
    appendchatmessage('system', 'ai ready (beta). ask me to create objects like "blue house"');
    await loadmanifest();
}

async function loadmanifest() {
    try {
        const response = await fetch('/tmodels/manifest.json');
        if (response.ok) modelmanifest = await response.json();
        else appendchatmessage('system', 'no local models manifest found');
    } catch(e) { appendchatmessage('system', 'manifest load failed'); }
}

function appendchatmessage(role, text) {
    const log = document.getelementbyid('aichatlog');
    if (!log) return;
    const div = document.createelement('div');
    div.classname = 'chatmessage';
    div.innerhtml = `<span style="color:${role === 'user' ? '#ffaa66' : '#88ffaa'}">${role === 'user' ? 'you' : 'ai'}:</span> ${text}`;
    log.appendchild(div);
    log.scrolltop = log.scrollheight;
}

export async function processaiprompt(prompt) {
    appendchatmessage('user', prompt);
    const lower = prompt.tolowercase();
    const color = extractcolor(lower);
    const objecttype = extractobjecttype(lower);

    if (objecttype) {
        createfallbackobject(objecttype, color);
    } else if (getselectedmesh()) {
        if (color) {
            recolorobject(getselectedmesh(), color);
            appendchatmessage('ai', `changed selected object color to ${color}`);
        } else {
            appendchatmessage('ai', 'select an object first, or ask for a new object like "red car"');
        }
    } else {
        appendchatmessage('ai', 'no object selected. try "create a blue house"');
    }
}

function extractcolor(text) {
    const colormap = {
        red: '#ff3333', blue: '#3366ff', green: '#33cc33', yellow: '#ffcc00',
        orange: '#ff8833', purple: '#aa44ff', pink: '#ff66cc', black: '#222222',
        white: '#eeeeee', gray: '#888888', brown: '#8b4513', cyan: '#00cccc',
        magenta: '#ff44ff', lime: '#88ff44', teal: '#008080', gold: '#ffcc44',
        silver: '#c0c0c0', bronze: '#cd7f32'
    };
    for (let [colorname, hex] of object.entries(colormap)) {
        if (text.includes(colorname)) return hex;
    }
    return null;
}

function extractobjecttype(text) {
    const typemap = {
        house: 'house', building: 'house', home: 'house',
        car: 'car', vehicle: 'car', truck: 'car',
        tree: 'tree', plant: 'tree', bush: 'tree',
        table: 'table', desk: 'table', chair: 'chair',
        box: 'cube', crate: 'cube', sphere: 'sphere', ball: 'sphere',
        cylinder: 'cylinder', pillar: 'cylinder'
    };
    for (let [keyword, type] of object.entries(typemap)) {
        if (text.includes(keyword)) return type;
    }
    return null;
}

function createfallbackobject(objecttype, colorhex) {
    let mesh = null;
    if (objecttype === 'house') {
        mesh = add3dobject('cube', colorhex ? parseint(colorhex.slice(1), 16) : 0xcc8866);
        mesh.scale.set(1.2, 1, 1.2);
        const roofgeo = new THREE.conegeometry(0.9, 0.8, 4);
        const roofmat = new THREE.meshstandardmaterial({ color: 0xaa6644 });
        const roof = new THREE.mesh(roofgeo, roofmat);
        roof.position.y = 0.6;
        mesh.add(roof);
        appendchatmessage('ai', `created a ${colorhex ? 'colored ' : ''}house`);
    } else if (objecttype === 'car') {
        mesh = add3dobject('cube', colorhex ? parseint(colorhex.slice(1), 16) : 0x3366ff);
        mesh.scale.set(1.2, 0.4, 0.8);
        const topgeo = new THREE.boxgeometry(0.8, 0.3, 0.6);
        const topmat = new THREE.meshstandardmaterial({ color: 0x88aaff });
        const top = new THREE.mesh(topgeo, topmat);
        top.position.y = 0.25;
        mesh.add(top);
        appendchatmessage('ai', `created a ${colorhex ? 'colored ' : ''}car`);
    } else if (objecttype === 'tree') {
        mesh = add3dobject('cylinder', colorhex ? parseint(colorhex.slice(1), 16) : 0x88aa44);
        mesh.scale.set(0.4, 0.8, 0.4);
        const foliagegeo = new THREE.spheregeometry(0.5, 8, 8);
        const foliagemat = new THREE.meshstandardmaterial({ color: 0x44aa44 });
        const foliage = new THREE.mesh(foliagegeo, foliagemat);
        foliage.position.y = 0.6;
        mesh.add(foliage);
        appendchatmessage('ai', `created a ${colorhex ? colorhex + ' ' : ''}tree`);
    } else {
        mesh = add3dobject(objecttype, colorhex ? parseint(colorhex.slice(1), 16) : 0x88aa44);
        appendchatmessage('ai', `created a ${colorhex ? colorhex + ' ' : ''}${objecttype}`);
    }
    if (mesh && colorhex) recolorobject(mesh, colorhex);
}
