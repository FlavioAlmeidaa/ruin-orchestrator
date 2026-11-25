import React from "react";

interface GlobeControlsProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetView: () => void;
  isAutoRotating: boolean;
  onToggleAutoRotate: () => void;
  isTiltShiftEnabled: boolean;
  onToggleTiltShift: () => void;
}

export const GlobeControls: React.FC<GlobeControlsProps> = ({
  onRotateLeft,
  onRotateRight,
  onResetView,
  isAutoRotating,
  onToggleAutoRotate,
  isTiltShiftEnabled,
  onToggleTiltShift,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: "rgba(10, 16, 12, 0.92)",
        border: "1px solid #2d4533",
        borderRadius: 4,
        padding: "8px 10px",
        fontFamily: "'Courier New', Courier, monospace",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{ fontSize: 10, color: "#86efac", fontWeight: "bold", marginBottom: 2, letterSpacing: 1 }}>
        🌐 NAVEGAÇÃO 2.5D
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onRotateLeft}
          title="Girar Globo para a Esquerda"
          style={{
            flex: 1,
            background: "#162319",
            border: "1px solid #334d3a",
            color: "#e2e8d5",
            fontSize: 12,
            padding: "5px 8px",
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          ⟲ ESQ
        </button>
        <button
          onClick={onRotateRight}
          title="Girar Globo para a Direita"
          style={{
            flex: 1,
            background: "#162319",
            border: "1px solid #334d3a",
            color: "#e2e8d5",
            fontSize: 12,
            padding: "5px 8px",
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          DIR ⟳
        </button>
      </div>

      <button
        onClick={onResetView}
        title="Centralizar Câmera e Restaurar Ângulo Padrão"
        style={{
          background: "transparent",
          border: "1px solid #334d3a",
          color: "#9ca3af",
          fontSize: 10,
          padding: "4px 8px",
          cursor: "pointer",
          borderRadius: 2,
        }}
      >
        🎯 CENTRALIZAR
      </button>

      <div style={{ borderTop: "1px dashed #243628", margin: "4px 0" }} />

      <button
        onClick={onToggleAutoRotate}
        title="Ativar rotação contínua como diorama"
        style={{
          background: isAutoRotating ? "#163321" : "transparent",
          border: isAutoRotating ? "1px solid #4ade80" : "1px solid #334d3a",
          color: isAutoRotating ? "#86efac" : "#9ca3af",
          fontSize: 10,
          padding: "4px 8px",
          cursor: "pointer",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>ÓRBITA AUTO</span>
        <span style={{ color: isAutoRotating ? "#4ade80" : "#6b7280", fontWeight: "bold" }}>
          {isAutoRotating ? "ON" : "OFF"}
        </span>
      </button>

      <button
        onClick={onToggleTiltShift}
        title="Ativar profundidade de campo e efeito miniatura / diorama"
        style={{
          background: isTiltShiftEnabled ? "#163321" : "transparent",
          border: isTiltShiftEnabled ? "1px solid #38bdf8" : "1px solid #334d3a",
          color: isTiltShiftEnabled ? "#7dd3fc" : "#9ca3af",
          fontSize: 10,
          padding: "4px 8px",
          cursor: "pointer",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>TILT-SHIFT DoF</span>
        <span style={{ color: isTiltShiftEnabled ? "#38bdf8" : "#6b7280", fontWeight: "bold" }}>
          {isTiltShiftEnabled ? "ON" : "OFF"}
        </span>
      </button>

      <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2, textAlign: "center" }}>
        Arraste com o mouse para girar o globo em 3D
      </div>
    </div>
  );
};
