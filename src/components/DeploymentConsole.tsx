import { useState, useEffect } from "react";
import { ArrowUpCircle, RotateCcw, CheckCircle2, AlertTriangle, Play, RefreshCw } from "lucide-react";

interface DeploymentConsoleProps {
  scenarioId: string;
  onLogMessage: (msg: string, service: string, level: "INFO" | "WARNING" | "CRITICAL") => void;
  onRollbackComplete: () => void;
  triggerCrashLoop: () => void;
}

export default function DeploymentConsole({
  scenarioId,
  onLogMessage,
  onRollbackComplete,
  triggerCrashLoop,
}: DeploymentConsoleProps) {
  const [activeStep, setActiveStep] = useState<number>(0); // 0: idle, 1: build, 2: test, 3: canary, 4: prod_rollout, 5: completed, -1: failed
  const [currentVersion, setCurrentVersion] = useState<string>("v2.1.3 (안정)");
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [rollbackStatus, setRollbackStatus] = useState<"idle" | "rolling_back" | "success">("idle");

  const addDeployLog = (msg: string) => {
    setDeployLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Handle deployments
  const handleStartDeploy = () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setActiveStep(1);
    setDeployLogs([]);
    setRollbackStatus("idle");
    onLogMessage("Release v2.1.4-beta 배포 파이프라인이 즉각 시작되었습니다.", "orchestrator", "INFO");

    addDeployLog("🚀 배포 파이프라인 트리거됨: Release v2.1.4");
  };

  useEffect(() => {
    if (!isDeploying || activeStep <= 0 || activeStep > 4) return;

    const timer = setTimeout(() => {
      if (activeStep === 1) {
        addDeployLog("🔨 코드 빌드 성공: ESBuild 번들 파일 생성 완료 (340ms)");
        setActiveStep(2);
      } else if (activeStep === 2) {
        addDeployLog("🧪 자동 테스트 성공: Unit Tests 148/148 PASS, Integration Tests PASS");
        setActiveStep(3);
      } else if (activeStep === 3) {
        if (scenarioId === "CRASH_LOOP") {
          addDeployLog("❌ 카나리 헬스체크 실패! web-v2.1.4 컨테이너 비정상 종료 (Exit Code 1)");
          addDeployLog("⚠️ 원인: 필수 환경 변수 'DB_PASS' 누락으로 인한 NullPointerException");
          setActiveStep(-1);
          setIsDeploying(false);
          triggerCrashLoop();
          onLogMessage("배포 실패! v2.1.4가 예외 코드 1로 충돌했습니다. 온콜 경보를 트리거합니다.", "orchestrator", "CRITICAL");
        } else {
          addDeployLog("🐤 카나리 10% 롤아웃 성공: 트래픽 유입 정상 및 Latency < 150ms");
          setActiveStep(4);
        }
      } else if (activeStep === 4) {
        addDeployLog("🎉 실서버 100% 점진적 롤아웃 및 부하 분산 스케일링 성공!");
        setCurrentVersion("v2.1.4 (최신)");
        setActiveStep(5);
        setIsDeploying(false);
        onLogMessage("배포가 성공적으로 완료되었습니다. 시스템이 v2.1.4 버전으로 업데이트되었습니다.", "orchestrator", "INFO");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [activeStep, isDeploying, scenarioId]);

  // Handle rollback
  const handleRollback = () => {
    if (rollbackStatus === "rolling_back") return;
    setRollbackStatus("rolling_back");
    addDeployLog("🔄 긴급 원클릭 롤백 매커니즘 트리거됨! v2.1.3(안정) 버전 회귀 복구 중...");
    onLogMessage("롤백 명령이 수신되었습니다. 오케스트레이터가 v2.1.3 버전으로 트래픽을 회귀합니다.", "orchestrator", "WARNING");

    setTimeout(() => {
      setRollbackStatus("success");
      setCurrentVersion("v2.1.3 (안정)");
      setActiveStep(0);
      setIsDeploying(false);
      addDeployLog("✅ 롤백 완료! 시스템이 안전 버전 v2.1.3으로 100% 복구되었습니다.");
      onLogMessage("시스템 롤백이 성공적으로 완료되었습니다. 트래픽이 v2.1.3 건강한 노드로 복구되었습니다.", "orchestrator", "INFO");
      onRollbackComplete();
    }, 1800);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-200 font-semibold text-base flex items-center gap-2">
          <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
          배포 및 롤백 자동화 콘솔
        </h3>
        <div className="px-3 py-1 bg-zinc-800 text-zinc-300 font-mono text-xs rounded-full border border-zinc-700">
          현재 버전: <span className="text-emerald-400 font-bold">{currentVersion}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Left pane: Control & Workflow steps */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              수작업과 잦은 롤백으로 인한 월 50시간의 공수를 단 1초 만에 해결하는 SRE 오케스트레이션 기능입니다. 신규 빌드 배포 중 장애 발생 시, 인프라 차단과 복구 과정을 완전히 자동화합니다.
            </p>

            {/* Stepper */}
            <div className="space-y-2.5 mt-2">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${activeStep >= 1 ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"}`}>1</div>
                <span className={`text-xs ${activeStep >= 1 ? "text-emerald-400 font-medium" : "text-zinc-400"}`}>코드 통합 & 빌드 (ESBuild)</span>
                {activeStep === 1 && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin ml-auto" />}
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${activeStep >= 2 ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"}`}>2</div>
                <span className={`text-xs ${activeStep >= 2 ? "text-emerald-400 font-medium" : "text-zinc-400"}`}>자동화 테스트 실행</span>
                {activeStep === 2 && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin ml-auto" />}
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${activeStep === -1 ? "bg-rose-500 text-white font-bold" : activeStep >= 3 ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"}`}>3</div>
                <span className={`text-xs ${activeStep === -1 ? "text-rose-400 font-bold" : activeStep >= 3 ? "text-emerald-400 font-medium" : "text-zinc-400"}`}>카나리 롤아웃 (Canary 10%)</span>
                {activeStep === 3 && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin ml-auto" />}
                {activeStep === -1 && <AlertTriangle className="w-4 h-4 text-rose-500 ml-auto animate-pulse" />}
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${activeStep >= 4 ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"}`}>4</div>
                <span className={`text-xs ${activeStep >= 4 ? "text-emerald-400 font-medium" : "text-zinc-400"}`}>실서버 전면 가동 (Production Scaling)</span>
                {activeStep === 4 && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin ml-auto" />}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleStartDeploy}
              disabled={isDeploying || activeStep === -1}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
                isDeploying || activeStep === -1
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50"
                  : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 border border-emerald-400"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              v2.1.4 배포 시작
            </button>

            <button
              onClick={handleRollback}
              disabled={activeStep !== -1 && scenarioId !== "CRASH_LOOP" && currentVersion !== "v2.1.4 (최신)"}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs border transition-all ${
                activeStep === -1 || scenarioId === "CRASH_LOOP"
                  ? "bg-rose-950/80 text-rose-300 hover:bg-rose-900 border-rose-500 animate-pulse"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${rollbackStatus === "rolling_back" ? "animate-spin" : ""}`} />
              원클릭 긴급 롤백
            </button>
          </div>
        </div>

        {/* Right pane: Real-time Orchestration Logs */}
        <div className="bg-black/40 border border-zinc-800/80 rounded-lg p-3 font-mono text-[10.5px] leading-relaxed flex flex-col h-48 md:h-auto overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 mb-2">
            <span className="text-zinc-500 text-[10px]">배포 이벤트 파이프라인</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isDeploying ? "bg-amber-400 animate-ping" : "bg-zinc-600"}`} />
              <span className="text-zinc-500 text-[9px]">{isDeploying ? "진행 중" : "대기 상태"}</span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {deployLogs.length === 0 ? (
              <div className="text-zinc-600 h-full flex items-center justify-center italic">
                배포를 시작하면 파이프라인 로그가 여기에 출력됩니다.
              </div>
            ) : (
              deployLogs.map((log, i) => {
                let colorClass = "text-zinc-400";
                if (log.includes("❌") || log.includes("⚠️")) colorClass = "text-rose-400 font-medium";
                if (log.includes("🚀") || log.includes("🎉") || log.includes("✅")) colorClass = "text-emerald-400 font-semibold";
                return (
                  <div key={i} className={`whitespace-pre-wrap ${colorClass}`}>
                    {log}
                  </div>
                );
              })
            )}
            {rollbackStatus === "rolling_back" && (
              <div className="text-amber-400 font-semibold animate-pulse">
                [ORCHESTRATOR] ⚠️ 즉시 롤백 조치 가동: 파드 트래픽 완전 차단 및 이전 릴리즈 전환 중...
              </div>
            )}
            {rollbackStatus === "success" && (
              <div className="text-emerald-400 font-bold">
                [ORCHESTRATOR] ✅ 시스템 복구 완료! 모든 트래픽이 v2.1.3 안전 노드로 포워딩되었습니다. (복구시간: 0.8s)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
