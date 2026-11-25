import { Database } from "bun:sqlite";
import type { AgentModel, BuildingModel, LogMessage, SectorModel } from "../../shared/events";

const db = new Database("ruin_orchestrator.sqlite", { create: true });

// Habilita WAL mode para alta performance e concorrência
db.run("PRAGMA journal_mode = WAL;");

export function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS sectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      restoration_percentage REAL NOT NULL DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      sector_id TEXT NOT NULL,
      name TEXT NOT NULL,
      pos_x INTEGER NOT NULL,
      pos_y INTEGER NOT NULL,
      state TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      pos_x INTEGER NOT NULL,
      pos_y INTEGER NOT NULL,
      status TEXT NOT NULL,
      energy INTEGER NOT NULL,
      max_energy INTEGER NOT NULL,
      tools TEXT NOT NULL,
      error_reason TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'info'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Semente inicial se não existir setor
  const sectorExists = db.query("SELECT id FROM sectors LIMIT 1").get();
  if (!sectorExists) {
    seedInitialData();
  }
}

export function seedInitialData() {
  db.run("DELETE FROM logs;");
  db.run("DELETE FROM agents;");
  db.run("DELETE FROM buildings;");
  db.run("DELETE FROM sectors;");

  db.run(
    "INSERT INTO sectors (id, name, restoration_percentage) VALUES (?, ?, ?)",
    ["sector-01", "Setor 01: Ruínas de Nova Selva", 0]
  );

  const defaultBuildings = [
    {
      id: "bld-tower",
      sector_id: "sector-01",
      name: "Torre de Dados",
      x: 5,
      y: 2,
      state: "ruined",
      description: "Antiga torre de telecomunicações com memórias quânticas corrompidas.",
    },
    {
      id: "bld-solar",
      sector_id: "sector-01",
      name: "Matriz Solar",
      x: 2,
      y: 5,
      state: "ruined",
      description: "Coletores fotovoltaicos soterrados por vinhas e concreto quebrado.",
    },
    {
      id: "bld-workshop",
      sector_id: "sector-01",
      name: "Oficina de Autômatos",
      x: 6,
      y: 6,
      state: "ruined",
      description: "Hangar de montagem desativado contendo peças sobressalentes.",
    },
  ];

  for (const b of defaultBuildings) {
    db.run(
      "INSERT INTO buildings (id, sector_id, name, pos_x, pos_y, state, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [b.id, b.sector_id, b.name, b.x, b.y, b.state, b.description]
    );
  }

  const defaultAgents = [
    {
      id: "bot-01",
      name: "Unit-734 (Builder)",
      class: "builder",
      pos_x: 1,
      pos_y: 1,
      status: "idle",
      energy: 1000,
      max_energy: 1000,
      tools: JSON.stringify(["weld_circuit", "place_scaffold", "synthesize_metal"]),
      error_reason: null,
    },
    {
      id: "bot-02",
      name: "Unit-108 (Explorer)",
      class: "explorer",
      pos_x: 0,
      pos_y: 3,
      status: "idle",
      energy: 850,
      max_energy: 1000,
      tools: JSON.stringify(["scan_terrain", "decode_signal", "dowsing_sensor"]),
      error_reason: null,
    },
  ];

  for (const a of defaultAgents) {
    db.run(
      "INSERT INTO agents (id, name, class, pos_x, pos_y, status, energy, max_energy, tools, error_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [a.id, a.name, a.class, a.pos_x, a.pos_y, a.status, a.energy, a.max_energy, a.tools, a.error_reason]
    );
  }

  insertLog("SISTEMA", "Setor 01 inicializado com sucesso. Banco SQLite ativado.", "info");
}

export function getSector(): SectorModel {
  const row = db.query("SELECT * FROM sectors WHERE id = 'sector-01'").get() as any;
  if (!row) {
    return { id: "sector-01", name: "Setor 01: Ruínas de Nova Selva", restorationPercentage: 0 };
  }
  return {
    id: row.id,
    name: row.name,
    restorationPercentage: row.restoration_percentage,
  };
}

