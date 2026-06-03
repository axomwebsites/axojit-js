import { init3dengine, add3dobject, selectobject, getselectedmesh, loadmodelfromurl, recolorobject } from './engine3d.js';
import { init2dengine, addrectangle, addcircle, addtriangle, setbrushmode, setcolor2d, getselected2dobject } from './engine2d.js';
import { buildexplorer, createnewfile, savecurrentfile, loadfilecontent, getcurrentfile } from './explorer.js';
import { addaudioasset, addimageasset, addvideoasset, rendermedialist } from './assetmanager.js';
import { animationmanager, createanimationclip, addkeyframe, playcurrentclip, stopcurrentclip, renderkeyframelist } from './animation.js';
import { initaisystem, processaiprompt } from './ai.js';
import { seteditmode, getinstance, getallinstances } from './gui.js';

let activetab = '3d';
window.instance = getinstance();

window.onload = () => {
    init3dengine('view3d');
    init2dengine('view2d');
    buildexplorer('explorertree', onfileselect);
    rendermedialist('medialist', onmediainsert);
    setuppolyhavenmodels();
    setuppolyhavenmaterials();
    attachuievents();
    animationmanager.settargetgetter(getselectedmesh);
    animationmanager.set2dtargetgetter(getselected2dobject);
    initaisystem();
};

function attachuievents() {
    document.getElementById('tab3dbtn').onclick = () => switchtab('3d');
    document.getElementById('tab2dbtn').onclick = () => switchtab('2d');
    document.getElementById('tabguibtn').onclick = () => switchtab('gui');
    document.getElementById('tabcodebtn').onclick = () => switchtab('code');
    document.getElementById('tabanimbtn').onclick = () => switchtab('anim');
    document.getElementById('tabaibtn').onclick = () => switchtab('ai');
    document.getElementById('addplusbtn').onclick = () => createnewfile('script.lua', '-- luau style\nlet screen = instance.new("screengui")');
    document.getElementById('savefilebtn').onclick = () => savecurrentfile(document.getElementById('codeeditor').value);
    document.getElementById('runscriptbtn').onclick = () => evalscript();
    document.getElementById('uploadaudiobtn').onclick = () => addaudioasset();
    document.getElementById('uploadimagebtn').onclick = () => addimageasset();
    document.getElementById('uploadvideobtn').onclick = () => addvideoasset();
    document.getElementById('addrect2d').onclick = () => addrectangle();
    document.getElementById('addcircle2d').onclick = () => addcircle();
    document.getElementById('addtriangle2d').onclick = () => addtriangle();
    document.getElementById('paintbrush2d').onclick = () => setbrushmode(true);
    document.getElementById('color2d').onchange = (e) => setcolor2d(e.target.value);
    document.getElementById('modelsearch').oninput = (e) => searchpolymodels(e.target.value);
    document.getElementById('materialsearch').oninput = (e) => searchpolymaterials(e.target.value);
    document.getElementById('playruntime').onclick = () => { seteditmode(false); alert('runtime mode - gui interactive'); };
    document.getElementById('guieditmodebtn').onclick = () => { const btn = document.getElementById('guieditmodebtn'); btn.classList.toggle('active'); seteditmode(btn.classList.contains('active')); };
    document.getElementById('addscreengui').onclick = () => window.instance.new('screengui');
    document.getElementById('addbillboardgui').onclick = () => window.instance.new('billboardgui');
    document.getElementById('addsurfacegui').onclick = () => window.instance.new('surfacegui');
    document.getElementById('addframe').onclick = () => { const f = window.instance.new('frame'); f.set('size', new udim2(0,160,0,100)); f.set('position', new udim2(0,50,0,50)); };
    document.getElementById('addscrollingframe').onclick = () => { const sf = window.instance.new('scrollingframe'); sf.set('size', new udim2(0,180,0,120)); sf.set('position', new udim2(0,50,0,170)); };
    document.getElementById('addcanvasgroup').onclick = () => window.instance.new('canvasgroup');
    document.getElementById('addviewportframe').onclick = () => window.instance.new('viewportframe');
    document.getElementById('addtextlabel').onclick = () => { const tl = window.instance.new('textlabel'); tl.set('text', 'hello'); tl.set('size', new udim2(0,100,0,30)); };
    document.getElementById('addtextbutton').onclick = () => { const tb = window.instance.new('textbutton'); tb.set('text', 'click'); tb.set('size', new udim2(0,100,0,40)); };
    document.getElementById('addtextbox').onclick = () => { const tbx = window.instance.new('textbox'); tbx.set('size', new udim2(0,150,0,30)); };
    document.getElementById('addimagelabel').onclick = () => { const il = window.instance.new('imagelabel'); il.set('image', 'https://placehold.co/100x100'); };
    document.getElementById('addimagebutton').onclick = () => { const ib = window.instance.new('imagebutton'); ib.set('image', 'https://placehold.co/100x100'); };
    document.getElementById('addvideoframe').onclick = () => { const vf = window.instance.new('videoframe'); vf.set('videourl', 'https://www.w3schools.com/html/mov_bbb.mp4'); };
    document.getElementById('newanimbtn').onclick = () => { const name = document.getElementById('animname').value || 'clip' + Date.now(); createanimationclip(name); renderkeyframelist('keyframelist', animationmanager.getcurrentclip()); };
    document.getElementById('playanimbtn').onclick = () => playcurrentclip();
    document.getElementById('stopanimbtn').onclick = () => stopcurrentclip();
    document.getElementById('addkeyframebtn').onclick = () => { const prop = document.getElementById('propertyselect').value; const time = parseFloat(document.getElementById('keyframetime').value); if (isNaN(time)) return; const target = getselectedmesh() || getselected2dobject(); if (!target) { alert('select an object'); return; } let value; if (prop === 'position') value = { x: target.position.x, y: target.position.y, z: target.position.z }; else if (prop === 'rotation') value = { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }; else if (prop === 'scale') value = { x: target.scale.x, y: target.scale.y, z: target.scale.z }; else if (prop === 'color') value = { hex: target.material?.color?.gethexstring() || '#ffaa66' }; addkeyframe(prop, time, value); renderkeyframelist('keyframelist', animationmanager.getcurrentclip()); };
    document.getElementById('aisendbtn').onclick = () => { const p = document.getElementById('aiprompt').value; if (p) processaiprompt(p); document.getElementById('aiprompt').value = ''; };
}

