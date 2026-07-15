import { useState } from "react";
import { Shield, Bell, Send, CheckCircle2, User, Clock, AlertOctagon } from "lucide-react";
import { Severity } from "../types";

interface OnCallPlaybookProps {
  scenarioId: string;
  severity: Severity;
  alertMessage: string;
}

export default function OnCallPlaybook({ scenarioId, severity, alertMessage }: OnCallPlaybookProps) {
  const [slackSent, setSlackSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDispatchAlert = () => {
    if (!alertMessage) return;
    setLoading(true);
    setTimeout(() => {
      setSlackSent(true);
      setLoading(false);
      setTimeout(() => setSlackSent(false), 4000);
    }, 1200);
  };

  // Dynamic troubleshooting recommendation based on scenario
  const getPlaybookGuide = () => {
    switch (scenarioId) {
      case "HEALTHY":
        return {
          title: "안정 상태 유지 관리",
          steps: [
            "주기적인 데이터베이스 백업 헬스 체크 확인",
            "애플리케이션 로그 레벨 'INFO' 기본값 점검",
            "쿠버네티스 노드 오토스케일러 예비 마진 체크"
          ],
          aiTip: "현재 모든 시스템 자원이 골디락스 존에 있습니다. 안심하고 정기 백업 일정만 관측하십시오."
        };
      case "LATENCY_SPIKE":
        return {
          title: "API 지연 급증 긴급 가이드",
          steps: [
            "외부 결제 대행사(PG) 소켓 타임아웃을 1500ms로 임시 하향 조정",
            "인프라 내 Gateway 서비스의 회선 대역폭 스케일아웃 적용",
            "지연 API 응답 결과 캐싱 강제 활성화 (Redis TTL 5분)"
          ],
          aiTip: "주 원인은 외부 연동 응답의 연쇄 병목입니다. 서킷 브레이커 가동 상태를 주시하고, 필요 시 수동 강제 오픈을 집행하세요."
        };
      case "MEMORY_LEAK":
        return {
          title: "메모리 누수(OOM) 완화 가이드",
          steps: [
            "Inventory 파드의 메모리 상한값 임시 증설 (2Gi -> 4Gi)",
            "점진적 메모리 회수를 위한 노드 데몬셋 가동",
            "가상 머신 힙 프로파일링 덤프 트리거 및 수집"
          ],
          aiTip: "가비지 컬렉션(GC) 주기가 매우 빈번해진 상태입니다. 힙 덤프를 백그라운드 수집한 뒤, 해당 파드를 예비 파드로 자동 점진 교체하세요."
        };
      case "DB_POOL_EXHAUSTED":
        return {
          title: "데이터베이스 커넥션 복원 가이드",
          steps: [
            "HikariCP 커넥션 풀 크기 즉시 확장 조치",
            "마스터 데이터베이스 CPU 부하 및 슬로우 쿼리 로그 추출",
            "읽기 전용 API 트래픽을 즉시 슬레이브 DB(Read Replica)로 강제 전환"
          ],
          aiTip: "커넥션 고갈은 대형 장애로 번집니다. 긴급 트래픽 쉐이핑(Throttling)을 적용하고 비동기 배치 워커 스레드를 일시 정지하세요."
        };
      case "CRASH_LOOP":
        return {
          title: "배포 실패 크래시 루프 극복 가이드",
          steps: [
            "배포 콘솔에서 즉시 '원클릭 긴급 롤백' 단추를 실행하여 v2.1.3으로 원복",
            "새 빌드 v2.1.4 파이프라인의 환경 변수 ConfigMap 주입 검증",
            "오케스트레이터의 롤아웃 재기동 일시 동결"
          ],
          aiTip: "환경 변수 누락으로 인한 컨테이너 크래시 루프 상태입니다. 디버깅을 미루고 오케스트레이터 차단 후 즉각 안정 버전 롤백이 1순위입니다."
        };
      default:
        return {
          title: "미확인 장애 가이드",
          steps: [
            "시스템 실시간 로그 콘솔을 열어 에러 스택 트레이스 파악",
            "최근 인프라 빌드 배포 이력 검증"
          ],
          aiTip: "로깅 콘솔의 AI 보고서 생성 기능을 클릭하여 맞춤 가이드를 취득하세요."
        };
    }
  };

  const guide = getPlaybookGuide();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* On call Shift status */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-zinc-200 font-semibold text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            온콜 가드 & AI 실시간 가이드
          </h3>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800 text-[10px] text-indigo-300 font-mono">
            <Clock className="w-3 h-3" />
            야간 대기 오프라인 자원
          </span>
        </div>

        {/* Current on call officer */}
        <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">주 당직 온콜 SRE 엔지니어</p>
              <p className="text-xs font-bold text-zinc-200">김온콜 선임 연구원</p>
            </div>
          </div>
          <div className="text-right font-mono text-[10px]">
            <p className="text-zinc-500">지정 구역</p>
            <p className="text-emerald-400 font-bold">인프라 코어 파트</p>
          </div>
        </div>

        {/* Real-time Incident Alert Box */}
        {alertMessage && (
          <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
            severity === "CRITICAL"
              ? "bg-rose-950/30 border-rose-800 text-rose-200"
              : "bg-amber-950/20 border-amber-800 text-amber-200"
          }`}>
            <div className="flex items-start gap-2.5">
              <AlertOctagon className={`w-4 h-4 mt-0.5 shrink-0 ${severity === "CRITICAL" ? "text-rose-400 animate-bounce" : "text-amber-400"}`} />
              <div className="flex-1">
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase bg-red-950 border border-red-700/60 px-1 py-0.5 rounded mr-1.5">
                  {severity === "CRITICAL" ? "장애 심각(CRITICAL)" : "장애 경고(WARNING)"}
                </span>
                <span className="text-xs font-bold text-zinc-100 leading-tight block mt-1.5">{alertMessage}</span>
              </div>
            </div>

            {/* Simulated Slack integration */}
            <div className="mt-3.5 flex items-center justify-between border-t border-zinc-800/60 pt-2.5">
              <span className="text-[10px] text-zinc-400">즉시 경보 전달 비서</span>
              <button
                onClick={handleDispatchAlert}
                disabled={loading || slackSent}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold rounded transition-colors ${
                  slackSent
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                }`}
              >
                {loading ? (
                  <Clock className="w-3 h-3 animate-spin" />
                ) : slackSent ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                {slackSent ? "Slack/SMS 발송됨" : "Slack 전송 시뮬레이션"}
              </button>
            </div>
          </div>
        )}

        {/* AI Playbook recommendation */}
        <div className="space-y-2 pt-1">
          <h4 className="text-zinc-300 font-bold text-xs flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            장애 완화 대응 매뉴얼 (AI Playbook)
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{guide.title}</p>
          
          <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-lg p-3 space-y-2">
            <div className="space-y-1.5">
              {guide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-indigo-400 font-bold text-[11px] mt-0.5">{idx + 1}.</span>
                  <span className="text-[11px] text-zinc-400 leading-normal">{step}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-zinc-800/50 pt-2 mt-2">
              <p className="text-[10px] leading-relaxed text-zinc-400">
                <span className="text-indigo-400 font-bold">💡 온콜 꿀팁:</span> {guide.aiTip}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-zinc-500 font-mono text-center pt-3 border-t border-zinc-800/40 mt-4">
        SRE Sentinel Smart Playbook Engine v1.0.4
      </div>
    </div>
  );
}
