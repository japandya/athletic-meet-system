const state = {
  meet: {},
  athletes: [],
  events: [],
  registrations: [],
  results: [],
  dashboard: null,
  exportRows: [],
  reports: null,
  currentRankingEvent: "",
  organizerEventId: localStorage.getItem("organizerEventId") || ""
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const teamPalette = ["#176b55", "#c9512b", "#315f9f", "#8a5b12", "#6d5bd0", "#287b8f", "#9f3d5a"];
const standardEventNames = [
  "60M", "80M", "100M", "200M", "400M", "800M", "1500M", "3000M", "5000M", "10000M",
  "80M Hurdles", "100M Hurdles", "110M Hurdles", "400M Hurdles", "2000M Steeplechase", "3000M Steeplechase",
  "4x100M Relay", "4x400M Relay", "Long Jump", "High Jump", "Triple Jump", "Pole Vault",
  "Shot Put", "Discus Throw", "Javelin Throw", "Hammer Throw", "Heptathlon", "Decathlon", "Race Walk"
];
const standardCategories = [
  "Open", "Boys", "Girls",
  "Under 8-Boys", "Under 8-Girls", "Under 10-Boys", "Under 10-Girls",
  "Under 12-Boys", "Under 12-Girls", "Under 14-Boys", "Under 14-Girls",
  "Under 16-Boys", "Under 16-Girls", "Under 18-Boys", "Under 18-Girls",
  "Under 20-Boys", "Under 20-Girls", "Men", "Women"
];

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = $("#themeToggle");
  if (toggle) toggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
  localStorage.setItem("meetTheme", theme);
}

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  const headers = rows.shift() || [];
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] || ""])));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  const headers = ["Meet", "Event", "Discipline", "Category", "Gender", "Date", "Position", "AFI UID / Bib", "Athlete", "University", "Mark", "Medal", "Points"];
  return rowsToCsv(rows, headers);
}

