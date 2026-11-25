import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import type { ConfigState, SectorModel } from "../../../shared/events";

interface HudTopBarProps {
  sector: SectorModel;
  config?: ConfigState;
  onOpenQuestModal: () => void;
  onOpenSettings: () => void;
  onResetSector: () => void;
  isConnected: boolean;
}

export const HudTopBar: React.FC<HudTopBarProps> = ({
  sector,
  config,
  onOpenQuestModal,
  onOpenSettings,
  onResetSector,
  isConnected,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${sector.restorationPercentage}%`,
        duration: 0.8,
        ease: "power2.out",
      });
    }
  }, [sector.restorationPercentage]);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        padding: "12px 20px",
        background: "linear-gradient(180deg, rgba(10, 15, 12, 0.95) 0%, rgba(10, 15, 12, 0.75) 80%, rgba(10, 15, 12, 0) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "'Courier New', Courier, monospace",
        color: "#c2d6c5",
        pointerEvents: "none",
      }}
    >
      {/* Título & Status de Conexão */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, pointerEvents: "auto" }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: isConnected ? "#4ade80" : "#ef4444",
            boxShadow: isConnected ? "0 0 10px #4ade80" : "0 0 10px #ef4444",
            transition: "all 0.3s ease",
          }}
          title={isConnected ? "WebSocket Conectado" : "WebSocket Desconectado"}
        />
        <div>
          <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: 1.5, color: "#86efac" }}>
            RUIN ORCHESTRATOR // {sector.name.toUpperCase()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: "#6b8a72" }}>
              SISTEMA DE AUTÔMATOS COGNITIVOS • v0.2.0
            </span>
            {config && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 2,
                  background: config.hasGeminiKey ? "#15803d33" : "#ca8a0433",
                  border: `1px solid ${config.hasGeminiKey ? "#4ade80" : "#facc15"}`,
                  color: config.hasGeminiKey ? "#86efac" : "#fde047",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ● {config.hasGeminiKey ? "GEMINI ONLINE" : "SIMULAÇÃO LOCAL"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra Central de Restauração */}
      <div
        style={{
          width: 340,
          background: "rgba(19, 26, 21, 0.85)",
          border: "1px solid #3d5242",
          padding: "6px 12px",
          borderRadius: 4,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, color: "#a7f3d0" }}>
          <span>PROGRESSO DO SETOR</span>
          <span ref={percentageRef} style={{ fontWeight: "bold", color: "#4ade80" }}>
            {sector.restorationPercentage}%
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: 10,
            background: "#131b15",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid #233327",
          }}
        >
          <div
            ref={progressBarRef}
            style={{
              height: "100%",
              width: "0%",
              background: "linear-gradient(90deg, #15803d, #4ade80)",
              boxShadow: "0 0 8px #4ade80",
            }}
          />
        </div>
      </div>

      {/* Ações Rápidas */}
      <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
        <button
          onClick={onOpenQuestModal}
          style={{
            background: "#1e3a29",
            color: "#86efac",
            border: "1px solid #4ade80",
            padding: "8px 16px",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: "bold",
            cursor: "pointer",
            borderRadius: 3,
            boxShadow: "0 0 10px rgba(74, 222, 128, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>▶</span> NOVA QUEST
        </button>

        <button
          onClick={onOpenSettings}
          title="Configurar chaves de API (Google Gemini / Ollama)"
          style={{
            background: config?.hasGeminiKey ? "#163321" : "rgba(35, 43, 38, 0.8)",
            color: config?.hasGeminiKey ? "#86efac" : "#cbd5e1",
            border: config?.hasGeminiKey ? "1px solid #4ade80" : "1px solid #4b5563",
            padding: "8px 12px",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: "bold",
            cursor: "pointer",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>🔑</span> CHAVES API
        </button>

        <button
          onClick={onResetSector}
          title="Restaura as ruínas para testar novamente"
          style={{
            background: "rgba(35, 43, 38, 0.8)",
            color: "#9ca3af",
            border: "1px solid #4b5563",
            padding: "8px 12px",
            fontFamily: "inherit",
            fontSize: 12,
            cursor: "pointer",
            borderRadius: 3,
          }}
        >
          ↺ REINICIAR
        </button>
      </div>
    </header>
  );
};
