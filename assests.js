export function initassetsui() {
  const pane = document.getElementById('assetspane');
  pane.innerHTML = `
    <div class="card">
      <button id="uploadimgasset">upload texture</button>
      <button id="uploadsndasset">upload sound</button>
      <input type="file" id="imgfile" accept="image/*" hidden>
      <input type="file" id="sndfile" accept="audio/*" hidden>
      <div class="scrolllist" id="assetlist"></div>
    </div>
  `;
  document.getElementById('uploadimgasset').onclick = () => document.getElementById('imgfile').click();
  document.getElementById('uploadsndasset').onclick = () => document.getElementById('sndfile').click();
}