function switchtab(tab) {
    activetab = tab;
    document.querySelectorAll('.viewpanel').forEach(p => p.classList.remove('activepanel'));
    document.getElementById(`view${tab}`).classList.add('activepanel');
    ['3d','2d','gui','code','anim','ai'].forEach(t => document.getElementById(`tab${t}btn`).classList.toggle('active', t === tab));
    if (tab === 'code') document.getElementById('codeeditor').value = getcurrentfile().content;
}

function onfileselect(filename) { const f = loadfilecontent(filename); if (f) document.getElementById('codeeditor').value = f.content; }
function evalscript() { const code = document.getElementById('codeeditor').value; try { const fn = new Function('instance', 'udim2', 'udim', 'color3', 'vector2', code); fn(window.instance, udim2, udim, color3, vector2); } catch(e) { alert('script error: ' + e.message); } }
function onmediainsert(type, url) { if (activetab === '3d') { const m = getselectedmesh(); if (m && m.material) new THREE.TextureLoader().load(url, t => { m.material.map = t; m.material.needsupdate = true; }); } else if (activetab === '2d') fabric.Image.fromURL(url, img => window.fabriccanvas.add(img)); }
async function setuppolyhavenmodels() { const grid = document.getElementById('modelgrid'); grid.innerHTML = '<div>loading...</div>'; try { const res = await fetch('https://api.polyhaven.com/assets?t=models'); const data = await res.json(); const keys = object.keys(data).slice(0, 24); grid.innerHTML = ''; for (let k of keys) { const thumb = `https://cdn.polyhaven.com/asset_img/thumbs/${k}.png?width=200`; const card = document.createElement('div'); card.className = 'modelcard'; card.innerHTML = `<img src="${thumb}"><div>${k.slice(0,18)}</div>`; card.onclick = () => loadmodelfromurl(`https://cdn.polyhaven.com/asset_img/primary/${k}.png?format=gltf`, k); grid.appendChild(card); } } catch(e) { grid.innerHTML = '<div>failed</div>'; } }
async function setuppolyhavenmaterials() { const grid = document.getElementById('materialgrid'); grid.innerHTML = '<div>loading materials...</div>'; try { const res = await fetch('https://api.polyhaven.com/assets?t=textures'); const data = await res.json(); const keys = object.keys(data).slice(0, 24); grid.innerHTML = ''; for (let k of keys) { const thumb = `https://cdn.polyhaven.com/asset_img/thumbs/${k}.png?width=200`; const card = document.createElement('div'); card.className = 'modelcard'; card.innerHTML = `<img src="${thumb}"><div>${k.slice(0,18)}</div>`; card.onclick = () => { const m = getselectedmesh(); if (m) new THREE.TextureLoader().load(`https://cdn.polyhaven.com/asset_img/primary/${k}.png`, tex => { m.material.map = tex; m.material.needsupdate = true; }); }; grid.appendChild(card); } } catch(e) { grid.innerHTML = '<div>failed</div>'; } }
function searchpolymodels(q) { document.querySelectorAll('#modelgrid .modelcard').forEach(c => { c.style.display = c.innertext.tolowercase().includes(q.tolowercase()) ? 'block' : 'none'; }); }
function searchpolymaterials(q) { document.querySelectorAll('#materialgrid .modelcard').forEach(c => { c.style.display = c.innertext.tolowercase().includes(q.tolowercase()) ? 'block' : 'none'; }); }
