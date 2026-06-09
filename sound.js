export function initsoundui() {
  const pane = document.getElementById('soundpane');
  pane.innerHTML = `
    <div class="card">
      <div class="row"><button id="playsoundbtn"><i class="fas fa-play"></i></button><button id="stopsoundbtn"><i class="fas fa-stop"></i></button><input type="range" id="soundvol" min="0" max="1" step="0.01"><span id="currentsound">none</span></div>
      <canvas id="soundtimelinecanvas" class="timelinecanvas" height="40"></canvas>
      <button id="addsoundkeyframe">vol keyframe</button>
    </div>
  `;
  document.getElementById('playsoundbtn').onclick = () => alert('play sound');
  document.getElementById('stopsoundbtn').onclick = () => alert('stop sound');
  document.getElementById('addsoundkeyframe').onclick = () => alert('volume keyframe added');
}
