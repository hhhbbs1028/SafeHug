import React, { useState } from "react";
import styles from "./Header.module.css";
import logoImg from "../../assets/safehug-logo.png";
import { Link, useNavigate } from "react-router-dom";
import SideMenu from "./SideMenu";
import { useAuth } from "../../contexts/AuthContext"; // AuthContext에서 로그인 상태 가져오기

const Header = () => {
  // 사이드 메뉴의 열림/닫힘 상태를 관리하는 state
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  // AuthContext에서 로그인 상태와 로그아웃 함수 가져오기
  const { user, logout } = useAuth();
  const isLoggedIn = !!user; // user가 null이 아니면 로그인 상태

  const navigate = useNavigate(); // 페이지 이동을 위한 훅

  // 사이드 메뉴 토글 함수
  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  // 로그아웃 버튼 클릭 시 처리
  const handleLogout = () => {
    logout(); // AuthContext의 로그아웃 함수 호출
    window.alert("로그아웃 되었습니다.");
    navigate("/");
  };

  return (
    <>
      <nav className={styles.headerNav}>
        <Link to="/" className={styles.logoWrap}>
          <img src={logoImg} alt="SafeHug" className={styles.logoImg} />
          <span className={styles.logoText}>SafeHug</span>
        </Link>
        <div className={styles.spacer} />
        <div className={styles.rightMenu}>
          <Link to="/faq" className={styles.menuLink}>
            FAQ
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/profile" className={styles.menuLink}>
                프로필
              </Link>
              <Link to="/chatbot" className={styles.menuLink}>
                AI 상담
              </Link>
              <button
                className={styles.menuLink}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: "1rem",
                  marginLeft: "8px",
                }}
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.menuLink}>
              로그인
            </Link>
          )}
          <div className={styles.menuIconWrap}>
            <button className={styles.menuIcon} onClick={toggleSideMenu}>
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                <path
                  d="M3 12H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 6H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 18H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={toggleSideMenu}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
};

export default Header;
