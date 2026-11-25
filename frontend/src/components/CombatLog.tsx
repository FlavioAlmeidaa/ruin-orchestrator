import React, { useState, useRef, useEffect } from "react";
import type { LogMessage } from "../../../shared/events";

interface CombatLogProps {
  logs: LogMessage[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const [filter, setFilter] = useState<"all" | "system" | "agents" | "errors">("all");
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para mensagens mais recentes
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const filteredLogs = logs.filter((l) => {
    if (filter === "errors") return l.level === "error";
    if (filter === "system") return l.source.toUpperCase().includes("SISTEMA");
    if (filter === "agents") return !l.source.toUpperCase().includes("SISTEMA");
    return true;
  });

  const getLevelColor = (level?: string) => {
    switch (level) {
      case "error":
        return "#f87171";
      case "warn":
        return "#facc15";
      case "success":
        return "#4ade80";
      default:
        return "#86efac";
    }
  };

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.source}: ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: 440,
        zIndex: 20,
        background: "rgba(10, 15, 12, 0.95)",
        border: "1px solid #2d4533",
        borderRadius: 4,
        fontFamily: "'Courier New', Courier, monospace",
        color: "#c2d6c5",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.7)",
        overflow: "hidden",
      }}
    >
      {/* Barra de Título do Terminal CRT */}
      <div
        style={{
          background: "#162319",
          borderBottom: "1px solid #2d4533",
          padding: "6px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#86efac", fontWeight: "bold" }}>
          <span>⌨</span> COMBAT & TELEMETRY LOG
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={copyLogs}
            title="Copiar logs para área de transferência"
            style={{
              background: "transparent",
              border: "1px solid #334d3a",
              color: "#9ca3af",
              fontSize: 9,
              padding: "2px 6px",
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            COPIAR
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Filtros de Mensagens */}
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "6px 12px",
              background: "#0d1410",
              borderBottom: "1px solid #1c2a1f",
              fontSize: 10,
            }}
          >
            {(["all", "system", "agents", "errors"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                style={{
                  background: filter === mode ? "#26422d" : "transparent",
                  color: filter === mode ? "#86efac" : "#6b7280",
                  border: filter === mode ? "1px solid #4ade80" : "1px solid transparent",
                  padding: "2px 6px",
                  fontSize: 9,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  borderRadius: 2,
                  textTransform: "uppercase",
                }}
              >
                {mode === "all" ? "TODOS" : mode === "system" ? "SISTEMA" : mode === "agents" ? "ROBÔS" : "ERROS"}
              </button>
            ))}
          </div>

          {/* Área de Linhas do Log */}
          <div
            ref={logContainerRef}
            style={{
              height: 220,
              overflowY: "auto",
              padding: "8px 12px",
              fontSize: 11,
              lineHeight: 1.45,
              background: "#080c09",
            }}
          >
            {filteredLogs.length === 0 ? (
              <div style={{ color: "#4b5563", fontStyle: "italic", padding: 8 }}>
                Nenhum evento registrado no canal selecionado.
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  style={{
                    marginBottom: 6,
                    borderLeft: `2px solid ${getLevelColor(log.level)}`,
                    paddingLeft: 6,
                  }}
                >
                  <span style={{ color: "#526e57", marginRight: 6, fontSize: 10 }}>[{log.timestamp}]</span>
                  <strong style={{ color: getLevelColor(log.level), marginRight: 6 }}>{log.source}:</strong>
                  <span style={{ color: "#e2e8d5", wordBreak: "break-word" }}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
