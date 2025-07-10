import axios from "axios";
import { handleApiError } from '../utils/errorHandler';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// CORS 설정
const corsConfig = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// 토큰 갱신 관련 상태
let isRefreshing = false;
let refreshSubscribers = [];

// 토큰 갱신 대기 요청 추가
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

// 토큰 갱신 완료 후 대기 중인 요청들 실행
const onRefreshed = (token) => {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
};

// 토큰 갱신 실패 시 대기 중인 요청들 실패 처리
const onRefreshError = (error) => {
  refreshSubscribers.map(cb => cb(null, error));
  refreshSubscribers = [];
};

// 토큰 갱신 함수
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken
    });

    if (!response.data.success) {
      throw new Error(response.data.message || '토큰 갱신에 실패했습니다.');
    }

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    
    // 토큰 저장
    const storage = localStorage.getItem('keepLogin') === 'true' ? localStorage : sessionStorage;
    storage.setItem('token', accessToken);
    storage.setItem('refreshToken', newRefreshToken);

    return accessToken;
  } catch (error) {
    console.error('[Auth] 토큰 갱신 실패:', error);
    // 토큰 갱신 실패 시 저장소 정리
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('keepLogin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    
    // 인증 오류 이벤트 발생
    window.dispatchEvent(new Event('authError'));
    throw error;
  }
};

// 기본 axios 인스턴스 생성 (인증 필요)
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 채팅봇용 axios 인스턴스 생성 (인증 불필요)
const chatbotAxios = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

// 소셜 로그인 및 AI 테스트용 axios 인스턴스 생성 (루트 경로용)
const rootAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// 소셜 로그인용 axios 인스턴스 생성 (HTTP)
const socialAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "text/html",
    Accept: "text/html",
  },
  withCredentials: false,
  responseType: "text",
});

// Request interceptor (인증이 필요한 API용)
api.interceptors.request.use(
  (config) => {
    // 토큰 저장소 확인 순서: localStorage -> sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    console.log("=== API 요청 시작 ===");
    console.log("요청 URL:", `${config.baseURL}${config.url}`);
    console.log("요청 메서드:", config.method);
    console.log("요청 데이터:", config.data);
    
    // 인증이 필요하지 않은 API 경로 체크
    const publicPaths = [
      '/upload/chat',
      '/analysis',
      '/analysis/',
      '/analysis/generate-pdf',
      '/chatbot',
      '/login',
      '/signup',
      '/auth/refresh'
    ];
    
    const isPublicPath = publicPaths.some(path => config.url.includes(path));
    
    if (isPublicPath) {
      // 공개 API는 토큰 없이도 진행
      return config;
    }
    
    // 그 외 API는 토큰 필요
    if (!token) {
      window.dispatchEvent(new Event('authError'));
      return Promise.reject(new Error("인증이 필요합니다."));
    }

    // 토큰 형식 검증
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error("잘못된 토큰 형식:", token);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.dispatchEvent(new Event('authError'));
      return Promise.reject(new Error("잘못된 토큰 형식입니다."));
    }

    // Bearer 토큰 형식으로 설정
    config.headers.Authorization = `Bearer ${token.trim()}`;
    return config;
  },
  (error) => {
    console.error("요청 인터셉터 에러:", error);
    return Promise.reject(error);
  }
);

// Response interceptor (인증이 필요한 API용)
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // 401 에러이고, 토큰 갱신 시도가 아닌 경우에만 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 공개 API는 토큰 갱신 시도하지 않음
      const publicPaths = [
        '/upload/chat',
        '/analysis',
        '/analysis/',
        '/analysis/generate-pdf',
        '/chatbot',
        '/login',
        '/signup',
        '/auth/refresh'
      ];
      
      const isPublicPath = publicPaths.some(path => originalRequest.url.includes(path));
      if (isPublicPath) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(token => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axios(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        isRefreshing = false;
        onRefreshed(newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshError(refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(handleApiError(error));
  }
);

// 챗봇용 axios 인터셉터 설정
chatbotAxios.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 헤더에 추가
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

chatbotAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.")
      );
    }
    if (!error.response) {
      return Promise.reject(
        new Error("서버와의 통신에 실패했습니다. 인터넷 연결을 확인해주세요.")
      );
    }
    return Promise.reject(error);
  }
);

