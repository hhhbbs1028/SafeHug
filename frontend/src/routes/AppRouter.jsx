import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MainPage from "../features/HomePage/HomePage";
import LoginPage from "../features/LoginPage/LoginPage";
import SignupPage from "../features/SignupPage/SignupPage";
import FaqPage from "../features/FaqPage/FaqPage";
import Profile from "../components/Profile/Profile";
import ChatbotPage from "../features/Chatbot/ChatbotPage";
import AnalysisResultPage from "../features/Analysis/AnalysisResultPage/AnalysisResultPage";
import AnalysisUploadPage from "../features/Analysis/AnalysisUploadPage";
import Terms from "./Terms";
import Privacy from "./Privacy";
import OrganizationConnectionPage from "../features/OrganizationConnectionPage/OrganizationConnectionPage";
import EvidenceCollectionPage from "../features/EvidenceCollection/EvidenceCollectionPage";
import AnalysisDetailPage from "../features/EvidenceCollection/AnalysisDetailPage";
import PdfUploadPage from "../features/PdfUpload/PdfUploadPage";
import NotFoundPage from "../features/NotFoundPage/NotFoundPage";
import FindPasswordPage from "../features/Auth/FindPasswordPage";
import ResetPasswordPage from "../features/Auth/ResetPasswordPage";
import { useAuth } from "../contexts/AuthContext";

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { 
        state: { 
          from: window.location.pathname,
          message: "로그인이 필요한 서비스입니다." 
        } 
      });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>; // 로딩 중일 때 표시할 컴포넌트
  }

  return user ? children : null;
};

// AppRouter: 전체 라우팅 담당
// - 메인, 로그인, 회원가입, FAQ, 챗봇, 프로필, 보안 설정, 알림 설정 등 연결
const AppRouter = () => (
  <Routes>
    {/* 공개 라우트 */}
    <Route path="/" element={<MainPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/faq" element={<FaqPage />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="/find-password" element={<FindPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* 서비스 라우트 */}
    <Route path="/analysis-upload" element={<AnalysisUploadPage />} />
    <Route
      path="/analysis-result/:analysisId"
      element={<AnalysisResultPage />}
    />
    <Route path="/chatbot" element={<ChatbotPage />} />
    <Route path="/pdf-upload" element={<PdfUploadPage />} />
    <Route
      path="/organization-connection"
      element={<OrganizationConnectionPage />}
    />

    {/* 보호된 라우트 */}
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/evidence-collection"
      element={
        <ProtectedRoute>
          <EvidenceCollectionPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/evidence-collection/:id"
      element={
        <ProtectedRoute>
          <EvidenceCollectionPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/analysis-detail/:evidenceId"
      element={
        <ProtectedRoute>
          <AnalysisDetailPage />
        </ProtectedRoute>
      }
    />

    {/* 404 처리 */}
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default AppRouter;
