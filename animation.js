export let timeline = { playing: false, time: 0, duration: 3, keyframes: [] };
let animinterval;

export function initanimationui() {
  const pane = document.getElementById('animationpane');
  pane.innerHTML = `
    <div class="card">
      <div class="row"><button id="playanimbtn"><i class="fas fa-play"></i></button><button id="stopanimbtn"><i class="fas fa-stop"></i></button><input type="range" id="animscrub" min="0" max="1" step="0.01" style="flex:1"><span id="animtime">0s</span></div>
      <canvas id="timelinecanvas" class="timelinecanvas" width="400" height="50"></canvas>
      <div class="row"><select id="keyframeprop"><option value="x">x</option><option value="y">y</option><option value="w">width</option><option value="h">height</option></select><button id="addkeyframebtn">+keyframe</button></div>
      <div class="row"><button id="addcamkeyframebtn">camera keyframe</button><button id="playcamanimbtn">play camera anim</button></div>
    </div>
  `;
  document.getElementById('playanimbtn').onclick = () => { timeline.playing = true; };
  document.getElementById('stopanimbtn').onclick = () => { timeline.playing = false; };
  document.getElementById('addkeyframebtn').onclick = () => { alert('keyframe added'); };
  document.getElementById('addcamkeyframebtn').onclick = () => { alert('camera keyframe'); };
  document.getElementById('playcamanimbtn').onclick = () => { alert('camera anim'); };
}