// 요청 제어를 위한 변수
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 최소 요청 간격 (1초)
const MAX_RETRY_COUNT = 3; // 최대 재시도 횟수
const INITIAL_RETRY_DELAY = 1000; // 초기 재시도 대기 시간 (1초)

// 요청 지연 함수
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// API 객체 확장
Object.assign(api, {
  // 분석 관련 API
  analysis: {
    // 분석 결과 조회
    getAnalysisResult: async (analysisId) => {
      try {
        console.log("분석 결과 조회 요청:", analysisId);
        const response = await api.get(`/analysis/${analysisId}`);
        console.log("분석 결과 조회 응답:", response.data);
        return response;
      } catch (error) {
        console.error("분석 결과 조회 중 에러 발생:", error);
        throw error;
      }
    },

    // 파일 업로드 및 분석 (단일 메서드로 통합)
    uploadChat: async (formData, config = {}) => {
      console.log("파일 업로드 및 분석 요청 시작");
      try {
        // 사용자 ID가 있으면 추가, 없어도 진행
        if (formData.get('userId')) {
          console.log("사용자 ID 포함:", formData.get('userId'));
        } else {
          console.log("사용자 ID 없음 - 비로그인 상태로 진행");
        }

        const response = await api.post("/upload/chat", formData, {
          ...config,
          headers: {
            ...config.headers,
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("파일 업로드 및 분석 응답:", response.data);
        return response;
      } catch (error) {
        console.error("파일 업로드 중 에러 발생:", error);
        throw error;
      }
    },

    // 분석 결과 저장
    saveAnalysisResult: async (data) => {
      try {
        console.log("분석 결과 저장 요청:", data);
        const response = await api.post("/analysis", data);
        console.log("분석 결과 저장 응답:", response);
        return response.data;
      } catch (error) {
        console.error("분석 결과 저장 중 에러 발생:", error);
        throw error;
      }
    },

    // 분석 결과 수정
    updateAnalysisResult: async (analysisId, data) => {
      try {
        console.log("분석 결과 수정 요청:", { analysisId, data });
        const response = await api.put(`/analysis/${analysisId}`, data);
        console.log("분석 결과 수정 응답:", response);
        return response.data;
      } catch (error) {
        console.error("분석 결과 수정 중 에러 발생:", error);
        throw error;
      }
    },

    // 분석 결과 삭제
    deleteAnalysisResult: async (analysisId) => {
      try {
        console.log("분석 결과 삭제 요청:", { analysisId });
        const response = await api.delete(`/analysis/${analysisId}`);
        console.log("분석 결과 삭제 응답:", response);
        return response.data;
      } catch (error) {
        console.error("분석 결과 삭제 중 에러 발생:", error);
        throw error;
      }
    },

    // 분석 결과 목록 조회
    getAnalysisResults: async (params = {}) => {
      try {
        console.log("분석 결과 목록 조회 요청:", params);
        const response = await api.get("/analysis", { params });
        console.log("분석 결과 목록 조회 응답:", response);
        return response.data;
      } catch (error) {
        console.error("분석 결과 목록 조회 중 에러 발생:", error);
        throw error;
      }
    },

    // 파일 업로드 및 분석
    uploadAndAnalyze: async (formData, config) => {
      try {
        console.log("파일 업로드 및 분석 요청:", formData);
        const response = await api.post("/upload/chat", formData, config);
        console.log("파일 업로드 및 분석 응답:", response);
        return response;
      } catch (error) {
        console.error("파일 업로드 및 분석 중 에러 발생:", error);
        throw error;
      }
    },

    // PDF 파일 검증
    verifyPdf: async (file) => {
      try {
        console.log("PDF 파일 검증 요청:", file);
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/verify", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("PDF 파일 검증 응답:", response);
        return response;
      } catch (error) {
        console.error("PDF 파일 검증 중 에러 발생:", error);
        throw error;
      }
    },
  },

  // 증거 관련 API
  evidence: {
    // 증거 목록 조회
    getMyEvidence: async (params = {}) => {
      try {
        console.log("증거 목록 조회 요청:", params);
        const response = await api.get("/my-evidence", { params });
        console.log("증거 목록 조회 응답:", response);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // 증거 상세 조회
    getEvidenceDetail: async (evidenceId) => {
      try {
        console.log("증거 상세 조회 요청:", { evidenceId });
        const response = await api.get(`/my-evidence/${evidenceId}`);
        console.log("증거 상세 조회 응답:", response);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // 증거 생성
    createEvidence: async (chatAnalysisId, data) => {
      try {
        console.log("=== 증거 생성 요청 시작 ===");
        console.log("요청 URL:", `/evidence/${chatAnalysisId}`);
        console.log("요청 데이터:", data);
        console.log("Authorization 헤더:", api.defaults.headers.common['Authorization']);
        
        const response = await api.post(`/evidence/${chatAnalysisId}`, data);
        
        console.log("=== 증거 생성 응답 ===");
        console.log("상태 코드:", response.status);
        console.log("응답 데이터:", response.data);
        return response.data;
      } catch (error) {
        console.error("=== 증거 생성 실패 ===");
        console.error("에러 메시지:", error.message);
        console.error("에러 응답:", error.response?.data);
        console.error("에러 상태:", error.response?.status);
        throw handleApiError(error);
      }
    },

    // 증거 수정
    updateEvidence: async (evidenceId, data) => {
      try {
        console.log("증거 수정 요청:", { evidenceId, data });
        const response = await api.put(`/my-evidence/${evidenceId}`, data);
        console.log("증거 수정 응답:", response);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // 증거 삭제
    deleteEvidence: async (evidenceId) => {
      try {
        console.log("증거 삭제 요청:", { evidenceId });
        const response = await api.delete(`/my-evidence/${evidenceId}`);
        console.log("증거 삭제 응답:", response);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // 카테고리 목록 조회
    getCategories: async () => {
      try {
        console.log("카테고리 목록 조회 요청");
        const response = await api.get("/categories");
        console.log("카테고리 목록 조회 응답:", response);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // PDF 증거 생성
    createPdfEvidence: async (data) => {
      try {
        console.log("PDF 증거 생성 요청:", data);
        const response = await api.post(
          `/evidence/pdf?chatAnalysisId=${data.analysisId}`,
          {
            title: data.title,
            category: Array.isArray(data.category) ? data.category[0] : data.category,
            tags: data.tags || [],
            incidentDate: {
              start: data.incidentDate.start,
              end: data.incidentDate.end
            },
            incidentTime: data.incidentTime,
            location: data.location,
            offenderInfo: data.offenderInfo,
            witnesses: data.witnesses || [],
            emotions: data.emotions || [],
            otherEmotion: data.otherEmotion,
            details: data.details,
            outputOptions: {
              includeMessages: data.outputOptions.includeMessages,
              includeCover: data.outputOptions.includeCover,
              includeToc: data.outputOptions.includeToc,
              pageNumbering: data.outputOptions.pageNumbering,
              orientation: data.outputOptions.orientation,
              maskingOption: data.outputOptions.maskingOption
            },
            signature: {
              signedBy: data.signature.signedBy,
              signedAt: data.signature.signedAt,
              hashAlgorithm: 'SHA256',
              signatureAlgorithm: 'SHA256WithRSA'
            }
          }
        );
        console.log("PDF 증거 생성 응답:", response);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    },

    // PDF 생성
    generatePdf: async (evidenceId, data) => {
      try {
        console.log("PDF 생성 요청:", { evidenceId, data });
        const response = await api.post(`/my-evidence/${evidenceId}/pdf`, data);
        console.log("PDF 생성 응답:", response);
        return response.data;
      } catch (error) {
        throw handleApiError(error);
      }
    }
  }
});

// API 객체 내보내기
export const { analysis: analysisApi, evidence: evidenceApi } = api;

// 채팅봇 API
export const chatbotApi = {
  sendMessage: async (data) => {
    try {
      console.log("채팅봇 메시지 전송 요청:", data);
      const response = await chatbotAxios.post("/chatbot/message", data);
      console.log("채팅봇 메시지 전송 응답:", response);
      return response;
    } catch (error) {
      console.error("채팅봇 메시지 전송 중 에러 발생:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  }
};

// 1. 사용자 관리 API
export const userApi = {
  // 1.1 회원가입
  signup: async (userData) => {
    const response = await api.post("/user/signup", userData);
    return response.data;
  },

  // 1.2 로그인
  login: async (credentials) => {
    try {
      const response = await api.post("/user/login", credentials);
      console.log("로그인 응답:", response.data);
      
      const { token, refreshToken, user } = response.data.data;
      
      if (!token) {
        console.error("토큰이 응답에 없습니다:", response.data);
        throw new Error("로그인 응답에 토큰이 없습니다.");
      }

      // 토큰 형식 검증
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("잘못된 토큰 형식:", token);
        throw new Error("잘못된 토큰 형식입니다.");
      }

      // 토큰 저장
      const keepLogin = localStorage.getItem("keepLogin") === "true";
      const storage = keepLogin ? localStorage : sessionStorage;
      
      // 토큰 저장 전 공백 제거 및 형식 검증
      const cleanToken = token.trim();
      const cleanRefreshToken = refreshToken.trim();
      
      // 토큰 형식 재검증
      if (cleanToken.split('.').length !== 3) {
        throw new Error("잘못된 토큰 형식입니다.");
      }
      
      storage.setItem("token", cleanToken);
      storage.setItem("refreshToken", cleanRefreshToken);
      storage.setItem("isLoggedIn", "true");
      storage.setItem("user", JSON.stringify(user));
      
      // 저장된 토큰 확인
      const savedToken = storage.getItem("token");
      console.log("저장된 토큰 형식:", {
        token: savedToken ? `${savedToken.substring(0, 10)}...` : null,
        parts: savedToken ? savedToken.split('.').length : 0
      });
      
      return {
        success: true,
        data: {
          token: cleanToken,
          refreshToken: cleanRefreshToken,
          user
        }
      };
    } catch (error) {
      console.error("로그인 중 오류:", error);
      throw error;
    }
  },

  // 1.3 현재 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await api.get("/user/me");
    return response.data;
  },

  // 1.4 이메일 중복 확인
  checkEmail: async (email) => {
    const response = await api.post("/user/email-exists", { email });
    return response.data; // Boolean 값 직접 반환
  },

  // 1.5 비밀번호 찾기
  findPassword: async ({ email }) => {
    const response = await api.post("/user/find-password", { email });
    return response.data;
  },

  // 1.6 비밀번호 재설정
  resetPassword: async ({ token, newPassword }) => {
    const response = await api.post("/user/reset-password", { token, newPassword });
    return response.data;
  },

  // 1.7 비밀번호 변경
  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await api.patch("/user/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // 1.8 회원 탈퇴 (인증 필요)
  deleteAccount: async ({ password }) => {
    try {
      const response = await api.delete("/user/withdraw", {
        data: { password }
      });
      // 회원 탈퇴 성공 시 로컬 스토리지 정리
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      return response.data;
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      throw error;
    }
  },

  // 1.9 토큰 재발급
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 1.10 로그아웃
  logout: async () => {
    const response = await api.post("/user/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    return response.data;
  },

  // 1.11 소셜 로그인 페이지 URL 요청
  getSocialLoginPage: async (provider) => {
    try {
      const response = await socialAxios.get(`/login/${provider}`);
      if (!response.data) {
        throw new Error("소셜 로그인 URL을 받아오는데 실패했습니다.");
      }
      return { success: true, data: { url: response.data } };
    } catch (error) {
      console.error(`[${provider}] 소셜 로그인 URL 요청 실패:`, error);
      throw new Error(error.response?.data?.message || "소셜 로그인을 시작할 수 없습니다.");
    }
  },

  // 1.12 카카오 로그인 콜백 처리
  kakaoLogin: async (code) => {
    try {
      const response = await api.get(`/api/login/kakao/callback?code=${code}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || "카카오 로그인에 실패했습니다.");
      }
      return response.data;
    } catch (error) {
      console.error("[Kakao] 로그인 콜백 처리 실패:", error);
      throw new Error(error.response?.data?.message || "카카오 로그인 처리 중 오류가 발생했습니다.");
    }
  },

  // 1.13 네이버 로그인 콜백 처리
  naverLogin: async (code) => {
    try {
      const response = await api.get(`/api/login/naver/callback?code=${code}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || "네이버 로그인에 실패했습니다.");
      }
      return response.data;
    } catch (error) {
      console.error("[Naver] 로그인 콜백 처리 실패:", error);
      throw new Error(error.response?.data?.message || "네이버 로그인 처리 중 오류가 발생했습니다.");
    }
  },
};

// 6. PDF 검증 API
export const verifyPdfApi = {
  // 6.1 PDF 진위 확인
  verifyPdf: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/verify", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return response.data;
  }
};

// API 인스턴스 export
export {
  api,
  chatbotAxios,
  corsConfig as corsSettings
};

// 기본 export
export default api;
