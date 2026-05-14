const $ = selector => document.querySelector(selector);

async function api(path) {
  const response = await fetch(`/api${path}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function emptyRow(cols, message) {
  return `<tr><td colspan="${cols}" class="empty">${message}</td></tr>`;
}

function bestScoreSheet(reports) {
  return reports.scoreSheets.find(sheet => sheet.rows.length > 0) || reports.scoreSheets[0];
}

function bestResultSheet(reports) {
  return reports.resultSheets.find(sheet => sheet.rows.length > 0) || reports.resultSheets[0];
}

function resultNarrative(sheet) {
  const winner = sheet?.rows?.[0];
  if (!winner) return "No official result has been recorded for this event yet.";
  const second = sheet.rows[1];
  const third = sheet.rows[2];
  return [
    `${winner.athlete} of ${winner.team} claimed gold with ${winner.mark}.`,
    second ? `${second.athlete} took silver with ${second.mark}.` : "",
    third ? `${third.athlete} earned bronze with ${third.mark}.` : "",
    "The report follows the reference result sheet format with athlete, university, mark, medal and points."
  ].filter(Boolean).join(" ");
}

async function render() {
  const [dashboard, reports] = await Promise.all([api("/dashboard"), api("/reports")]);
  const totals = dashboard.totals || {};

  $("#meetName").textContent = reports.meet.name || "Athletic Meet Report";
  $("#meetMeta").textContent = [reports.meet.venue, reports.meet.date].filter(Boolean).join(" - ") || "Venue - Date";
  $("#totalAthletes").textContent = totals.athletes || 0;
  $("#totalEvents").textContent = totals.events || 0;
  $("#totalEntries").textContent = totals.registrations || 0;
  $("#totalScored").textContent = totals.completedEvents || 0;

  $("#teamSummaryBody").innerHTML = reports.teamSummary.slice(0, 12).map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${row.team}</td>
      <td><strong>${row.points}</strong></td>
      <td>${row.gold}</td>
      <td>${row.silver}</td>
      <td>${row.bronze}</td>
      <td>${row.athletes}</td>
    </tr>
  `).join("") || emptyRow(7, "No team data available");

  const scoreSheet = bestScoreSheet(reports);
  if (scoreSheet) {
    $("#scoreSheetTitle").textContent = `Score Sheet - ${scoreSheet.event.name}`;
    $("#scoreSheetMeta").textContent = `${scoreSheet.event.category} - ${scoreSheet.event.type} - ${scoreSheet.event.unit}`;
    $("#scoreMeetName").textContent = scoreSheet.meet.name || "ATHLETICS SELECTION TRIAL";
    $("#scoreEventLine").textContent = `EVENT: ${scoreSheet.event.name}`;
    $("#scoreGenderLine").textContent = `GENDER: ${scoreSheet.event.category || "Men / Women"}`;
    $("#scoreSheetBody").innerHTML = scoreSheet.rows.slice(0, 18).map(row => `
      <tr>
        <td>${row.lane}</td>
        <td>${row.athlete}</td>
        <td>${row.team}</td>
        <td>${row.bib || row.afiUid || ""}</td>
        <td></td>
      </tr>
    `).join("") || emptyRow(5, "No entries available");
    $("#scoreFinalBody").innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map(position => `
      <tr><td>${position}</td><td></td><td></td><td></td></tr>
    `).join("");
  }

  const resultSheet = bestResultSheet(reports);
  if (resultSheet) {
    $("#resultSheetTitle").textContent = `Result Sheet - ${resultSheet.event.name}`;
    $("#resultSheetMeta").textContent = `${resultSheet.event.name} - ${resultSheet.event.type} - ${resultSheet.event.category}`;
    $("#resultSheetBody").innerHTML = resultSheet.rows.map(row => `
      <tr>
        <td>${row.position}</td>
        <td>${row.athlete}</td>
        <td>${row.team}</td>
        <td>${row.mark}</td>
        <td>${String(row.medal || "-").toLowerCase()}</td>
        <td><strong>${row.points}</strong></td>
      </tr>
    `).join("") || emptyRow(6, "No results entered yet");
    $("#matchHeadline").textContent = `${resultSheet.event.name} Official Result`;
    $("#matchBody").textContent = resultNarrative(resultSheet);
  }

  $("#participationBody").innerHTML = reports.participation.slice(0, 25).map(row => `
    <tr>
      <td>${row.afiUid || row.bib}</td>
      <td>${row.athlete}</td>
      <td>${row.category || "-"}</td>
      <td>${row.gender || "-"}</td>
      <td>${row.district || row.team}</td>
      <td>${row.events || "-"}</td>
    </tr>
  `).join("") || emptyRow(6, "No participation data available");
}

render().catch(error => {
  document.body.innerHTML = `<main class="report-book"><section class="report-section"><h1>${error.message}</h1></section></main>`;
});
