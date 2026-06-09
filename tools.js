export function inittoolsui() {
  const pane = document.getElementById('toolspane');
  pane.innerHTML = `
    <div class="card">
      <div class="row"><button id="brushtool"><i class="fas fa-paint-brush"></i> brush</button><button id="erasertool">eraser</button><input type="color" id="brushcolor" value="#ffaa55"><input type="range" id="brushsize" min="2" max="30" value="8"><span id="brushsizeval">8</span></div>
      <button id="cleardrawlayer">clear layer</button>
      <button id="snapshottosprite">snapshot->sprite</button>
    </div>
  `;
  document.getElementById('brushtool').onclick = () => alert('brush selected');
  document.getElementById('erasertool').onclick = () => alert('eraser selected');
  document.getElementById('cleardrawlayer').onclick = () => alert('draw layer cleared');
  document.getElementById('snapshottosprite').onclick = () => alert('snapshot converted to sprite');
}
