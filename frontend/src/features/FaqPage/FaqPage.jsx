import React, { useState } from "react";
import styles from "./FaqPage.module.css";
import { useNavigate } from 'react-router-dom';

// FAQ 페이지 컴포넌트
// - 자주 묻는 질문/답변 목록을 아코디언 스타일로 표시
// - 클릭 시 답변 표시/숨김 기능 구현
const FaqPage = () => {
  // useNavigate 훅을 컴포넌트 내부에서 호출해야 함
  const navigate = useNavigate();
  // 현재 열린 FAQ 항목의 인덱스를 관리하는 상태
  const [openIndex, setOpenIndex] = useState(null);

  // FAQ 데이터
  const faqData = [
    {
      icon: "💬",
      question: "카카오톡 대화 내용은 어떻게 업로드하나요?",
      answer:
        "카카오톡 내보내기 기능을 통해 대화 내용을 txt 파일로 저장한 후, SafeHug의 '증거 업로드' 메뉴에서 파일을 업로드해 주세요. AI가 자동으로 대화 내용을 분석하여 법적 증거로 활용할 수 있도록 정리해 드립니다.",
    },
    {
      icon: "🔒",
      question: "증거 자료는 얼마나 안전하게 보관되나요?",
      answer:
        "모든 증거 자료는 은행급 보안 수준의 암호화(AES-256)로 처리되어 저장됩니다. 또한 블록체인 기술을 활용하여 증거 자료의 위변조를 방지하고, 접근 권한이 있는 담당자만 열람할 수 있도록 엄격하게 관리됩니다.",
    },
    {
      icon: "👥",
      question: "전문가 상담은 어떻게 받을 수 있나요?",
      answer:
        "SafeHug에 가입 후 '전문가 상담' 메뉴에서 상담 예약이 가능합니다. 성폭력 피해 관련 전문 상담사, 법률 전문가, 심리 치료사 등 분야별 전문가와 연결해 드리며, 24시간 긴급 상담도 제공합니다.",
    },
    {
      icon: "🛡️",
      question: "개인정보가 노출될 위험은 없나요?",
      answer:
        "개인정보보호법과 GDPR 기준을 준수하며, 모든 개인정보는 강력한 보안 시스템으로 보호됩니다. 상담 내용과 신원 정보는 철저히 분리 보관되며, 법원 제출 등 필수적인 경우를 제외하고는 절대 외부에 공개되지 않습니다.",
    },
    {
      icon: "📝",
      question: "고소장 작성은 어떻게 도와주나요?",
      answer:
        "AI 기반 고소장 작성 지원 시스템을 통해 피해 상황에 맞는 맞춤형 고소장 템플릿을 제공합니다. 작성된 고소장은 협력 법률사무소의 검토를 거쳐 완성되며, 필요한 경우 무료 법률 상담도 연계해 드립니다.",
    },
    {
      icon: "💎",
      question: "얼마나 많은 기관과 연계되어 있나요?",
      answer:
        "전국 39개 성폭력상담소, 15개 법률구조공단 지부, 12개 협력 병원, 20개 심리치료 기관과 협력하고 있습니다. 피해자의 거주 지역에 따라 가장 가까운 기관과 즉시 연계를 도와드립니다.",
    },
    {
      icon: "🤖",
      question: "AI 분석은 얼마나 정확한가요?",
      answer:
        "SafeHug의 AI 시스템은 10만 건 이상의 성폭력 사례를 학습하여 95% 이상의 분석 정확도를 보유하고 있습니다. 증거 분석, 위험도 평가, 법적 대응 방안 제시 등에서 전문가 수준의 정확한 판단을 제공합니다.",
    },
    {
      icon: "🏥",
      question: "긴급상황시 어떻게 도움을 받을 수 있나요?",
      answer:
        "SafeHug 앱의 '긴급 지원' 버튼을 누르면 24시간 상담사와 즉시 연결됩니다. 위치 기반으로 가장 가까운 경찰서, 병원, 상담소를 안내해 드리며, 필요한 경우 긴급 출동 서비스도 제공합니다.",
    },
  ];

  // FAQ 항목 클릭 핸들러
  const handleFaqClick = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 1:1 상담하기 버튼 클릭 시 챗봇 페이지로 이동
  const handleNewChat = () => {
    navigate('/chatbot'); // 경로는 필요에 따라 수정 가능
  }

  return (
    <div className={styles.faqContainer}>
      <h1 className={styles.title}>자주 묻는 질문</h1>
      <p className={styles.subtitle}>
        SafeHug의 서비스에 대해 궁금하신 점을 확인하세요.
        <br />더 자세한 문의는 1:1 상담을 이용해주세요.
      </p>

      <div className={styles.faqGrid}>
        {faqData.map((faq, index) => (
          <div
            key={index}
            className={`${styles.faqItem} ${
              openIndex === index ? styles.open : ""
            }`}
            onClick={() => handleFaqClick(index)}
          >
            <div className={styles.question}>
              <span className={styles.icon}>{faq.icon}</span>
              <span className={styles.questionText}>{faq.question}</span>
              <span className={styles.arrow}>▼</span>
            </div>
            <div className={styles.answer}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.contactSection}>
        <p>원하시는 답변을 찾지 못하셨나요?</p>
        <button className={styles.contactButton} onClick={handleNewChat}>1:1 상담하기</button>
      </div>
    </div>
  );
};

export default FaqPage;
