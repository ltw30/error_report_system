import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client with proper header options as dictated in the skill.
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Warning: GEMINI_API_KEY is not defined. AI features will fallback to deterministic rules.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const ai = getGeminiClient();

// Deterministic fallback templates in case GEMINI_API_KEY is missing or fails.
const FALLBACK_ANALYSIS = {
  rootCause: "데이터베이스 커넥션 풀 고갈 (결정론적 Fallback 분석)",
  severity: "CRITICAL",
  summary: "과도한 동시 커넥션 요청으로 인해 연결 풀이 포화 상태에 도달했습니다. 이로 인해 마이크로서비스 및 사용자 세션에 HTTP 500 내부 서버 오류가 반환되었습니다.",
  playbook: [
    "1. 데이터베이스 커넥션 풀 한도 확장 조정 (예: 20개에서 100개로 변경).",
    "2. 애플리케이션 소스 코드 내에서 미반환 커넥션 누수(leak) 코드 유무 확인.",
    "3. HikariCP 또는 DBCP 타임아웃 및 재시도 백오프 로직 고도화 적용.",
    "4. 지연을 유발하는 특정 고부하 엔드포인트에 일시적인 Rate-Limiting(요청 제한) 적용."
  ],
  actionTaken: "DB 최대 커넥션 풀 수치를 긴급 증설하고 부하 유발 트래픽에 임시 속도 제한을 부여했습니다.",
  reportMarkdown: `# SRE 사후분석 장애 보고서 (Post-Mortem)\n\n**장애 ID:** INC-90142\n**심각도:** CRITICAL (심각)\n\n## 1. 장애 요약 및 개요\n2026년 7월 14일, 결제 및 주문 처리 흐름에 존재하던 비효율적인 루프 쿼리와 야간 트래픽 유입 급증이 맞물려 주 데이터베이스 서비스의 커넥션 풀이 완전히 고갈되었습니다. 이로 인해 모든 대고객 웹 API 서비스에서 HTTP 500 장애가 연쇄적으로 파생되었습니다.\n\n## 2. 근본 원인 분석 (RCA)\n- **커넥션 풀 구성 오류:** 최대 커넥션 풀이 20개로 고정되어 있어 급증한 대기 트래픽 감당 불가능.\n- **미반환 리소스:** 일부 결제 예외 처리 핸들러에서 에러 분기 발생 시 세션을 닫지 않는(close 누락) 누수 발견.\n- **인덱스 미설정:** \`orders\` 테이블의 최신 정렬 필드에 복합 인덱스가 누락되어 DB CPU 연산 부하 가속화.\n\n## 3. 타임라인 기록\n- **21:40 :** 마케팅 이벤트를 통한 접속자 폭증 (평소 대비 +150% 부하 발생).\n- **21:42 :** 게이트웨이 99%ile 응답 대기 시간이 5초 임계치를 초과하여 알람 발생.\n- **21:44 :** AI 이상 징후 분석 엔진이 이상 패턴을 감지하고 슬랙 온콜 경보 발송.\n- **21:46 :** 당직 엔지니어가 긴급 롤백 매커니즘을 집행하여 커넥션을 100개로 수동 오버라이드.\n- **21:50 :** 시스템 자동 회복 완료. 전면 Latency 200ms 이하 안정권 안착.\n\n## 4. 즉각 조치 및 AI 단기 해결안\n- 모든 DB 쿼리 문맥에 명시적인 Try-With-Resources 또는 Close 구문 강제 설정.\n- orders 테이블 내 \`user_id, created_at\`에 대한 최적 복합 인덱스 신속 빌드.\n- 데이터베이스 프록시 노드에 자동 수평 오토스케일러(HPA) 적용.`
};

const FALLBACK_CAPACITY = {
  forecastMonth: "2026년 9월",
  daysToSaturation: 52,
  analysis: "현재 누적 디스크 증가 수치는 어플리케이션 디버그용 로그 미정리로 인해 하루 평균 +1.2GB 수준으로 우상향을 그립니다. 이 선형 증가 추세가 지속될 경우 v_db_data 데이터 디스크 볼륨은 대략 52일 이내에 포화 임계점(100%)에 도달합니다.",
  recommendations: [
    "Cloud Logging 내 자동 로그 만료 보존 정책(Retention Policy)을 14일 이하로 하향 조치하세요.",
    "디스크 사용률이 80%를 돌파할 경우 SRE 즉각 통지 경보를 사전에 구축하십시오.",
    "일반 정적 아카이브 로그 파일은 단가가 낮은 객체 스토리지(GCS 등)로 생명주기 규칙에 의거해 이관하세요.",
    "다가오는 추석 성수기 쇼핑 부하에 대비해 CPU 한도를 2 vCPU에서 4 vCPU로 선제 확장 계획하십시오."
  ],
  predictedDataPoints: [
    { name: "현재", cpu: 45, disk: 68, memory: 52 },
    { name: "30일후", cpu: 55, disk: 81, memory: 58 },
    { name: "60일후", cpu: 65, disk: 94, memory: 65 },
    { name: "90일후", cpu: 75, disk: 107, memory: 72 }
  ]
};

