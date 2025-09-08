import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TestTube,
  Droplets,
  Gauge,
  AlertTriangle,
  Power,
  MapPin,
  RefreshCw,
  Database,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowLeft,
  Zap,
  Waves,
  Star
} from "lucide-react";
import HeaderNav from "@/components/Header";

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

export default function Test() {
  const params = useParams();
  const routedSiteId = params.id ?? null;
  // 실시간 센서 데이터 상태
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("24h");
  const [showMoreRecords, setShowMoreRecords] = useState<number>(10);
  
  // 즐겨찾기 관련 상태
  const [favoriteSites, setFavoriteSites] = useState<string[]>([]);

  // 실시간 센서 데이터 가져오기
  const fetchSensorData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8084/api/sensor/data');
      if (response.ok) {
        const data = await response.json();
        console.log('센서 데이터 로드 완료:', data.length, '개');
        console.log('데이터 시간 범위:', data.length > 0 ? {
          최신: new Date(data[0].createdAt).toLocaleString(),
          최고: new Date(data[data.length - 1].createdAt).toLocaleString()
        } : '데이터 없음');
        
        // 데이터 샘플 로그 (처음 5개, 마지막 5개)
        if (data.length > 0) {
          console.log('처음 5개 데이터:', data.slice(0, 5).map(d => ({
            id: d.id,
            createdAt: new Date(d.createdAt).toLocaleString(),
            waterLevel: d.waterLevel,
            flowRate: d.flowRate
          })));
          if (data.length > 5) {
            console.log('마지막 5개 데이터:', data.slice(-5).map(d => ({
              id: d.id,
              createdAt: new Date(d.createdAt).toLocaleString(),
              waterLevel: d.waterLevel,
              flowRate: d.flowRate
            })));
          }
        }
        
        setSensorData(data);
      }
    } catch (error) {
      console.error('센서 데이터 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 즐겨찾기 관련 함수들
  const loadFavoriteSites = () => {
    const saved = localStorage.getItem('favoriteSites');
    if (saved) {
      try {
        setFavoriteSites(JSON.parse(saved));
      } catch (error) {
        console.error('즐겨찾기 로드 실패:', error);
        setFavoriteSites([]);
      }
    }
  };

  const saveFavoriteSites = (sites: string[]) => {
    localStorage.setItem('favoriteSites', JSON.stringify(sites));
    setFavoriteSites(sites);
  };

  const toggleFavorite = (siteId: string) => {
    const newFavorites = favoriteSites.includes(siteId)
      ? favoriteSites.filter(id => id !== siteId)
      : [...favoriteSites, siteId];
    saveFavoriteSites(newFavorites);
  };

  const isFavorite = (siteId: string) => {
    return favoriteSites.includes(siteId);
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchSensorData();
    loadFavoriteSites();
  }, []);

  // URL 파라미터로 들어온 경우 자동 상세 열기
  useEffect(() => {
    if (routedSiteId) {
      setSelectedSite(routedSiteId);
    }
  }, [routedSiteId]);

  // 모터 상태 텍스트 변환
  const getMotorStatusText = (status1: number, status2: number) => {
    if (status1 === 1 && status2 === 1) return '모터1 ON, 모터2 ON';
    if (status1 === 1 && status2 === 0) return '모터1 ON, 모터2 OFF';
    if (status1 === 0 && status2 === 1) return '모터1 OFF, 모터2 ON';
    return '모터1 OFF, 모터2 OFF';
  };

  // 상태에 따른 배지 색상
  const getStatusBadge = (value: number, type: 'water' | 'chemical' | 'leak') => {
    if (type === 'water') {
      if (value > 80) return 'destructive';
      if (value > 60) return 'secondary';
      return 'default';
    } else if (type === 'chemical') {
      if (value < 20) return 'destructive';
      if (value < 40) return 'secondary';
      return 'default';
    } else if (type === 'leak') {
      if (value > 10) return 'destructive';
      if (value > 5) return 'secondary';
      return 'default';
    }
    return 'default';
  };

  // 현장별 최신 데이터만 추출
  const getLatestDataBySite = () => {
    const siteMap = new Map<string, SensorData>();
    sensorData.forEach(data => {
      if (!siteMap.has(data.siteId) || 
          new Date(data.createdAt) > new Date(siteMap.get(data.siteId)!.createdAt)) {
        siteMap.set(data.siteId, data);
      }
    });
    return Array.from(siteMap.values());
  };

  // 상세보기 열기
  const openDetailView = (siteId: string) => {
    setSelectedSite(siteId);
    setShowMoreRecords(10);
  };

  // 상세보기 닫기
  const closeDetailView = () => {
    setSelectedSite(null);
    setShowMoreRecords(10);
  };

  // 더보기 버튼 클릭 시
  const handleShowMore = () => {
    setShowMoreRecords(prev => prev + 10);
  };

  // 선택된 현장의 데이터 가져오기
  const getSelectedSiteData = () => {
    if (!selectedSite) return [];
    
    let filteredData = sensorData
      .filter(data => data.siteId === selectedSite)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log('현장별 필터링 후:', filteredData.length, '개');
    
    // 시간 범위에 따른 필터링
    const now = new Date();
    const timeRangeMs = getTimeRangeInMs(timeRange);
    const cutoffTime = new Date(now.getTime() - timeRangeMs);
    
    console.log('시간 범위 필터링:', {
      현재시간: now.toLocaleString(),
      선택범위: timeRange,
      시작시간: cutoffTime.toLocaleString(),
      차이: Math.round(timeRangeMs / (1000 * 60 * 60)) + '시간'
    });
    
    filteredData = filteredData.filter(data => 
      new Date(data.createdAt) >= cutoffTime
    );
    
    console.log('시간 범위 필터링 후:', filteredData.length, '개');
    
    return filteredData;
  };

  // 시간 범위를 밀리초로 변환
  const getTimeRangeInMs = (range: string) => {
    switch (range) {
      case "1h": return 60 * 60 * 1000;
      case "6h": return 6 * 60 * 60 * 1000;
      case "12h": return 12 * 60 * 60 * 1000;
      case "24h": return 24 * 60 * 60 * 1000;
      case "3d": return 3 * 24 * 60 * 60 * 1000;
      case "7d": return 7 * 24 * 60 * 60 * 1000;
      case "1m": return 30 * 24 * 60 * 60 * 1000;
      case "3m": return 90 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  };

  // 시간 범위에 따른 간격 계산 (밀리초)
  const getTimeInterval = (range: string) => {
    switch (range) {
      case "1h": return 10 * 60 * 1000;
      case "6h": return 30 * 60 * 1000;
      case "12h": return 60 * 60 * 1000;
      case "24h": return 2 * 60 * 60 * 1000;
      case "3d": return 6 * 60 * 60 * 1000;
      case "7d": return 12 * 60 * 60 * 1000;
      case "1m": return 24 * 60 * 60 * 1000;
      case "3m": return 3 * 24 * 60 * 60 * 1000;
      default: return 2 * 60 * 60 * 1000;
    }
  };

  // 시간 범위에 따른 간격 텍스트
  const getTimeIntervalText = (range: string) => {
    switch (range) {
      case "1h": return "10분";
      case "6h": return "30분";
      case "12h": return "1시간";
      case "24h": return "2시간";
      case "3d": return "6시간";
      case "7d": return "12시간";
      case "1m": return "1일";
      case "3m": return "3일";
      default: return "2시간";
    }
  };

  // 🎯 최고의 해결방법: 시간 범위별 적응형 배경 선 설정
  const getAdaptiveBackgroundLineSettings = (timeRange: string) => {
    switch (timeRange) {
      case "1h":
        return {
          opacity: 0.08,        // 매우 옅게 (거의 안 보임)
          strokeWidth: 0.5,     // 매우 얇게
          sampleInterval: 8,    // 8개 간격으로 샘플링 (복잡성 대폭 감소)
          enabled: true         // 완전히 제거하지 않고 매우 옅게
        };
      case "6h":
        return {
          opacity: 0.25,        // 적당히 옅게
          strokeWidth: 1,       // 기본 두께
          sampleInterval: 3,    // 3개 간격으로 샘플링
          enabled: true
        };
      case "12h":
        return {
          opacity: 0.35,        // 조금 진하게
          strokeWidth: 1,       // 기본 두께
          sampleInterval: 2,    // 2개 간격으로 샘플링
          enabled: true
        };
      case "24h":
        return {
          opacity: 0.4,         // 더 진하게
          strokeWidth: 1,       // 기본 두께
          sampleInterval: 1,    // 모든 데이터 사용
          enabled: true
        };
      case "3d":
      case "7d":
      case "1m":
      case "3m":
        return {
          opacity: 0.5,         // 가장 진하게
          strokeWidth: 1,       // 기본 두께
          sampleInterval: 1,    // 모든 데이터 사용
          enabled: true
        };
      default:
        return {
          opacity: 0.3,         // 기본값
          strokeWidth: 1,       // 기본 두께
          sampleInterval: 1,    // 모든 데이터 사용
          enabled: true
        };
    }
  };

  // 현장별 상세 데이터 가져오기 (더보기 기능 포함)
  const getSiteDetailData = (siteId: string) => {
    return sensorData
      .filter(data => data.siteId === siteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, showMoreRecords);
  };

  // 상세보기 모드일 때 현장 상세정보 페이지 표시
  if (selectedSite) {
    const siteData = getLatestDataBySite().find(data => data.siteId === selectedSite);
    if (!siteData) return null;

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={closeDetailView}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              뒤로가기
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">현장 {selectedSite} 상세정보</h1>
              <p className="text-gray-600">관리번호: {selectedSite}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              마지막 업데이트: {new Date(siteData.createdAt).toLocaleTimeString('ko-KR', { hour12: false })}
            </span>
            <Button variant="outline" size="sm" onClick={fetchSensorData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-6">
            {/* 사이트 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-blue-500" />
                  사이트 기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">관리번호</span>
                  <span className="font-mono text-blue-600">{selectedSite}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">물탱크 수위</span>
                  <span className="font-mono text-green-600">{siteData.waterLevel}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">화학물질</span>
                  <span className="font-mono text-purple-600">{siteData.chemicalLevel}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">유량</span>
                  <span className="font-mono text-orange-600">{siteData.flowRate.toFixed(2)} L/min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">누적</span>
                  <span className="font-mono text-gray-600">{siteData.totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* 모터 작동 상태 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  모터 작동 상태
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 모터 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">모터 1</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${siteData.motorStatus1 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <Badge variant={siteData.motorStatus1 === 1 ? 'default' : 'destructive'}>
                        {siteData.motorStatus1 === 1 ? '가동중' : '정지'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>최근 가동시간: {siteData.motorStatus1 === 1 ? '24.5시간' : '0시간'}</div>
                    <div>누적 가동시간: {siteData.motorStatus1 === 1 ? '2,450시간' : '1,890시간'}</div>
                  </div>
                </div>

                {/* 모터 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">모터 2</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${siteData.motorStatus2 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <Badge variant={siteData.motorStatus2 === 1 ? 'default' : 'destructive'}>
                        {siteData.motorStatus2 === 1 ? '가동중' : '정지'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>최근 가동시간: {siteData.motorStatus2 === 1 ? '24.5시간' : '0시간'}</div>
                    <div>누적 가동시간: {siteData.motorStatus2 === 1 ? '2,450시간' : '1,890시간'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 - 데이터 변화 트렌드 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    데이터 변화 트렌드
                  </span>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1시간</SelectItem>
                      <SelectItem value="6h">6시간</SelectItem>
                      <SelectItem value="12h">12시간</SelectItem>
                      <SelectItem value="24h">24시간</SelectItem>
                      <SelectItem value="3d">3일</SelectItem>
                      <SelectItem value="7d">7일</SelectItem>
                      <SelectItem value="1m">1개월</SelectItem>
                      <SelectItem value="3m">3개월</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 수위 변화 그래프 */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      물탱크 수위 변화 (%) 
                      <span className="text-xs text-gray-500 ml-2">
                        ({getTimeIntervalText(timeRange)} 간격)
                      </span>
                    </h3>
                    <div className="h-80 relative">
                      <svg className="w-full h-full" viewBox="0 0 800 320">
                        {/* Y축 눈금 */}
                        <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                        <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                        <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                        <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                        <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                        
                        {/* Y축 라벨 */}
                        <text x="5" y="15" fontSize="12" fill="#6b7280">100%</text>
                        <text x="5" y="85" fontSize="12" fill="#6b7280">75%</text>
                        <text x="5" y="155" fontSize="12" fill="#6b7280">50%</text>
                        <text x="5" y="225" fontSize="12" fill="#6b7280">25%</text>
                        
                        {/* 선그래프 - 시간 간격에 따라 데이터 샘플링하여 표시 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          // 시간 범위 계산
                          const startTime = new Date(data[data.length - 1].createdAt); // 가장 오래된 데이터
                          const endTime = new Date(data[0].createdAt); // 가장 최신 데이터
                          const totalTimeRange = endTime.getTime() - startTime.getTime();
                          
                          // 시간 간격에 따른 샘플링 간격 계산
                          const interval = getTimeInterval(timeRange);
                          const sampleInterval = Math.max(1, Math.floor(data.length / (totalTimeRange / interval)));
                          
                          // 샘플링된 데이터 포인트 생성
                          const sampledData = [];
                          for (let i = 0; i < data.length; i += sampleInterval) {
                            sampledData.push(data[i]);
                          }
                          // 마지막 데이터 포인트 추가
                          if (data.length > 0 && !sampledData.includes(data[data.length - 1])) {
                            sampledData.push(data[data.length - 1]);
                          }
                          
                          return sampledData.map((dataPoint, index) => {
                            if (index === 0) return null;
                            
                            const currentTime = new Date(dataPoint.createdAt);
                            const prevTime = new Date(sampledData[index - 1].createdAt);
                            
                            // X축 위치 계산 (정석적인 방식: 왼쪽이 과거, 오른쪽이 현재)
                            const currentX = 50 + ((currentTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            const prevX = 50 + ((prevTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            
                            const currentY = 280 - (dataPoint.waterLevel / 100) * 280;
                            const prevY = 280 - (sampledData[index - 1].waterLevel / 100) * 280;
                            
                            return (
                              <g key={index}>
                                <line
                                  x1={prevX}
                                  y1={prevY}
                                  x2={currentX}
                                  y2={currentY}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                  fill="none"
                                />
                                <circle
                                  cx={currentX}
                                  cy={currentY}
                                  r="4"
                                  fill="#3b82f6"
                                />
                              </g>
                            );
                          });
                        })()}
                        
                        {/* 🎯 적응형 배경 선 - 시간 범위에 따라 자동 조정 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          const settings = getAdaptiveBackgroundLineSettings(timeRange);
                          if (!settings.enabled) return null;
                          
                          const startTime = new Date(data[data.length - 1].createdAt);
                          const endTime = new Date(data[0].createdAt);
                          const totalTimeRange = endTime.getTime() - startTime.getTime();
                          
                          // 샘플링된 데이터 포인트 생성 (복잡성 감소)
                          const sampledBackgroundData = [];
                          for (let i = 0; i < data.length; i += settings.sampleInterval) {
                            sampledBackgroundData.push(data[i]);
                          }
                          // 마지막 데이터 포인트 추가
                          if (data.length > 0 && !sampledBackgroundData.includes(data[data.length - 1])) {
                            sampledBackgroundData.push(data[data.length - 1]);
                          }
                          
                          return sampledBackgroundData.map((dataPoint, index) => {
                            if (index === 0) return null;
                            
                            const currentTime = new Date(dataPoint.createdAt);
                            const prevTime = new Date(sampledBackgroundData[index - 1].createdAt);
                            
                            // X축 위치 계산 (정석적인 방식: 왼쪽이 과거, 오른쪽이 현재)
                            const currentX = 50 + ((currentTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            const prevX = 50 + ((prevTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            
                            const currentY = 280 - (dataPoint.waterLevel / 100) * 280;
                            const prevY = 280 - (sampledBackgroundData[index - 1].waterLevel / 100) * 280;
                            
                            return (
                              <line
                                key={`bg-${index}`}
                                x1={prevX}
                                y1={prevY}
                                x2={currentX}
                                y2={currentY}
                                stroke="#3b82f6"
                                strokeWidth={settings.strokeWidth}
                                opacity={settings.opacity}
                                fill="none"
                              />
                            );
                          });
                        })()}
                        
                        {/* 첫 번째 점도 표시 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          const startTime = new Date(data[data.length - 1].createdAt);
                          const endTime = new Date(data[0].createdAt);
                          const totalTimeRange = endTime.getTime() - startTime.getTime();
                          
                          const firstData = data[data.length - 1]; // 가장 오래된 데이터
                          const firstX = 50 + ((startTime.getTime() - startTime.getTime()) / totalTimeRange) * 700; // 50
                          const firstY = 280 - (firstData.waterLevel / 100) * 280;
                          
                          return (
                            <circle
                              cx={firstX}
                              cy={firstY}
                              r="3"
                              fill="#3b82f6"
                            />
                          );
                        })()}
                        
                        {/* X축 시간 라벨 - 동적 간격 시간 표시만 사용 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          const startTime = new Date(data[data.length - 1].createdAt);
                          const endTime = new Date(data[0].createdAt);
                          const interval = getTimeInterval(timeRange);
                          
                          const timePoints = [];
                          let currentTime = new Date(startTime);
                          
                          // 시작 시간을 간격에 맞게 조정
                          if (interval <= 60 * 60 * 1000) {
                            // 분 단위 간격
                            const minutes = Math.floor(currentTime.getMinutes() / (interval / (60 * 1000))) * (interval / (60 * 1000));
                            currentTime.setMinutes(minutes, 0, 0);
                          } else if (interval <= 24 * 60 * 60 * 1000) {
                            // 시간 단위 간격
                            const hours = Math.floor(currentTime.getHours() / (interval / (60 * 60 * 1000))) * (interval / (60 * 60 * 1000));
                            currentTime.setHours(hours, 0, 0, 0);
                          } else {
                            // 일 단위 간격
                            const days = Math.floor(currentTime.getDate() / (interval / (24 * 60 * 60 * 1000))) * (interval / (24 * 60 * 60 * 1000));
                            currentTime.setDate(days);
                            currentTime.setHours(0, 0, 0, 0);
                          }
                          
                          // 간격에 맞는 시간 포인트 생성
                          while (currentTime <= endTime) {
                            timePoints.push(new Date(currentTime));
                            if (interval <= 60 * 60 * 1000) {
                              currentTime.setMinutes(currentTime.getMinutes() + (interval / (60 * 1000)));
                            } else if (interval <= 24 * 60 * 60 * 1000) {
                              currentTime.setHours(currentTime.getHours() + (interval / (60 * 60 * 1000)));
                            } else {
                              currentTime.setDate(currentTime.getDate() + (interval / (24 * 60 * 60 * 1000)));
                            }
                          }
                          
                          return timePoints.map((time, timeIndex) => {
                            // 데이터에서 가장 가까운 시간 찾기
                            let closestIndex = 0;
                            let minDiff = Infinity;
                            
                            data.forEach((dataPoint, dataIndex) => {
                              const dataTime = new Date(dataPoint.createdAt);
                              const diff = Math.abs(dataTime.getTime() - time.getTime());
                              if (diff < minDiff) {
                                minDiff = diff;
                                closestIndex = dataIndex;
                              }
                            });
                            
                            // 간격의 절반 이내에 있는 데이터만 표시
                            if (minDiff <= interval / 2) {
                              const dataPoint = data[closestIndex];
                              const currentTime = new Date(dataPoint.createdAt);
                              const startTime = new Date(data[data.length - 1].createdAt);
                              const endTime = new Date(data[0].createdAt);
                              const totalTimeRange = endTime.getTime() - startTime.getTime();
                              
                              // X축 위치 계산 (정석적인 방식: 왼쪽이 과거, 오른쪽이 현재)
                              const x = 50 + ((currentTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                              
                              return (
                                <g key={`interval-${timeIndex}`}>
                                  {/* 수직 점선 */}
                                  <line 
                                    x1={x} y1="0" x2={x} y2="280" 
                                    stroke="#e5e7eb" 
                                    strokeWidth="1" 
                                    strokeDasharray="2,2"
                                  />
                                  {/* 시간 라벨 */}
                                  <text 
                                    x={x} y="300" 
                                    fontSize="10" 
                                    fill="#6b7280" 
                                    textAnchor="middle"
                                  >
                                    {time.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit', hour12: false})}
                                  </text>
                                </g>
                              );
                            }
                            return null;
                          });
                        })()}
                      </svg>
                    </div>
                  </div>

                  {/* 유량 변화 그래프 */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      유량 변화 (L/min)
                      <span className="text-xs text-gray-500 ml-2">
                        ({getTimeIntervalText(timeRange)} 간격)
                      </span>
                    </h3>
                    <div className="h-80 relative">
                      <svg className="w-full h-full" viewBox="0 0 800 320">
                        {/* Y축 눈금 */}
                        <line x1="0" y1="0" x2="0" y2="280" stroke="#e5e7eb" strokeWidth="1" />
                        <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                        <line x1="0" y1="70" x2="800" y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
                        <line x1="0" y1="140" x2="800" y2="140" stroke="#e5e7eb" strokeWidth="0.5" />
                        <line x1="0" y1="210" x2="800" y2="210" stroke="#e5e7eb" strokeWidth="0.5" />
                        
                        {/* Y축 라벨 */}
                        <text x="5" y="15" fontSize="12" fill="#6b7280">50 L/min</text>
                        <text x="5" y="85" fontSize="12" fill="#6b7280">37.5 L/min</text>
                        <text x="5" y="155" fontSize="12" fill="#6b7280">25 L/min</text>
                        <text x="5" y="225" fontSize="12" fill="#6b7280">12.5 L/min</text>
                        
                        {/* 선그래프 - 시간 간격에 따라 데이터 샘플링하여 표시 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          // 시간 범위 계산
                          const startTime = new Date(data[data.length - 1].createdAt); // 가장 오래된 데이터
                          const endTime = new Date(data[0].createdAt); // 가장 최신 데이터
                          const totalTimeRange = endTime.getTime() - startTime.getTime();
                          
                          // 시간 간격에 따른 샘플링 간격 계산
                          const interval = getTimeInterval(timeRange);
                          const sampleInterval = Math.max(1, Math.floor(data.length / (totalTimeRange / interval)));
                          
                          // 샘플링된 데이터 포인트 생성
                          const sampledData = [];
                          for (let i = 0; i < data.length; i += sampleInterval) {
                            sampledData.push(data[i]);
                          }
                          // 마지막 데이터 포인트 추가
                          if (data.length > 0 && !sampledData.includes(data[data.length - 1])) {
                            sampledData.push(data[data.length - 1]);
                          }
                          
                          return sampledData.map((dataPoint, index) => {
                            if (index === 0) return null;
                            
                            const currentTime = new Date(dataPoint.createdAt);
                            const prevTime = new Date(sampledData[index - 1].createdAt);
                            
                            // X축 위치 계산 (정석적인 방식: 왼쪽이 과거, 오른쪽이 현재)
                            const currentX = 50 + ((currentTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            const prevX = 50 + ((prevTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            
                            const currentY = 280 - (dataPoint.flowRate / 50) * 280;
                            const prevY = 280 - (sampledData[index - 1].flowRate / 50) * 280;
                            
                            return (
                              <g key={index}>
                                <line
                                  x1={prevX}
                                  y1={prevY}
                                  x2={currentX}
                                  y2={currentY}
                                  stroke="#10b981"
                                  strokeWidth="3"
                                  fill="none"
                                />
                                <circle
                                  cx={currentX}
                                  cy={currentY}
                                  r="4"
                                  fill="#10b981"
                                />
                              </g>
                            );
                          });
                        })()}
                        
                        {/* 🎯 적응형 배경 선 - 시간 범위에 따라 자동 조정 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          const settings = getAdaptiveBackgroundLineSettings(timeRange);
                          if (!settings.enabled) return null;
                          
                          const startTime = new Date(data[data.length - 1].createdAt);
                          const endTime = new Date(data[0].createdAt);
                          const totalTimeRange = endTime.getTime() - startTime.getTime();
                          
                          // 샘플링된 데이터 포인트 생성 (복잡성 감소)
                          const sampledBackgroundData = [];
                          for (let i = 0; i < data.length; i += settings.sampleInterval) {
                            sampledBackgroundData.push(data[i]);
                          }
                          // 마지막 데이터 포인트 추가
                          if (data.length > 0 && !sampledBackgroundData.includes(data[data.length - 1])) {
                            sampledBackgroundData.push(data[data.length - 1]);
                          }
                          
                          return sampledBackgroundData.map((dataPoint, index) => {
                            if (index === 0) return null;
                            
                            const currentTime = new Date(dataPoint.createdAt);
                            const prevTime = new Date(sampledBackgroundData[index - 1].createdAt);
                            
                            // X축 위치 계산 (정석적인 방식: 왼쪽이 과거, 오른쪽이 현재)
                            const currentX = 50 + ((currentTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            const prevX = 50 + ((prevTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                            
                            const currentY = 280 - (dataPoint.flowRate / 50) * 280;
                            const prevY = 280 - (sampledBackgroundData[index - 1].flowRate / 50) * 280;
                            
                            return (
                              <line
                                key={`bg-flow-${index}`}
                                x1={prevX}
                                y1={prevY}
                                x2={currentX}
                                y2={currentY}
                                stroke="#10b981"
                                strokeWidth={settings.strokeWidth}
                                opacity={settings.opacity}
                                fill="none"
                              />
                            );
                          });
                        })()}
                        
                        {/* 첫 번째 점도 표시 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          const startTime = new Date(data[data.length - 1].createdAt);
                          const endTime = new Date(data[0].createdAt);
                          const totalTimeRange = endTime.getTime() - startTime.getTime();
                          
                          const firstData = data[data.length - 1]; // 가장 오래된 데이터
                          const firstX = 50 + ((startTime.getTime() - startTime.getTime()) / totalTimeRange) * 700; // 50
                          const firstY = 280 - (firstData.flowRate / 50) * 280;
                          
                          return (
                            <circle
                              cx={firstX}
                              cy={firstY}
                              r="3"
                              fill="#10b981"
                            />
                          );
                        })()}
                        
                        {/* X축 시간 라벨 - 동적 간격 시간 표시만 사용 */}
                        {(() => {
                          const data = getSelectedSiteData();
                          if (data.length === 0) return null;
                          
                          const startTime = new Date(data[data.length - 1].createdAt);
                          const endTime = new Date(data[0].createdAt);
                          const interval = getTimeInterval(timeRange);
                          
                          const timePoints = [];
                          let currentTime = new Date(startTime);
                          
                          if (interval <= 60 * 60 * 1000) {
                            currentTime.setMinutes(Math.floor(currentTime.getMinutes() / (interval / (60 * 1000))) * (interval / (60 * 1000)), 0, 0);
                          } else if (interval <= 24 * 60 * 60 * 1000) {
                            currentTime.setHours(Math.floor(currentTime.getHours() / (interval / (60 * 60 * 1000))) * (interval / (60 * 60 * 1000)), 0, 0, 0);
                          } else {
                            currentTime.setDate(Math.floor(currentTime.getDate() / (interval / (24 * 60 * 60 * 1000))) * (interval / (24 * 60 * 60 * 1000)));
                            currentTime.setHours(0, 0, 0, 0);
                          }
                          
                          while (currentTime <= endTime) {
                            timePoints.push(new Date(currentTime));
                            if (interval <= 60 * 60 * 1000) {
                              currentTime.setMinutes(currentTime.getMinutes() + (interval / (60 * 1000)));
                            } else if (interval <= 24 * 60 * 60 * 1000) {
                              currentTime.setHours(currentTime.getHours() + (interval / (60 * 60 * 1000)));
                            } else {
                              currentTime.setDate(currentTime.getDate() + (interval / (24 * 60 * 60 * 1000)));
                            }
                          }
                          
                          return timePoints.map((time, timeIndex) => {
                            let closestIndex = 0;
                            let minDiff = Infinity;
                            
                            data.forEach((dataPoint, dataIndex) => {
                              const dataTime = new Date(dataPoint.createdAt);
                              const diff = Math.abs(dataTime.getTime() - time.getTime());
                              if (diff < minDiff) {
                                minDiff = diff;
                                closestIndex = dataIndex;
                              }
                            });
                            
                            if (minDiff <= interval / 2) {
                              const dataPoint = data[closestIndex];
                              const currentTime = new Date(dataPoint.createdAt);
                              const startTime = new Date(data[data.length - 1].createdAt);
                              const endTime = new Date(data[0].createdAt);
                              const totalTimeRange = endTime.getTime() - startTime.getTime();
                              
                              const x = 50 + ((currentTime.getTime() - startTime.getTime()) / totalTimeRange) * 700;
                              
                              return (
                                <g key={`interval-flow-${timeIndex}`}>
                                  {/* 수직 점선 */}
                                  <line 
                                    x1={x} y1="0" x2={x} y2="280" 
                                    stroke="#e5e7eb" 
                                    strokeWidth="1" 
                                    strokeDasharray="2,2"
                                  />
                                  {/* 시간 라벨 */}
                                  <text 
                                    x={x} y="300" 
                                    fontSize="10" 
                                    fill="#6b7280" 
                                    textAnchor="middle"
                                  >
                                    {time.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit', hour12: false})}
                                  </text>
                                </g>
                              );
                            }
                            return null;
                          });
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 현장 기록 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              현장 {selectedSite} 기록
            </CardTitle>
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
                  {getSiteDetailData(selectedSite).map((data, index) => (
                    <TableRow key={data.id || index}>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(data.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(data.waterLevel, 'water')}>
                          {data.waterLevel}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(data.chemicalLevel, 'chemical')}>
                          {data.chemicalLevel}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{(data.flowRate).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{data.totalAmount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(data.leakAmount, 'leak')}>
                          {(data.leakAmount).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{(data.leakPercentage).toFixed(1)}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${data.motorStatus1 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div className={`w-2 h-2 rounded-full ${data.motorStatus2 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-gray-600">
                            {getMotorStatusText(data.motorStatus1, data.motorStatus2)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* 더보기 버튼 */}
            {(() => {
              const totalRecords = sensorData.filter(data => data.siteId === selectedSite).length;
              if (totalRecords > showMoreRecords) {
                return (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={handleShowMore}
                      className="w-full"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      더보기 ({showMoreRecords}/{totalRecords})
                    </Button>
                  </div>
                );
              }
              return null;
            })()}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 메인 테이블 화면
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            뒤로가기
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
            <TestTube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">실시간 센서 모니터링</h1>
            <p className="text-gray-600">상수도 관리 시스템 실시간 데이터</p>
          </div>
        </div>
         <HeaderNav />
        <div className="flex items-center gap-2">
          <Badge variant="default">
            <Database className="h-3 w-3 mr-1" />
            실시간 모니터링
          </Badge>
        </div>
      </div>

      {/* 현장별 최신 데이터 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              현장별 최신 데이터
            </span>
            <Button variant="outline" size="sm" onClick={fetchSensorData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">데이터 로딩 중...</p>
            </div>
          ) : sensorData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 센서 데이터가 없습니다.</p>
              <p className="text-sm">백엔드에서 데이터를 생성하고 있는지 확인해주세요.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>현장 ID</TableHead>
                    <TableHead>수위 (%)</TableHead>
                    <TableHead>약품 (%)</TableHead>
                    <TableHead>유량 (L/min)</TableHead>
                    <TableHead>적산 (L)</TableHead>
                    <TableHead>누수량 (L)</TableHead>
                    <TableHead>일일 누수율 (%)</TableHead>
                    <TableHead>모터 상태</TableHead>
                    <TableHead>최신 업데이트</TableHead>
                    <TableHead>즐겨찾기</TableHead>
                    <TableHead>상세보기</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getLatestDataBySite().map((data, index) => (
                    <TableRow key={data.id || index}>
                      <TableCell className="font-medium">{data.siteId}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(data.waterLevel, 'water')}>
                          {data.waterLevel}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(data.chemicalLevel, 'chemical')}>
                          {data.chemicalLevel}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{(data.flowRate).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{data.totalAmount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(data.leakAmount, 'leak')}>
                          {(data.leakAmount).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{(data.leakPercentage).toFixed(1)}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${data.motorStatus1 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div className={`w-2 h-2 rounded-full ${data.motorStatus2 === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-gray-600">
                            {getMotorStatusText(data.motorStatus1, data.motorStatus2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(data.createdAt).toLocaleTimeString('ko-KR', { hour12: false })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(data.siteId)}
                          className={`p-1 h-8 w-8 ${isFavorite(data.siteId) ? 'text-yellow-500' : 'text-gray-400'}`}
                        >
                          <Star className={`h-4 w-4 ${isFavorite(data.siteId) ? 'fill-current' : ''}`} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailView(data.siteId)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}