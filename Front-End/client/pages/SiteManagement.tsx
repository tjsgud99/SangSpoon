import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Activity,
  Gauge,
  ArrowLeft,
  TrendingUp,
  Zap,
  Droplets,
  X,
  FileText,
  Download
} from "lucide-react";
import { apiClient, type CreateOrUpdateSiteRequest, type SiteResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import HeaderNav from "@/components/Header";

// 인쇄용 스타일은 별도 페이지에서 처리됩니다

interface Site {
  id: string;
  name: string;
  managementNumber: string;
  contactPerson: string;
  contactPhone: string;
  tankType: "circular" | "square";
  width: number;
  length: number;
  height: number;
  volume: number;
  flowRate: number;
  total: number;
  status: "active" | "inactive" | "maintenance";
}

interface SensorData {
  id: number;
  waterLevel: number;
  chemicalLevel: number;
  motorStatus1: number;
  motorStatus2: number;
  flowRate: number;
  totalAmount: number;
  createdAt: string;
  siteId: string;
}

// 서버 응답을 UI 타입으로 매핑
function mapSite(resp: SiteResponse): Site {
  const tankType = resp.tankType?.toLowerCase() === "circle" ? "circular" : resp.tankType?.toLowerCase() === "square" ? "square" : "circular";
  const status = resp.status?.toLowerCase() === "inactive"
    ? "inactive"
    : resp.status?.toLowerCase() === "maintenance"
      ? "maintenance"
      : "active";
  return {
    id: resp.managementCode,
    name: resp.siteName,
    managementNumber: resp.managementCode,
    contactPerson: resp.manager || resp.memberName || "",
    contactPhone: resp.contactNumber || "",
    tankType,
    width: resp.width || 0,
    length: resp.length || 0,
    height: resp.height || 0,
    volume: typeof resp.calculatedVolume === "number" ? resp.calculatedVolume : 0,
    flowRate: 0,
    total: 0,
    status,
  };
}



// PDF 컴포넌트들은 별도 페이지로 이동했습니다

// PDF 컴포넌트들은 별도 페이지로 이동했습니다

// 전체 현장 통합 그래프 컴포넌트 (인쇄용)
function AllSitesGraphs({ sites, sensorData }: { sites: Site[]; sensorData: SensorData[] }) {
  const now = new Date().getTime();
  const recentData = sensorData.filter(d => now - new Date(d.createdAt).getTime() <= 24 * 60 * 60 * 1000);
  
  // 모든 현장의 데이터를 시간별로 그룹화
  const timeGroups: Record<string, { waterLevel: number; flowRate: number; count: number }> = {};
  
  recentData.forEach(d => {
    const timeKey = new Date(d.createdAt).toISOString().slice(0, 13); // 시간별 그룹화
    if (!timeGroups[timeKey]) {
      timeGroups[timeKey] = { waterLevel: 0, flowRate: 0, count: 0 };
    }
    timeGroups[timeKey].waterLevel += d.waterLevel;
    timeGroups[timeKey].flowRate += d.flowRate;
    timeGroups[timeKey].count += 1;
  });

  // 평균값 계산 및 시간순 정렬
  const averagedData = Object.entries(timeGroups)
    .map(([time, data]) => ({
      time: new Date(time),
      waterLevel: data.waterLevel / data.count,
      flowRate: data.flowRate / data.count
    }))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  const maxFlowRate = Math.max(1, ...averagedData.map(d => d.flowRate));

  return (
    <div className="space-y-6">
      {/* 수위 변화 그래프 */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">전체 현장 24시간 평균 수위 변화 (%)</h3>
        <div className="h-48 relative">
          {averagedData.length > 1 ? (
            <svg className="w-full h-full" viewBox="0 0 800 240">
              {/* 축/눈금 */}
              <line x1="0" y1="0" x2="0" y2="200" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="50" x2="800" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
              <line x1="0" y1="150" x2="800" y2="150" stroke="#e5e7eb" strokeWidth="0.5" />
              
              {/* Y 라벨 */}
              <text x="5" y="15" fontSize="12" fill="#6b7280">100%</text>
              <text x="5" y="65" fontSize="12" fill="#6b7280">75%</text>
              <text x="5" y="115" fontSize="12" fill="#6b7280">50%</text>
              <text x="5" y="165" fontSize="12" fill="#6b7280">25%</text>

              {/* 수위 그래프 */}
              {averagedData.map((pt, idx) => {
                if (idx === 0) return null;
                const cx = 50 + (idx / (averagedData.length - 1)) * 700;
                const px = 50 + ((idx - 1) / (averagedData.length - 1)) * 700;
                const cy = 200 - (pt.waterLevel / 100) * 200;
                const py = 200 - (averagedData[idx - 1].waterLevel / 100) * 200;
                return (
                  <g key={`water-${idx}`}>
                    <line x1={px} y1={py} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="2" />
                    <circle cx={cx} cy={cy} r="3" fill="#3b82f6" />
                  </g>
                );
              })}

              {/* X축 시간 라벨 */}
              {averagedData.map((pt, idx) => {
                if (idx % 3 !== 0) return null; // 3시간 간격으로 라벨 표시
                const x = 50 + (idx / (averagedData.length - 1)) * 700;
                return (
                  <g key={`time-${idx}`}>
                    <line x1={x} y1="0" x2={x} y2="200" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                    <text x={x} y="220" fontSize="10" fill="#6b7280" textAnchor="middle">
                      {String(pt.time.getHours()).padStart(2, '0')}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다</div>
          )}
        </div>
      </div>

      {/* 유량 변화 그래프 */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">전체 현장 24시간 평균 유량 변화 (L/min)</h3>
        <div className="h-48 relative">
          {averagedData.length > 1 ? (
            <svg className="w-full h-full" viewBox="0 0 800 240">
              {/* 축/눈금 */}
              <line x1="0" y1="0" x2="0" y2="200" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="50" x2="800" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
              <line x1="0" y1="150" x2="800" y2="150" stroke="#e5e7eb" strokeWidth="0.5" />
              
              {/* Y 라벨 */}
              <text x="5" y="15" fontSize="12" fill="#6b7280">{maxFlowRate.toFixed(0)} L/min</text>
              <text x="5" y="65" fontSize="12" fill="#6b7280">{(maxFlowRate * 0.75).toFixed(0)} L/min</text>
              <text x="5" y="115" fontSize="12" fill="#6b7280">{(maxFlowRate * 0.5).toFixed(0)} L/min</text>
              <text x="5" y="165" fontSize="12" fill="#6b7280">{(maxFlowRate * 0.25).toFixed(0)} L/min</text>

              {/* 유량 그래프 */}
              {averagedData.map((pt, idx) => {
                if (idx === 0) return null;
                const cx = 50 + (idx / (averagedData.length - 1)) * 700;
                const px = 50 + ((idx - 1) / (averagedData.length - 1)) * 700;
                const cy = 200 - (pt.flowRate / maxFlowRate) * 200;
                const py = 200 - (averagedData[idx - 1].flowRate / maxFlowRate) * 200;
                return (
                  <g key={`flow-${idx}`}>
                    <line x1={px} y1={py} x2={cx} y2={cy} stroke="#10b981" strokeWidth="2" />
                    <circle cx={cx} cy={cy} r="3" fill="#10b981" />
                  </g>
                );
              })}

              {/* X축 시간 라벨 */}
              {averagedData.map((pt, idx) => {
                if (idx % 3 !== 0) return null; // 3시간 간격으로 라벨 표시
                const x = 50 + (idx / (averagedData.length - 1)) * 700;
                return (
                  <g key={`timef-${idx}`}>
                    <line x1={x} y1="0" x2={x} y2="200" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                    <text x={x} y="220" fontSize="10" fill="#6b7280" textAnchor="middle">
                      {String(pt.time.getHours()).padStart(2, '0')}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">데이터가 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}

// 좌측 그래프 컴포넌트 (선택된 현장 24시간 수위/유량 그래프)
function SiteGraphs({ selectedSite, sensorData, onClose }: { selectedSite: Site | null; sensorData: SensorData[]; onClose: () => void }) {
  if (!selectedSite) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MapPin className="h-16 w-16 mx-auto mb-3 text-gray-300" />
          <p className="text-base">현장을 선택하세요</p>
          <p className="text-sm">오른쪽 목록에서 행을 클릭하면</p>
          <p className="text-sm">여기에 24시간 그래프가 표시됩니다</p>
        </div>
      </div>
    );
  }

  const siteData = sensorData
    .filter(d => d.siteId === selectedSite.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const now = new Date().getTime();
  const recentData = siteData.filter(d => now - new Date(d.createdAt).getTime() <= 24 * 60 * 60 * 1000);

  const maxFlowRate = Math.max(1, ...recentData.map(d => d.flowRate));

  // 24시간 고정 간격 설정
  const timeRangeMs = 24 * 60 * 60 * 1000;
  const intervalMs = 2 * 60 * 60 * 1000; // 2시간 간격

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{selectedSite.name}</h2>
            <div className="text-sm text-gray-600">관리번호: {selectedSite.managementNumber}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            aria-label="그래프 닫기"
          >
            <X className="h-4 w-4" />
            닫기
          </button>
        </div>
      </div>

      {/* 수위 그래프 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              24시간 수위 변화 (%)
            </span>
            <span className="text-xs text-gray-500">(2시간 간격)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            {recentData.length > 1 ? (
              <svg className="w-full h-full" viewBox="0 0 800 320">
                {/* 축/눈금 */}
                <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                {/* Y 라벨 */}
                <text x="5" y="15" fontSize="12" fill="#6b7280">100%</text>
                <text x="5" y="85" fontSize="12" fill="#6b7280">75%</text>
                <text x="5" y="155" fontSize="12" fill="#6b7280">50%</text>
                <text x="5" y="225" fontSize="12" fill="#6b7280">25%</text>

                {(() => {
                  const start = new Date(recentData[0].createdAt).getTime();
                  const end = new Date(recentData[recentData.length - 1].createdAt).getTime();
                  const total = Math.max(1, end - start);
                  const sampleInterval = Math.max(1, Math.floor(recentData.length / (total / intervalMs)));
                  const sampled: typeof recentData = [] as any;
                  for (let i = 0; i < recentData.length; i += sampleInterval) sampled.push(recentData[i]);
                  if (recentData.length > 0 && sampled[sampled.length - 1] !== recentData[recentData.length - 1]) sampled.push(recentData[recentData.length - 1]);

                  // 옅은 배경선
                  const bg = sampled.map((pt, idx) => {
                    if (idx === 0) return null;
                    const cx = 50 + ((new Date(pt.createdAt).getTime() - start) / total) * 700;
                    const px = 50 + ((new Date(sampled[idx - 1].createdAt).getTime() - start) / total) * 700;
                    const cy = 280 - (pt.waterLevel / 100) * 280;
                    const py = 280 - (sampled[idx - 1].waterLevel / 100) * 280;
                    return (
                      <line key={`bg-${idx}`} x1={px} y1={py} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="1" opacity="0.35" />
                    );
                  });

                  const fg = sampled.map((pt, idx) => {
                    if (idx === 0) return null;
                    const cx = 50 + ((new Date(pt.createdAt).getTime() - start) / total) * 700;
                    const px = 50 + ((new Date(sampled[idx - 1].createdAt).getTime() - start) / total) * 700;
                    const cy = 280 - (pt.waterLevel / 100) * 280;
                    const py = 280 - (sampled[idx - 1].waterLevel / 100) * 280;
                    return (
                      <g key={`fg-${idx}`}>
                        <line x1={px} y1={py} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="3" />
                        <circle cx={cx} cy={cy} r="4" fill="#3b82f6" />
                      </g>
                    );
                  });

                  return (
                    <g>
                      {bg}
                      {fg}
                    </g>
                  );
                })()}

                {/* X축 시간 라벨 (2시간 간격) */}
                {(() => {
                  const start = new Date(recentData[0].createdAt);
                  const end = new Date(recentData[recentData.length - 1].createdAt);
                  const labels: Date[] = [];
                  const cur = new Date(start);
                  // 정돈된 시작시간으로 스냅
                  cur.setMinutes(0, 0, 0);
                  while (cur <= end) {
                    labels.push(new Date(cur));
                    cur.setHours(cur.getHours() + 2);
                  }
                  return labels.map((t, i) => {
                    // 가장 가까운 데이터의 위치로 표시
                    let closest = 0;
                    let min = Infinity;
                    recentData.forEach((d, idx) => {
                      const diff = Math.abs(new Date(d.createdAt).getTime() - t.getTime());
                      if (diff < min) { min = diff; closest = idx; }
                    });
                    const startMs = new Date(recentData[0].createdAt).getTime();
                    const endMs = new Date(recentData[recentData.length - 1].createdAt).getTime();
                    const total = Math.max(1, endMs - startMs);
                    const x = 50 + ((new Date(recentData[closest].createdAt).getTime() - startMs) / total) * 700;
                    return (
                      <g key={`tick-${i}`}>
                        <line x1={x} y1="0" x2={x} y2="280" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                        <text x={x} y="220" fontSize="10" fill="#6b7280" textAnchor="middle">{String(t.getHours()).padStart(2, '0')}</text>
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

      {/* 유량 그래프 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              유량 변화 (L/min)
            </span>
            <span className="text-xs text-gray-500">(2시간 간격)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            {recentData.length > 1 ? (
              <svg className="w-full h-full" viewBox="0 0 800 320">
                {/* 축/눈금 */}
                <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                {/* Y 라벨 */}
                <text x="5" y="15" fontSize="12" fill="#6b7280">50 L/min</text>
                <text x="5" y="85" fontSize="12" fill="#6b7280">37.5 L/min</text>
                <text x="5" y="155" fontSize="12" fill="#6b7280">25 L/min</text>
                <text x="5" y="225" fontSize="12" fill="#6b7280">12.5 L/min</text>

                {(() => {
                  const start = new Date(recentData[0].createdAt).getTime();
                  const end = new Date(recentData[recentData.length - 1].createdAt).getTime();
                  const total = Math.max(1, end - start);
                  const sampleInterval = Math.max(1, Math.floor(recentData.length / (total / intervalMs)));
                  const sampled: typeof recentData = [] as any;
                  for (let i = 0; i < recentData.length; i += sampleInterval) sampled.push(recentData[i]);
                  if (recentData.length > 0 && sampled[sampled.length - 1] !== recentData[recentData.length - 1]) sampled.push(recentData[recentData.length - 1]);

                  // 옅은 배경선
                  const bg = sampled.map((pt, idx) => {
                    if (idx === 0) return null;
                    const cx = 50 + ((new Date(pt.createdAt).getTime() - start) / total) * 700;
                    const px = 50 + ((new Date(sampled[idx - 1].createdAt).getTime() - start) / total) * 700;
                    const cy = 280 - (pt.flowRate / 50) * 280;
                    const py = 280 - (sampled[idx - 1].flowRate / 50) * 280;
                    return (
                      <line key={`bgf-${idx}`} x1={px} y1={py} x2={cx} y2={cy} stroke="#10b981" strokeWidth="1" opacity="0.35" />
                    );
                  });

                  const fg = sampled.map((pt, idx) => {
                    if (idx === 0) return null;
                    const cx = 50 + ((new Date(pt.createdAt).getTime() - start) / total) * 700;
                    const px = 50 + ((new Date(sampled[idx - 1].createdAt).getTime() - start) / total) * 700;
                    const cy = 280 - (pt.flowRate / 50) * 280;
                    const py = 280 - (sampled[idx - 1].flowRate / 50) * 280;
                    return (
                      <g key={`fgf-${idx}`}>
                        <line x1={px} y1={py} x2={cx} y2={cy} stroke="#10b981" strokeWidth="3" />
                        <circle cx={cx} cy={cy} r="4" fill="#10b981" />
                      </g>
                    );
                  });

                  return (
                    <g>
                      {bg}
                      {fg}
                    </g>
                  );
                })()}

                {/* X축 시간 라벨 (2시간 간격) */}
                {(() => {
                  const start = new Date(recentData[0].createdAt);
                  const end = new Date(recentData[recentData.length - 1].createdAt);
                  const labels: Date[] = [];
                  const cur = new Date(start);
                  cur.setMinutes(0, 0, 0);
                  while (cur <= end) {
                    labels.push(new Date(cur));
                    cur.setHours(cur.getHours() + 2);
                  }
                  return labels.map((t, i) => {
                    let closest = 0;
                    let min = Infinity;
                    recentData.forEach((d, idx) => {
                      const diff = Math.abs(new Date(d.createdAt).getTime() - t.getTime());
                      if (diff < min) { min = diff; closest = idx; }
                    });
                    const startMs = new Date(recentData[0].createdAt).getTime();
                    const endMs = new Date(recentData[recentData.length - 1].createdAt).getTime();
                    const total = Math.max(1, endMs - startMs);
                    const x = 50 + ((new Date(recentData[closest].createdAt).getTime() - startMs) / total) * 700;
                    return (
                      <g key={`tickf-${i}`}>
                        <line x1={x} y1="0" x2={x} y2="280" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                        <text x={x} y="220" fontSize="10" fill="#6b7280" textAnchor="middle">{String(t.getHours()).padStart(2, '0')}</text>
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

      {/* 약품 레벨 그래프 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-purple-500" />
              약품 변화 (%)
            </span>
            <span className="text-xs text-gray-500">(2시간 간격)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            {recentData.length > 1 ? (
              <svg className="w-full h-full" viewBox="0 0 800 320">
                {/* 축/눈금 */}
                <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                {/* Y 라벨 */}
                <text x="5" y="15" fontSize="12" fill="#6b7280">100%</text>
                <text x="5" y="85" fontSize="12" fill="#6b7280">75%</text>
                <text x="5" y="155" fontSize="12" fill="#6b7280">50%</text>
                <text x="5" y="225" fontSize="12" fill="#6b7280">25%</text>

                {(() => {
                  const start = new Date(recentData[0].createdAt).getTime();
                  const end = new Date(recentData[recentData.length - 1].createdAt).getTime();
                  const total = Math.max(1, end - start);
                  const sampleInterval = Math.max(1, Math.floor(recentData.length / (total / intervalMs)));
                  const sampled: typeof recentData = [] as any;
                  for (let i = 0; i < recentData.length; i += sampleInterval) sampled.push(recentData[i]);
                  if (recentData.length > 0 && sampled[sampled.length - 1] !== recentData[recentData.length - 1]) sampled.push(recentData[recentData.length - 1]);

                  // 옅은 배경선
                  const bg = sampled.map((pt, idx) => {
                    if (idx === 0) return null;
                    const cx = 50 + ((new Date(pt.createdAt).getTime() - start) / total) * 700;
                    const px = 50 + ((new Date(sampled[idx - 1].createdAt).getTime() - start) / total) * 700;
                    const cy = 280 - (pt.chemicalLevel / 100) * 280;
                    const py = 280 - (sampled[idx - 1].chemicalLevel / 100) * 280;
                    return (
                      <line key={`bgc-${idx}`} x1={px} y1={py} x2={cx} y2={cy} stroke="#8b5cf6" strokeWidth="1" opacity="0.35" />
                    );
                  });

                  const fg = sampled.map((pt, idx) => {
                    if (idx === 0) return null;
                    const cx = 50 + ((new Date(pt.createdAt).getTime() - start) / total) * 700;
                    const px = 50 + ((new Date(sampled[idx - 1].createdAt).getTime() - start) / total) * 700;
                    const cy = 280 - (pt.chemicalLevel / 100) * 280;
                    const py = 280 - (sampled[idx - 1].chemicalLevel / 100) * 280;
                    return (
                      <g key={`fgc-${idx}`}>
                        <line x1={px} y1={py} x2={cx} y2={cy} stroke="#8b5cf6" strokeWidth="3" />
                        <circle cx={cx} cy={cy} r="4" fill="#8b5cf6" />
                      </g>
                    );
                  });

                  return (
                    <g>
                      {bg}
                      {fg}
                    </g>
                  );
                })()}

                {/* X축 시간 라벨 (2시간 간격) */}
                {(() => {
                  const start = new Date(recentData[0].createdAt);
                  const end = new Date(recentData[recentData.length - 1].createdAt);
                  const labels: Date[] = [];
                  const cur = new Date(start);
                  cur.setMinutes(0, 0, 0);
                  while (cur <= end) {
                    labels.push(new Date(cur));
                    cur.setHours(cur.getHours() + 2);
                  }
                  return labels.map((t, i) => {
                    let closest = 0;
                    let min = Infinity;
                    recentData.forEach((d, idx) => {
                      const diff = Math.abs(new Date(d.createdAt).getTime() - t.getTime());
                      if (diff < min) { min = diff; closest = idx; }
                    });
                    const startMs = new Date(recentData[0].createdAt).getTime();
                    const endMs = new Date(recentData[recentData.length - 1].createdAt).getTime();
                    const total = Math.max(1, endMs - startMs);
                    const x = 50 + ((new Date(recentData[closest].createdAt).getTime() - startMs) / total) * 700;
                    return (
                      <g key={`tickc-${i}`}>
                        <line x1={x} y1="0" x2={x} y2="280" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                        <text x={x} y="220" fontSize="10" fill="#6b7280" textAnchor="middle">{String(t.getHours()).padStart(2, '0')}</text>
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
  );
}



export default function SiteManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestBySiteId, setLatestBySiteId] = useState<Record<string, { flowRate: number; totalAmount: number }>>({});
  const [formData, setFormData] = useState<Partial<Site>>({
    name: "",
    managementNumber: "",
    contactPerson: "",
    contactPhone: "",
    tankType: "circular",
    width: 0,
    length: 0,
    height: 0,
    status: "active"
  });

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.managementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.contactPhone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateVolume = (type: "circular" | "square", width: number, length: number, height: number) => {
    if (type === "circular") {
      return Math.PI * Math.pow(width / 2, 2) * height;
    } else {
      return width * length * height;
    }
  };

  // PDF 다운로드 함수들
  const downloadSitePdf = async (siteId: string) => {
    try {
      // 선택된 현장이 있는지 확인
      if (!selectedSite) {
        toast({
          title: "현장 선택 필요",
          description: "인쇄할 현장을 먼저 선택해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      // 현장 인쇄 페이지로 이동
      navigate('/site-print', {
        state: {
          site: selectedSite,
          sensorData: sensorData
        }
      });
      
      toast({
        title: "현장 상세 보고서 페이지로 이동",
        description: `${selectedSite.name} 현장 상세 보고서를 확인하고 인쇄할 수 있습니다.`,
      });
    } catch (error) {
      console.error('페이지 이동 오류:', error);
      toast({
        title: "페이지 이동 실패",
        description: "인쇄 페이지로 이동할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const downloadAllSitesPdf = async () => {
    try {
      // 전체 현장 인쇄 페이지로 이동
      navigate('/all-sites-print', {
        state: {
          sites: sites,
          sensorData: sensorData,
          latestBySiteId: latestBySiteId
        }
      });
      
      // 토스트 메시지 제거 - 전체 현장 인쇄 시 팝업 안 뜨게 함
    } catch (error) {
      console.error('페이지 이동 오류:', error);
      toast({
        title: "페이지 이동 실패",
        description: "인쇄 페이지로 이동할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  // handleInputChange는 현재 사용하지 않으므로 제거하거나 향후 필요 시 다시 추가하세요.

  // Memoized input change handlers to prevent re-creation and focus loss
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleManagementNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, managementNumber: e.target.value }));
  }, []);

  const handleContactPersonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, contactPerson: e.target.value }));
  }, []);

  const handleContactPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, contactPhone: e.target.value }));
  }, []);

  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const updated = { ...prev, width: value };
      const { tankType = "circular", width = value, length = prev.length || 0, height = prev.height || 0 } = updated;
      updated.volume = calculateVolume(tankType as "circular" | "square", width, length, height);
      return updated;
    });
  }, []);

  const handleLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const updated = { ...prev, length: value };
      const { tankType = "circular", width = prev.width || 0, length = value, height = prev.height || 0 } = updated;
      updated.volume = calculateVolume(tankType as "circular" | "square", width, length, height);
      return updated;
    });
  }, []);

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const updated = { ...prev, height: value };
      const { tankType = "circular", width = prev.width || 0, length = prev.length || 0, height = value } = updated;
      updated.volume = calculateVolume(tankType as "circular" | "square", width, length, height);
      return updated;
    });
  }, []);

  const handleTankTypeChange = useCallback((value: string) => {
    setFormData(prev => {
      const updated = { ...prev, tankType: value as "circular" | "square" };
      const { tankType = value as "circular" | "square", width = prev.width || 0, length = prev.length || 0, height = prev.height || 0 } = updated;
      updated.volume = calculateVolume(tankType, width, length, height);
      return updated;
    });
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, status: value as "active" | "inactive" | "maintenance" }));
  }, []);

  const loadSites = useCallback(async () => {
    try {
      const res = await apiClient.listSites();
      if (res.success && Array.isArray(res.data)) {
        setSites(res.data.map(mapSite));
      }
    } catch (e: any) {
      toast({ title: "현장 목록 로딩 실패", description: e.message, variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const fetchSensorData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8084/api/sensor/data');
      if (!response.ok) return;
      const data: SensorData[] = await response.json();
      setSensorData(data);

      // 최신값 맵 구성
      const map: Record<string, { flowRate: number; totalAmount: number; createdAt: number }> = {};
      for (const d of data) {
        const ts = new Date(d.createdAt).getTime();
        const prev = map[d.siteId];
        if (!prev || ts > prev.createdAt) {
          map[d.siteId] = { flowRate: d.flowRate, totalAmount: d.totalAmount, createdAt: ts };
        }
      }
      const latestOnly: Record<string, { flowRate: number; totalAmount: number }> = {};
      Object.keys(map).forEach(k => {
        latestOnly[k] = { flowRate: map[k].flowRate, totalAmount: map[k].totalAmount };
      });
      setLatestBySiteId(latestOnly);
    } catch (error) {
      // 콘솔만 기록 (UI 토스트 소음 방지)
      console.error('센서 데이터 조회 실패:', error);
    }
  }, []);

  useEffect(() => {
    fetchSensorData();
    const timer = setInterval(fetchSensorData, 30000);
    return () => clearInterval(timer);
  }, [fetchSensorData]);

  const handleSubmit = async () => {
    try {
      if (editingSite) {
        const payload: Partial<CreateOrUpdateSiteRequest> = {
          siteName: formData.name!,
          contactNumber: formData.contactPhone!,
          manager: formData.contactPerson || undefined,
          tankType: formData.tankType!,
          length: formData.tankType === "square" ? formData.length || 0 : 0,
          width: formData.width || 0,
          height: formData.height || 0,
          status: formData.status!,
        };
        await apiClient.updateSite(editingSite.managementNumber, payload);
        toast({ title: "현장 수정 완료" });
        setEditingSite(null);
      } else {
        const payload: CreateOrUpdateSiteRequest = {
          managementCode: formData.managementNumber!,
          siteName: formData.name!,
          contactNumber: formData.contactPhone!,
          manager: formData.contactPerson || undefined,
          tankType: formData.tankType!,
          length: formData.tankType === "square" ? formData.length || 0 : 0,
          width: formData.width || 0,
          height: formData.height || 0,
          status: formData.status!,
          memberId: null,
        };
        await apiClient.createSite(payload);
        toast({ title: "현장이 추가되었습니다." });
      }
      await loadSites();
      setFormData({
        name: "",
        managementNumber: "",
        contactPerson: "",
        contactPhone: "",
        tankType: "circular",
        width: 0,
        length: 0,
        height: 0,
        status: "active"
      });
      setIsAddDialogOpen(false);
    } catch (e: any) {
      toast({ title: "저장 실패", description: e.message, variant: "destructive" });
    }
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setFormData(site);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (siteId: string) => {
    try {
      await apiClient.deleteSite(siteId);
      toast({ title: "삭제되었습니다." });
      await loadSites();
    } catch (e: any) {
      toast({ title: "삭제 실패", description: e.message, variant: "destructive" });
    }
  };

  const handlePrintSite = (site: Site) => {
    try {
      // 해당 현장의 센서 데이터만 필터링
      const siteSensorData = sensorData.filter(data => data.siteId === site.id);
      
      // 현장 인쇄 페이지로 이동
      navigate('/site-print', {
        state: {
          site: {
            id: site.id,
            name: site.name,
            managementNumber: site.managementNumber,
            contactPerson: site.contactPerson,
            contactPhone: site.contactPhone,
            tankType: site.tankType,
            width: site.width,
            length: site.length,
            height: site.height,
            volume: site.volume,
            status: site.status
          },
          sensorData: siteSensorData
        }
      });
      
      // 토스트 메시지 제거 - 현장 인쇄 시 팝업 안 뜨게 함
    } catch (error) {
      console.error('페이지 이동 오류:', error);
      toast({
        title: "페이지 이동 실패",
        description: "인쇄 페이지로 이동할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "maintenance": return "destructive";
      default: return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "활성";
      case "inactive": return "비활성";
      case "maintenance": return "점검중";
      default: return status;
    }
  };

  const SitesTable = () => (
    <Card>
      <CardContent className="p-0">
        {/* 인쇄용 테이블 제목 */}
        <div className="print-table-title" style={{ display: 'none' }}>
          <h2 className="text-xl font-bold text-gray-900 text-center py-4">현장 목록</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>현장 정보</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>탱크 사양</TableHead>
              <TableHead>용량</TableHead>
              <TableHead>실시간 데이터</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSites.map((site) => (
              <TableRow
                key={site.id}
                className={`${selectedSite?.id === site.id ? 'bg-blue-50' : ''} hover:bg-gray-50 site-info-row`}
                onClick={() => setSelectedSite(site)}
              >
                <TableCell>
                  <div>
                    <div className="site-name">
                      {site.name}
                    </div>
                    <div className="site-id">{site.managementNumber}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="contact-info">
                    <div>{site.contactPerson}</div>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {site.contactPhone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="tank-specs">
                    <Badge variant="outline" className="mb-1">
                      {site.tankType === 'circular' ? '원형' : '사각형'}
                    </Badge>
                    <div>
                      {site.tankType === 'circular'
                        ? `⌀${site.width}m × ${site.height}m`
                        : `${site.width}m × ${site.length}m × ${site.height}m`}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="capacity">
                    {site.volume.toFixed(1)} m³
                  </div>
                </TableCell>
                <TableCell>
                  <div className="realtime-data">
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 mr-1 text-blue-500" />
                      유량: {latestBySiteId[site.id]?.flowRate !== undefined ? latestBySiteId[site.id].flowRate.toFixed(1) : '-'} L/min
                    </div>
                    <div className="flex items-center">
                      <Gauge className="h-3 w-3 mr-1 text-green-500" />
                      누적: {latestBySiteId[site.id]?.totalAmount !== undefined ? latestBySiteId[site.id].totalAmount.toFixed(1) : '-'} L
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`status-badge status-${site.status}`}>
                    {getStatusText(site.status)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 action-buttons">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); handleEdit(site); }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handlePrintSite(site); 
                      }}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>현장 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 "{site.name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(site.id)}>
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PDF 컴포넌트들은 별도 페이지로 이동 */}
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">현장 관리</h1>
            </div>
            <Badge variant="outline">CRUD 운영</Badge>
          </div>

          <HeaderNav />

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                현장 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSite ? "현장 편집" : "새 현장 추가"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">현장명 *</label>
                    <Input
                      key="field-name"
                      value={formData.name || ""}
                      onChange={handleNameChange}
                      placeholder="현장명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">관리번호 *</label>
                    <Input
                      key="management-number"
                      value={formData.managementNumber || ""}
                      onChange={handleManagementNumberChange}
                      placeholder="예: RSA-001"
                      disabled={!!editingSite}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">담당자 *</label>
                    <Input
                      key="contact-person"
                      value={formData.contactPerson || ""}
                      onChange={handleContactPersonChange}
                      placeholder="담당자명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">연락처 *</label>
                    <Input
                      key="contact-phone"
                      value={formData.contactPhone || ""}
                      onChange={handleContactPhoneChange}
                      placeholder="+82-10-1234-5678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">탱크 타입 *</label>
                  <Select
                    value={formData.tankType}
                    onValueChange={handleTankTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="탱크 타입을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circular">원형</SelectItem>
                      <SelectItem value="square">사각형</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {formData.tankType === "circular" ? "직경 (m)" : "너비 (m)"} *
                    </label>
                    <Input
                      key="width"
                      type="number"
                      value={formData.width || ""}
                      onChange={handleWidthChange}
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className={`space-y-2 ${formData.tankType === "circular" ? "hidden" : ""}`}>
                    <label className="text-sm font-medium">길이 (m) *</label>
                    <Input
                      key="length"
                      type="number"
                      value={formData.length || ""}
                      onChange={handleLengthChange}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      disabled={formData.tankType === "circular"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">높이 (m) *</label>
                    <Input
                      key="height"
                      type="number"
                      value={formData.height || ""}
                      onChange={handleHeightChange}
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                {formData.volume !== undefined && formData.volume > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>계산된 용량:</strong> {formData.volume.toFixed(2)} m³
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">상태</label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="상태를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="inactive">비활성</SelectItem>
                      <SelectItem value="maintenance">점검중</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingSite(null);
                  setFormData({
                    name: "",
                    managementNumber: "",
                    contactPerson: "",
                    contactPhone: "",
                    tankType: "circular",
                    width: 0,
                    length: 0,
                    height: 0,
                    status: "active"
                  });
                }}>
                  취소
                </Button>
                <Button onClick={handleSubmit}>
                  {editingSite ? "현장 수정" : "현장 추가"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">현장 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
                          <div className="relative flex-1 search-and-filter-controls">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="현장명, 관리번호, 담당자명, 연락처 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
              <Badge variant="secondary">
                {filteredSites.length} / {sites.length} 현장
              </Badge>
              
              {/* PDF 다운로드 버튼들 */}
              <div className="flex items-center space-x-2 print-button-group">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAllSitesPdf()}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">전체 현장 PDF출력</span>
                </Button>
                {selectedSite && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSitePdf(selectedSite.id)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">현장 PDF출력</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 레이아웃: 선택 전에는 테이블 전체, 선택 후에는 4:6 분할 */}
        {selectedSite ? (
          <div className="grid grid-cols-10 gap-4">
            {/* Left 4/10: Selected site graphs */}
            <div className="col-span-10 lg:col-span-4 site-graphs-container">
              <SiteGraphs selectedSite={selectedSite} sensorData={sensorData} onClose={() => setSelectedSite(null)} />
            </div>
            {/* Right 6/10: Sites Table */}
            <div className="col-span-10 lg:col-span-6">
              <SitesTable />
            </div>
          </div>
        ) : (
          <>
            <SitesTable />
            

          </>
        )}
      </div>
      
      {/* 인쇄용 푸터는 별도 페이지에서 처리됩니다 */}
    </div>
  );
}
