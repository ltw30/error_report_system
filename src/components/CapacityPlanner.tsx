import { useState } from "react";
import { Database, AlertCircle, TrendingUp, Sparkles, CheckSquare, Server, Calendar } from "lucide-react";

interface CapacityPlannerProps {
  currentMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    ingress: number;
  };
}

interface CapacityForecast {
  forecastMonth: string;
  daysToSaturation: number;
  analysis: string;
  recommendations: string[];
  predictedDataPoints: Array<{
    name: string;
    cpu: number;
    disk: number;
    memory: number;
  }>;
}

export default function CapacityPlanner({ currentMetrics }: CapacityPlannerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [forecast, setForecast] = useState<CapacityForecast | null>(null);

  const handleFetchForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/predict-capacity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMetrics: {
            cpu: Math.round(currentMetrics.cpu),
            memory: Math.round(currentMetrics.memory),
            disk: 74, // Base static disk utilization simulation %
            ingress: 125, // Base dynamic ingress simulation GB/day
          },
          daysOfHistory: 30,
        }),
      });

      const data = await response.json();
      setForecast(data);
    } catch (err) {
      console.error("Failed to fetch capacity forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-200 font-semibold text-base flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          AI 인프라 용량 계획 & 예측 (Capacity Planning)
        </h3>
        <button
          onClick={handleFetchForecast}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-bold rounded-lg transition-all border border-amber-300"
        >
          <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "AI 분석 중..." : "AI 용량 예측 가동"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Current Usage Stats & Progress */}
        <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-lg p-4 space-y-4">
          <h4 className="text-zinc-400 text-xs font-mono flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-zinc-500" />
            실시간 인프라 리소스 점유 현황
          </h4>

          {/* CPU Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">인스턴스 CPU 부하</span>
              <span className="text-zinc-200 font-bold">{currentMetrics.cpu.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentMetrics.cpu > 80 ? "bg-rose-500" : currentMetrics.cpu > 60 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${currentMetrics.cpu}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">성장 트렌드: 월평균 +2.5% 상승 추이</p>
          </div>

          {/* Memory Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">메모리 점유율 (Heap/RAM)</span>
              <span className="text-zinc-200 font-bold">{currentMetrics.memory.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentMetrics.memory > 85 ? "bg-rose-500" : currentMetrics.memory > 70 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${currentMetrics.memory}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">성장 트렌드: 월평균 +4.0% 캐시 소모 증가</p>
          </div>

          {/* Disk Space Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">스토리지 디스크 용량 (v_db_data)</span>
              <span className="text-zinc-200 font-bold">74%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "74%" }} />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">성장 트렌드: 월평균 +6.5GB 로그 축적</p>
          </div>
        </div>

        {/* Center & Right columns: AI Projection Results */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          {!forecast ? (
            <div className="border border-dashed border-zinc-800 rounded-lg flex-1 flex flex-col items-center justify-center p-6 text-center">
              <TrendingUp className="w-8 h-8 text-zinc-600 mb-2 animate-bounce" />
              <p className="text-zinc-300 font-medium text-xs">AI 예측 데이터가 부재합니다.</p>
              <p className="text-zinc-500 text-[11px] mt-1 max-w-sm">
                상단의 [AI 용량 예측 가동] 버튼을 누르면, Gemini AI 모델이 과거 30일 트렌드를 학습하여 시스템 포화일과 임계점을 안전하게 선제 도출합니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              {/* Stat highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-amber-400 font-semibold font-mono">가장 먼저 포화될 자원 시점</p>
                    <p className="text-sm font-bold text-zinc-100 mt-0.5">{forecast.forecastMonth}</p>
                  </div>
                </div>

                <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-3 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-rose-400 font-semibold font-mono">자원 임계치(100%) 도달 잔여일</p>
                    <p className="text-sm font-bold text-zinc-100 mt-0.5">약 {forecast.daysToSaturation}일 남음</p>
                  </div>
                </div>
              </div>

              {/* Forecast graph (Future projection) */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3.5">
                <p className="text-[10px] text-zinc-500 font-mono mb-2">90일 리소스 임계 포화 곡선 예측 (AI 시뮬레이션)</p>
                <div className="h-28 flex items-end gap-3 pt-3">
                  {forecast.predictedDataPoints.map((pt, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex justify-center gap-1 mb-1.5 h-16 items-end">
                        {/* CPU Bar */}
                        <div
                          className="w-2.5 bg-emerald-500/80 rounded-t-sm transition-all duration-1000"
                          style={{ height: `${Math.min(pt.cpu, 100)}%` }}
                          title={`CPU: ${pt.cpu}%`}
                        />
                        {/* Disk Bar */}
                        <div
                          className="w-2.5 bg-amber-500/80 rounded-t-sm transition-all duration-1000"
                          style={{ height: `${Math.min(pt.disk, 100)}%` }}
                          title={`Disk: ${pt.disk}%`}
                        />
                        {/* Memory Bar */}
                        <div
                          className="w-2.5 bg-purple-500/80 rounded-t-sm transition-all duration-1000"
                          style={{ height: `${Math.min(pt.memory, 100)}%` }}
                          title={`Memory: ${pt.memory}%`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono font-semibold">{pt.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4 text-[9px] font-mono mt-3 border-t border-zinc-800/60 pt-2 text-zinc-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500/80 rounded-sm" />CPU</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500/80 rounded-sm" />스토리지</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500/80 rounded-sm" />메모리</span>
                </div>
              </div>

              {/* Recommendations list */}
              <div className="space-y-2 mt-2">
                <h5 className="text-zinc-300 text-xs font-semibold flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  AI 예방적 조치 권장 체크리스트 (On-Call 리스크 완화)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {forecast.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 bg-zinc-950/30 border border-zinc-800/40 p-2 rounded-lg">
                      <input type="checkbox" className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900 w-3 h-3" />
                      <span className="text-[10.5px] text-zinc-400 leading-tight">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis comment */}
              <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/20 border border-zinc-800 p-2.5 rounded-lg mt-2">
                <span className="text-amber-400 font-bold">SRE AI 종합 진단: </span>
                {forecast.analysis}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
