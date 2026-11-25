export type TileCoord = { x: number; y: number };

export type BuildingState = "ruined" | "constructing" | "restored";

export type AgentClass = "builder" | "explorer" | "inspector";

export type AgentStatus = "idle" | "walking" | "working" | "error";

export type AgentModel = {
  id: string;
  name: string;
  class: AgentClass;
  pos: TileCoord;
  status: AgentStatus;
  energy: number;
  maxEnergy: number;
  tools: string[];
  errorReason?: string;
};

export type BuildingModel = {
  id: string;
  name: string;
  pos: TileCoord;
  state: BuildingState;
  description: string;
};

export type SectorModel = {
  id: string;
  name: string;
  restorationPercentage: number;
};

export type LogMessage = {
  id?: string;
  timestamp: string;
  source: string;
  message: string;
  level?: "info" | "warn" | "error" | "success";
};

export type ConfigState = {
  hasGeminiKey: boolean;
  maskedKey: string;
  provider: string;
  ollamaHost: string;
  ollamaModel: string;
};

export type WorldEvent =
  | {
      type: "WORLD_SNAPSHOT";
      agents: AgentModel[];
      buildings: BuildingModel[];
      sector: SectorModel;
      logs: LogMessage[];
      config?: ConfigState;
    }
  | { type: "AGENT_MOVED"; agentId: string; target: TileCoord; path?: TileCoord[] }
  | {
      type: "AGENT_TOOL_CALL";
      agentId: string;
      toolName: string;
      animation: "scan" | "weld" | "transmitting" | "spark";
      details?: string;
    }
  | { type: "AGENT_STATUS"; agentId: string; status: AgentStatus; errorReason?: string }
  | { type: "AGENT_ENERGY_UPDATED"; agentId: string; energy: number; maxEnergy: number }
  | { type: "BUILDING_PROGRESS"; buildingId: string; state: BuildingState }
  | { type: "SECTOR_PROGRESS"; restorationPercentage: number }
  | {
      type: "COMBAT_LOG";
      timestamp: string;
      source: string;
      message: string;
      level?: "info" | "warn" | "error" | "success";
    }
  | ({ type: "CONFIG_STATE" } & ConfigState);

export type ClientCommand =
  | {
      type: "DISPATCH_QUEST";
      prompt: string;
      targetBuildingId: string;
      agentId?: string;
    }
  | {
      type: "REPAIR_AGENT";
      agentId: string;
    }
  | {
      type: "RESET_SECTOR";
    }
  | {
      type: "SAVE_CONFIG";
      geminiApiKey?: string;
      ollamaHost?: string;
      ollamaModel?: string;
    };
