import React from "react";
import styles from "./Footer.module.css";
import logoImage from "../../assets/team-logo.png";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        {/* 로고 */}
        <img src={logoImage} alt="SafeHug Logo" className={styles.logo} />
        {/* 연락처 및 프로젝트 정보 */}
        <div className={styles.infoGroup}>
          <div>
            <span className={styles.label}>연락처</span>
            <span>hhhbbs1028@sookmyung.ac.kr, lucy023@sookmyung.ac.kr</span>
          </div>
          <div>
            <span className={styles.label}>프로젝트</span>
            <span>지도교수: 박영훈 / 2025.03.04-2025.06.13</span>
          </div>
        </div>
        {/* 바로가기 링크 그룹 */}
        <div className={styles.linkGroup}>
          <Link to="/terms">📄 이용약관</Link>
          <Link to="/privacy">🔒 개인정보처리방침</Link>
          <a
            href="https://cheerful-kicker-3f6.notion.site/SafeHug-AI-1c484d76ff9e80db80b0f70e0ee7ad79?pvs=4"
            target="_blank"
            rel="noopener noreferrer"
            title="프로젝트 Notion 바로가기"
          >
            🗒️ Notion
          </a>
          <a
            href="https://github.com/choiyunjung88/AI-Based-Sexual-Violence-Support-Platform.git"
            target="_blank"
            rel="noopener noreferrer"
            title="프로젝트 GitHub 저장소 바로가기"
          >
            🐙 GitHub
          </a>
        </div>
        {/* 학교/과목 정보 */}
        <div className={styles.footerLinks}>
          <span>숙명여자대학교</span>
          <span>|</span>
          <span>2025 -1 시스템종합설계</span>
        </div>
        {/* 저작권 */}
        <div className={styles.copyright}>
          © 안전네트워크팀. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
