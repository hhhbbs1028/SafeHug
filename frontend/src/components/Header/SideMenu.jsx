import React from "react";
import { Link } from "react-router-dom";
import styles from "./SideMenu.module.css";
import { useAuth } from "../../contexts/AuthContext"; // AuthContext에서 로그인 상태 가져오기

/**
 * 사이드 메뉴 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 사이드 메뉴 열림/닫힘 상태
 * @param {Function} props.onClose - 사이드 메뉴 닫기 함수
 */
const SideMenu = ({ isOpen, onClose }) => {
  // AuthContext에서 로그인 상태 가져오기
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.show : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 사이드 메뉴 패널 */}
      <div
        className={`${styles.sideMenu} ${isOpen ? styles.open : ""}`}
        role="navigation"
        aria-label="메인 메뉴"
      >
        <div className={styles.menuHeader}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        <nav className={styles.menuContent}>
          {/* 로그인 상태일 때만 보여줄 메뉴 섹션 */}
          {isLoggedIn && (
            <div className={styles.menuSection}>
              <h3>내 계정</h3>
              <Link to="/profile" onClick={onClose}>
                👤 프로필
              </Link>
              <Link to="/evidence-collection" onClick={onClose}>
                📁 나의 증거함
              </Link>
            </div>
          )}

          {/* 공통 메뉴 섹션 */}
          <div className={styles.menuSection}>
            <h3>서비스</h3>
            <Link to="/" onClick={onClose}>
              🏠 홈
            </Link>
            <Link to="/analysis-upload" onClick={onClose}>
              💬 카톡 대화 분석
            </Link>
            <Link to="/chatbot" onClick={onClose}>
              💬 AI 챗봇 상담
            </Link>
            <Link to="/organization-connection" onClick={onClose}>
              🏥 전문 기관 연결
            </Link>
            <Link to="/pdf-upload" onClick={onClose}>
              📄 PDF 무결성 검증
            </Link>
            <Link to="/faq" onClick={onClose}>
              ❓ 자주 묻는 질문
            </Link>
          </div>

          {/* 로그인/회원가입 섹션 */}
          {!isLoggedIn && (
            <div className={styles.menuSection}>
              <h3>계정</h3>
              <Link to="/login" onClick={onClose}>
                🔑 로그인
              </Link>
              <Link to="/signup" onClick={onClose}>
                ✍️ 회원가입
              </Link>
              <Link to="/find-password" onClick={onClose}>
                🔍 비밀번호 찾기
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default SideMenu;