// API: Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API: AI-powered Log Analysis & Post-Mortem Report Generation
app.post("/api/analyze-logs", async (req, res) => {
  const { logs, systemState, incidentScenario } = req.body;

  if (!logs) {
    return res.status(400).json({ error: "No log content provided for analysis." });
  }

  if (!ai) {
    // Graceful fallback when API key is missing
    return res.json({
      ...FALLBACK_ANALYSIS,
      isFallback: true,
      message: "Using offline deterministic analysis template due to missing API key."
    });
  }

  try {
    const prompt = `You are a Principal Site Reliability Engineer (SRE). Review the following error logs, scenario details, and current system state, then generate an exhaustive, professional incident analysis and post-mortem report.
    
Incident Scenario: ${incidentScenario || "Unknown Incident"}
System State: CPU: ${systemState?.cpu || "85"}%, Mem: ${systemState?.memory || "90"}%, Latency: ${systemState?.latency || "1200"}ms

--- ERROR LOGS ---
${logs}
------------------

CRITICAL: You MUST write the "rootCause", "summary", "actionTaken", "playbook" items, and "reportMarkdown" COMPLETELY in Korean language. Maintain a professional, objective SRE tone.

Please output your response as a valid JSON object matching the following TypeScript interface (strict JSON only, do not include markdown blocks like \`\`\`json in your raw API response structure, just plain text JSON):
{
  "rootCause": "한국어 근본원인 1문장 요약",
  "severity": "CRITICAL" | "WARNING" | "INFO",
  "summary": "장애 요약 설명 (한국어)",
  "playbook": ["조치법 명령어 1", "조치법 명령어 2", "..."],
  "actionTaken": "한국어로 수행한 긴급 복구 조치 설명",
  "reportMarkdown": "장애 원인, 대응 타임라인, 단기/장기 예방책을 마크다운 문법으로 상세하게 작성한 한국어 리포트"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (text) {
      try {
        const cleanedText = text.trim();
        const result = JSON.parse(cleanedText);
        return res.json({ ...result, isFallback: false });
      } catch (parseErr) {
        console.error("JSON parsing failed, returning string wrapper:", parseErr);
        // Fallback in case Gemini returns a bad JSON structure
        return res.json({
          rootCause: "Uncaught log exception detected.",
          severity: "CRITICAL",
          summary: "Error log parsed deterministically: SRE observed critical app crashes.",
          playbook: ["Verify server health", "Run automated system rollback", "Scale web instances"],
          actionTaken: "Analyzed via SRE Sentinel engine",
          reportMarkdown: `# SRE Post-Mortem Report\n\n${text}`,
          isFallback: true
        });
      }
    } else {
      throw new Error("No response content from Gemini.");
    }
  } catch (err: any) {
    console.error("Gemini API call failed:", err);
    return res.json({
      ...FALLBACK_ANALYSIS,
      isFallback: true,
      apiError: err.message
    });
  }
});

// API: AI-powered Infrastructure Capacity Planning Forecasting
app.post("/api/predict-capacity", async (req, res) => {
  const { currentMetrics, daysOfHistory } = req.body;

  if (!ai) {
    return res.json({
      ...FALLBACK_CAPACITY,
      isFallback: true,
      message: "Using offline deterministic forecasting due to missing API key."
    });
  }

  try {
    const prompt = `You are an Infrastructure Planning & Capacity Manager. Analyze the following current system resources and growth parameters over the past ${daysOfHistory || 30} days, then project resource saturation points and generate recommendations.

Current Metrics:
- CPU Average Load: ${currentMetrics?.cpu || 48}% (Monthly growth trend: +2.5%)
- Memory Utilization: ${currentMetrics?.memory || 62}% (Monthly growth trend: +4.0%)
- Disk Space Utilized: ${currentMetrics?.disk || 74}% (Monthly growth trend: +6.5GB/month)
- Daily API Ingress Volume: ${currentMetrics?.ingress || 120} GB/day (Monthly growth trend: +12%)

CRITICAL: You MUST write the "forecastMonth" (e.g. "2026년 11월"), "analysis", and "recommendations" COMPLETELY in Korean. For "predictedDataPoints" name array, use Korean keys: "현재", "30일 후", "60일 후", "90일 후".

Please output your forecast as a valid JSON object matching the following structure (strict JSON only):
{
  "forecastMonth": "최초로 자원 포화가 우려되는 년월 (예: 2026년 11월)",
  "daysToSaturation": number,
  "analysis": "서버 컴퓨터 디스크 및 메모리 증가 트렌드 진단 (한국어)",
  "recommendations": ["권장 선제 해결책 1", "권장 선제 해결책 2", "..."],
  "predictedDataPoints": [
    { "name": "현재", "cpu": number, "disk": number, "memory": number },
    { "name": "30일 후", "cpu": number, "disk": number, "memory": number },
    { "name": "60일 후", "cpu": number, "disk": number, "memory": number },
    { "name": "90일 후", "cpu": number, "disk": number, "memory": number }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (text) {
      try {
        const result = JSON.parse(text.trim());
        return res.json({ ...result, isFallback: false });
      } catch (parseErr) {
        console.error("JSON parse failed for capacity endpoint:", parseErr);
        return res.json({ ...FALLBACK_CAPACITY, isFallback: true });
      }
    } else {
      throw new Error("Empty response from Gemini capacity prediction.");
    }
  } catch (err: any) {
    console.error("Gemini capacity prediction failed:", err);
    return res.json({
      ...FALLBACK_CAPACITY,
      isFallback: true,
      apiError: err.message
    });
  }
});

// Mount Vite middleware in development, and serve static built files in production.
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve client SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SRE Sentinel backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
