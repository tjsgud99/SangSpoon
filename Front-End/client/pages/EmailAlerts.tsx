import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowLeft, Save, CheckSquare, XSquare } from "lucide-react";
import { apiClient, type SiteResponse } from "@/lib/api";
import HeaderNav from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

type PerSiteFlags = {
    enabled: boolean;
    highWater: boolean;   // 고수위 (>80)
    lowWater: boolean;    // 저수위 (<25)
    chemical: boolean;    // 약품 (<20)
    motor1: boolean;      // 모터1 정지 (==0)
    motor2: boolean;      // 모터2 정지 (==0)
    motorFault: boolean;  // 모터불량(모터 ON인데 유량≈0, 또는 모터 OFF인데 유량>0)
};

type AlertMatrix = Record<string, PerSiteFlags>;

type EmailSettings = {
    enabled: boolean;   // 사용유무(전체 알림 ON/OFF)
    name: string;
    email: string;
};

const LS_EMAIL = "alertEmailSettings";
const LS_MATRIX = "alertMatrix";

export default function EmailAlerts() {
    const { toast } = useToast();
    const [sites, setSites] = useState<SiteResponse[]>([]);
    const [emailSettings, setEmailSettings] = useState<EmailSettings>({
        enabled: true,
        name: "",
        email: "",
    });
    const [matrix, setMatrix] = useState<AlertMatrix>({});

    // 사이트 목록 로드
    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.listSites();
                if (res.success && Array.isArray(res.data)) {
                    setSites(res.data);
                }
            } catch (e: any) {
                console.error(e);
            }
        })();
    }, []);

    // 로컬스토리지 로드
    useEffect(() => {
        try {
            const s = localStorage.getItem(LS_EMAIL);
            if (s) setEmailSettings(JSON.parse(s));
        } catch {}
        try {
            const m = localStorage.getItem(LS_MATRIX);
            if (m) setMatrix(JSON.parse(m));
        } catch {}
    }, []);

    // 사이트ID 기준으로 매트릭스 기본값 채우기
    const rows = useMemo(() => {
        return sites.map((s) => {
            const id = s.managementCode;
            const existing = matrix[id];
            const base: PerSiteFlags = {
                enabled: false,
                highWater: false,
                lowWater: false,
                chemical: false,
                motor1: false,
                motor2: false,
                motorFault: false,
            };
            return { site: s, flags: existing ?? base };
        });
    }, [sites, matrix]);

    const updateEmail = <K extends keyof EmailSettings>(key: K, value: EmailSettings[K]) => {
        setEmailSettings((prev) => ({ ...prev, [key]: value }));
    };

    const updateMatrix = (siteId: string, patch: Partial<PerSiteFlags>) => {
        setMatrix((prev) => ({
            ...prev,
            [siteId]: { ...(prev[siteId] ?? {}), ...patch },
        }));
    };

    const saveEmailSettings = () => {
        if (!emailSettings.email || !/^\S+@\S+\.\S+$/.test(emailSettings.email)) {
            toast({ title: "이메일 형식 오류", description: "올바른 이메일 주소를 입력하세요.", variant: "destructive" });
            return;
        }
        localStorage.setItem(LS_EMAIL, JSON.stringify(emailSettings));
        toast({ title: "저장 완료", description: "이메일 알림 설정이 저장되었습니다." });
    };

    const saveMatrix = () => {
        localStorage.setItem(LS_MATRIX, JSON.stringify(matrix));
        toast({ title: "저장 완료", description: "현장별 알림 체크가 저장되었습니다." });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/sites">
                            <Button variant="ghost" size="icon" title="통계로 돌아가기">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Mail className="h-6 w-6 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">이메일 알림 설정</h1>
                        </div>
                        <Badge variant="outline">로컬저장</Badge>
                    </div>
                    <HeaderNav />
                    <div />
                </div>
            </header>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 좌측: 이메일 기본 설정 */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>수신자 설정</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={emailSettings.enabled}
                                onChange={(e) => updateEmail("enabled", e.target.checked)}
                            />
                            <span className="text-sm">알림 사용</span>
                        </label>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">이름</label>
                            <Input
                                placeholder="홍길동"
                                value={emailSettings.name}
                                onChange={(e) => updateEmail("name", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">이메일</label>
                            <Input
                                placeholder="user@example.com"
                                value={emailSettings.email}
                                onChange={(e) => updateEmail("email", e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={saveEmailSettings} className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                저장
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 우측: 현장별 알림 매트릭스 */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>현장별 알림 체크</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">알림여부</TableHead>
                                        <TableHead className="whitespace-nowrap">현장번호</TableHead>
                                        <TableHead className="whitespace-nowrap">현장이름</TableHead>
                                        <TableHead className="whitespace-nowrap">고수위</TableHead>
                                        <TableHead className="whitespace-nowrap">저수위</TableHead>
                                        <TableHead className="whitespace-nowrap">약품</TableHead>
                                        <TableHead className="whitespace-nowrap">모터1</TableHead>
                                        <TableHead className="whitespace-nowrap">모터2</TableHead>
                                        <TableHead className="whitespace-nowrap">모터불량</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map(({ site, flags }) => (
                                        <TableRow key={site.managementCode}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={flags.enabled}
                                                    onChange={(e) => updateMatrix(site.managementCode, { enabled: e.target.checked })}
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono">{site.managementCode}</TableCell>
                                            <TableCell>{site.siteName}</TableCell>

                                            {([
                                                ["highWater", "고수위"],
                                                ["lowWater", "저수위"],
                                                ["chemical", "약품"],
                                                ["motor1", "모터1"],
                                                ["motor2", "모터2"],
                                                ["motorFault", "모터불량"],
                                            ] as const).map(([key]) => (
                                                <TableCell key={key} className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4"
                                                        checked={(flags as any)[key]}
                                                        onChange={(e) => updateMatrix(site.managementCode, { [key]: e.target.checked } as any)}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button onClick={saveMatrix} className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                저장
                            </Button>

                            {/* 전체 켜기/끄기 스위치(편의기능) */}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const next: AlertMatrix = {};
                                    for (const r of rows) next[r.site.managementCode] = { ...r.flags, enabled: true };
                                    setMatrix(next);
                                }}
                                className="flex items-center gap-2"
                            >
                                <CheckSquare className="h-4 w-4" />
                                전체 알림여부 켜기
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const next: AlertMatrix = {};
                                    for (const r of rows) next[r.site.managementCode] = { ...r.flags, enabled: false };
                                    setMatrix(next);
                                }}
                                className="flex items-center gap-2"
                            >
                                <XSquare className="h-4 w-4" />
                                전체 알림여부 끄기
                            </Button>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                            <div>• 기준값(기본): 고수위 &gt; 80, 저수위 &lt; 25, 약품 &lt; 20</div>
                            <div>• 모터1/2: 체크 시 해당 모터가 정지(0)면 알람</div>
                            <div>• 모터불량: (모터 ON ∧ 유량≈0) ∨ (모터 OFF ∧ 유량&gt;0)</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
