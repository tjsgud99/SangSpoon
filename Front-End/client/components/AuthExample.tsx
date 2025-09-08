import React, { useState, useEffect } from 'react';
import { apiClient, LoginRequest, RegisterRequest } from '../lib/api';

const AuthExample: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    loginId: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    name: '',
    loginId: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  // 컴포넌트 마운트 시 현재 사용자 정보와 API 상태 확인
  useEffect(() => {
    checkApiStatus();
    checkCurrentUser();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await apiClient.getStatus();
      setStatus(response.message || 'API 연결 성공');
    } catch (error) {
      setStatus('API 연결 실패');
      console.error('API 상태 확인 실패:', error);
    }
  };

  const checkCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success) {
        setCurrentUser(response.member);
      }
    } catch (error) {
      console.log('로그인되지 않은 상태');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.login(loginForm);
      if (response.success) {
        alert('로그인 성공!');
        setCurrentUser(response.member);
        setLoginForm({ loginId: '', password: '' });
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert('로그인 실패');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.register(registerForm);
      if (response.success) {
        alert('회원가입 성공!');
        setRegisterForm({ 
          name: '',
          loginId: '',
          email: '',
          phoneNumber: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert('회원가입 실패');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await apiClient.logout();
      if (response.success) {
        alert('로그아웃 성공!');
        setCurrentUser(null);
      }
    } catch (error) {
      alert('로그아웃 실패');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">백엔드 API 연동 테스트</h1>
      
      {/* API 상태 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">API 상태</h2>
        <p>상태: {status}</p>
      </div>

      {/* 현재 사용자 정보 */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">현재 로그인 사용자</h2>
        {currentUser ? (
          <div>
            <p>사용자 ID: {currentUser.loginId}</p>
            <p>이름: {currentUser.name}</p>
            <p>이메일: {currentUser.email}</p>
            <p>전화번호: {currentUser.phoneNumber}</p>
            <button 
              onClick={handleLogout}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <p>로그인되지 않음</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 로그인 폼 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">로그인</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">사용자 ID</label>
              <input
                type="text"
                value={loginForm.loginId}
                onChange={(e) => setLoginForm({...loginForm, loginId: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              로그인
            </button>
          </form>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">회원가입</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">이름</label>
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">아이디</label>
              <input
                type="text"
                value={registerForm.loginId}
                onChange={(e) => setRegisterForm({...registerForm, loginId: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">전화번호</label>
              <input
                type="tel"
                value={registerForm.phoneNumber}
                onChange={(e) => setRegisterForm({...registerForm, phoneNumber: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="010-1234-5678"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              회원가입
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthExample;