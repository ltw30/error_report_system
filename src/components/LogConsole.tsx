import { useState, useRef, useEffect } from "react";
import { Terminal, FileText, Download, Sparkles, Copy, Check, RefreshCw } from "lucide-react";
import { LogEntry } from "../types";

interface LogConsoleProps {
  logs: LogEntry[];
  currentScenarioName: string;
  scenarioId: string;
  onClearLogs: () => void;
  systemState: {
    cpu: number;
    memory: number;
    latency: number;
  };
}

interface SreReport {
  rootCause: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  summary: string;
  playbook: string[];
  actionTaken: string;
  reportMarkdown: string;
}

export default function LogConsole({
  logs,
  currentScenarioName,
  scenarioId,
  onClearLogs,
  systemState,
}: LogConsoleProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<SreReport | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [markdownView, setMarkdownView] = useState<boolean>(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom when new logs stream in
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Clear report if the scenario is reset or healthy
  useEffect(() => {
    if (scenarioId === "HEALTHY") {
      setReport(null);
    }
  }, [scenarioId]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport(null);

    const logString = logs
      .map((l) => `[${l.timestamp}] [${l.service.toUpperCase()}] [${l.level}] ${l.message}`)
      .join("\n");

    try {
      const response = await fetch("/api/analyze-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: logString,
          systemState,
          incidentScenario: currentScenarioName,
        }),
      });

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error("Failed to generate AI SRE post-mortem report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([report.reportMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SRE_Incident_Report_${scenarioId}_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-200 font-semibold text-base flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          실시간 시스템 로그 & AI 장애 분석기
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="px-2.5 py-1 text-zinc-500 hover:text-zinc-300 font-mono text-[10.5px] border border-zinc-800 hover:border-zinc-700 rounded transition-colors"
          >
            로그 클리어
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-100 text-xs font-bold rounded-lg transition-all border border-indigo-400"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "AI 분석 중..." : "AI 장애 보고서 자동 생성"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-[350px]">
        {/* Left Column: Live SRE Console/Terminal */}
        <div className="bg-black/65 border border-zinc-800/80 rounded-lg p-4 font-mono text-xs flex flex-col justify-between h-[450px] xl:h-auto overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
            <span className="text-indigo-400 font-semibold text-[10px] tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              SRE_실시간_로그_스트림.log
            </span>
            <span className="text-zinc-600 text-[10px]">시나리오: {scenarioId}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {logs.length === 0 ? (
              <div className="text-zinc-600 italic h-full flex items-center justify-center">
                실시간 수집 로그가 존재하지 않습니다. 상단 시나리오 주입기로 장애를 발생시켜보세요.
              </div>
            ) : (
              logs.map((log, i) => {
                let levelBadge = "bg-zinc-800 text-zinc-400";
                let textStyle = "text-zinc-300";

                if (log.level === "CRITICAL") {
                  levelBadge = "bg-rose-950/80 text-rose-400 border border-rose-800";
                  textStyle = "text-rose-200 font-medium";
                } else if (log.level === "WARNING") {
                  levelBadge = "bg-amber-950/80 text-amber-400 border border-amber-800";
                  textStyle = "text-amber-200";
                }

                return (
                  <div key={i} className="flex items-start gap-2.5 text-[11px] leading-relaxed group">
                    <span className="text-zinc-600 text-[10px] select-none shrink-0">{log.timestamp}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide uppercase shrink-0 ${levelBadge}`}>
                      {log.level}
                    </span>
                    <span className="text-indigo-300 font-semibold shrink-0">[{log.service}]</span>
                    <span className={`whitespace-pre-wrap ${textStyle}`}>{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>

        {/* Right Column: AI SRE Post-Mortem and Action Items */}
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 flex flex-col h-[450px] xl:h-auto overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              <p className="text-zinc-300 font-medium text-sm">Gemini AI가 장애 패턴을 심층 분석하고 있습니다...</p>
              <p className="text-zinc-500 text-xs mt-1 max-w-sm">
                수집된 {logs.length}개의 SRE 로그, 메트릭 추이, 그리고 서비스 토폴로지 연관성을 추론하여 근본원인(RCA) 보고서 초안을 도출 중입니다.
              </p>
            </div>
          ) : !report ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-800 rounded-lg">
              <FileText className="w-10 h-10 text-zinc-700 mb-2" />
              <p className="text-zinc-400 font-medium text-xs">AI 포스트모템 분석 보고서 대기 중</p>
              <p className="text-zinc-500 text-[11px] mt-1.5 max-w-sm">
                우측 상단의 [AI 장애 보고서 자동 생성] 버튼을 클릭하면, 수동 작성에 수 시간이 소요되는 SRE 사고 보고서(Post-Mortem)가 Gemini API를 통해 즉각 마크다운 포맷으로 편찬됩니다.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header inside Report Box */}
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${report.severity === "CRITICAL" ? "bg-rose-500" : "bg-amber-500"}`} />
                  <span className="text-zinc-200 text-xs font-semibold">AI SRE 장애 사후 보고서</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMarkdownView(!markdownView)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10.5px] font-medium rounded text-zinc-300 transition-colors"
                  >
                    {markdownView ? "플레이북 보기" : "보고서 원문 보기"}
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10.5px] font-bold rounded text-zinc-100 transition-colors border border-indigo-400"
                  >
                    <Download className="w-3.5 h-3.5" />
                    내보내기 (.md)
                  </button>
                </div>
              </div>

              {/* Scrollable Report Content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 text-xs">
                {markdownView ? (
                  /* SRE Markdown report preview */
                  <div className="space-y-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                      <div className="text-[10px] text-zinc-500 font-bold font-mono">장애 근본 원인 분석 (RCA)</div>
                      <div className="text-zinc-200 font-semibold mt-0.5">{report.rootCause}</div>
                      <div className="text-zinc-400 mt-2 text-[11px] leading-relaxed">{report.summary}</div>
                    </div>

                    <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed font-sans border border-zinc-800/60 rounded-lg p-4 bg-zinc-950/30">
                      {/* Simple custom markdown renderer inside the scroll wrapper */}
                      <pre className="whitespace-pre-wrap font-mono text-[11px] text-zinc-300 leading-relaxed">
                        {report.reportMarkdown}
                      </pre>
                    </div>
                  </div>
                ) : (
                  /* Action command playbook list */
                  <div className="space-y-3">
                    <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
                      <h4 className="text-amber-400 font-bold text-xs mb-1">💡 자동 탐지 및 조치 이력</h4>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        시스템 복구를 완료하기 위해 적용된 긴급 조치: <span className="text-amber-200 font-semibold underline">{report.actionTaken}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-zinc-300 font-semibold text-xs flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-zinc-400" />
                        AI 추천 SRE 터미널 해결 명령어 & 가이드
                      </h4>
                      <p className="text-zinc-500 text-[10px]">SRE 담당자가 수동 복구할 때 사용할 수 있는 고속 CLI 해결책입니다. 복사하여 터미널에 전달하세요.</p>
                      <div className="space-y-2">
                        {report.playbook.map((step, idx) => (
                          <div key={idx} className="bg-black/50 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between group">
                            <span className="font-mono text-[10.5px] text-zinc-300 flex-1 pr-4 whitespace-pre-wrap">{step}</span>
                            <button
                              onClick={() => handleCopyCommand(step, idx)}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors shrink-0"
                              title="클립보드 복사"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
