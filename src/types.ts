export type Severity = "INFO" | "WARNING" | "CRITICAL";

export interface LogEntry {
  timestamp: string;
  service: string;
  level: Severity;
  message: string;
}

export interface MetricPoint {
  cpu: number;
  memory: number;
  network: number;
  latency: number;
}

export type ScenarioType = "HEALTHY" | "LATENCY_SPIKE" | "MEMORY_LEAK" | "DB_POOL_EXHAUSTED" | "CRASH_LOOP";

export interface Scenario {
  id: ScenarioType;
  name: string;
  description: string;
  severity: Severity;
  logs: LogEntry[];
  triggerWarning: string;
  preventativeAction: string;
}

export const SCENARIOS: Record<ScenarioType, Scenario> = {
  HEALTHY: {
    id: "HEALTHY",
    name: "정상 운영 (Healthy State)",
    description: "모든 마이크로서비스가 정상 응답 속도를 유지하고 있으며 자원 사용량이 안정적입니다.",
    severity: "INFO",
    logs: [
      { timestamp: "21:51:02", service: "gateway", level: "INFO", message: "GET /api/v1/catalog - HTTP 200 (12ms)" },
      { timestamp: "21:51:08", service: "auth", level: "INFO", message: "Token verification successful for user_9082" },
      { timestamp: "21:51:15", service: "order", level: "INFO", message: "Order processed successfully: ord_9414" },
      { timestamp: "21:51:25", service: "database", level: "INFO", message: "Vacuum process completed on table 'users'" }
    ],
    triggerWarning: "",
    preventativeAction: ""
  },
  LATENCY_SPIKE: {
    id: "LATENCY_SPIKE",
    name: "API 지연시간 급증 (Latency Spike)",
    description: "특정 외부 결제 연동 API의 응답 속도가 저하되면서 게이트웨이 커넥션 대기열이 누적되고 있습니다.",
    severity: "WARNING",
    logs: [
      { timestamp: "21:52:10", service: "gateway", level: "WARNING", message: "Response time for POST /api/v1/payment exceeded 3500ms" },
      { timestamp: "21:52:15", service: "payment", level: "WARNING", message: "External PG provider timeout (socket read timeout)" },
      { timestamp: "21:52:20", service: "gateway", level: "WARNING", message: "Circuit breaker status changed: HALF-OPEN for service 'payment'" },
      { timestamp: "21:52:28", service: "gateway", level: "CRITICAL", message: "Upstream buffer saturated. Active threads queue: 450/500" }
    ],
    triggerWarning: "결제 게이트웨이 서킷 브레이커 임계치 도달 조짐 감지! (이상 징후)",
    preventativeAction: "서킷 브레이커 강제 오픈 및 결제 처리 트래픽 서브 인스턴스 자동 우회 기동"
  },
  MEMORY_LEAK: {
    id: "MEMORY_LEAK",
    name: "메모리 누수 발생 (Memory Leak)",
    description: "최근 배포된 v2.1.4-beta 버전의 캐시 모듈 미반환으로 인해 메모리 점유율이 지속적으로 수직 상승하고 있습니다.",
    severity: "WARNING",
    logs: [
      { timestamp: "21:53:01", service: "inventory", level: "INFO", message: "Scheduled cache purge initiated" },
      { timestamp: "21:53:15", service: "inventory", level: "WARNING", message: "Heap allocation warning. Current usage: 1.45GB (85% of limit)" },
      { timestamp: "21:53:30", service: "inventory", level: "WARNING", message: "Garbage Collector overhead limit exceeded. GC active for 1200ms" },
      { timestamp: "21:53:45", service: "inventory", level: "CRITICAL", message: "OutOfMemoryError impending. Process heap utilization is 98.4%" }
    ],
    triggerWarning: "inventory 서비스 힙 메모리 급격한 우상향 곡선 탐지! (이상 징후)",
    preventativeAction: "메모리 프로파일링 덤프 자동 저장 후, inventory-pod-02 예비 인스턴스로 동적 롤백 우회"
  },
  DB_POOL_EXHAUSTED: {
    id: "DB_POOL_EXHAUSTED",
    name: "DB 커넥션 풀 고갈 (Connection Exhaustion)",
    description: "야간 배치 작업과 실시간 트래픽 폭증이 겹쳐 데이터베이스 커넥션이 완전히 포화되었습니다.",
    severity: "CRITICAL",
    logs: [
      { timestamp: "21:54:05", service: "database", level: "CRITICAL", message: "FATAL: remaining connection slots are reserved for non-replication superuser connections" },
      { timestamp: "21:54:12", service: "order", level: "CRITICAL", message: "Cannot acquire JDBC Connection from HikariPool-1. Timeout after 15000ms" },
      { timestamp: "21:54:20", service: "gateway", level: "CRITICAL", message: "POST /api/v1/orders - HTTP 500 Internal Server Error (Database Connection Timeout)" },
      { timestamp: "21:54:35", service: "database", level: "WARNING", message: "Deadlock detected in transactions: tx_9041 and tx_9042" }
    ],
    triggerWarning: "HikariPool 대기 시간 급증 및 DB 커넥션 가용성 0% 임박! (이상 징후)",
    preventativeAction: "비핵심 비즈니스 API 읽기 전용 복제본(Read Replica)으로 즉시 강제 분산"
  },
  CRASH_LOOP: {
    id: "CRASH_LOOP",
    name: "배포 실패 후 크래시 루프 (CrashLoopBackOff)",
    description: "새 빌드 v2.1.4 배포 도중 환경 변수 누락으로 웹 컨테이너 기동 즉시 종료 및 무한 재부팅이 일어납니다.",
    severity: "CRITICAL",
    logs: [
      { timestamp: "21:55:01", service: "orchestrator", level: "INFO", message: "Rolling deployment initiated: v2.1.3 -> v2.1.4" },
      { timestamp: "21:55:04", service: "web-v2.1.4", level: "CRITICAL", message: "FATAL: NullPointerException in AppConfig.ts line 42 (Required env DB_PASS is missing)" },
      { timestamp: "21:55:10", service: "orchestrator", level: "WARNING", message: "Container web-v2.1.4 exited with code 1. Restarting..." },
      { timestamp: "21:55:15", service: "orchestrator", level: "CRITICAL", message: "Pod 'web-v2.1.4-xyz' entered CrashLoopBackOff status. Ready: 0/1" }
    ],
    triggerWarning: "새 빌드 배포 후 3회 연속 헬스체크 실패 감지! (이상 징후)",
    preventativeAction: "v2.1.4 롤아웃 자동 차단 및 v2.1.3 안전 안정 빌드로의 원클릭 롤백 매커니즘 활성화"
  }
};
