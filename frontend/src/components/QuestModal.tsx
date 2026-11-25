import React, { useState } from "react";
import type { AgentModel, BuildingModel } from "../../../shared/events";

interface QuestModalProps {
  buildings: BuildingModel[];
  agents: AgentModel[];
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (buildingId: string, prompt: string, agentId: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  buildings,
  agents,
  isOpen,
  onClose,
  onDispatch,
}) => {
  const [targetBuildingId, setTargetBuildingId] = useState<string>(buildings[0]?.id || "bld-tower");
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "bot-01");
  const [prompt, setPrompt] = useState<string>("Diagnosticar e restaurar núcleo estrutural da torre");

  if (!isOpen) return null;

  const presets = [
    "Diagnosticar e restaurar núcleo estrutural da torre",
    "Limpar acúmulo vegetal e soldar condutores solares",
    "Reparar bancada de montagem e reativar linha de peças",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBuildingId || !prompt.trim()) return;
    onDispatch(targetBuildingId, prompt.trim(), selectedAgentId);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <div
        style={{
          width: 480,
          background: "#0f1712",
          border: "2px solid #3d5945",
          borderRadius: 6,
          padding: 24,
          color: "#c2d6c5",
          boxShadow: "0 0 30px rgba(74, 222, 128, 0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#86efac" }}>
            // PROTOCOLO DE DESPACHO DE QUEST
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Selecionar Estrutura Alvo */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
              ESTRUTURA ALVO // COORDENADAS:
            </label>
            <select
              value={targetBuildingId}
              onChange={(e) => setTargetBuildingId(e.target.value)}
              style={{
                width: "100%",
                background: "#162319",
                border: "1px solid #3d5945",
                color: "#e2e8d5",
                padding: "8px 10px",
                fontFamily: "inherit",
                fontSize: 12,
                borderRadius: 3,
                outline: "none",
              }}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.state.toUpperCase()}) — [{b.pos.x}, {b.pos.y}]
                </option>
              ))}
            </select>
          </div>

          {/* Selecionar Agente */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
              AUTÔMATO ENCARREGADO:
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              style={{
                width: "100%",
                background: "#162319",
                border: "1px solid #3d5945",
                color: "#e2e8d5",
                padding: "8px 10px",
                fontFamily: "inherit",
                fontSize: 12,
                borderRadius: 3,
                outline: "none",
              }}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} [{a.class.toUpperCase()}] • {a.energy} PWR
                </option>
              ))}
            </select>
          </div>

          {/* Prompt / Instrução da Missão */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
              INSTRUÇÃO DO OPERADOR (PROMPT LLM):
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: "100%",
                background: "#162319",
                border: "1px solid #3d5945",
                color: "#86efac",
                padding: "8px 10px",
                fontFamily: "inherit",
                fontSize: 12,
                borderRadius: 3,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Presets Rápidos */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>PRESETS RÁPIDOS:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(p)}
                  style={{
                    background: "transparent",
                    border: "1px dashed #243628",
                    color: "#9ca3af",
                    textAlign: "left",
                    padding: "4px 8px",
                    fontSize: 10,
                    cursor: "pointer",
                    borderRadius: 2,
                  }}
                >
                  › {p}
                </button>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid #4b5563",
                color: "#9ca3af",
                padding: "8px 16px",
                fontFamily: "inherit",
                fontSize: 12,
                cursor: "pointer",
                borderRadius: 3,
              }}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              style={{
                background: "#15803d",
                border: "1px solid #4ade80",
                color: "#f0fdf4",
                padding: "8px 20px",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: "bold",
                cursor: "pointer",
                borderRadius: 3,
                boxShadow: "0 0 10px rgba(74, 222, 128, 0.3)",
              }}
            >
              ▶ DESPACHAR AUTÔMATO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
