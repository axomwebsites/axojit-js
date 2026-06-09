export function initnavmeshui() {
  const pane = document.getElementById('navmeshpane');
  pane.innerHTML = `
    <div class="card">
      <button id="gennavmesh">gen navmesh</button>
      <button id="addwaypoint">add waypoint</button>
      <div class="scrolllist" id="waypointlist"></div>
      <button id="clearwaypoints">clear</button>
    </div>
  `;
  document.getElementById('gennavmesh').onclick = () => alert('navmesh generated');
  document.getElementById('addwaypoint').onclick = () => alert('waypoint added');
  document.getElementById('clearwaypoints').onclick = () => alert('waypoints cleared');
}
