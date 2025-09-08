import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts";
import {
  Droplets,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  MapPin,
  TrendingUp,
  LogOut,
  TestTube,
  Settings,
  RefreshCw,
  Database,
  Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import HeaderNav from "@/components/Header";

// 센서 데이터 인터페이스
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

// Sample data for demonstration
const fieldOverviewData = {
  totalFields: 24,
  activeFields: 21,
  alertFields: 3,
  offlineFields: 0,
};



const motorStatusData = [
  { name: "가동중", value: 18, color: "#10b981" },
  { name: "정지", value: 4, color: "#6b7280" },
  { name: "오류", value: 2, color: "#ef4444" },
];



export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // 즐겨찾기 관련 상태
  const [favoriteSites, setFavoriteSites] = useState<string[]>([]);
  const [selectedFavoriteField, setSelectedFavoriteField] = useState<string>("");
    const [favoriteFieldData, setFavoriteFieldData] = useState<any>({});
  
  // 센서 데이터 상태
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 더보기 상태 추가
  const [showMoreCount, setShowMoreCount] = useState<number>(5);
  
  // 전체 현장 수 상태 추가
  const [totalSites, setTotalSites] = useState<number>(0);
  
  // 마지막 업데이트 시간 상태 추가
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Dialogs for "Active" and "Alert" sites
  const [openActive, setOpenActive] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  // 더보기 함수 추가
  const handleShowMore = () => {
    setShowMoreCount(prev => prev + 5);
  };

  // 전체 현장 수 가져오기 (API와 센서 데이터 비교)
  const fetchTotalSites = async () => {
    try {
      const response = await fetch('http://localhost:8084/api/sites');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          console.log('API에서 가져온 현장 수:', result.data.length);
          console.log('API에서 가져온 현장 ID들:', result.data.map((site: any) => site.managementCode));
          
          // 센서 데이터에서 실제 현장 수 확인
          if (sensorData.length > 0) {
            const sensorSites = new Set(sensorData.map(data => data.siteId));
            console.log('센서 데이터에서 추출한 현장 ID들:', Array.from(sensorSites));
            console.log('센서 데이터 기반 현장 수:', sensorSites.size);
            
            // 센서 데이터에 있는 현장이 더 많으면 센서 데이터 기준으로 설정
            if (sensorSites.size > result.data.length) {
              console.log('센서 데이터에 더 많은 현장이 있음. 센서 데이터 기준으로 설정:', sensorSites.size);
              setTotalSites(sensorSites.size);
            } else {
              console.log('API 데이터 기준으로 설정:', result.data.length);
              setTotalSites(result.data.length);
            }
          } else {
            setTotalSites(result.data.length);
          }
        } else {
          console.error('API 응답 형식 오류:', result);
        }
      } else {
        console.error('API 응답 실패:', response.status);
      }
    } catch (error) {
      console.error('전체 현장 수 조회 실패:', error);
    }
  };

  // 실시간 센서 데이터 가져오기
  const fetchSensorData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8084/api/sensor/data');
      if (response.ok) {
        const data = await response.json();
        console.log('센서 데이터 로드 완료:', data.length, '개');
        
        // 현장 ID별로 데이터 개수 확인
        const siteCounts = data.reduce((acc: any, item: any) => {
          acc[item.siteId] = (acc[item.siteId] || 0) + 1;
          return acc;
        }, {});
        console.log('현장별 데이터 개수:', siteCounts);
        
        // 001000 현장 데이터 확인
        const site001000Data = data.filter((item: any) => item.siteId === '001000');
        console.log('001000 현장 데이터:', site001000Data);
        
        setSensorData(data);
      }
    } catch (error) {
      console.error('센서 데이터 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // 즐겨찾기 관련 함수들
  const loadFavoriteSites = () => {
    const saved = localStorage.getItem('favoriteSites');
    if (saved) {
      try {
        const sites = JSON.parse(saved);
        setFavoriteSites(sites);
        if (sites.length > 0) {
          setSelectedFavoriteField(sites[0]);
        }
      } catch (error) {
        console.error('즐겨찾기 로드 실패:', error);
        setFavoriteSites([]);
      }
    }
  };

  // 즐겨찾기 현장 데이터 가져오기
  const fetchFavoriteFieldData = async (siteId: string) => {
    try {
      console.log('즐겨찾기 현장 데이터 가져오기:', siteId);
      const response = await fetch(`http://localhost:8084/api/sensor/data/${siteId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('즐겨찾기 현장 데이터:', data.length, '개');
        
        if (data.length === 0) {
          console.log('해당 현장의 센서 데이터가 없습니다.');
          return;
        }
        
        // 현재 시간을 기준으로 24시간 데이터로 변환
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const filteredData = data.filter((item: any) => 
          new Date(item.createdAt) >= oneDayAgo
        ).sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        console.log('24시간 필터링된 데이터:', filteredData.length, '개');

        // 시간별로 그룹화하여 평균값 계산 (현재 시간 기준)
        const hourlyData: any = {};
        filteredData.forEach((item: any) => {
          const itemDate = new Date(item.createdAt);
          const hour = itemDate.getHours();
          if (!hourlyData[hour]) {
            hourlyData[hour] = { waterLevel: [], flowRate: [] };
          }
          hourlyData[hour].waterLevel.push(item.waterLevel);
          hourlyData[hour].flowRate.push(item.flowRate);
        });

        // 현재 시간을 기준으로 24시간 데이터 생성
        const waterLevelData = [];
        const flowRateData = [];
        
        for (let i = 23; i >= 0; i--) {
          const targetHour = (now.getHours() - i + 24) % 24;
          const timeStr = `${targetHour.toString().padStart(2, '0')}:00`;
          
          const avgWaterLevel = hourlyData[targetHour]?.waterLevel.length > 0 
            ? hourlyData[targetHour].waterLevel.reduce((a: number, b: number) => a + b, 0) / hourlyData[targetHour].waterLevel.length
            : 0;
          const avgFlowRate = hourlyData[targetHour]?.flowRate.length > 0
            ? hourlyData[targetHour].flowRate.reduce((a: number, b: number) => a + b, 0) / hourlyData[targetHour].flowRate.length
            : 0;
          
          waterLevelData.push({ time: timeStr, level: Math.round(avgWaterLevel * 10) / 10 });
          flowRateData.push({ time: timeStr, flow: Math.round(avgFlowRate * 10) / 10 });
        }

        console.log('생성된 차트 데이터 (현재 시간 기준):', { waterLevelData, flowRateData });

        setFavoriteFieldData(prev => ({
          ...prev,
          [siteId]: {
            waterLevel: waterLevelData,
            flowRate: flowRateData
          }
        }));
        
        // 마지막 업데이트 시간 갱신
        setLastUpdate(new Date());
      } else {
        console.error('즐겨찾기 현장 데이터 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('즐겨찾기 현장 데이터 조회 실패:', error);
    }
  };



  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchSensorData();
    loadFavoriteSites();
    // fetchTotalSites는 센서 데이터 로드 후에 호출됨
  }, []);

  // 센서 데이터가 로드된 후 전체 현장 수 계산
  useEffect(() => {
    if (sensorData.length > 0) {
      const uniqueSites = new Set(sensorData.map(data => data.siteId));
      console.log('센서 데이터에서 추출한 현장 ID들:', Array.from(uniqueSites));
      console.log('센서 데이터 기반 총 현장 수:', uniqueSites.size);
      
      // 센서 데이터를 기준으로 현장 수 설정 (가장 정확한 방법)
      setTotalSites(uniqueSites.size);
      
      // API에서도 현장 목록을 가져와서 비교
      fetchTotalSites();
    }
  }, [sensorData]);

  // 즐겨찾기 현장 목록이 로드될 때 첫 번째 현장 데이터 가져오기
  useEffect(() => {
    if (favoriteSites.length > 0 && selectedFavoriteField) {
      console.log('즐겨찾기 현장 목록 로드됨, 첫 번째 현장 데이터 가져오기:', selectedFavoriteField);
      fetchFavoriteFieldData(selectedFavoriteField);
    }
  }, [favoriteSites, selectedFavoriteField]);

  // 실시간 업데이트 (30초마다)
  useEffect(() => {
    if (favoriteSites.length > 0 && selectedFavoriteField) {
      const interval = setInterval(() => {
        console.log('즐겨찾기 현장 데이터 실시간 업데이트:', selectedFavoriteField);
        fetchFavoriteFieldData(selectedFavoriteField);
      }, 30000); // 30초마다 업데이트

      return () => clearInterval(interval);
    }
  }, [selectedFavoriteField, favoriteSites]);

  // 즐겨찾기 현장이 변경될 때 데이터 가져오기
  useEffect(() => {
    if (selectedFavoriteField && favoriteSites.includes(selectedFavoriteField)) {
      console.log('즐겨찾기 현장 변경됨:', selectedFavoriteField);
      fetchFavoriteFieldData(selectedFavoriteField);
    }
  }, [selectedFavoriteField]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };





  // 디버깅을 위한 로그
  console.log('Dashboard 렌더링:', { sensorData: sensorData.length, isLoading });

  return (
    <div className="min-h-screen bg-white">
      {/* Header (Sticky) */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-10 py-4 flex items-center justify-between">
          {/* Left: Logo/Title (navigate to /sites) */}
          <button
            className="flex items-center space-x-3 group"
            aria-label="현장 관리로 이동"
            title="현장 관리로 이동"
          >
            <Droplets className="h-9 w-9 text-blue-600 group-hover:scale-105 transition-transform" />
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight group-hover:opacity-90">
                상수도 관리 모니터링
              </h1>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px] sm:text-xs">실시간 현황</Badge>
            </div>
          </button>

              {/* 가운데 및 오른쪽: 공용 내비게이션 컴포넌트 */}
      <HeaderNav />

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              title="설정"
              aria-label="설정으로 이동"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout} title="로그아웃">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg">센서 데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 표시 */}
        {!isLoading && sensorData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-gray-900 text-xl font-semibold mb-2">데이터를 불러올 수 없습니다</h3>
            <p className="text-gray-500 mb-4">백엔드 서버가 실행 중인지 확인해주세요</p>
            <Button onClick={fetchSensorData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        )}

        {/* 데이터가 있을 때만 표시 */}
        {!isLoading && (
          <>
            {/* Site Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Sites */}
              <Card className="cursor-default">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">전체 현장</CardTitle>
                  <MapPin className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSites}</div>
                  <p className="text-xs text-muted-foreground">모니터링 사이트</p>
                </CardContent>
              </Card>

          {/* Active Sites (open dialog) */}
          <Card onClick={() => setOpenActive(true)} className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 현장</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
                          <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {sensorData.length > 0 ? (() => {
                    const sitesWithData = getLatestDataBySite();
                    return sitesWithData.filter(site => site.flowRate > 0).length;
                  })() : 0}
                </div>
                <p className="text-xs text-muted-foreground">정상 운영중</p>
              </CardContent>
            </Card>

            {/* Alert Sites (open dialog) */}
            <Card onClick={() => setOpenAlert(true)} className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">경고 현장</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {sensorData.length > 0 ? (() => {
                    const sitesWithData = getLatestDataBySite();
                    return sitesWithData.filter(site => 
                      site.waterLevel > 80 || site.waterLevel < 20 || 
                      site.chemicalLevel < 20 || site.leakAmount > 10
                    ).length;
                  })() : 0}
                </div>
                <p className="text-xs text-muted-foreground">주의 필요</p>
              </CardContent>
            </Card>

                      {/* System Efficiency */}
            <Card className="cursor-default">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">시스템 효율성</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {sensorData.length > 0 ? (() => {
                    const sites = getLatestDataBySite();
                    if (sites.length === 0) return 0;
                    const normalSites = sites.filter(site => 
                      site.waterLevel >= 20 && site.waterLevel <= 80 && 
                      site.chemicalLevel >= 20 && site.leakAmount <= 10
                    );
                    return Math.round((normalSites.length / sites.length) * 100);
                  })() : 0}%
                </div>
                <p className="text-xs text-muted-foreground">정상 운영 현장 비율</p>
              </CardContent>
            </Card>
          </div>

          {/* 즐겨찾는 현장 데이터 - 수위와 유량 통합 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    즐겨찾는 현장 데이터
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>마지막 업데이트: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="w-64">
                  <Select value={selectedFavoriteField} onValueChange={setSelectedFavoriteField}>
                    <SelectTrigger>
                      <SelectValue placeholder="즐겨찾는 현장 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {favoriteSites.map((siteId) => (
                        <SelectItem key={siteId} value={siteId}>
                          현장 {siteId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {favoriteSites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>즐겨찾기된 현장이 없습니다.</p>
                  <p className="text-sm">현장별 최신 데이터 페이지에서 ⭐ 버튼을 클릭하여 즐겨찾기에 추가하세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {/* 수위 그래프 - 왼쪽 */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-gray-700">수위 (%)</h4>
                    <ChartContainer
                      config={{ level: { label: "수위", color: "#3b82f6" } }}
                      className="h-64 w-full"
                    >
                      <LineChart data={(favoriteFieldData as any)[selectedFavoriteField]?.waterLevel || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" axisLine tickLine tick orientation="bottom" type="category" />
                        <YAxis axisLine tickLine tick orientation="left" type="number" domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ChartContainer>
                  </div>

                  {/* 유량 그래프 - 오른쪽 */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-gray-700">유량 (L/min)</h4>
                    <ChartContainer
                      config={{ flow: { label: "유량", color: "#10b981" } }}
                      className="h-64 w-full"
                    >
                      <LineChart data={(favoriteFieldData as any)[selectedFavoriteField]?.flowRate || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" axisLine tickLine tick orientation="bottom" type="category" />
                        <YAxis axisLine tickLine tick orientation="left" type="number" domain={[0, "dataMax"]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="flow" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Active / Alert Dialogs */}
        <Dialog open={openActive} onOpenChange={setOpenActive}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>활성 현장 목록</DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>현장ID</TableHead>
                  <TableHead>수위(%)</TableHead>
                  <TableHead>유량(L/min)</TableHead>
                  <TableHead>모터1</TableHead>
                  <TableHead>모터2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getLatestDataBySite()
                  .filter((f) => f.flowRate > 0)
                  .map((f) => (
                    <TableRow key={f.id} className="hover:bg-gray-50">
                      <TableCell>{f.siteId}</TableCell>
                      <TableCell>{f.waterLevel}%</TableCell>
                      <TableCell>{f.flowRate.toFixed(1)}</TableCell>
                      <TableCell>{f.motorStatus1 === 1 ? "작동중" : "정지"}</TableCell>
                      <TableCell>{f.motorStatus2 === 1 ? "작동중" : "정지"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>

        <Dialog open={openAlert} onOpenChange={setOpenAlert}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>경고 현장 목록</DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>현장ID</TableHead>
                  <TableHead>경고내용</TableHead>
                  <TableHead>심각도</TableHead>
                  <TableHead>수위</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getLatestDataBySite()
                  .filter(site => 
                    site.waterLevel > 80 || site.waterLevel < 20 || 
                    site.chemicalLevel < 20 || site.leakAmount > 10
                  )
                  .map((site) => {
                    let message = "";
                    let severity = "medium";
                    
                    if (site.waterLevel > 80) {
                      message = "수위가 너무 높습니다";
                      severity = "high";
                    } else if (site.waterLevel < 20) {
                      message = "수위가 너무 낮습니다";
                      severity = "high";
                    } else if (site.chemicalLevel < 20) {
                      message = "약품이 부족합니다";
                      severity = "medium";
                    } else if (site.leakAmount > 10) {
                      message = "누수량이 많습니다";
                      severity = "medium";
                    }
                    
                    return (
                      <TableRow key={site.id} className="hover:bg-gray-50">
                        <TableCell>{site.siteId}</TableCell>
                        <TableCell>{message}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadge(severity) as any}>
                            {severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{site.waterLevel}%</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>



            {/* 현장별 최신 데이터 테이블 */}
            <Card className="[text-size-adjust:100%]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    현장별 최신 데이터
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/test">
                        전체보기
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      새로고침
                    </Button>
                    <Badge variant="secondary">
                      {sensorData.length > 0 ? getLatestDataBySite().length : 0}개 현장
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sensorData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>센서 데이터가 없습니다.</p>
                    <p className="text-sm">백엔드 서버가 실행 중인지 확인해주세요.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table className="w-full text-[15px] leading-6">
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
                            <TableHead>상세보기</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getLatestDataBySite().slice(0, showMoreCount).map((data, index) => (
                            <TableRow key={data.id || index} className="hover:bg-gray-50">
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
                                <Button size="sm" variant="outline" asChild>
                                  <Link to={`/test/${data.siteId}`}>상세보기</Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 더보기 버튼 */}
                    {getLatestDataBySite().length > showMoreCount && (
                      <div className="mt-4 text-center">
                        <Button 
                          variant="outline" 
                          onClick={handleShowMore}
                          className="w-full"
                        >
                          더보기 (+5개)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Abnormal Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  주의가 필요한 현장
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getLatestDataBySite()
                    .filter(site => 
                      site.waterLevel > 80 || site.waterLevel < 20 || 
                      site.chemicalLevel < 20 || site.leakAmount > 10
                    )
                    .slice(0, 3)
                    .map((site) => {
                      let issue = "";
                      let severity = "medium";
                      
                      if (site.waterLevel > 80) {
                        issue = "수위가 너무 높습니다";
                        severity = "high";
                      } else if (site.waterLevel < 20) {
                        issue = "수위가 너무 낮습니다";
                        severity = "high";
                      } else if (site.chemicalLevel < 20) {
                        issue = "약품이 부족합니다";
                        severity = "medium";
                      } else if (site.leakAmount > 10) {
                        issue = "누수량이 많습니다";
                        severity = "medium";
                      }
                      
                      return (
                        <div key={site.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">현장 {site.siteId}</h4>
                            <Badge variant={getSeverityBadge(severity) as any}>
                              {severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{issue}</p>
                          <Button size="sm" variant="outline" className="w-full" asChild>
                            <Link to={`/test/${site.siteId}`}>
                              상세보기
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 이동</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button asChild className="h-20 text-base">
                    <Link to="/sites" className="flex flex-col items-center justify-center space-y-2">
                      <MapPin className="h-6 w-6" />
                      <span>현장 관리</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 text-base">
                    <Link to="/statistics" className="flex flex-col items-center justify-center space-y-2">
                      <TrendingUp className="h-6 w-6" />
                      <span>통계</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 text-base">
                    <Link to="/settings" className="flex flex-col items-center justify-center space-y-2">
                      <Settings className="h-6 w-6" />
                      <span>설정</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
