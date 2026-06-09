export let plugins = [];

export function registerplugin(name, initfn) {
  plugins.push({ name, initfn });
  initfn();
}

export function initplugins() {
  registerplugin('example', () => console.log('plugin loaded'));
  window.registerplugin = registerplugin;
}
