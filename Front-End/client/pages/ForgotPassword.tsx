import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // TODO: Implement password reset logic
    console.log("Password reset request for:", email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400/80 to-indigo-500/80 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
                <Droplets className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">이메일을 확인하세요</h1>
          </div>

          <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border border-white/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Reset link sent!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Please check your email and click the link to reset your password. 
                    If you don't see the email, check your spam folder.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Link to="/" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full text-blue-700 border-blue-300 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      로그인으로 돌아가기
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsSubmitted(false)}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    이메일을 받지 못하셨나요? 다시 시도
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400/80 to-indigo-500/80 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
              <Droplets className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">비밀번호 재설정</h1>
          <p className="text-gray-600">이메일을 입력하여 재설정 링크를 받으세요</p>
        </div>

        <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border border-white/20">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="text-xl text-center text-blue-900">비밀번호 찾기</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={error ? "border-red-500" : ""}
                  required
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
              >
                재설정 링크 보내기
              </Button>

              <div className="text-center space-y-2">
                <Link
                  to="/"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  로그인으로 돌아가기
                </Link>
                <br />
                <Link
                  to="/signup"
                  className="text-sm text-blue-500 hover:text-blue-700 hover:underline transition-colors duration-200"
                >
                  계정이 없으신가요? 회원가입
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
