export let allobjects = [];
export let selectedobjects = [];
export let activemode = '3d';
export let history = [];
export let historyindex = -1;

export function setactivemode(mode) { activemode = mode; }
export function getactivemode() { return activemode; }

export function savetohistory() {
  const state = JSON.parse(JSON.stringify(allobjects.map(o => ({ id: o.id, type: o.type, x: o.x, y: o.y, z: o.z, rot: o.rot, sx: o.sx, sy: o.sy, sz: o.sz, parentid: o.parent?.id || null }))));
  history = history.slice(0, historyindex + 1);
  history.push(state);
  historyindex++;
  if (history.length > 50) history.shift();
}

export function undo() {
  if (historyindex > 0) {
    historyindex--;
    restorefromhistory(history[historyindex]);
  }
}

export function redo() {
  if (historyindex < history.length - 1) {
    historyindex++;
    restorefromhistory(history[historyindex]);
  }
}

function restorefromhistory(state) {
  if (window.restoreenginestate) window.restoreenginestate(state);
}

export function addobject(obj) {
  allobjects.push(obj);
  savetohistory();
  if (window.refreshui) window.refreshui();
}

export function removeobject(obj) {
  const idx = allobjects.indexOf(obj);
  if (idx !== -1) allobjects.splice(idx, 1);
  if (selectedobjects.includes(obj)) selectedobjects = selectedobjects.filter(o => o !== obj);
  savetohistory();
  if (window.refreshui) window.refreshui();
}

export function selectobject(obj) {
  selectedobjects = [obj];
  if (window.refreshui) window.refreshui();
}

export function addtoselection(obj) {
  if (!selectedobjects.includes(obj)) selectedobjects.push(obj);
  else selectedobjects = selectedobjects.filter(o => o !== obj);
  if (window.refreshui) window.refreshui();
}

export function clearselection() {
  selectedobjects = [];
  if (window.refreshui) window.refreshui();
}

export function initshared() {
  window.savetohistory = savetohistory;
  window.undo = undo;
  window.redo = redo;
  window.selectobject = selectobject;
  window.addtoselection = addtoselection;
  window.clearselection = clearselection;
}
