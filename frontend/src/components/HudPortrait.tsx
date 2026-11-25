import React from "react";
import type { AgentModel } from "../../../shared/events";

interface HudPortraitProps {
  activeAgent?: AgentModel;
  onOpenInspector?: () => void;
}

export const HudPortrait: React.FC<HudPortraitProps> = ({ activeAgent, onOpenInspector }) => {
  const isBuilder = !activeAgent || activeAgent.class === "builder";
  const portraitSrc = isBuilder ? "/assets/hud/portrait_builder.png" : "/assets/agents/robot_scout.png";

  const getStatusLabel = () => {
    if (!activeAgent) return "ONLINE";
    switch (activeAgent.status) {
      case "idle":
        return "ONLINE // OCIOSO";
      case "walking":
        return "DESLOCANDO-SE";
      case "working":
        return "EM OPERAÇÃO";
      case "error":
        return "CURTO-CIRCUITO";
      default:
        return "ONLINE";
    }
  };

  return (
    <div
      onClick={onOpenInspector}
      style={{
        position: "fixed",
        bottom: 16,
        left: 20,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(10, 16, 12, 0.94)",
        border: "2px solid #2d4533",
        borderRadius: 6,
        padding: "8px 14px",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#c2d6c5",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.7)",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
      title="Clique para inspecionar unidade"
    >
      {/* Moldura do Retrato 64x64 */}
      <div
        style={{
          width: 64,
          height: 64,
          border: "2px solid #4ade80",
          borderRadius: 4,
          overflow: "hidden",
          background: "#121b14",
          boxShadow: "0 0 10px rgba(74, 222, 128, 0.25)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <img
          src={portraitSrc}
          alt="Retrato da Unidade"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            imageRendering: "pixelated",
            display: "block",
          }}
        />
        {/* Linha CRT Scanline */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: activeAgent?.status === "error" ? "#ef4444" : "#4ade80",
              boxShadow: activeAgent?.status === "error" ? "0 0 8px #ef4444" : "0 0 8px #4ade80",
            }}
          />
          <div style={{ fontSize: 13, fontWeight: "bold", color: "#86efac" }}>
            {activeAgent?.name || "Unit-734"}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" }}>
          CLASSE: {activeAgent?.class || "BUILDER"} • {getStatusLabel()}
        </div>
        <div style={{ fontSize: 10, color: "#38bdf8", marginTop: 4, fontWeight: "bold" }}>
          ENERGIA: {activeAgent?.energy ?? 1000} / {activeAgent?.maxEnergy ?? 1000} PWR
        </div>
      </div>
    </div>
  );
};
