import { useState, useEffect, useRef, useCallback } from "react";
import {
  Server,
  Activity,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckCircle,
  Play,
  Heart,
  FileText,
  Clock,
  ShieldAlert,
  Zap,
  Check
} from "lucide-react";
import { SCENARIOS, ScenarioType, LogEntry, MetricPoint } from "./types";
import RealTimeChart from "./components/RealTimeChart";
import DeploymentConsole from "./components/DeploymentConsole";
import CapacityPlanner from "./components/CapacityPlanner";
import LogConsole from "./components/LogConsole";
import OnCallPlaybook from "./components/OnCallPlaybook";

export default function App() {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>("HEALTHY");
  const [monitoringInterval, setMonitoringInterval] = useState<number>(1); // Seconds: 1, 5, 10
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<MetricPoint>({
    cpu: 28,
    memory: 44,
    network: 18,
    latency: 52,
  });

  // Preventive & Anomaly detection states
  const [isAnomalyDetected, setIsAnomalyDetected] = useState<boolean>(false);
  const [preventiveApplied, setPreventiveApplied] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>("");

  // Refs for tracking mutable leak state
  const memLeakRef = useRef<number>(44);

  // Helper to append a log dynamically
  const addLogMessage = useCallback((msg: string, service: string, level: "INFO" | "WARNING" | "CRITICAL") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, service, level, message: msg }]);
  }, []);

  // Trigger preventative action
  const handleApplyPreventative = () => {
    const active = SCENARIOS[activeScenario];
    if (!active.preventativeAction) return;

    setPreventiveApplied(true);
    addLogMessage(`[AI SRE Sentinel] 선제적 조치 강제 집행: ${active.preventativeAction}`, "sre-agent", "INFO");
    addLogMessage("시스템 부하 회로 복구 및 오토스케일러 예비 인스턴스 전면 배치 완료.", "sre-agent", "INFO");

    // Heal the metrics slightly
    setCurrentMetrics((prev) => ({
      ...prev,
      cpu: Math.max(prev.cpu - 25, 30),
      memory: activeScenario === "MEMORY_LEAK" ? 50 : prev.memory,
      latency: Math.max(prev.latency / 3, 120),
    }));

    // Alert completion toast
    setNotificationMsg("🚨 AI 선제적 장애 예방 조치가 성공적으로 적용되어 인프라가 임시 안정화되었습니다!");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Switch scenario handler
  const handleScenarioChange = (id: ScenarioType) => {
    setActiveScenario(id);
    setPreventiveApplied(false);
    const scenario = SCENARIOS[id];

    // Seed logs for the chosen scenario
    const timestampedLogs = scenario.logs.map((log) => ({
      ...log,
      timestamp: new Date().toLocaleTimeString(),
    }));
    setLogs(timestampedLogs);

    if (id !== "HEALTHY") {
      setIsAnomalyDetected(true);
      addLogMessage(`[이상 징후 탐지] 시스템 토폴로지 내에서 비정상 패턴 인식 스코어 94.2% 도출.`, "sre-agent", "WARNING");
      addLogMessage(`예방 제안: ${scenario.triggerWarning}`, "sre-agent", "WARNING");

      // Visual toast alarm
      setNotificationMsg(`⚠️ 이상 탐지: ${scenario.triggerWarning}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4500);
    } else {
      setIsAnomalyDetected(false);
      addLogMessage("인프라 가드가 정상(Healthy) 상태 검증을 완료하였습니다.", "sre-agent", "INFO");
    }

    // Reset memory leak initial accumulation point
    memLeakRef.current = 44;
  };

  // Automatic Rollback Complete hook from Deploy component
  const handleRollbackComplete = () => {
    setActiveScenario("HEALTHY");
    setIsAnomalyDetected(false);
    setPreventiveApplied(false);
    memLeakRef.current = 44;

    setCurrentMetrics({
      cpu: 28,
      memory: 44,
      network: 18,
      latency: 52,
    });
  };

  const triggerCrashLoopFromDeploy = () => {
    setActiveScenario("CRASH_LOOP");
    setIsAnomalyDetected(true);
    setPreventiveApplied(false);

    setNotificationMsg("🚨 배포 실패! 새 컨테이너가 CrashLoopBackOff 상태에 빠졌습니다. 원클릭 롤백이 요구됩니다.");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Generate dynamic telemetry metrics in real-time depending on selected scenario
  useEffect(() => {
    const generateTelemetry = () => {
      let cpu = 28;
      let memory = 44;
      let network = 18;
      let latency = 52;

      switch (activeScenario) {
        case "HEALTHY":
          cpu = 25 + Math.random() * 8;
          memory = 42 + Math.random() * 3;
          network = 15 + Math.random() * 10;
          latency = 45 + Math.random() * 20;
          break;
        case "LATENCY_SPIKE":
          // If preventive was applied, reduce the impact
          cpu = preventiveApplied ? 38 + Math.random() * 8 : 72 + Math.random() * 12;
          memory = 45 + Math.random() * 4;
          network = 145 + Math.random() * 25;
          latency = preventiveApplied ? 150 + Math.random() * 50 : 3800 + Math.random() * 600;
          break;
        case "MEMORY_LEAK":
          cpu = 40 + Math.random() * 10;
          // Slowly accumulate memory over time
          if (!preventiveApplied) {
            memLeakRef.current = Math.min(memLeakRef.current + (monitoringInterval === 1 ? 1.5 : monitoringInterval === 5 ? 4 : 8), 98.4);
          } else {
            memLeakRef.current = Math.max(memLeakRef.current - 1.2, 52);
          }
          memory = memLeakRef.current;
          network = 25 + Math.random() * 15;
          latency = 120 + Math.random() * 40;
          break;
        case "DB_POOL_EXHAUSTED":
          cpu = preventiveApplied ? 45 + Math.random() * 8 : 88 + Math.random() * 8;
          memory = 78 + Math.random() * 3;
          network = preventiveApplied ? 60 + Math.random() * 10 : 8 + Math.random() * 6;
          latency = preventiveApplied ? 180 + Math.random() * 30 : 4950 + Math.random() * 50;
          break;
        case "CRASH_LOOP":
          cpu = 4 + Math.random() * 2;
          memory = 5 + Math.random() * 2;
          network = 0;
          latency = 0;
          break;
      }

      const nextMetricPoint = { cpu, memory, network, latency };
      setCurrentMetrics(nextMetricPoint);

      // Append to graph history
      setMetricsHistory((prev) => {
        const nextHist = [...prev, nextMetricPoint];
        if (nextHist.length > 15) {
          nextHist.shift(); // Max 15 points in slider
        }
        return nextHist;
      });

      // Occasional random safe log generation if system is healthy
      if (activeScenario === "HEALTHY" && Math.random() > 0.7) {
        const services = ["gateway", "auth", "order", "inventory", "payment"];
        const chosen = services[Math.floor(Math.random() * services.length)];
        const messages = [
          `Ping status checked: safe response from ${chosen}`,
          `Cache sync OK for key: usr_session_${Math.floor(Math.random() * 1000)}`,
          `Heartbeat verified on pod-${chosen}-replica-a`,
          `Connection pooling health: active/idle (2/20)`
        ];
        addLogMessage(messages[Math.floor(Math.random() * messages.length)], chosen, "INFO");
      }
    };

    // Run immediately once
    generateTelemetry();

    // Start interval
    const intervalMs = monitoringInterval * 1000;
    const timer = setInterval(generateTelemetry, intervalMs);

    return () => clearInterval(timer);
  }, [activeScenario, monitoringInterval, preventiveApplied, addLogMessage]);

  // Seed default logging stream on startup
  useEffect(() => {
    handleScenarioChange("HEALTHY");
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Toast Alert Panel */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <h5 className="text-zinc-200 font-bold text-xs">SRE Sentinel 알람 센터</h5>
              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">{notificationMsg}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <header className="bg-zinc-900/60 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-950/40">
              <Server className="w-5.5 h-5.5 text-zinc-950 font-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-zinc-100">SRE Sentinel</h1>
                <span className="text-[10px] bg-indigo-950 border border-indigo-800/80 px-1.5 py-0.5 rounded text-indigo-300 font-bold uppercase tracking-wider">
                  지능형 통합 플랫폼
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">실시간 AI 이상 탐지, 원클릭 자동 롤백 및 다각도 로그 장애 보고서 생성기</p>
            </div>
          </div>

          {/* Monitoring Interval Controls */}
          <div className="flex items-center gap-3.5 bg-zinc-950/40 border border-zinc-800 rounded-xl p-2 shrink-0">
            <span className="text-[11px] text-zinc-400 font-semibold font-mono flex items-center gap-1.5 ml-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              모니터링 주기:
            </span>
            <div className="flex gap-1">
              {[1, 5, 10].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setMonitoringInterval(sec);
                    addLogMessage(`모니터링 해상도를 ${sec}초 단위로 세분화 업데이트하였습니다.`, "sre-agent", "INFO");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    monitoringInterval === sec
                      ? "bg-indigo-600 text-zinc-100 shadow-md border border-indigo-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main body area */}
      <main className="max-w-7xl mx-auto p-6 space-y-6 w-full flex-1">
        
        {/* Scenario injector panel (System Event Controller) */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <h3 className="text-zinc-200 font-semibold text-sm flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-400" />
              SRE 장애 및 이벤트 시나리오 주입 시뮬레이터 (Sandbox)
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">이상 징후 및 자동 대응 검증을 위한 장애 선택</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.values(SCENARIOS).map((scenario) => {
              const isActive = activeScenario === scenario.id;
              let btnClass = "bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300";
              
              if (isActive) {
                if (scenario.severity === "CRITICAL") {
                  btnClass = "bg-rose-950/80 border-rose-500 text-rose-100 font-bold shadow-lg shadow-rose-950/30";
                } else if (scenario.severity === "WARNING") {
                  btnClass = "bg-amber-950/80 border-amber-500 text-amber-100 font-bold shadow-lg shadow-amber-950/30";
                } else {
                  btnClass = "bg-indigo-950/80 border-indigo-500 text-indigo-100 font-bold shadow-lg shadow-indigo-950/30";
                }
              }

              return (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioChange(scenario.id)}
                  className={`border rounded-xl p-3 text-left transition-all duration-200 flex flex-col justify-between h-24 relative ${btnClass}`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-[11.5px] font-bold leading-tight line-clamp-1">{scenario.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-current shrink-0" />}
                  </div>
                  <p className="text-[9.5px] text-zinc-400 leading-normal line-clamp-2 mt-1">{scenario.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* AI Predictive Warning Bar */}
        {isAnomalyDetected && !preventiveApplied && (
          <div className="bg-gradient-to-r from-amber-950/50 via-rose-950/30 to-amber-950/50 border border-amber-500/60 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    [AI 이상 예측 알람: 실시간 선제 예방 경보]
                  </span>
                  <span className="text-[9.5px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                    이상 조짐 감지
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-medium mt-1">
                  사전 탐지: <span className="text-amber-300 font-semibold">{SCENARIOS[activeScenario].triggerWarning}</span>
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">실제 크리티컬 장애가 인프라를 다운시키기 전, AI가 감지한 예방책을 선제 조치하여 야간 온콜 콜아웃을 회피하십시오.</p>
              </div>
            </div>
            <button
              onClick={handleApplyPreventative}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold rounded-lg shrink-0 transition-all border border-amber-300"
            >
              <Zap className="w-4 h-4 fill-current animate-bounce" />
              자동 사전 예방조치 즉각 집행
            </button>
          </div>
        )}

        {/* Preventative Applied Success Message */}
        {preventiveApplied && (
          <div className="bg-emerald-950/20 border border-emerald-500/50 rounded-xl p-4 shadow-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-400 font-mono">[AI 인프라 예방 보호 기동 완료]</p>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                임시 가동 우회 회로가 활성화되었습니다. 리소스 포화를 억제하고 장애를 사전 격격하였습니다. 로깅 탭에서 Post-Mortem 보고서를 즉시 작성해 보십시오.
              </p>
            </div>
          </div>
        )}

        {/* Two Columns Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Real-time Telemetry (Left, spans 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RealTimeChart
                data={metricsHistory}
                metricType="compute"
                label="시스템 컴퓨트 메트릭"
              />
              <RealTimeChart
                data={metricsHistory}
                metricType="network"
                label="네트워크 대역 및 호출 지연율"
              />
            </div>

            {/* Deployment & Rollback Module */}
            <DeploymentConsole
              scenarioId={activeScenario}
              onLogMessage={addLogMessage}
              onRollbackComplete={handleRollbackComplete}
              triggerCrashLoop={triggerCrashLoopFromDeploy}
            />
          </div>

          {/* On-Call & Instant Notification module (Right, spans 1 col) */}
          <div className="lg:col-span-1">
            <OnCallPlaybook
              scenarioId={activeScenario}
              severity={SCENARIOS[activeScenario].severity}
              alertMessage={
                activeScenario === "HEALTHY"
                  ? "안전: 시스템이 최적의 상태를 상회하고 있습니다."
                  : SCENARIOS[activeScenario].triggerWarning || "경고: 이상 데이터 징후 수집 중."
              }
            />
          </div>
        </div>

        {/* Capacity planning predictions */}
        <section>
          <CapacityPlanner currentMetrics={currentMetrics} />
        </section>

        {/* SRE Terminal Logs & AI Post-Mortem builder */}
        <section>
          <LogConsole
            logs={logs}
            currentScenarioName={SCENARIOS[activeScenario].name}
            scenarioId={activeScenario}
            onClearLogs={() => setLogs([])}
            systemState={currentMetrics}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 px-6 bg-zinc-950 mt-12 text-center text-xs text-zinc-500 font-mono">
        <p>© 2026 SRE Sentinel 플랫폼. 지능형 SRE 가드 및 인프라 자율 대응 시스템.</p>
        <p className="text-[10px] text-zinc-600 mt-1">실시간 텔레메트리 갱신 주기: {monitoringInterval}초 • 고정밀 가상 모의 훈련 샌드박스</p>
      </footer>
    </div>
  );
}
