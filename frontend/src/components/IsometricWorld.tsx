import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type {
  AgentModel,
  BuildingModel,
  ConfigState,
  LogMessage,
  SectorModel,
  WorldEvent,
} from "../../../shared/events";
import { HudTopBar } from "./HudTopBar";
import { AgentInspector } from "./AgentInspector";
import { QuestModal } from "./QuestModal";
import { CombatLog } from "./CombatLog";
import { HudPortrait } from "./HudPortrait";
import { SettingsModal } from "./SettingsModal";
import { GlobeControls } from "./GlobeControls";

const GRID_SIZE = 8;
const GLOBE_RADIUS = 12.0;

// Helper para projetar uma coordenada do grid (x, y) na superfície da esfera 3D
function gridToSpherePosition(gx: number, gy: number, radius = GLOBE_RADIUS, elevation = 0) {
  const u = (gx - (GRID_SIZE - 1) / 2) * 0.16;
  const v = (gy - (GRID_SIZE - 1) / 2) * 0.16;

  const r = radius + elevation;
  const x = r * Math.sin(u) * Math.cos(v);
  const y = r * Math.sin(v);
  const z = r * Math.cos(u) * Math.cos(v);

  const pos = new THREE.Vector3(x, y, z);
  const normal = pos.clone().normalize();
  return { pos, normal };
}

