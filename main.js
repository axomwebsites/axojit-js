import { init3d } from './engine3d.js';
import { init2d } from './engine2d.js';
import { setactivemode, getactivemode, initshared } from './shared.js';
import { initplugins } from './plugins.js';
import { initanimationui } from './animation.js';
import { initphysicsui } from './physics.js';
import { initparticlesui } from './particles.js';
import { initassetsui } from './assets.js';
import { initlightingui } from './lighting.js';
import { initsoundui } from './sound.js';
import { initnavmeshui } from './navmesh.js';
import { inittoolsui } from './tools.js';
import { initexportui } from './export.js';

let current3d = null;
let current2d = null;
let activemode = '3d';

async function switchmode(mode) {
  const canvas = document.getElementById('enginecanvas');
  if (activemode === mode) return;
  activemode = mode;
  if (mode === '3d') {
    if (current2d) current2d.destroy();
    current3d = await init3d(canvas);
    document.getElementById('mode3dbtn').classList.add('active');
    document.getElementById('mode2dbtn').classList.remove('active');
  } else {
    if (current3d) current3d.destroy();
    current2d = await init2d(canvas);
    document.getElementById('mode2dbtn').classList.add('active');
    document.getElementById('mode3dbtn').classList.remove('active');
  }
  setactivemode(mode);
  if (window.refreshui) window.refreshui();
}

async function init() {
  await initshared();
  initplugins();
  initanimationui();
  initphysicsui();
  initparticlesui();
  initassetsui();
  initlightingui();
  initsoundui();
  initnavmeshui();
  inittoolsui();
  initexportui();

  document.getElementById('mode3dbtn').onclick = () => switchmode('3d');
  document.getElementById('mode2dbtn').onclick = () => switchmode('2d');
  document.getElementById('themetogglebtn').onclick = () => {
    document.body.classList.toggle('themelight');
    document.body.classList.toggle('themedark');
  };

  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const paneid = tab.dataset.tab + 'pane';
      document.querySelectorAll('.tabpane').forEach(p => p.classList.remove('activepane'));
      document.getElementById(paneid).classList.add('activepane');
    };
  });

  await switchmode('3d');
}

init();
