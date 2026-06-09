export function initparticlesui() {
  const pane = document.getElementById('particlespane');
  pane.innerHTML = `
    <div class="card">
      <button id="addemitterbtn">add emitter</button>
      <div class="propgrid"><span>rate</span><input id="emitrate" value="30"><span>life</span><input id="emitlife" value="1"></div>
      <button id="applyemitterbtn">apply</button>
    </div>
  `;
  document.getElementById('addemitterbtn').onclick = () => alert('emitter added');
  document.getElementById('applyemitterbtn').onclick = () => alert('emitter settings applied');
}