function rowsToCsv(rows, headers) {
  return [
    headers.join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\r\n");
}

function toast(message, type = "ok") {
  const node = $("#toast");
  node.textContent = message;
  node.className = `toast show ${type}`;
  setTimeout(() => node.classList.remove("show"), 2600);
}

function optionList(items, labelFn) {
  return items.map(item => `<option value="${item.id}">${labelFn(item)}</option>`).join("");
}

function teamColor(team) {
  const text = String(team || "");
  const total = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return teamPalette[total % teamPalette.length];
}

function eventEntryCount(eventId) {
  return state.registrations.filter(reg => reg.eventId === eventId).length;
}

function eventResultCount(eventId) {
  return state.results.filter(result => result.eventId === eventId).length;
}

function eventStatus(event) {
  const entries = eventEntryCount(event.id);
  const results = eventResultCount(event.id);
  if (results > 0) return "Scored";
  if (entries > 0) return "Ready";
  return "Open";
}

function resultFor(eventId, athleteId) {
  return state.results.find(result => result.eventId === eventId && result.athleteId === athleteId);
}

function athleteById(id) {
  return state.athletes.find(athlete => athlete.id === id);
}

function eventById(id) {
  return state.events.find(event => event.id === id);
}

function registeredAthletesFor(eventId) {
  const athleteIds = new Set(state.registrations.filter(reg => reg.eventId === eventId).map(reg => reg.athleteId));
  return state.athletes.filter(athlete => athleteIds.has(athlete.id));
}

function eventNameOptions() {
  return [...new Set([...state.events.map(event => event.name), ...standardEventNames])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function categoryOptions() {
  return [...new Set([
    ...standardCategories,
    ...state.events.map(event => event.category),
    ...state.athletes.map(athlete => athlete.category),
    ...state.athletes.map(athlete => athlete.gender)
  ])]
    .filter(Boolean)
    .sort((a, b) => {
      const standardA = standardCategories.includes(a);
      const standardB = standardCategories.includes(b);
      if (standardA !== standardB) return standardA ? -1 : 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });
}

async function loadAll() {
  const [meet, athletes, events, registrations, results, dashboard, exportRows, reports] = await Promise.all([
    api("/meet"),
    api("/athletes"),
    api("/events"),
    api("/registrations"),
    api("/results"),
    api("/dashboard"),
    api("/results-export"),
    api("/reports")
  ]);

  Object.assign(state, { meet, athletes, events, registrations, results, dashboard, exportRows, reports });
  if (!state.currentRankingEvent && events[0]) state.currentRankingEvent = events[0].id;
  if (!state.organizerEventId || !events.some(event => event.id === state.organizerEventId)) {
    state.organizerEventId = events[0]?.id || "";
  }
  render();
}

function renderMeet() {
  $("#meetName").value = state.meet.name || "";
  $("#meetVenue").value = state.meet.venue || "";
  $("#meetDate").value = state.meet.date || "";
  $("#sidebarMeetName").textContent = state.meet.name || "Meet setup";
  $("#sidebarMeetDate").textContent = [state.meet.venue, state.meet.date].filter(Boolean).join(" - ") || "Ready for entries";
}

function renderDashboard() {
  const totals = state.dashboard?.totals || {};
  const scored = totals.completedEvents || 0;
  const eventTotal = totals.events || 0;
  const progress = eventTotal ? Math.round((scored / eventTotal) * 100) : 0;
  const leaders = state.dashboard?.leaderboard || [];

  $("#heroMeet").textContent = state.meet.name || "Athletic Meet";
  $("#heroVenueDate").textContent = [state.meet.venue, state.meet.date].filter(Boolean).join(" - ") || "Venue and date pending";
  $("#meetProgressLabel").textContent = `${progress}% events scored`;
  $("#meetProgressBar").style.width = `${progress}%`;
  $("#leaderTeam").textContent = leaders[0] ? `${leaders[0].team} leads with ${leaders[0].points} pts` : "No leader yet";

  $("#statAthletes").textContent = totals.athletes || 0;
  $("#statEvents").textContent = totals.events || 0;
  $("#statEntries").textContent = totals.registrations || 0;
  $("#statCompleted").textContent = scored;

  const nextEvent = state.events.find(event => eventStatus(event) !== "Scored");
  $("#nextEventName").textContent = nextEvent ? `${nextEvent.name} - ${eventEntryCount(nextEvent.id)} entries` : "All scored events are complete";

  $("#eventCards").innerHTML = state.events.slice(0, 8).map(event => {
    const entries = eventEntryCount(event.id);
    const results = eventResultCount(event.id);
    const status = eventStatus(event);
    return `
      <article class="event-card ${status.toLowerCase()}">
        <div>
          <span>${event.category}</span>
          <strong>${event.name}</strong>
        </div>
        <p>${entries} entries - ${results} results</p>
        <b>${status}</b>
      </article>
    `;
  }).join("") || `<div class="empty-state">No events created yet.</div>`;

  const topPoints = Math.max(...leaders.map(row => row.points), 1);
  $("#teamBars").innerHTML = leaders.slice(0, 5).map(row => `
    <div class="team-bar-row">
      <span><i style="background:${teamColor(row.team)}"></i>${row.team}</span>
      <div><b style="width:${Math.max(4, (row.points / topPoints) * 100)}%; background:${teamColor(row.team)}"></b></div>
      <strong>${row.points}</strong>
    </div>
  `).join("") || `<div class="empty-state">No team points yet.</div>`;

  $("#leaderboardBody").innerHTML = (state.dashboard?.leaderboard || []).map((row, index) => `
    <tr>
      <td><span class="rank-pill">${index + 1}</span><span class="team-dot" style="background:${teamColor(row.team)}"></span>${row.team}</td>
      <td><strong>${row.points}</strong></td>
      <td>${row.gold}</td>
      <td>${row.silver}</td>
      <td>${row.bronze}</td>
    </tr>
  `).join("") || emptyRow(5, "No teams yet");

  $("#recentResults").innerHTML = (state.dashboard?.recentResults || []).map(result => `
    <article class="result-item">
      <div>
        <strong>${result.athlete?.name || "Unknown athlete"}</strong>
        <span>${result.event?.name || "Unknown event"} - ${result.athlete?.team || ""}</span>
      </div>
      <b>${result.mark} ${result.event?.unit || ""}</b>
    </article>
  `).join("") || `<div class="empty-state">No results entered yet.</div>`;
}

function renderExportPreview() {
  $("#exportPreviewBody").innerHTML = state.exportRows.slice(0, 20).map(row => `
    <tr>
      <td>${row.Meet}</td>
      <td>${row.Event}</td>
      <td><span class="rank-pill">${row.Position}</span></td>
      <td><strong>${row["AFI UID / Bib"]}</strong></td>
      <td>${row.Athlete}</td>
      <td>${row.Mark}</td>
      <td>${row.Medal || "-"}</td>
    </tr>
  `).join("") || emptyRow(7, "No result rows available yet");
}

function renderAthletes() {
  const query = ($("#athleteSearch")?.value || "").toLowerCase();
  const athletes = state.athletes.filter(athlete =>
    [athlete.bib, athlete.name, athlete.gender, athlete.team].join(" ").toLowerCase().includes(query)
  );

  $("#athletesBody").innerHTML = athletes.map(athlete => `
    <tr>
      <td><strong>${athlete.bib}</strong></td>
      <td>${athlete.name}</td>
      <td>${athlete.age || "-"}</td>
      <td>${athlete.gender}</td>
      <td><span class="team-dot" style="background:${teamColor(athlete.team)}"></span>${athlete.team}</td>
      <td><button class="link-button danger" data-delete="athletes" data-id="${athlete.id}">Delete</button></td>
    </tr>
  `).join("") || emptyRow(6, "No athletes found");
}

function renderEvents() {
  $("#eventsBody").innerHTML = state.events.map(event => `
    <tr>
      <td><strong>${event.name}</strong></td>
      <td>${event.category}</td>
      <td>${event.type}</td>
      <td>${event.lowerIsBetter ? "Lowest wins" : "Highest wins"}</td>
      <td><button class="link-button danger" data-delete="events" data-id="${event.id}">Delete</button></td>
    </tr>
  `).join("") || emptyRow(5, "No events created");
}

function renderEventEntriesPreview() {
  const eventId = $("#eventEntryMenu").value || state.events[0]?.id;
  const event = eventById(eventId);
  const athletes = registeredAthletesFor(eventId);

  $("#eventEntriesPreviewBody").innerHTML = athletes.map(athlete => `
    <tr>
      <td><strong>${athlete.bib}</strong></td>
      <td>${athlete.afiUid || "-"}</td>
      <td>${athlete.name}</td>
      <td>${athlete.category || event?.category || "-"}</td>
      <td>${athlete.gender || "-"}</td>
      <td><span class="team-dot" style="background:${teamColor(athlete.team)}"></span>${athlete.district || athlete.team}</td>
    </tr>
  `).join("") || emptyRow(6, event ? "No athletes registered in this event" : "Create an event first");
}

function renderEntries() {
  $("#entriesBody").innerHTML = state.registrations.map(reg => {
    const athlete = athleteById(reg.athleteId);
    const event = eventById(reg.eventId);
    if (!athlete || !event) return "";
    return `
      <tr>
        <td><strong>${athlete.bib}</strong></td>
        <td>${athlete.name}</td>
        <td>${event.name}</td>
        <td>${athlete.team}</td>
        <td><button class="link-button danger" data-delete="registrations" data-id="${reg.id}">Delete</button></td>
      </tr>
    `;
  }).join("") || emptyRow(5, "No entries yet");
}

function renderSelects() {
  const athleteOptions = optionList(state.athletes, athlete => `${athlete.bib} - ${athlete.name} (${athlete.team})`);
  const eventOptions = optionList(state.events, event => `${event.name} - ${event.category}`);
  const selectedEventEntry = $("#eventEntryMenu")?.value || state.events[0]?.id || "";
  const eventNameValue = $("#eventNameSelect")?.value || "";
  const eventCategoryValue = $("#eventCategorySelect")?.value || "";

  $("#eventNameSelect").innerHTML = `<option value="">Select athletic event</option>` +
    eventNameOptions().map(name => `<option value="${name}">${name}</option>`).join("");
  $("#eventCategorySelect").innerHTML = categoryOptions().map(category =>
    `<option value="${category}">${category}</option>`
  ).join("");
  $("#entryAthlete").innerHTML = athleteOptions;
  $("#entryEvent").innerHTML = eventOptions;
  $("#resultEvent").innerHTML = eventOptions;
  $("#rankingEvent").innerHTML = eventOptions;
  $("#scorePreviewEvent").innerHTML = eventOptions;
  $("#resultPreviewEvent").innerHTML = eventOptions;
  $("#eventEntryMenu").innerHTML = eventOptions;
  $("#organizerEvent").innerHTML = eventOptions;

  if (eventNameValue && eventNameOptions().includes(eventNameValue)) {
    $("#eventNameSelect").value = eventNameValue;
  }
  if (eventCategoryValue && categoryOptions().includes(eventCategoryValue)) {
    $("#eventCategorySelect").value = eventCategoryValue;
  }
  if (selectedEventEntry) {
    $("#eventEntryMenu").value = selectedEventEntry;
  }
  if (state.organizerEventId) {
    $("#organizerEvent").value = state.organizerEventId;
  }

  if (state.currentRankingEvent) {
    $("#rankingEvent").value = state.currentRankingEvent;
    $("#resultEvent").value = state.currentRankingEvent;
    $("#scorePreviewEvent").value = state.currentRankingEvent;
    $("#resultPreviewEvent").value = state.currentRankingEvent;
  }

  renderResultAthletes();
  renderEventEntriesPreview();
  renderOrganizer();
}

async function renderOrganizer() {
  const eventId = $("#organizerEvent").value || state.organizerEventId || state.events[0]?.id;
  const event = eventById(eventId);
  if (!event) {
    $("#organizerEventTitle").textContent = "No event selected";
    $("#organizerEventMeta").textContent = "Create an event first";
    $("#organizerEntriesCount").textContent = "0";
    $("#organizerResultsCount").textContent = "0";
    $("#organizerRemainingCount").textContent = "0";
    $("#organizerAthlete").innerHTML = "";
    $("#organizerEntriesBody").innerHTML = emptyRow(5, "No event available");
    $("#organizerRankingsBody").innerHTML = emptyRow(5, "No event available");
    return;
  }

  state.organizerEventId = eventId;
  localStorage.setItem("organizerEventId", eventId);

  const entries = registeredAthletesFor(eventId)
    .sort((a, b) => String(a.bib).localeCompare(String(b.bib), undefined, { numeric: true }));
  const pending = entries.filter(athlete => !resultFor(eventId, athlete.id));
  const resultCount = eventResultCount(eventId);
  const status = eventStatus(event);

  $("#organizerStatus").textContent = status;
  $("#organizerStatus").className = `status-chip ${status.toLowerCase()}`;
  $("#organizerEventTitle").textContent = event.name;
  $("#organizerEventMeta").textContent = `${event.category} - ${event.type} - ${event.unit} - ${event.lowerIsBetter ? "lowest mark wins" : "highest mark wins"}`;
  $("#organizerEntriesCount").textContent = entries.length;
  $("#organizerResultsCount").textContent = resultCount;
  $("#organizerRemainingCount").textContent = Math.max(0, entries.length - resultCount);

  $("#organizerAthlete").innerHTML = optionList(pending.length ? pending : entries, athlete =>
    `${athlete.bib} - ${athlete.name} (${athlete.team})`
  );

  $("#organizerEntriesBody").innerHTML = entries.map((athlete, index) => {
    const result = resultFor(eventId, athlete.id);
    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${athlete.bib}</strong></td>
        <td>${athlete.name}</td>
        <td><span class="team-dot" style="background:${teamColor(athlete.team)}"></span>${athlete.team}</td>
        <td>${result ? `${result.mark} ${event.unit}` : `<button class="link-button" data-fill-athlete="${athlete.id}">Enter</button>`}</td>
      </tr>
    `;
  }).join("") || emptyRow(5, "No athletes registered in this event");

  const rankings = await api(`/events/${eventId}/results`);
  $("#organizerRankingsBody").innerHTML = rankings.map(row => `
    <tr>
      <td><span class="rank-pill">${row.rank}</span></td>
      <td><strong>${row.athlete.bib}</strong></td>
      <td>${row.athlete.name}</td>
      <td>${row.mark} ${event.unit}</td>
      <td><strong>${row.points}</strong></td>
    </tr>
  `).join("") || emptyRow(5, "No results entered yet");
}

function renderResultAthletes() {
  const eventId = $("#resultEvent").value || state.events[0]?.id;
  const athletes = registeredAthletesFor(eventId);
  $("#resultAthlete").innerHTML = optionList(athletes.length ? athletes : state.athletes, athlete =>
    `${athlete.bib} - ${athlete.name}`
  );
}

async function renderRankings() {
  const eventId = $("#rankingEvent").value || state.currentRankingEvent || state.events[0]?.id;
  if (!eventId) {
    $("#rankingsBody").innerHTML = emptyRow(6, "Create an event first");
    return;
  }

  state.currentRankingEvent = eventId;
  const rankings = await api(`/events/${eventId}/results`);
  const event = eventById(eventId);
  $("#rankingsBody").innerHTML = rankings.map(row => `
    <tr>
      <td><span class="rank-pill">${row.rank}</span></td>
      <td><strong>${row.athlete.bib}</strong></td>
      <td>${row.athlete.name}</td>
      <td>${row.athlete.team}</td>
      <td>${row.mark} ${event?.unit || ""}</td>
      <td><strong>${row.points}</strong></td>
    </tr>
  `).join("") || emptyRow(6, "No results for this event");
}

function emptyRow(cols, message) {
  return `<tr><td colspan="${cols}" class="empty-table">${message}</td></tr>`;
}

function renderReportPreviews() {
  const scoreEventId = $("#scorePreviewEvent").value || state.events[0]?.id;
  const resultEventId = $("#resultPreviewEvent").value || state.events[0]?.id;
  const scoreSheet = state.reports?.scoreSheets?.find(sheet => sheet.event.id === scoreEventId);
  const resultSheet = state.reports?.resultSheets?.find(sheet => sheet.event.id === resultEventId);

  $("#scorePreviewBody").innerHTML = (scoreSheet?.rows || []).map(row => `
    <tr>
      <td>${row.lane}</td>
      <td><strong>${row.bib}</strong></td>
      <td>${row.athlete}</td>
      <td>${row.category}</td>
      <td>${row.team}</td>
      <td class="blank-cell"></td>
      <td class="blank-cell"></td>
    </tr>
  `).join("") || emptyRow(7, "No entries for this score sheet");

  $("#resultPreviewBody").innerHTML = (resultSheet?.rows || []).map(row => `
    <tr>
      <td><span class="rank-pill">${row.position}</span></td>
      <td><strong>${row.bib}</strong></td>
      <td>${row.athlete}</td>
      <td>${row.mark}</td>
      <td>${row.medal || "-"}</td>
      <td><strong>${row.points}</strong></td>
    </tr>
  `).join("") || emptyRow(6, "No results for this result sheet");
}

function downloadFile(filename, text, type = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resultNarrative(sheet) {
  const winner = sheet.rows[0];
  if (!winner) return "No official result has been recorded for this event yet.";
  const second = sheet.rows[1];
  const third = sheet.rows[2];
  const medalLine = [
    `${winner.athlete} of ${winner.team} claimed gold with ${winner.mark}`,
    second ? `${second.athlete} took silver with ${second.mark}` : "",
    third ? `${third.athlete} earned bronze with ${third.mark}` : ""
  ].filter(Boolean).join(", ");
  return `${medalLine}. The result sheet records the official position, athlete, institution or district, mark, medal and points for the event.`;
}

function reportHtml(title, sheets, mode) {
  const css = `
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 22px; }
      .sheet { break-after: page; margin-bottom: 28px; border: 1px solid #111; padding: 18px; }
      .sheet:last-child { break-after: auto; }
      .center { text-align: center; }
      .report-title { font-size: 18px; font-weight: 700; letter-spacing: 0.02em; }
      .result-title { font-size: 22px; font-weight: 700; margin-top: 6px; }
      .meta { display: flex; justify-content: space-between; gap: 16px; margin: 18px 0 10px; font-size: 13px; }
      .submeta { margin: 4px 0 12px; font-size: 13px; }
      .section-label { margin: 18px 0 6px; font-weight: 700; text-align: center; }
      h1, h2, p { margin: 0; }
      h1 { font-size: 24px; }
      h2 { font-size: 18px; }
      p { font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
      th, td { border: 1px solid #333; padding: 7px; text-align: left; height: 28px; }
      th { background: #eee; font-weight: 700; }
      .match-report { margin-top: 18px; line-height: 1.5; font-size: 13px; }
      .match-report h3 { margin: 0 0 8px; font-size: 16px; }
      .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 34px; font-size: 12px; }
      .sign div { border-top: 1px solid #111; padding-top: 6px; text-align: center; }
      @media print { body { margin: 12mm; } button { display: none; } }
    </style>`;

  const body = sheets.map(sheet => {
    if (mode === "score") {
      const entryRows = sheet.rows.map(row => [row.lane, row.athlete, row.team, row.bib || row.afiUid || "", ""]);
      const finalRows = [1, 2, 3, 4, 5, 6, 7, 8].map(position => [position, "", "", ""]);
      return `
        <section class="sheet">
          <div class="center">
            <div class="report-title">${sheet.meet.name}</div>
            <div class="result-title">RESULT SHEET</div>
          </div>
          <div class="meta">
            <strong>EVENT: ${sheet.event.name}</strong>
            <strong>GENDER: ${sheet.event.category || "Men / Women"}</strong>
          </div>
          <div class="submeta">Heat / Semi-Final / Final</div>
          <table>
            <thead><tr><th>Sr. No.</th><th>Name</th><th>Faculty</th><th>Contact</th><th>Performance</th></tr></thead>
            <tbody>${entryRows.map(row => `<tr>${row.map(cell => `<td>${cell ?? ""}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="5">No entries</td></tr>`}</tbody>
          </table>
          <div class="section-label">FINAL RESULT</div>
          <table>
            <thead><tr><th>Position</th><th>Name</th><th>Faculty</th><th>Performance</th></tr></thead>
            <tbody>${finalRows.map(row => `<tr>${row.map(cell => `<td>${cell ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
          <div class="sign">
            <div>Chief Referee</div>
            <div>Chief Time Keeper</div>
            <div>Chief Judge</div>
          </div>
        </section>
      `;
    }

    const rows = sheet.rows.map(row => [
      row.position,
      row.athlete,
      row.team,
      row.mark,
      String(row.medal || "").toLowerCase(),
      row.points
    ]);

    return `
      <section class="sheet">
        <h1>${sheet.event.name}</h1>
        <div class="submeta">${sheet.event.name} - ${sheet.event.type} - ${sheet.event.category}</div>
        <div class="submeta">Venue: ${sheet.meet.venue || "-"} &nbsp;&nbsp; Scheduled: ${sheet.meet.date || "-"}</div>
        <table>
          <thead><tr><th>#</th><th>Athlete</th><th>University</th><th>Mark</th><th>Medal</th><th>Pts</th></tr></thead>
          <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell ?? ""}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="6">No data</td></tr>`}</tbody>
        </table>
        <div class="match-report">
          <h3>Match Report</h3>
          <p><strong>${sheet.event.name} Official Result</strong></p>
          <p>${resultNarrative(sheet)}</p>
        </div>
      </section>
    `;
  }).join("");

  return `<!doctype html><html><head><title>${title}</title>${css}</head><body>${body}<script>window.print()</script></body></html>`;
}

function printReport(title, sheets, mode) {
  const win = window.open("", "_blank");
  win.document.write(reportHtml(title, sheets, mode));
  win.document.close();
}

function render() {
  renderMeet();
  renderDashboard();
  renderAthletes();
  renderEvents();
  renderEntries();
  renderSelects();
  renderRankings();
  renderExportPreview();
  renderReportPreviews();
}

function bindTabs() {
  $$(".nav-tabs button").forEach(button => {
    button.addEventListener("click", () => {
      $$(".nav-tabs button").forEach(item => item.classList.remove("active"));
      $$(".tab-panel").forEach(panel => panel.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.tab}`).classList.add("active");
    });
  });
}

function bindForms() {
  $("#meetForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      await api("/meet", { method: "PUT", body: JSON.stringify(formData(event.currentTarget)) });
      toast("Meet details saved");
      await loadAll();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  $("#athleteForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      await api("/athletes", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
      event.currentTarget.reset();
      toast("Athlete added");
      await loadAll();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  $("#eventForm").addEventListener("submit", async event => {
    event.preventDefault();
    const data = formData(event.currentTarget);
    data.lowerIsBetter = event.currentTarget.lowerIsBetter.checked;
    try {
      await api("/events", { method: "POST", body: JSON.stringify(data) });
      event.currentTarget.reset();
      event.currentTarget.lowerIsBetter.checked = true;
      $("#eventUnit").value = "seconds";
      toast("Event added");
      await loadAll();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  $("#entryForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      await api("/registrations", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
      toast("Entry registered");
      await loadAll();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  $("#resultForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      await api("/results", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
      event.currentTarget.mark.value = "";
      event.currentTarget.note.value = "";
      toast("Result saved");
      await loadAll();
    } catch (error) {
      toast(error.message, "error");
    }
  });
}

function bindActions() {
  document.body.addEventListener("click", async event => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;
    const resource = button.dataset.delete;
    const id = button.dataset.id;
    try {
      await api(`/${resource}/${id}`, { method: "DELETE" });
      toast("Deleted");
      await loadAll();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  $("#refreshBtn").addEventListener("click", loadAll);
  $("#athleteSearch").addEventListener("input", renderAthletes);
  $("#rankingEvent").addEventListener("change", renderRankings);
  $("#resultEvent").addEventListener("change", renderResultAthletes);
  $("#eventEntryMenu").addEventListener("change", renderEventEntriesPreview);
  $("#organizerEvent").addEventListener("change", renderOrganizer);
  $("#scorePreviewEvent").addEventListener("change", renderReportPreviews);
  $("#resultPreviewEvent").addEventListener("change", renderReportPreviews);
  $("#eventType").addEventListener("change", event => {
    const track = event.target.value === "track";
    $("#eventUnit").value = track ? "seconds" : "meters";
    $("#eventForm").lowerIsBetter.checked = track;
  });

  $("#themeToggle").addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  document.body.addEventListener("click", event => {
    const button = event.target.closest("[data-fill-athlete]");
    if (!button) return;
    $("#organizerAthlete").value = button.dataset.fillAthlete;
    $("#organizerResultForm").mark.focus();
  });

  $("#importCsvBtn").addEventListener("click", async () => {
    const file = $("#athleteCsvFile").files[0];
    if (!file) {
      toast("Choose an athletes CSV first", "error");
      return;
    }

    try {
      const rows = parseCsv(await file.text());
      const result = await api("/import-athletes", { method: "POST", body: JSON.stringify({ rows }) });
      const summary = result.summary;
      $("#importSummary").innerHTML = `
        Imported ${summary.importedAthletes} athletes, updated ${summary.updatedAthletes},
        created ${summary.createdEvents} events, and added ${summary.createdEntries} entries.
        ${summary.skippedRows ? `${summary.skippedRows} rows skipped.` : ""}
      `;
      toast("CSV imported");
      await loadAll();
    } catch (error) {
      toast(error.message, "error");
    }
  });

  $("#downloadResultsBtn").addEventListener("click", () => {
    downloadFile(`${(state.meet.name || "meet").replace(/[^a-z0-9]+/gi, "_")}_results.csv`, toCsv(state.exportRows));
  });

  $("#reloadReportsBtn").addEventListener("click", loadAll);

  $("#printScoreSheetsBtn").addEventListener("click", () => {
    printReport("Score Sheet", state.reports?.scoreSheets || [], "score");
  });

  $("#printResultSheetsBtn").addEventListener("click", () => {
    printReport("Result Sheet", state.reports?.resultSheets || [], "result");
  });

  $("#downloadTeamSummaryBtn").addEventListener("click", () => {
    const rows = (state.reports?.teamSummary || []).map((row, index) => ({
      Rank: index + 1,
      Team: row.team,
      Points: row.points,
      Gold: row.gold,
      Silver: row.silver,
      Bronze: row.bronze,
      Athletes: row.athletes
    }));
    downloadFile("team_summary.csv", rowsToCsv(rows, ["Rank", "Team", "Points", "Gold", "Silver", "Bronze", "Athletes"]));
  });

  $("#downloadParticipationBtn").addEventListener("click", () => {
    const rows = state.reports?.participation || [];
    downloadFile("participation_report.csv", rowsToCsv(rows, [
      "bib", "afiUid", "athlete", "category", "gender", "team", "district", "events", "entryCount", "coachName", "coachPhone"
    ]));
  });
}

$("#organizerResultForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = formData(event.currentTarget);
  data.eventId = state.organizerEventId || $("#organizerEvent").value;
  try {
    await api("/results", { method: "POST", body: JSON.stringify(data) });
    event.currentTarget.mark.value = "";
    event.currentTarget.note.value = "";
    toast("Organizer result saved");
    await loadAll();
  } catch (error) {
    toast(error.message, "error");
  }
});

bindTabs();
bindForms();
bindActions();
applyTheme(localStorage.getItem("meetTheme") || "dark");
loadAll().catch(error => toast(error.message, "error"));
