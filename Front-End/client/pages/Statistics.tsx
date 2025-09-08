import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Filter,
  BarChart3,
  Activity,
  Droplets,
  Zap,
  Mail
} from "lucide-react";
import { apiClient, type SiteResponse } from "@/lib/api";
import HeaderNav from "@/components/Header";
import { sendAlertEmail } from "@/lib/email";

// 통계 페이지에서 사용할 센서 데이터 타입
interface SensorData {
  id: number;
  waterLevel: number;
  chemicalLevel: number;
  motorStatus1: number;
  motorStatus2: number;
  flowRate: number;
  totalAmount: number;
  leakAmount: number;
  leakRate: number;
  leakPercentage: number;
  createdAt: string;
  siteId: string;
}

type PerSiteFlags = {
  enabled: boolean;
  highWater: boolean;
  lowWater: boolean;
  chemical: boolean;
  motor1: boolean;
  motor2: boolean;
  motorFault: boolean;
};

type AlertMatrix = Record<string, PerSiteFlags>;
type EmailSettings = { enabled: boolean; name: string; email: string };

const LS_EMAIL = "alertEmailSettings";
const LS_MATRIX = "alertMatrix";
const LS_LAST_SENT = "alertLastSent"; // { "<siteId>#<type>": timestamp }

const ALERT_THROTTLE_MIN = 15; // 같은 유형/현장 중복 메일 15분 이내 억제

