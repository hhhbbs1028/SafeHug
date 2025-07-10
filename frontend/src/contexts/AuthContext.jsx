import React, { createContext, useContext, useState, useEffect } from "react";
import { userApi } from "../api/axios";
import { useNavigate } from "react-router-dom";
// import CryptoJS from 'crypto-js';  // 암호화 라이브러리 (나중에 구현)

// // 암호화 키 (실제 프로덕션에서는 환경변수로 관리해야 함)
// const ENCRYPTION_KEY = 'your-secure-encryption-key';

// // 암호화 유틸리티 함수들
// const encryptData = (data) => {
//   try {
//     return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
//   } catch (error) {
//     console.error('암호화 중 오류 발생:', error);
//     return null;
//   }
// };

// const decryptData = (encryptedData) => {
//   try {
//     const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
//     return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
//   } catch (error) {
//     console.error('복호화 중 오류 발생:', error);
//     return null;
//   }
// };

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keepLogin, setKeepLogin] = useState(false);
  const navigate = useNavigate();

  // 토큰 갱신 실패 이벤트 리스너
  useEffect(() => {
    const handleAuthError = () => {
      console.debug('[Auth] 인증 오류 발생, 로그아웃 처리');
      logout({ redirect: true, redirectPath: '/login' });
    };

    window.addEventListener('authError', handleAuthError);
    return () => window.removeEventListener('authError', handleAuthError);
  }, []);

  // 새로고침 시 localStorage 또는 sessionStorage에 값이 있으면 자동 로그인 상태 복원
  useEffect(() => {
    const keepLogin = localStorage.getItem("keepLogin") === "true";
    const storage = keepLogin ? localStorage : sessionStorage;
    const token = storage.getItem("token");
    const userStr = storage.getItem("user");

    if (token && userStr) {
      setUser(JSON.parse(userStr));
      setLoading(false);
    } else if (token) {
      fetchUserInfo(storage);
    } else {
      setLoading(false);
    }
  }, []);

  // 사용자 정보 조회 (storage 구분)
  const fetchUserInfo = async (storage = localStorage) => {
    try {
      const response = await userApi.getCurrentUser();
      if (!response.success || !response.data) {
        throw new Error(
          response.message || "사용자 정보를 가져올 수 없습니다."
        );
      }
      const userData = response.data.user;
      setUser(userData);
      storage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      storage.removeItem("token");
      storage.removeItem("isLoggedIn");
      storage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 함수: keepLogin 옵션에 따라 저장소 분기
  const login = async (email, password, keepLogin = false) => {
    try {
      // 로그인 시도 전 저장소 정리
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      localStorage.removeItem("keepLogin");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("user");

      const response = await userApi.login({ email, password });
      console.debug("[Auth] 로그인 응답 수신");

      if (!response.success || !response.data) {
        throw new Error(response.message || "로그인에 실패했습니다.");
      }

      const { token, refreshToken, user: userData } = response.data;
      console.debug("[Auth] 토큰 수신 완료");

      // 토큰 정리 (공백 제거)
      const cleanToken = token.trim();
      const cleanRefreshToken = refreshToken.trim();

      // 저장소 선택
      const storage = keepLogin ? localStorage : sessionStorage;
      storage.setItem("keepLogin", keepLogin.toString());
      storage.setItem("token", cleanToken);
      storage.setItem("refreshToken", cleanRefreshToken);
      storage.setItem("isLoggedIn", "true");
      storage.setItem("user", JSON.stringify(userData));

      // 다른 저장소 정리
      if (keepLogin) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("user");
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
      }

      setUser(userData);
      window.dispatchEvent(new Event("authChanged"));
      return { success: true, token: cleanToken, user: userData };
    } catch (error) {
      console.error("[Auth] 로그인 오류:", error);
      // 로그인 실패 시 저장소 정리
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      localStorage.removeItem("keepLogin");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("user");
      
      return {
        success: false,
        error: error.message || "로그인에 실패했습니다.",
      };
    }
  };

  // 소셜 로그인 함수
  const socialLogin = async (provider) => {
    try {
      const response = await userApi.getSocialLoginPage(provider);
      if (!response.success || !response.data?.url) {
        throw new Error(response.message || "소셜 로그인을 시작할 수 없습니다.");
      }
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Social login error:", error);
      throw new Error(error.message || "소셜 로그인을 시작할 수 없습니다.");
    }
  };

  // 소셜 로그인 콜백 처리
  const handleSocialCallback = async (provider, code) => {
    try {
      // 로그인 시도 전 저장소 정리
      clearAuthStorage();

      let response;
      if (provider === "kakao") {
        response = await userApi.kakaoLogin(code);
      } else if (provider === "naver") {
        response = await userApi.naverLogin(code);
      } else {
        throw new Error("지원하지 않는 소셜 로그인입니다.");
      }

      if (!response.success || !response.data?.accessToken) {
        throw new Error(response.message || "소셜 로그인에 실패했습니다.");
      }

      const { accessToken, refreshToken, user } = response.data;

      // 토큰 정리 (공백 제거)
      const cleanToken = accessToken.trim();
      const cleanRefreshToken = refreshToken.trim();

      // 토큰 저장
      if (keepLogin) {
        localStorage.setItem("keepLogin", "true");
        localStorage.setItem("token", cleanToken);
        localStorage.setItem("refreshToken", cleanRefreshToken);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("token", cleanToken);
        sessionStorage.setItem("refreshToken", cleanRefreshToken);
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("user", JSON.stringify(user));
      }

      setUser(user);
      window.dispatchEvent(new Event("authChanged"));
      return { success: true, token: cleanToken, user };
    } catch (error) {
      console.error("Social callback error:", error);
      clearAuthStorage();
      throw new Error(error.message || "소셜 로그인 처리 중 오류가 발생했습니다.");
    }
  };

  // 인증 관련 저장소 정리 함수
  const clearAuthStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("keepLogin");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("user");
  };

  // 로그아웃 함수: 로그인 시 저장한 데이터만 정리
  const logout = (options = {}) => {
    const { redirect = true, redirectPath = '/' } = options;

    // localStorage 정리
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("keepLogin");

    // sessionStorage 정리
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("user");

    // 상태 초기화
    setUser(null);

    // 로그아웃 이벤트 발생
    window.dispatchEvent(new Event("authChanged"));

    // 리디렉션 처리
    if (redirect) {
      navigate(redirectPath);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    socialLogin,
    fetchUserInfo,
    keepLogin,
    setKeepLogin,
    handleSocialCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
