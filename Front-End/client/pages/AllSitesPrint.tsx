import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import HeaderNav from "@/components/Header";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";

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
  status: "active" | "inactive" | "maintenance";
}

interface SensorData {
  id: string;
  siteId: string;
  waterLevel: number;
  flowRate: number;
  createdAt: string;
}

interface LocationState {
  sites: Site[];
  sensorData: SensorData[];
  latestBySiteId: Record<string, { flowRate: number; totalAmount: number }>;
}

export default function AllSitesPrint() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const { sites, sensorData, latestBySiteId } = state || { sites: [], sensorData: [], latestBySiteId: {} };

  // 각 현장별 차트 데이터 상태
  const [chartDataBySite, setChartDataBySite] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 메인페이지와 동일한 방식으로 각 현장별 24시간 데이터 생성
  useEffect(() => {
    console.log('AllSitesPrint useEffect 실행:', { 
      sitesLength: sites.length, 
      sensorDataLength: sensorData.length,
      state 
    });
    
    if (sites.length > 0 && sensorData.length > 0) {
      setIsLoading(true);
      
      const newChartDataBySite: Record<string, any> = {};
      
      sites.forEach(site => {
        const siteData = sensorData
          .filter(d => d.siteId === site.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const filteredData = siteData.filter((item: any) => 
          new Date(item.createdAt) >= oneDayAgo
        );

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

        newChartDataBySite[site.id] = {
          waterLevel: waterLevelData,
          flowRate: flowRateData
        };

        // 디버깅: 차트 데이터 생성 결과 확인
        console.log(`현장 ${site.name} 차트 데이터:`, {
          waterLevelData: waterLevelData,
          flowRateData: flowRateData,
          waterLevelLength: waterLevelData.length,
          flowRateLength: flowRateData.length,
          hasValidWaterLevel: waterLevelData.some(d => d.level > 0),
          hasValidFlowRate: flowRateData.some(d => d.flow > 0)
        });
      });

      setChartDataBySite(newChartDataBySite);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [sites, sensorData]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/sites');
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">데이터가 없습니다</h1>
          <Button onClick={handleBack}>돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 인쇄용 헤더 (화면에서만 보임) */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">전체 현장 인쇄</h1>
            </div>
          </div>
          <HeaderNav />
          <Button onClick={handlePrint} className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            PDF출력
          </Button>
        </div>
      </div>

      {/* 인쇄용 콘텐츠 */}
      <div className="p-6 print:p-0">
        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div className="text-center py-12 print:hidden">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg">데이터를 불러오는 중...</p>
          </div>
        )}

                          {/* 헤더 */}
         <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
           <h1 className="text-3xl font-bold text-gray-900 mb-3">
             상수도모니터 - 상수도 관리 시스템
           </h1>
           <h2 className="text-xl text-gray-700 mb-2">
             전체 현장 관리 보고서
           </h2>
           <div className="text-gray-600 mb-2">
             {currentDate} {currentTime}
           </div>
           <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
             총 {sites.length}개 현장
           </div>
         </div>

                                                                       {/* 각 현장별 상세 정보 - 2개씩 그룹화 (첫 페이지는 헤더 제외, 2페이지부터 헤더 포함) */}
           {Array.from({ length: Math.ceil(sites.length / 2) }, (_, groupIndex) => {
             const startIndex = groupIndex * 2;
             const endIndex = Math.min(startIndex + 2, sites.length);
             const groupSites = sites.slice(startIndex, endIndex);
             
             return (
               <div key={groupIndex} className="print:page-break-before-auto">
                 {/* 첫 페이지가 아닌 경우에만 헤더 표시 */}
                 {groupIndex > 0 && (
                   <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
                     <h1 className="text-3xl font-bold text-gray-900 mb-3">
                       상수도모니터 - 상수도 관리 시스템
                     </h1>
                     <h2 className="text-xl text-gray-700 mb-2">
                       전체 현장 관리 보고서
                     </h2>
                     <div className="text-gray-600 mb-2">
                       {currentDate} {currentTime}
                     </div>
                     <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                       총 {sites.length}개 현장
                     </div>
                   </div>
                 )}

                {groupSites.map((site, siteIndex) => {
                  return (
                    <div key={site.id} className="mb-3 print:mb-2">
                      {/* 현장별 구분선 */}
                      {siteIndex > 0 && (
                        <div className="border-t border-gray-200 my-3 print:my-2"></div>
                      )}
                     
                      {/* 현장 기본 정보 - 컴팩트하게 정리 */}
                      <div className="mb-3 print:mb-2">
                        <h3 className="text-lg font-bold text-center mb-2 text-gray-800 print:text-base print:mb-1">
                          {site.name}
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 print:p-2">
                          <div className="grid grid-cols-2 gap-4 print:gap-3">
                            <div className="space-y-1.5 print:space-y-1">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">관리번호</span>
                                <span className="text-xs font-medium text-gray-900">{site.managementNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">담당자</span>
                                <span className="text-xs font-medium text-gray-900">{site.contactPerson}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">연락처</span>
                                <span className="text-xs font-medium text-gray-900">{site.contactPhone}</span>
                              </div>
                            </div>
                            <div className="space-y-1.5 print:space-y-1">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">탱크 타입</span>
                                <span className="text-xs font-medium text-gray-900">
                                  {site.tankType === 'circular' ? '원형' : '사각형'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">용량</span>
                                <span className="text-xs font-medium text-gray-900">{site.volume.toFixed(1)}m³</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">상태</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  site.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : site.status === 'maintenance' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {site.status === 'active' ? '활성' : site.status === 'maintenance' ? '점검중' : '비활성'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 그래프를 한 줄에 나란히 배치 - 메인페이지 즐겨찾기와 동일한 스타일 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:gap-3">
                        {/* 수위 변화 그래프 */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 print:p-1">
                          <h4 className="text-xs font-bold text-center mb-1 text-gray-800 print:text-xs print:mb-0.5">
                            수위 변화 (%)
                          </h4>
                          <div className="h-40 print:h-28 relative">
                            {chartDataBySite[site.id]?.waterLevel && chartDataBySite[site.id].waterLevel.length > 0 ? (
                              <ChartContainer
                                config={{ level: { label: "수위", color: "#3b82f6" } }}
                                className="h-full w-full"
                              >
                                <LineChart data={chartDataBySite[site.id].waterLevel}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" axisLine tickLine tick orientation="bottom" type="category" />
                                  <YAxis axisLine tickLine tick orientation="left" type="number" domain={[0, 100]} />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                              </ChartContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                <div className="text-center">
                                  <p className="text-xs mb-1">센서 데이터가 없습니다</p>
                                  <p className="text-xs text-gray-500">현장에 센서가 설치되어 있지 않거나</p>
                                  <p className="text-xs text-gray-500">데이터가 수집되지 않았습니다</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 유량 변화 그래프 */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 print:p-1">
                          <h4 className="text-xs font-bold text-center mb-1 text-gray-800 print:text-xs print:mb-0.5">
                            유량 변화 (L/min)
                          </h4>
                          <div className="h-40 print:h-28 relative">
                            {chartDataBySite[site.id]?.flowRate && chartDataBySite[site.id].flowRate.length > 0 ? (
                              <ChartContainer
                                config={{ flow: { label: "유량", color: "#10b981" } }}
                                className="h-full w-full"
                              >
                                <LineChart data={chartDataBySite[site.id].flowRate}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" axisLine tickLine tick orientation="bottom" type="category" />
                                  <YAxis axisLine tickLine tick orientation="left" type="number" domain={[0, "dataMax"]} />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Line type="monotone" dataKey="flow" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                              </ChartContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                <div className="text-center">
                                  <p className="text-xs mb-1">센서 데이터가 없습니다</p>
                                  <p className="text-xs text-gray-500">현장에 센서가 설치되어 있지 않거나</p>
                                  <p className="text-xs text-gray-500">데이터가 수집되지 않았습니다</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* 그룹 간 페이지 구분선 - 강제 페이지 분할 */}
                {groupIndex < Math.ceil(sites.length / 2) - 1 && (
                  <div className="border-t-4 border-blue-400 my-8 print:my-6 print:page-break-after-always print:page-break-before-avoid"></div>
                )}
              </div>
            );
          })}

        {/* 푸터 */}
        <div className="text-center border-t border-gray-300 pt-6 text-gray-600">
          이 보고서는 상수도모니터 - 상수도 관리 시스템에서 자동으로 생성되었습니다.<br/>
          생성 시간: {currentDate} {currentTime}
        </div>
      </div>
    </div>
  );
}
