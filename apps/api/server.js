const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5000;
const ORGANIZER_USER = process.env.ORGANIZER_USER || "organizer";
const ORGANIZER_PASSWORD = process.env.ORGANIZER_PASSWORD || "meetdesk2026";
const ORGANIZER_SETUP_KEY = process.env.ORGANIZER_SETUP_KEY || "SETUP2026";
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "meet-data.json");
const PUBLIC_DIR = path.join(__dirname, "..", "web", "public");

const POINTS = [10, 8, 6, 5, 4, 3, 2, 1];

const seedData = {
  meet: {
    name: "Inter House Athletic Meet",
    venue: "Main Stadium",
    date: new Date().toISOString().slice(0, 10)
  },
  athletes: [
    { id: "ath_1001", bib: "101", name: "Aarav Sharma", age: 16, gender: "Boys", team: "Red House" },
    { id: "ath_1002", bib: "102", name: "Vihaan Patel", age: 15, gender: "Boys", team: "Blue House" },
    { id: "ath_1003", bib: "201", name: "Anaya Gupta", age: 16, gender: "Girls", team: "Green House" },
    { id: "ath_1004", bib: "202", name: "Sara Khan", age: 15, gender: "Girls", team: "Yellow House" }
  ],
  events: [
    { id: "evt_1001", name: "100m Sprint", category: "Boys", type: "track", unit: "seconds", lowerIsBetter: true, status: "scheduled" },
    { id: "evt_1002", name: "200m Sprint", category: "Girls", type: "track", unit: "seconds", lowerIsBetter: true, status: "scheduled" },
    { id: "evt_1003", name: "Long Jump", category: "Open", type: "field", unit: "meters", lowerIsBetter: false, status: "scheduled" }
  ],
  registrations: [
    { id: "reg_1001", athleteId: "ath_1001", eventId: "evt_1001" },
    { id: "reg_1002", athleteId: "ath_1002", eventId: "evt_1001" },
    { id: "reg_1003", athleteId: "ath_1003", eventId: "evt_1002" },
    { id: "reg_1004", athleteId: "ath_1004", eventId: "evt_1002" },
    { id: "reg_1005", athleteId: "ath_1001", eventId: "evt_1003" },
    { id: "reg_1006", athleteId: "ath_1003", eventId: "evt_1003" }
  ],
  results: [
    { id: "res_1001", athleteId: "ath_1001", eventId: "evt_1001", mark: 11.84, note: "" },
    { id: "res_1002", athleteId: "ath_1002", eventId: "evt_1001", mark: 12.11, note: "" },
    { id: "res_1003", athleteId: "ath_1003", eventId: "evt_1003", mark: 5.21, note: "" }
  ]
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) writeDb(seedData);
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function backupDb() {
  ensureDb();
  const backupDir = path.join(DATA_DIR, "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `meet-data-${stamp}.json`);
  fs.copyFileSync(DB_FILE, backupFile);
  return backupFile;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString("hex")}`;
}

function accessCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function hashSecret(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function ensureAuthStore(db) {
  if (!db.auth) db.auth = {};
  if (!Array.isArray(db.auth.organizers)) db.auth.organizers = [];
  return db.auth;
}

function organizerMatches(db, username, password) {
  if (username === ORGANIZER_USER && password === ORGANIZER_PASSWORD) return true;
  const auth = ensureAuthStore(db);
  const passwordHash = hashSecret(password);
  return auth.organizers.some(user =>
    normalizeText(user.username).toLowerCase() === username.toLowerCase() &&
    user.passwordHash === passwordHash
  );
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRowValue(row, label) {
  const target = normalizeKey(label);
  const key = Object.keys(row).find(item => normalizeKey(item) === target);
  return key ? normalizeText(row[key]) : "";
}

function genderLabel(value) {
  const gender = normalizeText(value).toLowerCase();
  if (gender.startsWith("f")) return "Girls";
  if (gender.startsWith("m")) return "Boys";
  return normalizeText(value) || "Open";
}

function eventLowerIsBetter(eventName) {
  const name = normalizeText(eventName).toLowerCase();
  return !["jump", "throw", "put", "vault"].some(token => name.includes(token));
}

function eventUnit(eventName) {
  const name = normalizeText(eventName).toLowerCase();
  if (["jump", "throw", "put", "vault"].some(token => name.includes(token))) return "meters";
  return "seconds";
}

function ensureEvent(db, name, category, gender) {
  const eventName = normalizeText(name);
  if (!eventName) return null;
  const eventCategory = normalizeText(category) || genderLabel(gender);
  const existing = db.events.find(event =>
    event.name.toLowerCase() === eventName.toLowerCase() &&
    event.category.toLowerCase() === eventCategory.toLowerCase()
  );
  if (existing) return existing;

  const event = {
    id: id("evt"),
    name: eventName,
    category: eventCategory,
    type: eventUnit(eventName) === "seconds" ? "track" : "field",
    unit: eventUnit(eventName),
    lowerIsBetter: eventLowerIsBetter(eventName),
    status: "scheduled"
  };
  db.events.push(event);
  return event;
}

function ensureRegistration(db, athleteId, eventId) {
  if (!athleteId || !eventId) return false;
  if (db.registrations.some(reg => reg.athleteId === athleteId && reg.eventId === eventId)) return false;
  db.registrations.push({ id: id("reg"), athleteId, eventId });
  return true;
}

function ensureAthleteCredentials(db) {
  let generated = 0;
  for (const athlete of db.athletes) {
    if (!athlete.accessCode) {
      athlete.accessCode = accessCode();
      generated += 1;
    }
  }
  return generated;
}

function athletePortalData(db, athlete) {
  const entries = db.registrations
    .filter(reg => reg.athleteId === athlete.id)
    .map(reg => {
      const event = db.events.find(item => item.id === reg.eventId);
      const result = db.results.find(item => item.athleteId === athlete.id && item.eventId === reg.eventId);
      const ranked = event ? rankResults(db, event.id).find(row => row.athlete.id === athlete.id) : null;
      return {
        event,
        result,
        rank: ranked?.rank || "",
        points: ranked?.points || 0,
        medal: ranked?.medal || ""
      };
    })
    .filter(row => row.event);

  return {
    meet: db.meet,
    athlete,
    entries
  };
}

function importAthleteRows(db, rows) {
  const summary = {
    importedAthletes: 0,
    updatedAthletes: 0,
    createdEvents: 0,
    createdEntries: 0,
    skippedRows: 0
  };

  for (const row of rows) {
    const fullName = getRowValue(row, "Full Name") ||
      [getRowValue(row, "First Name"), getRowValue(row, "Last Name")].filter(Boolean).join(" ");
    const afiUid = getRowValue(row, "AFI UID");
    const bib = afiUid || getRowValue(row, "Bib") || getRowValue(row, "AFI UID / Bib");
    const team = getRowValue(row, "District") || getRowValue(row, "University") || getRowValue(row, "Team") || "Unassigned";

    if (!fullName || !bib) {
      summary.skippedRows += 1;
      continue;
    }

    let athlete = db.athletes.find(item =>
      normalizeText(item.afiUid).toLowerCase() === afiUid.toLowerCase() ||
      item.bib.toLowerCase() === bib.toLowerCase()
    );

    const athleteData = {
      bib,
      afiUid,
      name: fullName,
      age: "",
      gender: genderLabel(getRowValue(row, "Gender") || getRowValue(row, "Category")),
      team,
      category: getRowValue(row, "Category"),
      dob: getRowValue(row, "DOB"),
      district: getRowValue(row, "District"),
      email: getRowValue(row, "Email ID"),
      mobile: getRowValue(row, "Mobile Number"),
      coachName: getRowValue(row, "Coach Name"),
      coachPhone: getRowValue(row, "Coach Phone No"),
      photo: getRowValue(row, "photo")
    };

    if (athlete) {
      Object.assign(athlete, athleteData);
      summary.updatedAthletes += 1;
    } else {
      athlete = { id: id("ath"), accessCode: accessCode(), ...athleteData };
      db.athletes.push(athlete);
      summary.importedAthletes += 1;
    }

    const eventCountBefore = db.events.length;
    for (const eventName of [getRowValue(row, "Event 1"), getRowValue(row, "Event 2")]) {
      const event = ensureEvent(db, eventName, athlete.category, athlete.gender);
      if (event && ensureRegistration(db, athlete.id, event.id)) summary.createdEntries += 1;
    }
    summary.createdEvents += db.events.length - eventCountBefore;
  }

  return summary;
}

function rankResults(db, eventId) {
  const event = db.events.find(item => item.id === eventId);
  if (!event) return [];

  const sorted = db.results
    .filter(result => result.eventId === eventId && Number.isFinite(Number(result.mark)))
    .map(result => ({
      ...result,
      athlete: db.athletes.find(athlete => athlete.id === result.athleteId)
    }))
    .filter(result => result.athlete)
    .sort((a, b) => event.lowerIsBetter ? a.mark - b.mark : b.mark - a.mark);

  return sorted.map((result, index) => ({
    ...result,
    rank: index + 1,
    points: POINTS[index] || 0
  }));
}

function buildLeaderboard(db) {
  const teams = new Map();

  for (const athlete of db.athletes) {
    if (!teams.has(athlete.team)) {
      teams.set(athlete.team, { team: athlete.team, points: 0, gold: 0, silver: 0, bronze: 0, athletes: 0 });
    }
    teams.get(athlete.team).athletes += 1;
  }

  for (const event of db.events) {
    for (const result of rankResults(db, event.id)) {
      const row = teams.get(result.athlete.team) || {
        team: result.athlete.team,
        points: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        athletes: 0
      };
      row.points += result.points;
      if (result.rank === 1) row.gold += 1;
      if (result.rank === 2) row.silver += 1;
      if (result.rank === 3) row.bronze += 1;
      teams.set(row.team, row);
    }
  }

  return [...teams.values()].sort((a, b) =>
    b.points - a.points ||
    b.gold - a.gold ||
    b.silver - a.silver ||
    b.bronze - a.bronze ||
    a.team.localeCompare(b.team)
  );
}

function resultsExportRows(db) {
  return db.events.flatMap(event =>
    rankResults(db, event.id).map(result => ({
      Meet: db.meet.name,
      Event: event.name,
      Discipline: event.type,
      Category: event.category,
      Gender: result.athlete.gender || "",
      Date: db.meet.date,
      Position: result.rank,
      "AFI UID / Bib": result.athlete.afiUid || result.athlete.bib,
      Athlete: result.athlete.name,
      University: result.athlete.team,
      Mark: result.mark,
      Medal: result.rank === 1 ? "Gold" : result.rank === 2 ? "Silver" : result.rank === 3 ? "Bronze" : "",
      Points: result.points
    }))
  );
}

function eventEntryRows(db, eventId) {
  const event = db.events.find(item => item.id === eventId);
  if (!event) return [];
  return db.registrations
    .filter(reg => reg.eventId === eventId)
    .map(reg => db.athletes.find(athlete => athlete.id === reg.athleteId))
    .filter(Boolean)
    .sort((a, b) => String(a.bib).localeCompare(String(b.bib), undefined, { numeric: true }))
    .map((athlete, index) => ({
      lane: index + 1,
      bib: athlete.bib,
      afiUid: athlete.afiUid || "",
      athlete: athlete.name,
      category: athlete.category || event.category,
      gender: athlete.gender || "",
      team: athlete.team,
      district: athlete.district || athlete.team,
      mark: "",
      position: "",
      points: "",
      remarks: ""
    }));
}

function scoreSheetReport(db) {
  return db.events.map(event => ({
    meet: db.meet,
    event,
    rows: eventEntryRows(db, event.id)
  }));
}

function resultSheetReport(db) {
  return db.events.map(event => ({
    meet: db.meet,
    event,
    rows: rankResults(db, event.id).map(result => ({
      position: result.rank,
      bib: result.athlete.bib,
      afiUid: result.athlete.afiUid || "",
      athlete: result.athlete.name,
      category: result.athlete.category || event.category,
      gender: result.athlete.gender || "",
      team: result.athlete.team,
      mark: result.mark,
      medal: result.rank === 1 ? "Gold" : result.rank === 2 ? "Silver" : result.rank === 3 ? "Bronze" : "",
      points: result.points,
      remarks: result.note || ""
    }))
  }));
}

function participationReport(db) {
  return db.athletes
    .slice()
    .sort((a, b) => String(a.bib).localeCompare(String(b.bib), undefined, { numeric: true }))
    .map(athlete => {
      const entries = db.registrations
        .filter(reg => reg.athleteId === athlete.id)
        .map(reg => db.events.find(event => event.id === reg.eventId))
        .filter(Boolean);
      return {
        bib: athlete.bib,
        afiUid: athlete.afiUid || "",
        athlete: athlete.name,
        category: athlete.category || "",
        gender: athlete.gender || "",
        team: athlete.team,
        district: athlete.district || athlete.team,
        events: entries.map(event => event.name).join(", "),
        entryCount: entries.length,
        coachName: athlete.coachName || "",
        coachPhone: athlete.coachPhone || ""
      };
    });
}

function allReports(db) {
  return {
    meet: db.meet,
    scoreSheets: scoreSheetReport(db),
    resultSheets: resultSheetReport(db),
    teamSummary: buildLeaderboard(db),
    participation: participationReport(db),
    resultsExport: resultsExportRows(db)
  };
}

function dashboard(db) {
  const completedEvents = db.events.filter(event => rankResults(db, event.id).length > 0).length;
  return {
    meet: db.meet,
    totals: {
      athletes: db.athletes.length,
      events: db.events.length,
      registrations: db.registrations.length,
      completedEvents
    },
    leaderboard: buildLeaderboard(db),
    recentResults: db.results
      .slice(-6)
      .reverse()
      .map(result => ({
        ...result,
        athlete: db.athletes.find(athlete => athlete.id === result.athleteId),
        event: db.events.find(event => event.id === result.eventId)
      }))
  };
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml"
    };

    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(content);
  });
}

async function handleApi(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[1];
  const resourceId = parts[2];

  if (req.method === "GET" && resource === "dashboard") return sendJson(res, 200, dashboard(db));
  if (req.method === "GET" && resource === "leaderboard") return sendJson(res, 200, buildLeaderboard(db));
  if (req.method === "GET" && resource === "results-export") return sendJson(res, 200, resultsExportRows(db));
  if (req.method === "GET" && resource === "reports") return sendJson(res, 200, allReports(db));

  if (req.method === "POST" && resource === "organizer-login") {
    const body = await readBody(req);
    const username = normalizeText(body.username);
    const password = normalizeText(body.password);
    if (organizerMatches(db, username, password)) {
      return sendJson(res, 200, { role: "organizer", name: "Meet Organizer" });
    }
    return sendError(res, 401, "Invalid organizer credentials");
  }

  if (req.method === "POST" && resource === "organizer-register") {
    const body = await readBody(req);
    const setupKey = normalizeText(body.setupKey);
    const username = normalizeText(body.username);
    const password = normalizeText(body.password);
    if (setupKey !== ORGANIZER_SETUP_KEY) return sendError(res, 401, "Invalid setup key");
    if (username.length < 3) return sendError(res, 400, "Username must be at least 3 characters");
    if (password.length < 6) return sendError(res, 400, "Password must be at least 6 characters");
    const auth = ensureAuthStore(db);
    if (auth.organizers.some(user => normalizeText(user.username).toLowerCase() === username.toLowerCase())) {
      return sendError(res, 409, "Organizer username already exists");
    }
    auth.organizers.push({
      id: id("org"),
      username,
      passwordHash: hashSecret(password),
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return sendJson(res, 201, { message: "Organizer credential registered", username });
  }

  if (req.method === "POST" && resource === "athlete-credentials") {
    const generated = ensureAthleteCredentials(db);
    writeDb(db);
    return sendJson(res, 200, {
      message: generated ? `Generated ${generated} athlete access codes` : "All athletes already have access codes",
      generated,
      credentials: db.athletes.map(athlete => ({
        bib: athlete.bib,
        afiUID: athlete.afiUid || "",
        name: athlete.name,
        team: athlete.team,
        accessCode: athlete.accessCode
      }))
    });
  }

  if (req.method === "POST" && resource === "athlete-login") {
    const body = await readBody(req);
    const loginId = normalizeText(body.loginId).toLowerCase();
    const code = normalizeText(body.accessCode).toUpperCase();
    if (!loginId || !code) return sendError(res, 400, "Bib or AFI UID and access code are required");
    const athlete = db.athletes.find(item =>
      [item.bib, item.afiUid].filter(Boolean).some(value => normalizeText(value).toLowerCase() === loginId) &&
      normalizeText(item.accessCode).toUpperCase() === code
    );
    if (!athlete) return sendError(res, 401, "Invalid athlete credentials");
    return sendJson(res, 200, athletePortalData(db, athlete));
  }

  if (req.method === "POST" && resource === "athlete-register") {
    const body = await readBody(req);
    const loginId = normalizeText(body.loginId).toLowerCase();
    const mobile = normalizeText(body.mobile);
    if (!loginId) return sendError(res, 400, "Bib or AFI UID is required");
    const athlete = db.athletes.find(item =>
      [item.bib, item.afiUid].filter(Boolean).some(value => normalizeText(value).toLowerCase() === loginId)
    );
    if (!athlete) return sendError(res, 404, "Athlete not found");
    if (mobile && athlete.mobile && normalizeText(athlete.mobile) !== mobile) {
      return sendError(res, 401, "Mobile number does not match athlete record");
    }
    if (!athlete.accessCode) athlete.accessCode = accessCode();
    writeDb(db);
    return sendJson(res, 200, {
      message: "Athlete credential is ready",
      credential: {
        bib: athlete.bib,
        afiUID: athlete.afiUid || "",
        name: athlete.name,
        team: athlete.team,
        accessCode: athlete.accessCode
      }
    });
  }

  if (req.method === "POST" && resource === "clear-data") {
    const body = await readBody(req);
    if (body.confirm !== "CLEAR") return sendError(res, 400, "Type CLEAR to confirm data reset");
    const backupFile = backupDb();
    const before = {
      meet: db.meet,
      athletes: db.athletes.length,
      events: db.events.length,
      registrations: db.registrations.length,
      results: db.results.length
    };
    db.meet = { name: "", venue: "", date: "" };
    db.athletes = [];
    db.events = [];
    db.registrations = [];
    db.results = [];
    writeDb(db);
    return sendJson(res, 200, {
      message: "Meet data cleared and saved to database",
      backupFile,
      before,
      after: {
        meet: db.meet,
        athletes: 0,
        events: 0,
        registrations: 0,
        results: 0
      }
    });
  }

  if (req.method === "POST" && resource === "import-athletes") {
    const body = await readBody(req);
    if (!Array.isArray(body.rows)) return sendError(res, 400, "rows array is required");
    const before = {
      athletes: db.athletes.length,
      events: db.events.length,
      registrations: db.registrations.length
    };
    const summary = importAthleteRows(db, body.rows);
    writeDb(db);
    return sendJson(res, 200, { summary, before, after: {
      athletes: db.athletes.length,
      events: db.events.length,
      registrations: db.registrations.length
    } });
  }

  if (req.method === "GET" && resource === "events" && parts[3] === "results") {
    return sendJson(res, 200, rankResults(db, resourceId));
  }

  if (req.method === "GET" && resource === "meet") return sendJson(res, 200, db.meet);
  if (req.method === "PUT" && resource === "meet") {
    const body = await readBody(req);
    db.meet = {
      name: normalizeText(body.name) || db.meet.name,
      venue: normalizeText(body.venue) || db.meet.venue,
      date: normalizeText(body.date) || db.meet.date
    };
    writeDb(db);
    return sendJson(res, 200, db.meet);
  }

  const collections = {
    athletes: "ath",
    events: "evt",
    registrations: "reg",
    results: "res"
  };

  if (!collections[resource]) return sendError(res, 404, "Unknown API route");

  if (req.method === "GET") {
    return sendJson(res, 200, db[resource]);
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    let item;

    if (resource === "athletes") {
      const name = normalizeText(body.name);
      const bib = normalizeText(body.bib);
      const team = normalizeText(body.team);
      if (!name || !bib || !team) return sendError(res, 400, "Athlete name, bib, and team are required");
      if (db.athletes.some(athlete => athlete.bib.toLowerCase() === bib.toLowerCase())) {
        return sendError(res, 409, "Bib number already exists");
      }
      item = {
        id: id("ath"),
        accessCode: accessCode(),
        bib,
        name,
        age: parseNumber(body.age) || "",
        gender: normalizeText(body.gender) || "Open",
        team
      };
    }

    if (resource === "events") {
      const name = normalizeText(body.name);
      if (!name) return sendError(res, 400, "Event name is required");
      item = {
        id: id("evt"),
        name,
        category: normalizeText(body.category) || "Open",
        type: normalizeText(body.type) || "track",
        unit: normalizeText(body.unit) || "seconds",
        lowerIsBetter: Boolean(body.lowerIsBetter),
        status: normalizeText(body.status) || "scheduled"
      };
    }

    if (resource === "registrations") {
      const athleteId = normalizeText(body.athleteId);
      const eventId = normalizeText(body.eventId);
      if (!db.athletes.some(athlete => athlete.id === athleteId)) return sendError(res, 400, "Athlete not found");
      if (!db.events.some(event => event.id === eventId)) return sendError(res, 400, "Event not found");
      if (db.registrations.some(reg => reg.athleteId === athleteId && reg.eventId === eventId)) {
        return sendError(res, 409, "Athlete is already registered for this event");
      }
      item = { id: id("reg"), athleteId, eventId };
    }

    if (resource === "results") {
      const athleteId = normalizeText(body.athleteId);
      const eventId = normalizeText(body.eventId);
      const mark = parseNumber(body.mark);
      if (!db.athletes.some(athlete => athlete.id === athleteId)) return sendError(res, 400, "Athlete not found");
      if (!db.events.some(event => event.id === eventId)) return sendError(res, 400, "Event not found");
      if (mark === null) return sendError(res, 400, "A numeric mark is required");
      if (!db.registrations.some(reg => reg.athleteId === athleteId && reg.eventId === eventId)) {
        db.registrations.push({ id: id("reg"), athleteId, eventId });
      }
      const existing = db.results.find(result => result.athleteId === athleteId && result.eventId === eventId);
      if (existing) {
        existing.mark = mark;
        existing.note = normalizeText(body.note);
        writeDb(db);
        return sendJson(res, 200, existing);
      }
      item = { id: id("res"), athleteId, eventId, mark, note: normalizeText(body.note) };
    }

    db[resource].push(item);
    writeDb(db);
    return sendJson(res, 201, item);
  }

  if (req.method === "PUT" && resourceId) {
    const body = await readBody(req);
    const index = db[resource].findIndex(item => item.id === resourceId);
    if (index === -1) return sendError(res, 404, "Item not found");

    db[resource][index] = { ...db[resource][index], ...body, id: resourceId };
    writeDb(db);
    return sendJson(res, 200, db[resource][index]);
  }

  if (req.method === "DELETE" && resourceId) {
    const index = db[resource].findIndex(item => item.id === resourceId);
    if (index === -1) return sendError(res, 404, "Item not found");
    const [deleted] = db[resource].splice(index, 1);

    if (resource === "athletes") {
      db.registrations = db.registrations.filter(reg => reg.athleteId !== resourceId);
      db.results = db.results.filter(result => result.athleteId !== resourceId);
    }
    if (resource === "events") {
      db.registrations = db.registrations.filter(reg => reg.eventId !== resourceId);
      db.results = db.results.filter(result => result.eventId !== resourceId);
    }

    writeDb(db);
    return sendJson(res, 200, deleted);
  }

  sendError(res, 405, "Method not allowed");
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }
      return await handleApi(req, res);
    }

    serveStatic(req, res);
  } catch (error) {
    sendError(res, 500, error.message || "Server error");
  }
});

server.listen(PORT, () => {
  ensureDb();
  console.log(`Athletic Meet Manager running at http://localhost:${PORT}`);
});
