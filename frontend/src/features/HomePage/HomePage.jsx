import React, { useState, useEffect } from "react";
import styles from "./HomePage.module.css";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaShieldAlt, FaUserMd, FaLock, FaRobot } from 'react-icons/fa';
import Lottie from 'lottie-react';
import summaryAnimation from '../../assets/animations/summary.json';

// AI 분석 기술 소개 탭 데이터
const aiTabs = [
  {
    key: "summary",
    label: "AI 분석 요약",
    title: "빠르고 정확한 분석",
    desc: "AI가 대화 내용을 분석하여 핵심 정보를 추출합니다.",
    bullets: [
      "대화 내용 자동 분석",
      "핵심 정보 추출",
      "위험도 평가",
      "법적 조언 제공"
    ]
  },
  {
    key: "legal",
    label: "법적 대응",
    title: "전문가 수준의 법적 조언",
    desc: "성범죄 전문 변호사들이 검토한 법적 대응 방안을 제공합니다.",
    bullets: [
      "법적 권리 안내",
      "증거 수집 방법",
      "고소/고발 절차",
      "법적 지원 연계"
    ]
  },
  {
    key: "support",
    label: "상담 지원",
    title: "전문가 상담 연계",
    desc: "성범죄 전문 상담사와의 1:1 상담을 지원합니다.",
    bullets: [
      "전문 상담사 매칭",
      "24시간 상담 가능",
      "비대면 상담 지원",
      "후속 관리 서비스"
    ]
  }
];

const features = [
  {
    icon: <FaRobot />,
    title: "AI 분석",
    desc: "대화 내용을 AI가 분석하여 위험도를 평가합니다."
  },
  {
    icon: <FaShieldAlt />,
    title: "법적 대응",
    desc: "전문가가 검토한 법적 대응 방안을 제공합니다."
  },
  {
    icon: <FaUserMd />,
    title: "전문가 상담",
    desc: "성범죄 전문 상담사와 1:1 상담이 가능합니다."
  },
  {
    icon: <FaLock />,
    title: "보안",
    desc: "모든 데이터는 암호화되어 안전하게 보관됩니다."
  }
];

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`${styles.homeWrapper} ${isVisible ? styles.visible : ''}`}>
      {/* 인트로(히어로) 섹션 */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            AI로 분석하고{'\n'}전문가와 상담하세요
          </h1>
          <p className={styles.heroSubtitle}>
            대화 내용을 AI가 분석하여 위험도를 평가하고, 전문가와 함께 안전한 대응 방안을 찾아드립니다.
            익명성과 전문성을 바탕으로, 당신만의 치유 여정을 함께합니다.
          </p>
          <div className={styles.heroButtons}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/analysis-upload")}
            >
              대화 분석하기
              <FaArrowRight className={styles.buttonIcon} />
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate("/chatbot")}
            >
              전문가 상담받기
            </button>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>주요 기능</h2>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI 분석 기술 섹션 */}
      <section className={styles.aiSection}>
        <h2 className={styles.sectionTitle}>AI 분석 기술</h2>
        <div className={styles.aiContent}>
          <div className={styles.aiAnimation}>
            <Lottie animationData={summaryAnimation} loop={true} />
          </div>
          <div className={styles.aiTabs}>
            <div className={styles.tabButtons}>
              {aiTabs.map(tab => (
                <button
                  key={tab.key}
                  className={`${styles.tabButton} ${activeTab === tab.key ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={styles.tabContent}>
              {aiTabs.map(tab => (
                <div
                  key={tab.key}
                  className={`${styles.tabPanel} ${activeTab === tab.key ? styles.active : ''}`}
                >
                  <h3>{tab.title}</h3>
                  <p>{tab.desc}</p>
                  <ul>
                    {tab.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 사용 방법 섹션 */}
      <section className={styles.howToUse}>
        <h2 className={styles.sectionTitle}>이용 방법</h2>
        <div className={styles.steps}>
          <div className={styles.card}>
            <div className={styles.stepNumber}>1</div>
            <h3>상황 설명</h3>
            <p>발생한 상황을 자세히 설명해주세요.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.stepNumber}>2</div>
            <h3>AI 분석</h3>
            <p>AI가 상황을 분석하고 위험도를 평가합니다.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.stepNumber}>3</div>
            <h3>전문가 상담</h3>
            <p>필요시 전문가와 1:1 상담을 진행합니다.</p>
          </div>
        </div>
      </section>

      {/* 보안 섹션 */}
      <section className={styles.security}>
        <h2 className={styles.sectionTitle}>보안 시스템</h2>
        <div className={styles.securityFeatures}>
          <div className={styles.securityFeature}>
            <h3>데이터 암호화</h3>
            <p>모든 데이터는 최신 암호화 기술로 보호됩니다.</p>
          </div>
          <div className={styles.securityFeature}>
            <h3>익명 처리</h3>
            <p>개인정보는 철저히 보호되며 익명으로 처리됩니다.</p>
          </div>
          <div className={styles.securityFeature}>
            <h3>접근 제한</h3>
            <p>허가된 전문가만 정보에 접근할 수 있습니다.</p>
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className={styles.faq}>
        <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>서비스 이용은 무료인가요?</h3>
            <p>네, 기본적인 AI 분석과 상담 서비스는 무료로 이용하실 수 있습니다.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>데이터는 안전하게 보관되나요?</h3>
            <p>모든 데이터는 암호화되어 저장되며, 철저한 보안 시스템으로 보호됩니다.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>언제든지 상담이 가능한가요?</h3>
            <p>24시간 상담 서비스를 제공하며, 전문가와의 1:1 상담도 가능합니다.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