export function updateSectorProgress(percentage: number) {
  db.run("UPDATE sectors SET restoration_percentage = ? WHERE id = 'sector-01'", [percentage]);
}

export function getBuildings(): BuildingModel[] {
  const rows = db.query("SELECT * FROM buildings WHERE sector_id = 'sector-01'").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    pos: { x: r.pos_x, y: r.pos_y },
    state: r.state,
    description: r.description,
  }));
}

export function getBuilding(id: string): BuildingModel | null {
  const r = db.query("SELECT * FROM buildings WHERE id = ?").get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    pos: { x: r.pos_x, y: r.pos_y },
    state: r.state,
    description: r.description,
  };
}

export function updateBuildingState(id: string, state: string) {
  db.run("UPDATE buildings SET state = ? WHERE id = ?", [state, id]);
  recalculateSectorProgress();
}

function recalculateSectorProgress() {
  const buildings = getBuildings();
  if (buildings.length === 0) return;
  const restoredCount = buildings.filter((b) => b.state === "restored").length;
  const constructingCount = buildings.filter((b) => b.state === "constructing").length;
  const progress = Math.round(((restoredCount * 1.0 + constructingCount * 0.4) / buildings.length) * 100);
  updateSectorProgress(progress);
}

export function getAgents(): AgentModel[] {
  const rows = db.query("SELECT * FROM agents").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    class: r.class,
    pos: { x: r.pos_x, y: r.pos_y },
    status: r.status,
    energy: r.energy,
    maxEnergy: r.max_energy,
    tools: JSON.parse(r.tools || "[]"),
    errorReason: r.error_reason || undefined,
  }));
}

export function getAgent(id: string): AgentModel | null {
  const r = db.query("SELECT * FROM agents WHERE id = ?").get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    class: r.class,
    pos: { x: r.pos_x, y: r.pos_y },
    status: r.status,
    energy: r.energy,
    maxEnergy: r.max_energy,
    tools: JSON.parse(r.tools || "[]"),
    errorReason: r.error_reason || undefined,
  };
}

export function updateAgent(agent: Partial<AgentModel> & { id: string }) {
  const existing = getAgent(agent.id);
  if (!existing) return;

  const pos_x = agent.pos ? agent.pos.x : existing.pos.x;
  const pos_y = agent.pos ? agent.pos.y : existing.pos.y;
  const status = agent.status ?? existing.status;
  const energy = agent.energy ?? existing.energy;
  const error_reason = agent.errorReason !== undefined ? agent.errorReason : (existing.errorReason ?? null);

  db.run(
    "UPDATE agents SET pos_x = ?, pos_y = ?, status = ?, energy = ?, error_reason = ? WHERE id = ?",
    [pos_x, pos_y, status, energy, error_reason, agent.id]
  );
}

export function insertLog(source: string, message: string, level: "info" | "warn" | "error" | "success" = "info"): LogMessage {
  const timestamp = new Date().toLocaleTimeString();
  db.run("INSERT INTO logs (timestamp, source, message, level) VALUES (?, ?, ?, ?)", [
    timestamp,
    source,
    message,
    level,
  ]);
  return { timestamp, source, message, level };
}

export function getRecentLogs(limit: number = 50): LogMessage[] {
  const rows = db.query("SELECT * FROM logs ORDER BY id DESC LIMIT ?").all(limit) as any[];
  return rows.map((r) => ({
    id: String(r.id),
    timestamp: r.timestamp,
    source: r.source,
    message: r.message,
    level: r.level,
  }));
}

export function getSetting(key: string, defaultValue: string = ""): string {
  const row = db.query("SELECT value FROM settings WHERE key = ?").get(key) as any;
  if (!row) return defaultValue;
  return row.value ?? defaultValue;
}

export function setSetting(key: string, value: string) {
  db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [
    key,
    value,
  ]);
}
