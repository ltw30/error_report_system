import { useId } from "react";
import { MetricPoint } from "../types";

interface RealTimeChartProps {
  data: MetricPoint[];
  metricType: "compute" | "network";
  label: string;
}

export default function RealTimeChart({ data, metricType, label }: RealTimeChartProps) {
  const gradientId = useId();

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-zinc-500 font-mono text-sm">
        데이터 수집 대기 중...
      </div>
    );
  }

  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Extrapolate values depending on chart type
  const points1: number[] = [];
  const points2: number[] = [];

  if (metricType === "compute") {
    data.forEach((d) => {
      points1.push(d.cpu);
      points2.push(d.memory);
    });
  } else {
    data.forEach((d) => {
      points1.push(d.network);
      points2.push(d.latency);
    });
  }

  // Calculate coordinates for lines
  const getCoordinates = (vals: number[], maxVal: number) => {
    return vals.map((v, i) => {
      const x = paddingLeft + (i / (vals.length - 1)) * chartWidth;
      // Clamp to maxVal
      const cappedVal = Math.min(v, maxVal);
      const y = paddingTop + chartHeight - (cappedVal / maxVal) * chartHeight;
      return { x, y };
    });
  };

  const maxVal1 = metricType === "compute" ? 100 : 200; // CPU/Mem are % (0-100), Network (0-200MB/s)
  const maxVal2 = metricType === "compute" ? 100 : 5000; // Latency (0-5000ms)

  const coords1 = getCoordinates(points1, maxVal1);
  const coords2 = getCoordinates(points2, maxVal2);

  // Generate SVG path string for a line
  const generateLinePath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    return coords.reduce((acc, c, i) => {
      return i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`;
    }, "");
  };

  // Generate SVG path string for filled area under the line
  const generateAreaPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return "";
    const linePath = generateLinePath(coords);
    const first = coords[0];
    const last = coords[coords.length - 1];
    return `${linePath} L ${last.x} ${paddingTop + chartHeight} L ${first.x} ${paddingTop + chartHeight} Z`;
  };

  const linePath1 = generateLinePath(coords1);
  const linePath2 = generateLinePath(coords2);
  const areaPath1 = generateAreaPath(coords1);
  const areaPath2 = generateAreaPath(coords2);

  // Labels
  const label1 = metricType === "compute" ? "CPU 사용률" : "네트워크 처리량";
  const label2 = metricType === "compute" ? "메모리 점유율" : "API 지연 시간";

  const color1Line = metricType === "compute" ? "stroke-emerald-400" : "stroke-blue-400";
  const color1Area = metricType === "compute" ? "fill-emerald-400/10" : "fill-blue-400/10";
  const color2Line = metricType === "compute" ? "stroke-purple-400" : "stroke-amber-400";
  const color2Area = metricType === "compute" ? "fill-purple-400/10" : "fill-amber-400/10";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-zinc-300 font-medium text-sm flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${metricType === "compute" ? "bg-emerald-500 animate-pulse" : "bg-blue-500 animate-pulse"}`} />
          {label}
        </h4>
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-1.5 rounded-sm bg-current ${metricType === "compute" ? "text-emerald-400" : "text-blue-400"}`} />
            <span className="text-zinc-400">{label1}</span>
            <span className="text-zinc-200 font-bold">
              {points1[points1.length - 1]?.toFixed(0)}
              {metricType === "compute" ? "%" : " MB/s"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-1.5 rounded-sm bg-current ${metricType === "compute" ? "text-purple-400" : "text-amber-400"}`} />
            <span className="text-zinc-400">{label2}</span>
            <span className="text-zinc-200 font-bold">
              {points2[points2.length - 1]?.toFixed(0)}
              {metricType === "compute" ? "%" : "ms"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-44">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`${gradientId}-area1`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metricType === "compute" ? "#34d399" : "#60a5fa"} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={metricType === "compute" ? "#34d399" : "#60a5fa"} stopOpacity="0.0"/>
            </linearGradient>
            <linearGradient id={`${gradientId}-area2`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metricType === "compute" ? "#c084fc" : "#fbbf24"} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={metricType === "compute" ? "#c084fc" : "#fbbf24"} stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="#3f3f46" strokeWidth="1" />

          {/* Y Axis text */}
          <text x={paddingLeft - 8} y={paddingTop + 4} fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="end">
            {metricType === "compute" ? "100%" : "200M"}
          </text>
          <text x={paddingLeft - 8} y={paddingTop + chartHeight / 2 + 4} fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="end">
            {metricType === "compute" ? "50%" : (metricType === "network" ? "100M" : "")}
          </text>
          <text x={paddingLeft - 8} y={paddingTop + chartHeight + 3} fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="end">
            0
          </text>

          {/* Fill Areas */}
          {areaPath1 && <path d={areaPath1} fill={`url(#${gradientId}-area1)`} />}
          {areaPath2 && <path d={areaPath2} fill={`url(#${gradientId}-area2)`} />}

          {/* Stroke Lines */}
          {linePath1 && <path d={linePath1} fill="none" className={`${color1Line}`} strokeWidth="2" strokeLinecap="round" />}
          {linePath2 && <path d={linePath2} fill="none" className={`${color2Line}`} strokeWidth="2" strokeLinecap="round" />}

          {/* Tooltip dot on the last coordinate */}
          {coords1.length > 0 && (
            <circle cx={coords1[coords1.length - 1].x} cy={coords1[coords1.length - 1].y} r="4" className={metricType === "compute" ? "fill-emerald-400" : "fill-blue-400"} />
          )}
          {coords2.length > 0 && (
            <circle cx={coords2[coords2.length - 1].x} cy={coords2[coords2.length - 1].y} r="4" className={metricType === "compute" ? "fill-purple-400" : "fill-amber-400"} />
          )}
        </svg>
      </div>
    </div>
  );
}
