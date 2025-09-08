import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  ArrowLeft,
  MapPin,
  Activity,
  Gauge,
  Zap,
  Clock,
  RefreshCw
} from "lucide-react";
import HeaderNav from "@/components/Header";

// Sample site data - in real app this would come from API based on ID
const siteData = {
  "1": {
    name: "현장 A",
    managementNumber: "001000",
    waterLevel: 161,
    chemical: 4,
    flowRate: 10.660,
    cumulative: 2250,
    motor1Status: "O", // O = running, X = stopped
    motor2Status: "X",
    motor1Runtime: "24.5시간",
    motor2Runtime: "0시간",
    motor1CumulativeTime: "2,450시간",
    motor2CumulativeTime: "1,890시간"
  },
  "2": {
    name: "현장 B",
    managementNumber: "002000",
    waterLevel: 85,
    chemical: 2.1,
    flowRate: 15.420,
    cumulative: 3890,
    motor1Status: "O",
    motor2Status: "O",
    motor1Runtime: "18.2시간",
    motor2Runtime: "18.2시간",
    motor1CumulativeTime: "3,120시간",
    motor2CumulativeTime: "3,085시간"
  },
  "3": {
    name: "현장 C",
    managementNumber: "003000",
    waterLevel: 45,
    chemical: 1.8,
    flowRate: 8.230,
    cumulative: 1650,
    motor1Status: "X",
    motor2Status: "X",
    motor1Runtime: "0시간",
    motor2Runtime: "0시간",
    motor1CumulativeTime: "1,780시간",
    motor2CumulativeTime: "1,654시간"
  }
};

// Sample time series data for different periods
const generateTimeSeriesData = (period: string) => {
  const baseWaterLevel = 161;
  const baseFlowRate = 10.660;

  switch (period) {
    case "1h":
      return Array.from({ length: 12 }, (_, i) => ({
        time: `${String(Math.floor(i * 5 / 60)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`,
        waterLevel: baseWaterLevel + (Math.random() - 0.5) * 10,
        flowRate: baseFlowRate + (Math.random() - 0.5) * 2
      }));
    case "6h":
      return Array.from({ length: 12 }, (_, i) => ({
        time: `${String(i * 30 / 60).padStart(2, '0')}:${String((i * 30) % 60).padStart(2, '0')}`,
        waterLevel: baseWaterLevel + (Math.random() - 0.5) * 15,
        flowRate: baseFlowRate + (Math.random() - 0.5) * 3
      }));
    case "24h":
      return Array.from({ length: 24 }, (_, i) => ({
        time: `${String(i).padStart(2, '0')}:00`,
        waterLevel: baseWaterLevel + (Math.random() - 0.5) * 20,
        flowRate: baseFlowRate + (Math.random() - 0.5) * 4
      }));
    case "7d":
      return Array.from({ length: 7 }, (_, i) => ({
        time: `${i + 1}일차`,
        waterLevel: baseWaterLevel + (Math.random() - 0.5) * 25,
        flowRate: baseFlowRate + (Math.random() - 0.5) * 5
      }));
    case "30d":
      return Array.from({ length: 30 }, (_, i) => ({
        time: `${i + 1}`,
        waterLevel: baseWaterLevel + (Math.random() - 0.5) * 30,
        flowRate: baseFlowRate + (Math.random() - 0.5) * 6
      }));
    default:
      return Array.from({ length: 24 }, (_, i) => ({
        time: `${String(i).padStart(2, '0')}:00`,
        waterLevel: baseWaterLevel + (Math.random() - 0.5) * 20,
        flowRate: baseFlowRate + (Math.random() - 0.5) * 4
      }));
  }
};

