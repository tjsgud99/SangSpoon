// API 클라이언트 설정 - 직접 백엔드 주소 사용
const API_BASE_URL = 'http://localhost:8084/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  member?: any;
}

interface LoginRequest {
  loginId: string;
  password: string;
}

interface RegisterRequest {
  name: string;         // 이름
  loginId: string;      // 아이디
  email: string;        // 이메일
  phoneNumber: string;  // 전화번호
  password: string;     // 비밀번호
  confirmPassword: string; // 비밀번호 확인
}

// Site DTOs
export interface CreateOrUpdateSiteRequest {
  managementCode: string;
  siteName: string;
  contactNumber: string;
  manager?: string;
  tankType: string; // "circular" | "square" 등
  length: number;
  width: number;
  height: number;
  status: string; // active | inactive | maintenance
  memberId?: number | null;
}

export interface SiteResponse {
  managementCode: string;
  siteName: string;
  contactNumber: string;
  manager?: string | null;
  tankType: string;
  length: number;
  width: number;
  height: number;
  status: string;
  calculatedVolume?: number;
  memberId?: number | null;
  memberName?: string | null;
  memberLoginId?: string | null;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 타임아웃 처리를 위한 AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60초 타임아웃

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: controller.signal,
      ...options,
    };

    try {
      console.log(`API 요청 시작: ${url}`, config);
      const response = await fetch(url, config);
      clearTimeout(timeoutId); // 성공하면 타임아웃 해제
      
      // 응답이 JSON이 아닐 수 있으므로 content-type 확인
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'API 요청 실패');
        }
        
        return data;
      } else {
        // JSON이 아닌 응답 (보통 CORS 오류나 서버 오류)
        const text = await response.text();
        
        if (!response.ok) {
          if (response.status === 0 || text.includes('CORS')) {
            throw new Error('서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
          }
          throw new Error(`서버 오류: ${text || '알 수 없는 오류'}`);
        }
        
        // 성공했지만 JSON이 아닌 경우 (예: 텍스트 응답)
        return { success: true, message: text };
      }
    } catch (error: any) {
      clearTimeout(timeoutId); // 에러 시에도 타임아웃 해제
      console.error('API 요청 오류:', error);
      
      // AbortError (타임아웃) 처리
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다. 서버 상태를 확인해주세요.');
      }
      
      // 네트워크 오류 처리
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      }
      
      throw error;
    }
  }

  // 회원가입
  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    // 비밀번호 확인 체크
    if (userData.password !== userData.confirmPassword) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // confirmPassword 제거 후 서버로 전송
    const { confirmPassword, ...memberData } = userData;
    
    return this.request('/member/register', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  // 사이트 생성
  async createSite(payload: CreateOrUpdateSiteRequest): Promise<ApiResponse<SiteResponse>> {
    return this.request('/sites', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 사이트 목록
  async listSites(): Promise<ApiResponse<SiteResponse[]>> {
    return this.request('/sites', { method: 'GET' });
  }

  // 사이트 단건 조회
  async getSite(managementCode: string): Promise<ApiResponse<SiteResponse>> {
    return this.request(`/sites/${encodeURIComponent(managementCode)}`, { method: 'GET' });
  }

  // 사이트 수정
  async updateSite(managementCode: string, payload: Partial<CreateOrUpdateSiteRequest>): Promise<ApiResponse<SiteResponse>> {
    return this.request(`/sites/${encodeURIComponent(managementCode)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // 사이트 삭제
  async deleteSite(managementCode: string): Promise<ApiResponse<any>> {
    return this.request(`/sites/${encodeURIComponent(managementCode)}`, {
      method: 'DELETE',
    });
  }

  // 로그인
  async login(credentials: LoginRequest): Promise<ApiResponse<any>> {
    return this.request('/member/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // 로그아웃
  async logout(): Promise<ApiResponse<any>> {
    return this.request('/member/logout', {
      method: 'POST',
    });
  }

  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/member/current', {
      method: 'GET',
    });
  }

  // API 상태 확인
  async getStatus(): Promise<ApiResponse<any>> {
    return this.request('/', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
export type { LoginRequest, RegisterRequest, ApiResponse };