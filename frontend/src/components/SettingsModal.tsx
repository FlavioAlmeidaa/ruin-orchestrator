import React, { useState, useEffect } from "react";
import type { ConfigState } from "../../../shared/events";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigState;
  onSaveConfig: (geminiApiKey?: string, ollamaHost?: string, ollamaModel?: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [ollamaHost, setOllamaHost] = useState<string>(config.ollamaHost || "http://127.0.0.1:11434/v1");
  const [ollamaModel, setOllamaModel] = useState<string>(config.ollamaModel || "llama3.2");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setOllamaHost(config.ollamaHost || "http://127.0.0.1:11434/v1");
      setOllamaModel(config.ollamaModel || "llama3.2");
      setSavedFeedback(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(geminiKey ? geminiKey.trim() : undefined, ollamaHost.trim(), ollamaModel.trim());
    setSavedFeedback(true);
    setGeminiKey("");
    setTimeout(() => {
      setSavedFeedback(false);
    }, 3000);
  };

  const handleClearGeminiKey = () => {
    onSaveConfig("", ollamaHost.trim(), ollamaModel.trim());
    setGeminiKey("");
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 3000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <div
        style={{
          width: 520,
          background: "#0c140f",
          border: "2px solid #2e4a36",
          borderRadius: 6,
          padding: 24,
          color: "#c2d6c5",
          boxShadow: "0 0 35px rgba(74, 222, 128, 0.2)",
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔑</span>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#86efac", letterSpacing: 1 }}>
              CONFIGURAÇÃO // PROVEDORES DE IA
            </div>
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

        {/* Status Atual do Provedor */}
        <div
          style={{
            background: config.hasGeminiKey ? "rgba(34, 197, 94, 0.12)" : "rgba(234, 179, 8, 0.12)",
            border: `1px solid ${config.hasGeminiKey ? "#22c55e" : "#eab308"}`,
            borderRadius: 4,
            padding: "10px 14px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>PROVEDOR COGNITIVO ATIVO:</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: config.hasGeminiKey ? "#4ade80" : "#facc15" }}>
              {config.hasGeminiKey ? "● GOOGLE GEMINI 3.8 FLASH" : "● PROTOCOLO AUTÔNOMO (LOCAL / SIMULAÇÃO)"}
            </div>
            {config.hasGeminiKey && config.maskedKey && (
              <div style={{ fontSize: 10, color: "#86efac", marginTop: 2 }}>
                CHAVE REGISTRADA: {config.maskedKey}
              </div>
            )}
          </div>

          {config.hasGeminiKey && (
            <button
              onClick={handleClearGeminiKey}
              title="Remove a chave e volta para a simulação autônoma"
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                color: "#f87171",
                fontSize: 10,
                padding: "4px 8px",
                cursor: "pointer",
                borderRadius: 2,
              }}
            >
              REMOVER CHAVE
            </button>
          )}
        </div>

        <form onSubmit={handleSave}>
          {/* Campo Chave API do Gemini */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "#86efac", marginBottom: 6, fontWeight: "bold" }}>
              CHAVE API DO GOOGLE GEMINI:
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                placeholder={config.hasGeminiKey ? "Insira nova chave para substituir..." : "Cole sua chave AIzaSy..."}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{
                  width: "100%",
                  background: "#131e16",
                  border: "1px solid #3d5945",
                  color: "#f0fdf4",
                  padding: "10px 42px 10px 12px",
                  fontFamily: "inherit",
                  fontSize: 12,
                  borderRadius: 3,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: 14,
                }}
                title={showKey ? "Ocultar chave" : "Mostrar chave"}
              >
                {showKey ? "🙈" : "👁️"}
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#6b8a72", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
              <span>A chave é armazenada com segurança no banco SQLite local.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#38bdf8", textDecoration: "underline" }}
              >
                Obter chave no Google AI Studio ↗
              </a>
            </div>
          </div>

          {/* Opções Avançadas (Ollama Local) */}
          <div style={{ marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                fontSize: 11,
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{showAdvanced ? "▼" : "▶"}</span> Opções Avançadas // Ollama Local
            </button>

            {showAdvanced && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background: "#111a14",
                  border: "1px dashed #2d4533",
                  borderRadius: 3,
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>
                    OLLAMA ENDPOINT URL:
                  </label>
                  <input
                    type="text"
                    value={ollamaHost}
                    onChange={(e) => setOllamaHost(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#17241b",
                      border: "1px solid #334d3a",
                      color: "#e2e8d5",
                      padding: "6px 8px",
                      fontFamily: "inherit",
                      fontSize: 11,
                      borderRadius: 2,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>
                    MODELO OLLAMA:
                  </label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#17241b",
                      border: "1px solid #334d3a",
                      color: "#e2e8d5",
                      padding: "6px 8px",
                      fontFamily: "inherit",
                      fontSize: 11,
                      borderRadius: 2,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mensagem de Feedback */}
          {savedFeedback && (
            <div
              style={{
                marginBottom: 14,
                padding: "6px 12px",
                background: "rgba(74, 222, 128, 0.15)",
                border: "1px solid #4ade80",
                color: "#86efac",
                fontSize: 11,
                borderRadius: 3,
                textAlign: "center",
              }}
            >
              ✓ Configuração salva e transmitida com sucesso ao orquestrador!
            </div>
          )}

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
              FECHAR
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
              SALVAR CONFIGURAÇÃO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
