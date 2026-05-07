const state = {
  meet: {},
  events: [],
  leaderboard: [],
  selectedEventId: localStorage.getItem("scoreboardEventId") || ""
};

const $ = selector => document.querySelector(selector);
const palette = ["#38b891", "#f18a56", "#72a7ff", "#f2c14e", "#c58cff", "#55c7d4"];

async function api(path) {
  const response = await fetch(`/api${path}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function teamColor(team) {
  const total = [...String(team || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length];
}

function updateClock() {
  $("#lastUpdated").textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

async function loadScoreboard() {
  const [meet, events, leaderboard] = await Promise.all([
    api("/meet"),
    api("/events"),
    api("/leaderboard")
  ]);

  state.meet = meet;
  state.events = events;
  state.leaderboard = leaderboard;

  if (!state.selectedEventId || !events.some(event => event.id === state.selectedEventId)) {
    state.selectedEventId = events[0]?.id || "";
  }

  renderShell();
  await renderEventResults();
  updateClock();
}

function renderShell() {
  $("#meetTitle").textContent = state.meet.name || "Athletic Meet";
  $("#meetMeta").textContent = [state.meet.venue, state.meet.date].filter(Boolean).join(" - ") || "Venue - Date";

  $("#scoreEventSelect").innerHTML = state.events.map(event =>
    `<option value="${event.id}">${event.name} - ${event.category}</option>`
  ).join("");
  $("#scoreEventSelect").value = state.selectedEventId;

  const topPoints = Math.max(...state.leaderboard.map(row => row.points), 1);
  $("#teamStandings").innerHTML = state.leaderboard.slice(0, 8).map((row, index) => `
    <article class="team-row">
      <div class="team-rank">${index + 1}</div>
      <div class="team-info">
        <strong><i style="background:${teamColor(row.team)}"></i>${row.team}</strong>
        <div class="bar"><span style="width:${Math.max(4, (row.points / topPoints) * 100)}%; background:${teamColor(row.team)}"></span></div>
      </div>
      <b>${row.points}</b>
    </article>
  `).join("") || `<div class="empty">No team points yet</div>`;
}

async function renderEventResults() {
  const event = state.events.find(item => item.id === state.selectedEventId);
  if (!event) {
    $("#eventTitle").textContent = "No event available";
    $("#eventCategory").textContent = "Create events in manager";
    $("#scoreRows").innerHTML = `<tr><td colspan="6">No event selected</td></tr>`;
    $("#podium").innerHTML = "";
    return;
  }

  const rows = await api(`/events/${event.id}/results`);
  $("#eventTitle").textContent = event.name;
  $("#eventCategory").textContent = `${event.category} - ${event.type} - ${event.unit}`;

  const podiumRows = rows.slice(0, 3);
  $("#podium").innerHTML = podiumRows.map(row => `
    <article class="podium-card rank-${row.rank}">
      <span>${row.rank}</span>
      <strong>${row.athlete.name}</strong>
      <small>${row.athlete.team}</small>
      <b>${row.mark} ${event.unit}</b>
    </article>
  `).join("") || `<div class="empty">Waiting for results</div>`;

  $("#scoreRows").innerHTML = rows.map(row => `
    <tr>
      <td><span class="rank">${row.rank}</span></td>
      <td>${row.athlete.bib}</td>
      <td>${row.athlete.name}</td>
      <td><i class="dot" style="background:${teamColor(row.athlete.team)}"></i>${row.athlete.team}</td>
      <td>${row.mark} ${event.unit}</td>
      <td>${row.points}</td>
    </tr>
  `).join("") || `<tr><td colspan="6">No results entered for this event</td></tr>`;
}

$("#scoreEventSelect").addEventListener("change", async event => {
  state.selectedEventId = event.target.value;
  localStorage.setItem("scoreboardEventId", state.selectedEventId);
  await renderEventResults();
  updateClock();
});

loadScoreboard().catch(error => {
  $("#scoreRows").innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
});

setInterval(loadScoreboard, 5000);
