import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Droplets } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    loginId: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 비밀번호 복잡도 검증 제거

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    // 전화번호 자동 포맷팅
    if (name === "phoneNumber") {
      // 숫자만 추출
      const numbers = value.replace(/[^\d]/g, '');
      
      // 010-0000-0000 형식으로 포맷팅
      if (numbers.length <= 3) {
        processedValue = numbers;
      } else if (numbers.length <= 7) {
        processedValue = numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
      } else {
        processedValue = numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
      }
      
      // 최대 길이 제한 (13자: 010-0000-0000)
      if (processedValue.length > 13) {
        processedValue = processedValue.slice(0, 13);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // 비밀번호 실시간 검증 제거

    // 해당 필드의 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "이름을 입력해주세요";
    if (formData.name.length < 2) newErrors.name = "이름은 2글자 이상 입력해주세요";
    
    if (!formData.loginId.trim()) newErrors.loginId = "아이디를 입력해주세요";
    if (formData.loginId.length < 3) newErrors.loginId = "아이디는 3글자 이상 입력해주세요";
    if (!/^[a-zA-Z0-9_]+$/.test(formData.loginId)) newErrors.loginId = "영문, 숫자, 언더스코어만 사용 가능합니다";
    
    if (!formData.email.trim()) newErrors.email = "이메일을 입력해주세요";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "올바른 이메일 주소를 입력해주세요";
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "전화번호를 입력해주세요";
    if (!/^010-\d{4}-\d{4}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "010-0000-0000 형식으로 입력해주세요";
    
    if (!formData.password.trim()) newErrors.password = "비밀번호를 입력해주세요";
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // 백엔드 API 형식에 맞게 데이터 변환
        const registerData = {
          name: formData.name,
          loginId: formData.loginId,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        };

        console.log("회원가입 요청 데이터:", registerData);
        
        const response = await apiClient.register(registerData);
        
        console.log("회원가입 응답:", response);
        
        if (response.success) {
          alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
          navigate("/?showLogin=true"); // 로그인 화면이 표시되도록 파라미터 추가
        } else {
          setErrors({ general: response.message || "회원가입에 실패했습니다." });
        }
      } catch (error: any) {
        console.error("회원가입 오류:", error);
        setErrors({ general: error.message || "회원가입 중 오류가 발생했습니다." });
      } finally {
        setIsSubmitting(false);
      }
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400/80 to-indigo-500/80 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
              <Droplets className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">상수도 관리 시스템에 가입하세요</p>
        </div>

        <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border border-white/20">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="text-xl text-center text-blue-900">회원가입</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 일반 에러 메시지 */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}
              {/* 회원 정보 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    이름 *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="loginId" className="text-sm font-medium text-gray-700">
                    아이디 *
                  </label>
                  <Input
                    id="loginId"
                    name="loginId"
                    type="text"
                    placeholder="영문, 숫자만 입력 (3글자 이상)"
                    value={formData.loginId}
                    onChange={handleInputChange}
                    className={errors.loginId ? "border-red-500" : ""}
                  />
                  {errors.loginId && <p className="text-xs text-red-500">{errors.loginId}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    이메일 *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="이메일 주소 입력"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                    전화번호 *
                  </label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                  {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
                </div>
              </div>

              {/* 비밀번호 섹션 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    비밀번호 *
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호 입력"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    비밀번호 확인 *
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호 확인"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "계정 생성 중..." : "회원가입"}
              </Button>

              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                >
                  이미 계정이 있으신가요? 로그인하기
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
