import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./NotFoundPage.module.css";
import { FaHome, FaArrowLeft, FaSearch, FaExclamationTriangle, FaRobot, FaHeadset } from "react-icons/fa";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [suggestedPaths, setSuggestedPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 자주 방문하는 페이지 목록
  const commonPaths = [
    { path: "/", label: "홈" },
    { path: "/chatbot", label: "AI 상담" },
    { path: "/community", label: "커뮤니티" },
    { path: "/support", label: "지원 센터" },
  ];

  useEffect(() => {
    // 현재 경로에서 가장 유사한 페이지 추천
    const currentPath = location.pathname.toLowerCase();
    const suggestions = commonPaths
      .filter(path => 
        path.path.toLowerCase().includes(currentPath) || 
        path.label.toLowerCase().includes(currentPath)
      )
      .slice(0, 3);

    setSuggestedPaths(suggestions);
    setIsLoading(false);
  }, [location]);

  // 페이지 이동 핸들러
  const handleNavigation = (path) => {
    navigate(path);
  };

  // 이전 페이지로 이동 핸들러
  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>
          <FaExclamationTriangle className={styles.errorIcon} />
          404
        </div>
        <h1 className={styles.title}>페이지를 찾을 수 없습니다</h1>
        <p className={styles.description}>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          입력하신 주소가 정확한지 다시 한번 확인해주세요.
        </p>

        {/* 추천 경로 표시 */}
        {!isLoading && suggestedPaths.length > 0 && (
          <div className={styles.suggestions}>
            <h2 className={styles.suggestionsTitle}>
              <FaSearch className={styles.icon} />
              이런 페이지는 어떠신가요?
            </h2>
            <div className={styles.suggestionList}>
              {suggestedPaths.map((path, index) => (
                <button
                  key={index}
                  className={styles.suggestionButton}
                  onClick={() => handleNavigation(path.path)}
                >
                  {path.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleGoBack}
          >
            <FaArrowLeft className={styles.icon} />
            이전 페이지로
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={() => handleNavigation("/")}
          >
            <FaHome className={styles.icon} />
            홈으로 이동
          </button>
        </div>

        <div className={styles.supportSection}>
          <h2>도움이 필요하신가요?</h2>
          <div className={styles.supportButtons}>
            <button 
              className={styles.supportButton}
              onClick={() => navigate('/chatbot')}
            >
              <FaRobot className={styles.buttonIcon} />
              AI 상담사에게 문의하기
            </button>
            <button 
              className={styles.supportButton}
              onClick={() => navigate('/support')}
            >
              <FaHeadset className={styles.buttonIcon} />
              고객 지원 센터
            </button>
          </div>
        </div>

        {/* 오류 보고 버튼 */}
        <div className={styles.reportSection}>
          <p className={styles.reportText}>
            이 페이지에 접근할 수 없는 문제가 계속되나요?
          </p>
          <button
            className={styles.reportButton}
            onClick={() => handleNavigation("/support/contact")}
          >
            문제 신고하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
