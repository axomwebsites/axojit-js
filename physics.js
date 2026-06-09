export function initphysicsui() {
  const pane = document.getElementById('physicspane');
  pane.innerHTML = `
    <div class="card">
      <label><input type="checkbox" id="physicsenable"> enable physics</label>
      <div class="propgrid"><span>mass</span><input id="massval" value="1"><span>gravity</span><input id="gravityval" value="9.8"></div>
      <button id="applyphysicsbtn">apply</button>
    </div>
  `;
  document.getElementById('applyphysicsbtn').onclick = () => {
    const enabled = document.getElementById('physicsenable').checked;
    alert(`physics ${enabled ? 'on' : 'off'}`);
  };
}
