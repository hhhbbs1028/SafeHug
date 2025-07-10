import React from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import "./styles/common.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// App 컴포넌트
// - 공통 레이아웃(헤더, 푸터) 적용
// - 라우터(AppRouter)로 전체 페이지 관리
const AppContent = () => {
  const location = useLocation();
  const isChatbotPage = location.pathname === "/chatbot";

  return (
    <div className="app">
      <Header />
      <main>
        <AppRouter />
      </main>
      {!isChatbotPage && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
};

export default App;