export function IsometricWorld() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Estados reativos da HUD e Jogo
  const [sector, setSector] = useState<SectorModel>({
    id: "sector-01",
    name: "Setor 01: Ruínas de Nova Selva",
    restorationPercentage: 0,
  });
  const [agents, setAgents] = useState<AgentModel[]>([]);
  const [buildings, setBuildings] = useState<BuildingModel[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingModel | null>(null);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isTiltShiftEnabled, setIsTiltShiftEnabled] = useState<boolean>(true);

  const [config, setConfig] = useState<ConfigState>({
    hasGeminiKey: false,
    maskedKey: "",
    provider: "Simulação Local",
    ollamaHost: "http://127.0.0.1:11434/v1",
    ollamaModel: "llama3.2",
  });

  // Refs para controle da câmera Three.js a partir da HUD
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Refs de estado para acesso síncrono no loop do Three.js
  const stateRef = useRef({
    agents: [] as AgentModel[],
    buildings: [] as BuildingModel[],
  });

  const appendLog = useCallback((source: string, message: string, level: LogMessage["level"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ timestamp, source, message, level }, ...prev.slice(0, 100)]);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let ws: WebSocket | null = null;
    let animationFrameId: number;

    const container = containerRef.current;
    if (!container) return;

    // 1. CENA, CÂMERA E RENDERER THREE.JS (Estilo HD-2D / 2.5D)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060b08, 0.014);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 32);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.replaceChildren(renderer.domElement);

    // 2. ORBIT CONTROLS (Navegação tridimensional com inércia e rotação)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);
    controls.minDistance = 14;
    controls.maxDistance = 55;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // 3. ILUMINAÇÃO EQUILIBRADA (Sem emissões artificiais)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.6);
    sunLight.position.set(22, 34, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xa5f3fc, 1.2);
    rimLight.position.set(-20, 8, -20);
    scene.add(rimLight);

    // 4. CAMADA PARALLAX: Campo de Estrelas e Atmosfera Planetária
    const starGeo = new THREE.BufferGeometry();
    const starCount = 650;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 150 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x86efac, size: 0.8, transparent: true, opacity: 0.6 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Globo Central (Núcleo do Planeta)
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS - 0.08, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x07150c,
      roughness: 0.85,
      metalness: 0.1,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeMesh.receiveShadow = true;
    scene.add(globeMesh);

    // Aura Atmosférica do Planeta
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // 5. CARREGAMENTO DE TEXTURAS PBR (Diffuse + Normal com NearestFilter)
    const textureLoader = new THREE.TextureLoader();

    function loadPbrTextures(basePath: string) {
      const map = textureLoader.load(`${basePath}_diffuse.png`);
      const normalMap = textureLoader.load(`${basePath}_normal.png`);

      [map, normalMap].forEach((tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
      });

      return { map, normalMap };
    }

    const groundPbr = loadPbrTextures("/assets/tiles/ground_moss");
    const builderPbr = loadPbrTextures("/assets/agents/robot_builder");
    const scoutPbr = loadPbrTextures("/assets/agents/robot_scout");
    const towerRuinedPbr = loadPbrTextures("/assets/buildings/tower_ruined");
    const towerConstructingPbr = loadPbrTextures("/assets/buildings/tower_constructing");
    const towerRestoredPbr = loadPbrTextures("/assets/buildings/tower_restored");

    function createPbrMaterial(
      pbr: ReturnType<typeof loadPbrTextures>,
      options: { alphaTest?: number } = {}
    ) {
      return new THREE.MeshStandardMaterial({
        map: pbr.map,
        normalMap: pbr.normalMap,
        transparent: true,
        alphaTest: options.alphaTest !== undefined ? options.alphaTest : 0.4,
        roughness: 0.65,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
    }

    const groundMaterial = createPbrMaterial(groundPbr, { alphaTest: 0.3 });
    const builderMaterial = createPbrMaterial(builderPbr, { alphaTest: 0.45 });
    const scoutMaterial = createPbrMaterial(scoutPbr, { alphaTest: 0.45 });

    const towerMaterials = {
      ruined: createPbrMaterial(towerRuinedPbr, { alphaTest: 0.4 }),
      constructing: createPbrMaterial(towerConstructingPbr, { alphaTest: 0.4 }),
      restored: createPbrMaterial(towerRestoredPbr, { alphaTest: 0.4 }),
    };

    // 6. TILES DO TERRENO NO GLOBO (Projetados tangencialmente à esfera)
    const tilePlaneGeo = new THREE.PlaneGeometry(2.35, 2.35);
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const { pos, normal } = gridToSpherePosition(x, y, GLOBE_RADIUS, 0.02);
        const tileMesh = new THREE.Mesh(tilePlaneGeo, groundMaterial);
        tileMesh.position.copy(pos);
        tileMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        tileMesh.receiveShadow = true;
        scene.add(tileMesh);
      }
    }

    // 7. ESTRUTURAS (TORRES) BILLBOARDED SOBRE O GLOBO
    const buildingMeshes = new Map<string, { mesh: THREE.Mesh; model: BuildingModel }>();

    function updateBuildingMesh(b: BuildingModel) {
      let entry = buildingMeshes.get(b.id);
      if (!entry) {
        // Geometria transladada para que a base da torre fique no centro do tile
        const towerGeo = new THREE.PlaneGeometry(4.2, 8.2);
        towerGeo.translate(0, 4.1, 0);

        const mesh = new THREE.Mesh(towerGeo, towerMaterials[b.state]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: "building", id: b.id };

        const { pos } = gridToSpherePosition(b.pos.x, b.pos.y, GLOBE_RADIUS, 0.05);
        mesh.position.copy(pos);

        scene.add(mesh);
        entry = { mesh, model: b };
        buildingMeshes.set(b.id, entry);
      } else {
        entry.model = b;
        entry.mesh.material = towerMaterials[b.state];
      }
    }

    // 8. AGENTES (ROBÔS) BILLBOARDED COM MOVIMENTAÇÃO INTERPOLADA
    const agentMeshes = new Map<
      string,
      {
        mesh: THREE.Mesh;
        currentPos: { x: number; y: number };
        targetPos: { x: number; y: number };
        model: AgentModel;
      }
    >();

    function updateAgentMesh(a: AgentModel) {
      let entry = agentMeshes.get(a.id);
      if (!entry) {
        const robotGeo = new THREE.PlaneGeometry(2.8, 3.0);
        robotGeo.translate(0, 1.5, 0);

        const mat = a.class === "builder" ? builderMaterial : scoutMaterial;
        const mesh = new THREE.Mesh(robotGeo, mat);
        mesh.castShadow = true;
        mesh.userData = { type: "agent", id: a.id };

        scene.add(mesh);

        entry = {
          mesh,
          currentPos: { x: a.pos.x, y: a.pos.y },
          targetPos: { x: a.pos.x, y: a.pos.y },
          model: a,
        };
        agentMeshes.set(a.id, entry);
      } else {
        entry.model = a;
        entry.targetPos = { x: a.pos.x, y: a.pos.y };
      }
    }

    // 9. RAYCASTING PARA SELEÇÃO COM CLIQUE DO MOUSE
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const interactables: THREE.Object3D[] = [];
      buildingMeshes.forEach((e) => interactables.push(e.mesh));
      agentMeshes.forEach((e) => interactables.push(e.mesh));

      const intersects = raycaster.intersectObjects(interactables, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.type === "building") {
          const bld = stateRef.current.buildings.find((b) => b.id === hit.userData.id);
          if (bld) setSelectedBuilding(bld);
        } else if (hit.userData.type === "agent") {
          setSelectedAgentId(hit.userData.id);
        }
      }
    };

    renderer.domElement.addEventListener("click", handleCanvasClick);

    // Redimensionamento de Janela
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 10. LOOP PRINCIPAL DE RENDERIZAÇÃO (Billboarding & Interpolação)
    let tick = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      tick++;

      controls.update();

      // Rotação sutil do campo de estrelas (Rolagem Parallax 3D)
      starField.rotation.y += 0.0003;

      // Billboarding das Torres: Mantém os sprites 2D sempre voltados para a câmera
      buildingMeshes.forEach((entry) => {
        entry.mesh.quaternion.copy(camera.quaternion);
      });

      // Movimentação interpolada e Billboarding dos Robôs
      agentMeshes.forEach((entry) => {
        entry.currentPos.x += (entry.targetPos.x - entry.currentPos.x) * 0.12;
        entry.currentPos.y += (entry.targetPos.y - entry.currentPos.y) * 0.12;

        const { pos } = gridToSpherePosition(entry.currentPos.x, entry.currentPos.y, GLOBE_RADIUS, 0.12);
        entry.mesh.position.copy(pos);
        entry.mesh.quaternion.copy(camera.quaternion);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 11. CONEXÃO WEBSOCKET COM O BACKEND
    try {
      ws = new WebSocket("ws://localhost:3001");
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        appendLog("SISTEMA", "Conectado ao orquestrador Three.js 2.5D (ws://localhost:3001)", "success");
      };

      ws.onclose = () => {
        setIsConnected(false);
        appendLog("SISTEMA", "Conexão com o orquestrador encerrada.", "warn");
      };

      ws.onerror = () => {
        setIsConnected(false);
        appendLog("SISTEMA", "Falha de comunicação com o backend em ws://localhost:3001", "error");
      };

      ws.onmessage = (ev) => {
        try {
          const event: WorldEvent = JSON.parse(ev.data);

          if (event.type === "WORLD_SNAPSHOT") {
            setSector(event.sector);
            setAgents(event.agents);
            setBuildings(event.buildings);
            setLogs(event.logs);
            if (event.config) {
              setConfig(event.config);
            }
            stateRef.current.agents = event.agents;
            stateRef.current.buildings = event.buildings;

            event.buildings.forEach(updateBuildingMesh);
            event.agents.forEach(updateAgentMesh);
          } else if (event.type === "CONFIG_STATE") {
            setConfig({
              hasGeminiKey: event.hasGeminiKey,
              maskedKey: event.maskedKey,
              provider: event.provider,
              ollamaHost: event.ollamaHost,
              ollamaModel: event.ollamaModel,
            });
          } else if (event.type === "AGENT_MOVED") {
            setAgents((prev) =>
              prev.map((a) => (a.id === event.agentId ? { ...a, pos: event.target, status: "walking" } : a))
            );
            const ag = stateRef.current.agents.find((a) => a.id === event.agentId);
            if (ag) {
              ag.pos = event.target;
              updateAgentMesh(ag);
            }
          } else if (event.type === "AGENT_STATUS") {
            setAgents((prev) =>
              prev.map((a) => (a.id === event.agentId ? { ...a, status: event.status, errorReason: event.errorReason } : a))
            );
            const ag = stateRef.current.agents.find((a) => a.id === event.agentId);
            if (ag) {
              ag.status = event.status;
              ag.errorReason = event.errorReason;
              updateAgentMesh(ag);
            }
          } else if (event.type === "AGENT_ENERGY_UPDATED") {
            setAgents((prev) =>
              prev.map((a) => (a.id === event.agentId ? { ...a, energy: event.energy, maxEnergy: event.maxEnergy } : a))
            );
          } else if (event.type === "BUILDING_PROGRESS") {
            setBuildings((prev) =>
              prev.map((b) => (b.id === event.buildingId ? { ...b, state: event.state } : b))
            );
            const bld = stateRef.current.buildings.find((b) => b.id === event.buildingId);
            if (bld) {
              bld.state = event.state;
              updateBuildingMesh(bld);
            }
          } else if (event.type === "SECTOR_PROGRESS") {
            setSector((prev) => ({ ...prev, restorationPercentage: event.restorationPercentage }));
          } else if (event.type === "COMBAT_LOG") {
            setLogs((prev) => [
              {
                timestamp: event.timestamp,
                source: event.source,
                message: event.message,
                level: event.level || "info",
              },
              ...prev.slice(0, 100),
            ]);
          }
        } catch (e) {
          console.error("Erro ao analisar mensagem WebSocket:", e);
        }
      };
    } catch (err) {
      console.error("Erro ao iniciar WebSocket:", err);
    }

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener("click", handleCanvasClick);
      window.removeEventListener("resize", handleResize);

      if (ws) {
        ws.close();
        wsRef.current = null;
      }

      controls.dispose();
      renderer.dispose();
    };
  }, [appendLog]);

  // Controles do Globo via HUD
  const handleRotateLeft = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
      setIsAutoRotating(false);
      const angle = controlsRef.current.getAzimuthalAngle();
      controlsRef.current.minAzimuthAngle = -Infinity;
      controlsRef.current.maxAzimuthAngle = Infinity;
      cameraRef.current?.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.25);
    }
  };

  const handleRotateRight = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
      setIsAutoRotating(false);
      cameraRef.current?.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.25);
    }
  };

  const handleResetView = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.autoRotate = false;
      setIsAutoRotating(false);
      controlsRef.current.target.set(0, 2, 0);
      cameraRef.current.position.set(0, 10, 32);
      controlsRef.current.update();
    }
  };

  const handleToggleAutoRotate = () => {
    if (controlsRef.current) {
      const nextVal = !isAutoRotating;
      setIsAutoRotating(nextVal);
      controlsRef.current.autoRotate = nextVal;
    }
  };

  const handleToggleTiltShift = () => {
    setIsTiltShiftEnabled(!isTiltShiftEnabled);
  };

  // Ações de Quests e Configurações enviadas via WebSocket
  const handleDispatchQuest = (targetBuildingId: string, prompt: string, agentId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "DISPATCH_QUEST",
          targetBuildingId,
          prompt,
          agentId,
        })
      );
      appendLog("OPERADOR", `Ordem transmitida para ${agentId}: "${prompt}"`, "info");
    } else {
      appendLog("SISTEMA", "Falha de transmissão: Servidor desconectado.", "error");
    }
  };

  const handleRepairAgent = (agentId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "REPAIR_AGENT",
          agentId,
        })
      );
    }
  };

  const handleSaveConfig = (geminiApiKey?: string, ollamaHost?: string, ollamaModel?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "SAVE_CONFIG",
          geminiApiKey,
          ollamaHost,
          ollamaModel,
        })
      );
    }
  };

  const handleResetSector = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "RESET_SECTOR" }));
      appendLog("SISTEMA", "Setor reiniciado para estado original de ruínas.", "warn");
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#060b08" }}>
      {/* Camada 1: Palco Three.js 2.5D com PBR (Diffuse + Normal + Emission) e OrbitControls */}
      <div ref={containerRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />

      {/* Camada de Profundidade de Campo & Tilt-Shift (Diorama / Efeito Miniatura HD-2D) */}
      {isTiltShiftEnabled && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 10,
            background:
              "radial-gradient(ellipse at center, transparent 48%, rgba(6, 11, 8, 0.45) 82%, rgba(6, 11, 8, 0.85) 100%)",
            boxShadow: "inset 0 0 120px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Desfoque suave na linha do horizonte superior */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              background: "linear-gradient(180deg, rgba(6, 11, 8, 0.7) 0%, transparent 100%)",
              backdropFilter: "blur(2px)",
              maskImage: "linear-gradient(180deg, black, transparent)",
              WebkitMaskImage: "linear-gradient(180deg, black, transparent)",
            }}
          />
          {/* Desfoque suave no primeiro plano inferior */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 90,
              background: "linear-gradient(0deg, rgba(6, 11, 8, 0.7) 0%, transparent 100%)",
              backdropFilter: "blur(1.5px)",
              maskImage: "linear-gradient(0deg, black, transparent)",
              WebkitMaskImage: "linear-gradient(0deg, black, transparent)",
            }}
          />
        </div>
      )}

      {/* Camada 2: HUD Superior com Barra de Progresso, Status de IA e Ações */}
      <HudTopBar
        sector={sector}
        config={config}
        onOpenQuestModal={() => setIsQuestModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetSector={handleResetSector}
        isConnected={isConnected}
      />

      {/* Painel de Controles de Rotação 2.5D do Globo */}
      <GlobeControls
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onResetView={handleResetView}
        isAutoRotating={isAutoRotating}
        onToggleAutoRotate={handleToggleAutoRotate}
        isTiltShiftEnabled={isTiltShiftEnabled}
        onToggleTiltShift={handleToggleTiltShift}
      />

      {/* Camada 3: Inspetor do Agente / Estrutura */}
      <AgentInspector
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => setSelectedAgentId(id)}
        selectedBuilding={selectedBuilding}
        onRepairAgent={handleRepairAgent}
        onClose={() => setSelectedBuilding(null)}
      />

      {/* Camada 4: Combat Log Retrô */}
      <CombatLog logs={logs} />

      {/* Camada 5: Retrato no Canto Inferior Esquerdo da HUD */}
      <HudPortrait
        activeAgent={agents.find((a) => a.id === selectedAgentId) || agents[0]}
        onOpenInspector={() => {
          if (!selectedAgentId && agents[0]) {
            setSelectedAgentId(agents[0].id);
          }
        }}
      />

      {/* Modal de Despacho de Quests */}
      <QuestModal
        buildings={buildings}
        agents={agents}
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onDispatch={handleDispatchQuest}
      />

      {/* Modal de Configuração de Chaves de IA */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
