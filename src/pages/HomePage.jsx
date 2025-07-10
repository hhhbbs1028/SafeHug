import React, { useState, useEffect } from "react";
import styles from "./HomePage.module.css";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaRobot, FaComments, FaLock } from 'react-icons/fa';
import Lottie from 'lottie-react';

// Lottie 애니메이션 예시 (실제 파일로 교체 필요)
import summaryAnim from "../../assets/summary.json";

const aiTabs = [
  {
    key: "summary",
    label: "대화 요약",
    title: "AI가 대화를 요약합니다",
    desc: "복잡한 대화를 핵심만 뽑아 요약",
    bullets: ["키워드 기반 요약", "시간순 정리", "중요도 분석"],
    anim: summaryAnim,
  },
];

const features = [
  {
    icon: <FaRobot />,
    title: 'AI 분석',
    description: '대화를 AI가 자동 분석하여 위험 요소를 식별합니다.'
  },
  {
    icon: <FaShieldAlt />,
    title: '법적 대응',
    description: '전문가 법률 대응 가이드와 증거 수집 방법을 제공합니다.'
  },
  {
    icon: <FaComments />,
    title: '전문 상담',
    description: '24시간 전문 상담사와의 연계 서비스를 제공합니다.'
  },
  {
    icon: <FaLock />,
    title: '보안',
    description: '엔드투엔드 암호화로 안전한 분석 환경을 보장합니다.'
  }
];

const HomePage = () => {
  const [aiTab, setAiTab] = useState("summary");
  const [isVisible, setIsVisible] = useState(false);
  const currentTab = aiTabs.find(tab => tab.key === aiTab);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={styles.homeWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>AI로 분석하고,{'\n'}안전하게 증거화하세요</h1>
          <p className={styles.heroSubtitle}>
            카카오톡 대화를 기반으로 위험 발언을 분석하고{'\n'}
            법적 대응을 도와드립니다.
          </p>
          <div className={styles.heroButtons}>
            <button 
              className={styles.primaryButton} 
              onClick={() => navigate("/analysis-upload")}
            >
              분석 시작하기
            </button>
            <button 
              className={styles.secondaryButton} 
              onClick={() => navigate("/chatbot")}
            >
              상담받기
            </button>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>주요 기능</h2>
        <div className={styles.featureGrid}>
          {features.map((feature, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.featureIconWrapper}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.aiSection}>
        <h2 className={styles.sectionTitle}>AI 분석 기술</h2>
        <div className={styles.aiTabGroup}>
          {aiTabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.aiTabBtn} ${tab.key === aiTab ? styles.active : ''}`}
              onClick={() => setAiTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.aiContentBox}>
          <div className={styles.aiSummaryBox}>
            <b>{currentTab.title}</b>
            <p>{currentTab.desc}</p>
            <ul>
              {currentTab.bullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          </div>
          <div className={styles.aiImageBox}>
            <Lottie 
              animationData={currentTab.anim} 
              loop={true} 
              style={{ width: 300, height: 300 }} 
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 