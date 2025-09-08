import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Save
} from "lucide-react";
import HeaderNav from "@/components/Header";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    systemMaintenance: true,
    dataBackup: true
  });

  const [userSettings, setUserSettings] = useState({
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "+1-555-0101"
  });

  const [systemSettings, setSystemSettings] = useState({
    alertThresholds: {
      lowWaterLevel: "20",
      highWaterLevel: "95",
      flowRateVariance: "15"
    }
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleUserSettingChange = (key: string, value: string) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSystemSettingChange = (key: string, value: string) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleThresholdChange = (key: string, value: string) => {
    setSystemSettings(prev => ({
      ...prev,
      alertThresholds: { ...prev.alertThresholds, [key]: value }
    }));
  };

  const handleSave = () => {
    console.log("Saving settings:", { notifications, userSettings, systemSettings });
    // TODO: Implement settings save functionality
  };

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
              <SettingsIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">설정</h1>
            </div>
            <Badge variant="outline">시스템 구성</Badge>
          </div>
          
                <HeaderNav />
          

          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            변경사항 저장
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">프로필</TabsTrigger>
            <TabsTrigger value="notifications">알림</TabsTrigger>
            <TabsTrigger value="system">시스템</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  사용자 프로필
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">이름</label>
                    <Input
                      value={userSettings.firstName}
                      onChange={(e) => handleUserSettingChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">성</label>
                    <Input
                      value={userSettings.lastName}
                      onChange={(e) => handleUserSettingChange("lastName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">이메일 주소</label>
                    <Input
                      type="email"
                      value={userSettings.email}
                      onChange={(e) => handleUserSettingChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">전화번호</label>
                    <Input
                      value={userSettings.phone}
                      onChange={(e) => handleUserSettingChange("phone", e.target.value)}
                    />
                  </div>
                </div>


              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">이메일 알림</h4>
                      <p className="text-sm text-gray-600">시스템 알림을 이메일로 받기</p>
                    </div>
                    <Switch
                      checked={notifications.emailAlerts}
                      onCheckedChange={(checked) => handleNotificationChange("emailAlerts", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS 알림</h4>
                      <p className="text-sm text-gray-600">중요 알림을 문자 메시지로 받기</p>
                    </div>
                    <Switch
                      checked={notifications.smsAlerts}
                      onCheckedChange={(checked) => handleNotificationChange("smsAlerts", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">시스템 점검</h4>
                      <p className="text-sm text-gray-600">예정된 점검 알림</p>
                    </div>
                    <Switch
                      checked={notifications.systemMaintenance}
                      onCheckedChange={(checked) => handleNotificationChange("systemMaintenance", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">데이터 백업</h4>
                      <p className="text-sm text-gray-600">데이터 백업 상태 알림</p>
                    </div>
                    <Switch
                      checked={notifications.dataBackup}
                      onCheckedChange={(checked) => handleNotificationChange("dataBackup", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  시스템 구성
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">


                <div className="space-y-4">
                  <h4 className="font-medium">알림 임계값</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">낮은 수위 (%)</label>
                      <Input
                        type="number"
                        value={systemSettings.alertThresholds.lowWaterLevel}
                        onChange={(e) => handleThresholdChange("lowWaterLevel", e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">높은 수위 (%)</label>
                      <Input
                        type="number"
                        value={systemSettings.alertThresholds.highWaterLevel}
                        onChange={(e) => handleThresholdChange("highWaterLevel", e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">유량 변동률 (%)</label>
                      <Input
                        type="number"
                        value={systemSettings.alertThresholds.flowRateVariance}
                        onChange={(e) => handleThresholdChange("flowRateVariance", e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  보안 및 접근
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">비밀번호 변경</h4>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder="현재 비밀번호"
                      />
                      <Input
                        type="password"
                        placeholder="새 비밀번호"
                      />
                      <Input
                        type="password"
                        placeholder="새 비밀번호 확인"
                      />
                      <Button variant="outline">비밀번호 업데이트</Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">2단계 인증</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      계정에 추가 보안 계층을 추가하세요
                    </p>
                    <Button variant="outline">2FA 활성화</Button>
                  </div>


                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
