export function initlightingui() {
  const pane = document.getElementById('lightingpane');
  pane.innerHTML = `
    <div class="card">
      <button id="addpointlight">point light</button>
      <div class="scrolllist" id="lightlist"></div>
      <div class="propgrid"><span>x</span><input id="lightx"><span>y</span><input id="lighty"><span>intensity</span><input id="lightintensity"></div>
      <button id="updatelightbtn">update</button>
      <button id="deletelightbtn" class="btnwarning">delete</button>
    </div>
  `;
  document.getElementById('addpointlight').onclick = () => alert('point light added');
  document.getElementById('updatelightbtn').onclick = () => alert('light updated');
  document.getElementById('deletelightbtn').onclick = () => alert('light deleted');
}