export default function Statistics() {
  // 날짜 선택 (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [showMoreRecords, setShowMoreRecords] = useState<number>(10);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const navigate = useNavigate();

  const loadSites = useCallback(async () => {
    try {
      const res = await apiClient.listSites();
      if (res.success && Array.isArray(res.data)) setSites(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ---------- 알림 로직 헬퍼 ----------
  const getEmailSettings = (): EmailSettings | null => {
    try {
      const s = localStorage.getItem(LS_EMAIL);
      if (!s) return null;
      return JSON.parse(s);
    } catch { return null; }
  };
  const getMatrix = (): AlertMatrix => {
    try {
      const s = localStorage.getItem(LS_MATRIX);
      if (!s) return {};
      return JSON.parse(s);
    } catch { return {}; }
  };
  const getLastSent = (): Record<string, number> => {
    try {
      const s = localStorage.getItem(LS_LAST_SENT);
      if (!s) return {};
      return JSON.parse(s);
    } catch { return {}; }
  };
  const setLastSent = (map: Record<string, number>) => {
    localStorage.setItem(LS_LAST_SENT, JSON.stringify(map));
  };

  // 조건 판단
  const evaluateFlags = (d: SensorData) => {
    const highWater = d.waterLevel > 80;
    const lowWater = d.waterLevel < 25;
    const chemical = d.chemicalLevel < 20;
    const motor1 = d.motorStatus1 === 0;
    const motor2 = d.motorStatus2 === 0;
    const motorOn = d.motorStatus1 === 1 || d.motorStatus2 === 1;
    const motorOff = d.motorStatus1 === 0 && d.motorStatus2 === 0;
    const flowZero = Math.abs(d.flowRate) < 0.5;
    const flowHas = Math.abs(d.flowRate) >= 0.5;
    const motorFault = (motorOn && flowZero) || (motorOff && flowHas);
    return { highWater, lowWater, chemical, motor1, motor2, motorFault };
  };

  const typeLabels: Record<keyof ReturnType<typeof evaluateFlags>, string> = {
    highWater: "고수위",
    lowWater: "저수위",
    chemical: "약품",
    motor1: "모터1 정지",
    motor2: "모터2 정지",
    motorFault: "모터불량",
  };

  // 이메일 전송
  const sendEmailIfNeeded = async (batch: SensorData[]) => {
    const es = getEmailSettings();
    if (!es || !es.enabled || !es.email) return;
    const matrix = getMatrix();
    const last = getLastSent();
    const now = Date.now();

    // 사이트 이름 매핑
    const siteName = (id: string) => sites.find(s => s.managementCode === id)?.siteName ?? id;

    for (const d of batch) {
      const rule = matrix[d.siteId];
      if (!rule || !rule.enabled) continue;

      const flags = evaluateFlags(d);
      (Object.keys(flags) as (keyof typeof flags)[]).forEach(async (k) => {
        if (!rule[k]) return;                  // 사용자 체크 안 한 항목은 무시
        if (!flags[k]) return;                 // 조건 불충족
        const key = `${d.siteId}#${k}`;
        const prev = last[key] ?? 0;
        if (now - prev < ALERT_THROTTLE_MIN * 60 * 1000) return; // 스로틀

        const label = typeLabels[k];
        const subject = `[상수도 알림] ${siteName(d.siteId)} (${d.siteId}) - ${label}`;
        const html = `
          <div style="font-family:system-ui,Arial,sans-serif;line-height:1.6">
            <h2>현장 알림: ${siteName(d.siteId)} (${d.siteId})</h2>
            <p><strong>유형:</strong> ${label}</p>
            <ul>
              <li>수위: ${d.waterLevel}%</li>
              <li>약품: ${d.chemicalLevel}%</li>
              <li>유량: ${d.flowRate.toFixed(2)} L/min</li>
              <li>적산: ${d.totalAmount.toLocaleString()} L</li>
              <li>모터1: ${d.motorStatus1 ? "ON" : "OFF"}, 모터2: ${d.motorStatus2 ? "ON" : "OFF"}</li>
              <li>발생시각: ${new Date(d.createdAt).toLocaleString()}</li>
            </ul>
          </div>
        `;
        const ok = await sendAlertEmail({ to: es.email, subject, html });
        if (ok) {
          last[key] = now;
          setLastSent(last);
        }
      });
    }
  };
  // ---------- 알림 로직 끝 ----------

  const fetchSensorData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8084/api/sensor/data');
      if (!response.ok) return;
      const data: SensorData[] = await response.json();
      setSensorData(data);
      setHasSearched(true);

      // 🔔 알림 체크 & 이메일 전송
      await sendEmailIfNeeded(data);
    } catch (e) {
      console.error('센서 데이터 조회 실패:', e);
    }
  }, [sites]); // sites 이름 매핑에 사용

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const getDayRange = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    const start = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { start, end };
  };

  const { start: dayStart, end: dayEnd } = getDayRange(selectedDate);

  const monthlyData = sensorData
      .filter(d => {
        const t = new Date(d.createdAt);
        const byMonth = t >= dayStart && t <= dayEnd;
        const bySite = selectedSite === 'all' || d.siteId === selectedSite;
        return byMonth && bySite;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const buildSampled = (data: SensorData[], intervalHours: number) => {
    if (data.length === 0) return [] as SensorData[];
    const startMs = new Date(data[0].createdAt).getTime();
    const endMs = new Date(data[data.length - 1].createdAt).getTime();
    const total = Math.max(1, endMs - startMs);
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const sampleInterval = Math.max(1, Math.floor(data.length / (total / intervalMs)));
    const sampled: SensorData[] = [];
    for (let i = 0; i < data.length; i += sampleInterval) sampled.push(data[i]);
    if (data.length > 0 && sampled[sampled.length - 1] !== data[data.length - 1]) sampled.push(data[data.length - 1]);
    return sampled;
  };

  // 모든 현장 모드 유틸리티
  const getSiteName = (siteId: string) =>
      sites.find((s) => s.managementCode === siteId)?.siteName || siteId;

  const getDayDataBySite = (siteId: string) =>
      sensorData
          .filter((d) => d.siteId === siteId && new Date(d.createdAt) >= dayStart && new Date(d.createdAt) <= dayEnd)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const siteIdsForDay: string[] = Array.from(
      new Set(
          sensorData
              .filter((d) => new Date(d.createdAt) >= dayStart && new Date(d.createdAt) <= dayEnd)
              .map((d) => d.siteId)
      )
  );

  // 단일 현장 기록 테이블 유틸리티
  const getStatusBadge = (value: number, type: 'water' | 'chemical' | 'leak') => {
    if (type === 'water') {
      if (value > 80) return 'destructive';
      if (value > 60) return 'secondary';
      return 'default';
    } else if (type === 'chemical') {
      if (value < 20) return 'destructive';
      if (value < 40) return 'secondary';
      return 'default';
    } else {
      if (value > 10) return 'destructive';
      if (value > 5) return 'secondary';
      return 'default';
    }
  };

  const singleSiteRecordsDesc = selectedSite !== 'all'
      ? [...monthlyData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : [];

  const showRecords = singleSiteRecordsDesc.slice(0, showMoreRecords);

  return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">통계 및 분석</h1>
              </div>
              <Badge variant="outline">데이터 분석</Badge>
            </div>

            <HeaderNav />

            <div />
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                데이터 필터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">날짜 선택</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">건별 현장조회</label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger>
                      <SelectValue placeholder="현장을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 현장</SelectItem>
                      {sites.map((s) => (
                          <SelectItem key={s.managementCode} value={s.managementCode}>
                            {s.siteName} ({s.managementCode})
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">검색</label>
                  <Button className="w-full" onClick={fetchSensorData}>검색</Button>
                </div>

                {/* ➕ 이메일 알림 설정 버튼 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">알림</label>
                  <Button className="w-full" variant="outline" onClick={() => navigate("/email-alerts")}>
                    <Mail className="h-4 w-4 mr-2" />
                    이메일 알림 설정
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* (이하: 기존 통계 화면 그대로) */}

          {hasSearched && selectedSite !== 'all' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 24시간 수위 변화 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    24시간 수위 변화 (%)
                  </span>
                      <span className="text-xs text-gray-500">{selectedDate} (2시간 간격)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 relative">
                      {monthlyData.length > 1 ? (
                          <svg className="w-full h-full" viewBox="0 0 800 320">
                            <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                            <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                            <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                            <text x="5" y="15" fontSize="12" fill="#6b7280">100%</text>
                            <text x="5" y="85" fontSize="12" fill="#6b7280">75%</text>
                            <text x="5" y="155" fontSize="12" fill="#6b7280">50%</text>
                            <text x="5" y="225" fontSize="12" fill="#6b7280">25%</text>
                            {(() => {
                              const sampled = buildSampled(monthlyData, 2);
                              const startMs = dayStart.getTime();
                              const endMs = dayEnd.getTime();
                              const total = Math.max(1, endMs - startMs);
                              const bg = sampled.map((d, i) => {
                                if (i === 0) return null;
                                const cx = 50 + ((new Date(d.createdAt).getTime() - startMs) / total) * 700;
                                const px = 50 + ((new Date(sampled[i - 1].createdAt).getTime() - startMs) / total) * 700;
                                const cy = 280 - (d.waterLevel / 100) * 280;
                                const py = 280 - (sampled[i - 1].waterLevel / 100) * 280;
                                return <line key={`wbg-${i}`} x1={px} y1={py} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="1" opacity="0.35" />;
                              });
                              const fg = sampled.map((d, i) => {
                                if (i === 0) return null;
                                const cx = 50 + ((new Date(d.createdAt).getTime() - startMs) / total) * 700;
                                const px = 50 + ((new Date(sampled[i - 1].createdAt).getTime() - startMs) / total) * 700;
                                const cy = 280 - (d.waterLevel / 100) * 280;
                                const py = 280 - (sampled[i - 1].waterLevel / 100) * 280;
                                return (
                                    <g key={`wfg-${i}`}>
                                      <line x1={px} y1={py} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="3" />
                                      <circle cx={cx} cy={cy} r="4" fill="#3b82f6" />
                                    </g>
                                );
                              });
                              return <g>{bg}{fg}</g>;
                            })()}
                            {(() => {
                              const labels: Date[] = [];
                              const cur = new Date(dayStart);
                              while (cur <= dayEnd) { labels.push(new Date(cur)); cur.setHours(cur.getHours() + 2); }
                              return labels.map((t, i) => {
                                let closest = 0; let min = Infinity;
                                monthlyData.forEach((d, idx) => { const diff = Math.abs(new Date(d.createdAt).getTime() - t.getTime()); if (diff < min) { min = diff; closest = idx; } });
                                const sMs = dayStart.getTime();
                                const eMs = dayEnd.getTime();
                                const total = Math.max(1, eMs - sMs);
                                const x = 50 + ((new Date(monthlyData[closest].createdAt).getTime() - sMs) / total) * 700;
                                return (
                                    <g key={`wtick-${i}`}>
                                      <line x1={x} y1="0" x2={x} y2="280" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                                      <text x={x} y="300" fontSize="10" fill="#6b7280" textAnchor="middle">{String(t.getHours()).padStart(2, '0')}</text>
                                    </g>
                                );
                              });
                            })()}
                          </svg>
                      ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 24시간 유량 변화 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    24시간 유량 변화 (L/min)
                  </span>
                      <span className="text-xs text-gray-500">{selectedDate} (2시간 간격)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 relative">
                      {monthlyData.length > 1 ? (
                          <svg className="w-full h-full" viewBox="0 0 800 320">
                            <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                            <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                            <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                            <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                            <text x="5" y="15" fontSize="12" fill="#6b7280">50 L/min</text>
                            <text x="5" y="85" fontSize="12" fill="#6b7280">37.5 L/min</text>
                            <text x="5" y="155" fontSize="12" fill="#6b7280">25 L/min</text>
                            <text x="5" y="225" fontSize="12" fill="#6b7280">12.5 L/min</text>
                            {(() => {
                              const sampled = buildSampled(monthlyData, 2);
                              const startMs = dayStart.getTime();
                              const endMs = dayEnd.getTime();
                              const total = Math.max(1, endMs - startMs);
                              const bg = sampled.map((d, i) => {
                                if (i === 0) return null;
                                const cx = 50 + ((new Date(d.createdAt).getTime() - startMs) / total) * 700;
                                const px = 50 + ((new Date(sampled[i - 1].createdAt).getTime() - startMs) / total) * 700;
                                const cy = 280 - (d.flowRate / 50) * 280;
                                const py = 280 - (sampled[i - 1].flowRate / 50) * 280;
                                return <line key={`fbg-${i}`} x1={px} y1={py} x2={cx} y2={cy} stroke="#10b981" strokeWidth="1" opacity="0.35" />;
                              });
                              const fg = sampled.map((d, i) => {
                                if (i === 0) return null;
                                const cx = 50 + ((new Date(d.createdAt).getTime() - startMs) / total) * 700;
                                const px = 50 + ((new Date(sampled[i - 1].createdAt).getTime() - startMs) / total) * 700;
                                const cy = 280 - (d.flowRate / 50) * 280;
                                const py = 280 - (sampled[i - 1].flowRate / 50) * 280;
                                return (
                                    <g key={`ffg-${i}`}>
                                      <line x1={px} y1={py} x2={cx} y2={cy} stroke="#10b981" strokeWidth="3" />
                                      <circle cx={cx} cy={cy} r="4" fill="#10b981" />
                                    </g>
                                );
                              });
                              return <g>{bg}{fg}</g>;
                            })()}
                            {(() => {
                              const labels: Date[] = [];
                              const cur = new Date(dayStart);
                              while (cur <= dayEnd) { labels.push(new Date(cur)); cur.setHours(cur.getHours() + 2); }
                              return labels.map((t, i) => {
                                let closest = 0; let min = Infinity;
                                monthlyData.forEach((d, idx) => { const diff = Math.abs(new Date(d.createdAt).getTime() - t.getTime()); if (diff < min) { min = diff; closest = idx; } });
                                const sMs = dayStart.getTime();
                                const eMs = dayEnd.getTime();
                                const total = Math.max(1, eMs - sMs);
                                const x = 50 + ((new Date(monthlyData[closest].createdAt).getTime() - sMs) / total) * 700;
                                return (
                                    <g key={`ftick-${i}`}>
                                      <line x1={x} y1="0" x2={x} y2="280" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                                      <text x={x} y="300" fontSize="10" fill="#6b7280" textAnchor="middle">{String(t.getHours()).padStart(2, '0')}</text>
                                    </g>
                                );
                              });
                            })()}
                          </svg>
                      ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
          ) : hasSearched ? (
              <div className="space-y-10">
                {siteIdsForDay.map((sid) => {
                  const data = getDayDataBySite(sid);
                  if (data.length < 2) return null;
                  const sampled = buildSampled(data, 2);
                  const siteLabel = `${getSiteName(sid)} (${sid})`;
                  return (
                      <div key={sid} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">{siteLabel}</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 수위 */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Droplets className="h-5 w-5" />
                            수위 변화 (%)
                          </span>
                                <span className="text-xs text-gray-500">{selectedDate} (2시간 간격)</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64 relative">
                                <svg className="w-full h-full" viewBox="0 0 800 320">
                                  <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                                  <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                                  <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                                  <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                                  <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                                  <text x="5" y="15" fontSize="12" fill="#6b7280">100%</text>
                                  <text x="5" y="85" fontSize="12" fill="#6b7280">75%</text>
                                  <text x="5" y="155" fontSize="12" fill="#6b7280">50%</text>
                                  <text x="5" y="225" fontSize="12" fill="#6b7280">25%</text>
                                  {sampled.map((d, i) => {
                                    if (i === 0) return null;
                                    const startMs = dayStart.getTime();
                                    const endMs = dayEnd.getTime();
                                    const total = Math.max(1, endMs - startMs);
                                    const cx = 50 + ((new Date(d.createdAt).getTime() - startMs) / total) * 700;
                                    const px = 50 + ((new Date(sampled[i - 1].createdAt).getTime() - startMs) / total) * 700;
                                    const cy = 280 - (d.waterLevel / 100) * 280;
                                    const py = 280 - (sampled[i - 1].waterLevel / 100) * 280;
                                    return (
                                        <g key={`w-${i}`}>
                                          <line x1={px} y1={py} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="3" />
                                          <circle cx={cx} cy={cy} r="4" fill="#3b82f6" />
                                        </g>
                                    );
                                  })}
                                  {(() => {
                                    const sMs = dayStart.getTime();
                                    const eMs = dayEnd.getTime();
                                    const total = Math.max(1, eMs - sMs);
                                    const hours: number[] = [];
                                    for (let h = 0; h <= 24; h += 2) hours.push(h);
                                    return hours.map((h, i) => {
                                      const tMs = sMs + h * 60 * 60 * 1000;
                                      const x = 50 + ((tMs - sMs) / total) * 700;
                                      return (
                                          <g key={`wtick-${i}`}>
                                            <line x1={x} y1="0" x2={x} y2="280" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                                            <text x={x} y="300" fontSize="10" fill="#6b7280" textAnchor="middle">{String(h).padStart(2, '0')}</text>
                                          </g>
                                      );
                                    });
                                  })()}
                                </svg>
                              </div>
                            </CardContent>
                          </Card>

                          {/* 유량 */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            유량 변화 (L/min)
                          </span>
                                <span className="text-xs text-gray-500">{selectedDate} (2시간 간격)</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64 relative">
                                <svg className="w-full h-full" viewBox="0 0 800 320">
                                  <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                                  <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                                  <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                                  <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                                  <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                                  <text x="5" y="15" fontSize="12" fill="#6b7280">50 L/min</text>
                                  <text x="5" y="85" fontSize="12" fill="#6b7280">37.5 L/min</text>
                                  <text x="5" y="155" fontSize="12" fill="#6b7280">25 L/min</text>
                                  <text x="5" y="225" fontSize="12" fill="#6b7280">12.5 L/min</text>
                                  {sampled.map((d, i) => {
                                    if (i === 0) return null;
                                    const startMs = dayStart.getTime();
                                    const endMs = dayEnd.getTime();
                                    const total = Math.max(1, endMs - startMs);
                                    const cx = 50 + ((new Date(d.createdAt).getTime() - startMs) / total) * 700;
                                    const px = 50 + ((new Date(sampled[i - 1].createdAt).getTime() - startMs) / total) * 700;
                                    const cy = 280 - (d.flowRate / 50) * 280;
                                    const py = 280 - (sampled[i - 1].flowRate / 50) * 280;
                                    return (
                                        <g key={`f-${i}`}>
                                          <line x1={px} y1={py} x2={cx} y2={cy} stroke="#10b981" strokeWidth="3" />
                                          <circle cx={cx} cy={cy} r="4" fill="#10b981" />
                                        </g>
                                    );
                                  })}
                                  {(() => {
                                    const sMs = dayStart.getTime();
                                    const eMs = dayEnd.getTime();
                                    const total = Math.max(1, eMs - sMs);
                                    const hours: number[] = [];
                                    for (let h = 0; h <= 24; h += 2) hours.push(h);
                                    return hours.map((h, i) => {
                                      const tMs = sMs + h * 60 * 60 * 1000;
                                      const x = 50 + ((tMs - sMs) / total) * 700;
                                      return (
                                          <g key={`ftick-${i}`}>
                                            <line x1={x} y1="0" x2={x} y2="280" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                                            <text x={x} y="300" fontSize="10" fill="#6b7280" textAnchor="middle">{String(h).padStart(2, '0')}</text>
                                          </g>
                                      );
                                    });
                                  })()}
                                </svg>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                  );
                })}
              </div>
          ) : null}

          {/* 단일 현장 선택 시 기록 테이블 */}
          {hasSearched && selectedSite !== 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>현장 기록 ({getSiteName(selectedSite)} - {selectedSite})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>시간</TableHead>
                          <TableHead>수위 (%)</TableHead>
                          <TableHead>약품 (%)</TableHead>
                          <TableHead>유량 (L/min)</TableHead>
                          <TableHead>적산 (L)</TableHead>
                          <TableHead>누수량 (L)</TableHead>
                          <TableHead>일일 누수율 (%)</TableHead>
                          <TableHead>모터 상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {showRecords.map((d, idx) => (
                            <TableRow key={d.id || idx}>
                              <TableCell className="text-sm text-gray-500">{new Date(d.createdAt).toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadge(d.waterLevel, 'water') as any}>{d.waterLevel}%</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadge(d.chemicalLevel, 'chemical') as any}>{d.chemicalLevel}%</Badge>
                              </TableCell>
                              <TableCell><span className="font-mono">{d.flowRate.toFixed(2)}</span></TableCell>
                              <TableCell><span className="font-mono">{d.totalAmount.toLocaleString()}</span></TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadge(d.leakAmount, 'leak') as any}>{d.leakAmount.toFixed(2)}</Badge>
                              </TableCell>
                              <TableCell><span className="font-mono">{d.leakPercentage.toFixed(1)}%</span></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${d.motorStatus1 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                                  <div className={`w-2 h-2 rounded-full ${d.motorStatus2 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {singleSiteRecordsDesc.length > showMoreRecords && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" onClick={() => setShowMoreRecords((n) => n + 10)} className="w-full">더보기 ({showMoreRecords}/{singleSiteRecordsDesc.length})</Button>
                      </div>
                  )}
                </CardContent>
              </Card>
          )}
        </div>
      </div>
  );
}