export default function SiteDetails() {
  const { id } = useParams();
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [chartData, setChartData] = useState(generateTimeSeriesData("24h"));
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const site = siteData[id as keyof typeof siteData];

  useEffect(() => {
    setChartData(generateTimeSeriesData(selectedPeriod));
  }, [selectedPeriod]);

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      setChartData(generateTimeSeriesData(selectedPeriod));
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">사이트를 찾을 수 없음</h2>
          <p className="text-gray-600 mb-4">요청하신 사이트를 찾을 수 없습니다.</p>
          <Link to="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getMotorStatusColor = (status: string) => {
    return status === "O" ? "bg-green-500" : "bg-red-500";
  };

  const getMotorStatusText = (status: string) => {
    return status === "O" ? "가동중" : "정지";
  };

  const getBinaryCode = (motor1: string, motor2: string) => {
    const motor1Binary = motor1 === "O" ? "1" : "0";
    const motor2Binary = motor2 === "O" ? "1" : "0";
    return motor1Binary + motor2Binary;
  };

  const isOutlier = (waterLevel: number, flowRate: number) => {
    return waterLevel < 0 || waterLevel > 200 || Math.abs(flowRate - 10.660) > 5;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`시간: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey === 'waterLevel' ? '수위' : '유량'}: ${entry.value.toFixed(entry.dataKey === 'waterLevel' ? 1 : 3)}${entry.dataKey === 'waterLevel' ? '%' : ' L/min'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back button and Site Info */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" title="대시보드로 돌아가기">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{site.name} 상세정보</h1>
            </div>
            <Badge variant="outline" className="text-sm sm:text-lg px-2 sm:px-3 py-1">
              {site.managementNumber}
            </Badge>
          </div>

          {/* Center: Navigation */}
          <div className="flex-1 flex justify-center">
            <HeaderNav />
          </div>

          {/* Right: Update Info */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR', { hour12: false })}</span>
            <span className="sm:hidden">{lastRefresh.toLocaleTimeString('ko-KR', { hour12: false })}</span>
            <Button variant="ghost" size="sm" onClick={() => setLastRefresh(new Date())} title="새로고침">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Site Basic Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Site Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  사이트 기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700">관리번호:</span>
                    <span className="text-xl font-bold text-blue-600">{site.managementNumber}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-700">물탱크 수위:</span>
                    <span className="text-xl font-bold text-green-600">{site.waterLevel}%</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">화학물질:</span>
                    <span className="text-xl font-bold text-purple-600">{site.chemical}%</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">유량:</span>
                    <span className="text-xl font-bold text-orange-600">{site.flowRate} L/min</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">누적:</span>
                    <span className="text-xl font-bold text-gray-600">{site.cumulative}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Motor Operation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  모터 작동 상태
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Motor 1 */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">모터 1</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${getMotorStatusColor(site.motor1Status)}`} />
                        <span className="font-bold text-lg">{site.motor1Status}</span>
                        <Badge variant={site.motor1Status === "O" ? "default" : "secondary"}>
                          {getMotorStatusText(site.motor1Status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">최근 가동시간:</span>
                        <span className="font-medium">{site.motor1Runtime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">누적 가동시간:</span>
                        <span className="font-medium">{site.motor1CumulativeTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Motor 2 */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">모터 2</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${getMotorStatusColor(site.motor2Status)}`} />
                        <span className="font-bold text-lg">{site.motor2Status}</span>
                        <Badge variant={site.motor2Status === "O" ? "default" : "secondary"}>
                          {getMotorStatusText(site.motor2Status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">최근 가동시간:</span>
                        <span className="font-medium">{site.motor2Runtime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">누적 가동시간:</span>
                        <span className="font-medium">{site.motor2CumulativeTime}</span>
                      </div>
                    </div>
                  </div>


                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Data Graph */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    데이터 변화 트렌드
                  </CardTitle>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1시간</SelectItem>
                      <SelectItem value="6h">6시간</SelectItem>
                      <SelectItem value="24h">24시간</SelectItem>
                      <SelectItem value="7d">7일</SelectItem>
                      <SelectItem value="30d">30일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Water Level Chart */}
                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">물탱크 수위 변화 (%)</h4>
                    <ChartContainer
                      config={{
                        waterLevel: { label: "수위 (%)", color: "#3b82f6" }
                      }}
                      className="h-64"
                    >
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          axisLine={true}
                          tickLine={true}
                          tick={true}
                        />
                        <YAxis
                          axisLine={true}
                          tickLine={true}
                          tick={true}
                        />
                        <ChartTooltip content={<CustomTooltip />} />
                        <ReferenceLine
                          y={0}
                          stroke="#ef4444"
                          strokeDasharray="5 5"
                          strokeWidth={1}
                          ifOverflow="extendDomain"
                          label=""
                          yAxisId={0}
                          isFront={false}
                          fill="none"
                          strokeOpacity={1}
                          shape="line"
                          segment={[]}
                          position="start"
                        />
                        <ReferenceLine
                          y={100}
                          stroke="#ef4444"
                          strokeDasharray="5 5"
                          strokeWidth={1}
                          ifOverflow="extendDomain"
                          label=""
                          yAxisId={0}
                          isFront={false}
                          fill="none"
                          strokeOpacity={1}
                          shape="line"
                          segment={[]}
                          position="end"
                        />
                        <Line
                          type="monotone"
                          dataKey="waterLevel"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: "#1d4ed8" }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>

                  {/* Flow Rate Chart */}
                  <div>
                    <h4 className="font-medium mb-3 text-green-600">유량 변화 (L/min)</h4>
                    <ChartContainer
                      config={{
                        flowRate: { label: "유량 (L/min)", color: "#10b981" }
                      }}
                      className="h-64"
                    >
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          axisLine={true}
                          tickLine={true}
                          tick={true}
                        />
                        <YAxis
                          axisLine={true}
                          tickLine={true}
                          tick={true}
                        />
                        <ChartTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="flowRate"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: "#059669" }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>

                  {/* Outlier Alert */}
                  {chartData.some(d => isOutlier(d.waterLevel, d.flowRate)) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="font-medium text-red-700">
                          이상값 감지: 정상 운영 범위를 벗어난 값
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
