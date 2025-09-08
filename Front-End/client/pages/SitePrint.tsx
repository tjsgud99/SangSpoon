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
  site: Site;
  sensorData: SensorData[];
}

export default function SitePrint() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const { site, sensorData } = state || { site: null, sensorData: [] };

  // chartData 상태 추가
  const [chartData, setChartData] = useState<any>({ waterLevel: [], flowRate: [] });
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



  // 메인페이지와 동일한 방식으로 24시간 데이터 생성
  useEffect(() => {
    if (site && sensorData.length > 0) {
      setIsLoading(true);
      
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

      setChartData({
        waterLevel: waterLevelData,
        flowRate: flowRateData
      });
      
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [site, sensorData]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/sites');
  };

  if (!site || !state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">현장 정보가 없습니다</h1>
          <p className="text-gray-600 mb-4">현장관리 페이지에서 인쇄 버튼을 클릭하여 접근해주세요.</p>
          <Button onClick={handleBack}>현장관리로 돌아가기</Button>
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
              <h1 className="text-2xl font-bold text-gray-900">현장 상세 인쇄</h1>
            </div>
          </div>
          <HeaderNav />
          <Button onClick={handlePrint} className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            PDF출력
          </Button>
        </div>
      </div>

      {/* 인쇄용 콘텐츠 - 한 페이지에 맞춤 */}
      <div className="p-6 print:p-0 print:min-h-screen print:flex print:flex-col">
        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div className="text-center py-12 print:hidden">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg">데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 헤더 - 크기 축소 */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-4 print:pb-2 print:mb-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl print:mb-1">
            상수도모니터 - 상수도 관리 시스템
          </h1>
          <h2 className="text-lg text-gray-700 mb-1 print:text-base print:mb-1">
            현장 상세 보고서
          </h2>
          <div className="text-gray-600 text-sm print:text-xs">
            {currentDate} {currentTime}
          </div>
        </div>

        {/* 현장 기본 정보 - 테이블 크기 축소 */}
        <div className="mb-4 print:mb-3">
          <h3 className="text-lg font-bold mb-3 text-gray-800 border-b border-gray-300 pb-2 print:text-base print:mb-2 print:pb-1">현장 정보</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm print:text-xs">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold w-1/4 print:p-1">현장명</td>
                <td className="border border-gray-300 p-2 print:p-1">{site.name}</td>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold w-1/4 print:p-1">관리번호</td>
                <td className="border border-gray-300 p-2 print:p-1">{site.managementNumber}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold print:p-1">담당자</td>
                <td className="border border-gray-300 p-2 print:p-1">{site.contactPerson}</td>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold print:p-1">연락처</td>
                <td className="border border-gray-300 p-2 print:p-1">{site.contactPhone}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold print:p-1">탱크 타입</td>
                <td className="border border-gray-300 p-2 print:p-1">
                  {site.tankType === 'circular' ? '원형' : '사각형'}
                </td>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold print:p-1">용량</td>
                <td className="border border-gray-300 p-2 font-semibold text-green-600 print:p-1">
                  {site.volume.toFixed(1)} m³
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold print:p-1">탱크 사양</td>
                <td className="border border-gray-300 p-2 print:p-1" colSpan={3}>
                  {site.tankType === 'circular'
                    ? `직경: ${site.width}m, 높이: ${site.height}m`
                    : `너비: ${site.width}m, 길이: ${site.length}m, 높이: ${site.height}m`}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 bg-gray-50 font-semibold print:p-1">상태</td>
                <td className="border border-gray-300 p-2 print:p-1" colSpan={3}>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold print:px-1 print:py-0.5 ${
                    site.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : site.status === 'maintenance' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {site.status === 'active' ? '활성' : site.status === 'maintenance' ? '점검중' : '비활성'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 수위 변화 그래프 - 메인페이지 즐겨찾기와 동일한 스타일 */}
        <div className="mb-4 print:mb-3">
          <h3 className="text-lg font-bold text-center mb-3 text-gray-800 print:text-base print:mb-2">
            {site.name} - 24시간 수위 변화 (%)
          </h3>
          <div className="border border-gray-300 p-4 bg-gray-50 print:p-2">
            {chartData.waterLevel && chartData.waterLevel.length > 1 ? (
              <ChartContainer
                config={{ level: { label: "수위", color: "#3b82f6" } }}
                className="h-64 w-full print:h-32"
              >
                <LineChart data={chartData.waterLevel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" axisLine tickLine tick orientation="bottom" type="category" />
                  <YAxis axisLine tickLine tick orientation="left" type="number" domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ChartContainer>
                         ) : (
               <div className="flex items-center justify-center h-32 text-gray-400 print:h-24">
                 <div className="text-center">
                   <p className="text-sm mb-2">센서 데이터가 없습니다</p>
                   <p className="text-xs text-gray-500">현장에 센서가 설치되어 있지 않거나</p>
                   <p className="text-xs text-gray-500">데이터가 수집되지 않았습니다</p>
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* 유량 변화 그래프 - 메인페이지 즐겨찾기와 동일한 스타일 */}
         <div className="mb-4 print:mb-3">
                       <h3 className="text-lg font-bold text-center mb-3 text-gray-800 print:text-base print:mb-2">
              {site.name} - 24시간 유량 변화 (L/min)
            </h3>
           <div className="border border-gray-300 p-4 bg-gray-50 print:p-2">
             {chartData.flowRate && chartData.flowRate.length > 1 ? (
               <ChartContainer
                 config={{ flow: { label: "유량", color: "#10b981" } }}
                 className="h-64 w-full print:h-32"
               >
                 <LineChart data={chartData.flowRate}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="time" axisLine tickLine tick orientation="bottom" type="category" />
                   <YAxis axisLine tickLine tick orientation="left" type="number" domain={[0, "dataMax"]} />
                   <ChartTooltip content={<ChartTooltipContent />} />
                   <Line type="monotone" dataKey="flow" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                 </LineChart>
               </ChartContainer>
             ) : (
               <div className="flex items-center justify-center h-32 text-gray-400 print:h-24">
                 <div className="text-center">
                   <p className="text-sm mb-2">센서 데이터가 없습니다</p>
                   <p className="text-xs text-gray-500">현장에 센서가 설치되어 있지 않거나</p>
                   <p className="text-xs text-gray-500">데이터가 수집되지 않았습니다</p>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* 푸터 - 크기 축소 */}
        <div className="text-center border-t border-gray-300 pt-3 text-gray-600 text-sm print:text-xs print:pt-2 print:mt-auto">
          이 보고서는 마루아모니터 - 상수도 관리 시스템에서 자동으로 생성되었습니다.<br/>
          생성 시간: {currentDate} {currentTime}
        </div>
      </div>

      {/* 인쇄용 CSS 스타일 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            
            body {
              margin: 0;
              padding: 0;
            }
            
            .print\\:min-h-screen {
              min-height: 100vh !important;
            }
            
            .print\\:flex {
              display: flex !important;
            }
            
            .print\\:flex-col {
              flex-direction: column !important;
            }
            
            .print\\:mt-auto {
              margin-top: auto !important;
            }
            
            .print\\:p-0 {
              padding: 0 !important;
            }
            
            .print\\:pb-2 {
              padding-bottom: 0.5rem !important;
            }
            
            .print\\:mb-2 {
              margin-bottom: 0.5rem !important;
            }
            
            .print\\:mb-3 {
              margin-bottom: 0.75rem !important;
            }
            
            .print\\:text-xl {
              font-size: 1.25rem !important;
            }
            
            .print\\:text-base {
              font-size: 1rem !important;
            }
            
            .print\\:text-xs {
              font-size: 0.75rem !important;
            }
            
            .print\\:text-sm {
              font-size: 0.875rem !important;
            }
            
            .print\\:pb-1 {
              padding-bottom: 0.25rem !important;
            }
            
            .print\\:mb-1 {
              margin-bottom: 0.25rem !important;
            }
            
            .print\\:p-1 {
              padding: 0.25rem !important;
            }
            
            .print\\:p-2 {
              padding: 0.5rem !important;
            }
            
            .print\\:px-1 {
              padding-left: 0.25rem !important;
              padding-right: 0.25rem !important;
            }
            
            .print\\:py-0\\.5 {
              padding-top: 0.125rem !important;
              padding-bottom: 0.125rem !important;
            }
            
            .print\\:h-32 {
              height: 8rem !important;
            }
            
            .print\\:h-24 {
              height: 6rem !important;
            }
            
            .print\\:pt-2 {
              padding-top: 0.5rem !important;
            }
          }
        `
      }} />
    </div>
  );
}
