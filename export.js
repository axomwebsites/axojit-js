export function initexportui() {
  const pane = document.getElementById('exportpane');
  pane.innerHTML = `
    <div class="card">
      <button id="exportjsonbtn">export json</button>
      <button id="exporthtmlbtn">export html</button>
      <textarea id="exportdata" rows="4" readonly></textarea>
    </div>
  `;
  document.getElementById('exportjsonbtn').onclick = () => {
    const data = JSON.stringify({ objects: window.allobjects || [] });
    document.getElementById('exportdata').value = data;
  };
  document.getElementById('exporthtmlbtn').onclick = () => {
    document.getElementById('exportdata').value = '<html>standalone build placeholder</html>';
  };
}
