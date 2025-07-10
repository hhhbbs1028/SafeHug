import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChatbotPage.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { FaPaperPlane, FaSpinner } from "react-icons/fa";
import { chatbotApi } from "../../api/axios";
import counselorProfile from "../../assets/ai-counselor.svg";
// 상수 데이터
const EMERGENCY_CONTACTS = [
  { name: "경찰청 학대피해상담", number: "112" },
  { name: "여성긴급전화", number: "1366" },
  { name: "청소년상담전화", number: "1388" },
];

const SCENARIO_CONTENTS = [
  {
    title: "지금 당장 도움이 필요해요",
    steps: [
      "즉시 안전한 장소로 이동해주세요",
      "112(경찰) 또는 1366(여성긴급전화)에 연락해주세요",
      "주변에 신뢰할 수 있는 사람에게 도움을 요청해주세요",
      "증거가 될 수 있는 사진이나 녹음을 남겨주세요",
    ],
  },
  {
    title: "법적 조언이 필요해요",
    steps: [
      "법률구조공단(132)에 상담을 요청해주세요",
      "여성가족부 성폭력상담소(1366)에서 법률 상담을 받을 수 있습니다",
      "증거 수집과 보관에 대해 상담받으세요",
      "필요한 경우 변호사 선임을 도와드립니다",
    ],
  },
  {
    title: "심리적 지원이 필요해요",
    steps: [
      "여성긴급전화(1366)에서 심리 상담을 받을 수 있습니다",
      "청소년상담전화(1388)에서 전문 상담을 받을 수 있습니다",
      "가까운 정신건강의학과를 방문하실 수 있습니다",
      "신뢰할 수 있는 사람과 이야기를 나누세요",
    ],
  },
  {
    title: "고소장 작성이 필요해요",
    steps: [
      "경찰서나 검찰청에서 고소장 양식을 받을 수 있습니다",
      "온라인으로도 고소장을 작성할 수 있습니다",
      "법률구조공단(132)에서 무료로 고소장 작성을 도와드립니다",
      "증거자료를 함께 제출하면 더 효과적입니다",
    ],
  },
  {
    title: "기관 연계가 필요해요",
    steps: [
      "여성긴급전화(1366)에서 상담소 연계를 도와드립니다",
      "경찰서 성폭력전담팀과 연계할 수 있습니다",
      "법률구조공단(132)에서 변호사 연계를 도와드립니다",
      "지역별 지원기관을 안내해드립니다",
    ],
  },
  {
    title: "증거 수집이 필요해요",
    steps: [
      "대화 내용, 사진, 영상 등을 보관해주세요",
      "증거는 원본 그대로 보관하는 것이 중요합니다",
      "증거 수집 시에는 개인정보 보호에 주의해주세요",
      "필요한 경우 전문가의 도움을 받으세요",
    ],
  },
];

// 상담사 프로필 이미지 (전문적인 상담사 이미지)
const COUNSELOR_PROFILE = counselorProfile;

// 초기 메시지
const INITIAL_MESSAGE = {
  id: 1,
  type: "bot",
  content: `안녕하세요. SafeHug입니다.
아래 예시처럼 도움을 받고 싶은 내용을 자유롭게 입력해 주세요.
예: "성적인 메시지를 받았어요. 어떻게 해야 할까요?"`,
  timestamp: new Date().toISOString(),
};

// 메시지 내용을 줄바꿈만 <br />로 변환해서 출력하는 함수
function renderMessageContent(content) {
  // \n 또는 \n 기준으로 분리 후 <br />로 연결
  return content
    .split(/\n|\\n/)
    .map((line, idx, arr) => (
      <React.Fragment key={idx}>
        {line}
        {idx !== arr.length - 1 && <br />}
      </React.Fragment>
    ));
}

/**
 * 메시지 컴포넌트
 */
const Message = ({ message, onOptionClick }) => (
  <div
    className={`${styles.message} ${styles[`${message.type}Message`]} ${
      message.isInfo ? styles.infoMessage : ""
    }`}
  >
    {message.type === "bot" && !message.isInfo && (
      <div className={styles.messageProfile}>
        <img
          src={counselorProfile}
          alt="AI 상담사"
          className={styles.profileImage}
        />
      </div>
    )}
    <div className={styles.messageContent}>
      {renderMessageContent(message.content)}
      {message.options && (
        <div className={styles.messageOptions}>
          {message.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onOptionClick(option)}
              className={styles.optionButton}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

/**
 * 타이핑 인디케이터 컴포넌트
 */
const TypingIndicator = () => (
  <div className={`${styles.message} ${styles.botMessage}`}>
    <div className={styles.messageProfile}>
      <img
        src={counselorProfile}
        alt="AI 상담사"
        className={styles.profileImage}
      />
    </div>
    <div className={styles.messageContent}>
      <span className={styles.typingIndicator}>답변 작성 중...</span>
    </div>
  </div>
);

/**
 * 채팅봇 페이지 컴포넌트
 */
const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const messageIdRef = useRef(2);
  const sessionIdRef = useRef(generateSessionId());
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const lastSendTimeRef = useRef(0);
  const DEBOUNCE_DELAY = 500; // 500ms 디바운스
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 세션 ID 생성 함수
  function generateSessionId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // 메시지 스크롤 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 새 상담 시작
  const handleNewChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        content: "새로운 상담을 시작합니다. 어떤 도움이 필요하신가요?",
      },
    ]);
    messageIdRef.current = 2;
    sessionIdRef.current = generateSessionId();
  };

  // 메시지 추가
  const addMessage = (content, type = "user", options = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: messageIdRef.current++,
        type,
        content,
        ...(options && { options }),
      },
    ]);
  };

  // 챗봇 응답 생성
  const generateBotResponse = async (userMessage) => {
    setIsLoading(true);
    try {
      const response = await chatbotApi.sendMessage({
        message: userMessage,
        sessionId: sessionIdRef.current,
      });
      return {
        content: response.message,
        options: response.options,
      };
    } catch (error) {
      console.error("Error generating bot response:", error);
      return {
        content: "죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다.",
        options: ["다시 시도하기", "다른 도움이 필요해요"],
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 옵션 선택 처리
  const handleOptionSelect = (option) => {
    handleSendMessage(option);
  };

  // 메시지 전송 핸들러
  const handleSendMessage = async (message) => {
    try {
      setIsLoading(true);
      setError(null);

      // 사용자 메시지 추가
      const userMessage = {
        type: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // API 호출
      const response = await chatbotApi.sendMessage({
        message,
        sessionId: sessionIdRef.current,
        userId: user?.id,
      });

      // 응답 데이터 검증
      if (!response?.data) {
        throw new Error("서버로부터 유효한 응답을 받지 못했습니다.");
      }

      // 봇 응답 추가
      const botMessage = {
        type: "bot",
        content: response.data.message || response.data.content,
        options: response.data.options || [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // 스크롤을 최하단으로 이동
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("메시지 전송 중 오류:", error);

      // 에러 메시지 생성
      let errorMessage = "메시지 전송에 실패했습니다.";
      let errorOptions = ["다시 시도하기", "상담 종료하기"];

      if (error.response) {
        switch (error.response.status) {
          case 429:
            errorMessage = "잠시 후 다시 시도해주세요. (요청이 너무 많습니다)";
            errorOptions = ["다시 시도하기", "상담 종료하기"];
            break;
          case 401:
            errorMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
            errorOptions = ["로그인하기", "상담 종료하기"];
            break;
          case 500:
            errorMessage =
              "잠시 후 다시 시도해주세요.";
            errorOptions = ["다시 시도하기", "상담 종료하기"];
            break;
          default:
            if (error.response.data?.message) {
              errorMessage = error.response.data.message;
            }
        }
      } else if (error.request) {
        errorMessage =
          "서버와의 통신에 실패했습니다. 인터넷 연결을 확인해주세요.";
        errorOptions = ["다시 시도하기", "상담 종료하기"];
      }

      // 에러 메시지 추가
      const errorBotMessage = {
        type: "error",
        content: errorMessage,
        options: errorOptions,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 입력 처리
  const handleMessageInput = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    setError(""); // 입력 시 에러 메시지 초기화
  };

  // 엔터 키 처리
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isLoading && !isRetrying) {
        handleSendMessage(inputMessage);
        setInputMessage("");
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* 사이드바 */}
      <div className={styles.sidebar}>
        {/* 새 상담 시작 섹션 */}
        <section className={`${styles.section} ${styles.newChat}`}>
          <button className={styles.newChatButton} onClick={handleNewChat}>
            💬 새 상담 시작
          </button>
        </section>

        {/* 긴급 상황 안내 섹션 */}
        <section
          className={`${styles.section} ${styles.emergency}`}
          onClick={() => setIsScenarioOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.sectionTitle}>🚨 긴급 상황 안내</div>
          <div className={styles.content}>지금 즉시 도움이 필요하신가요?</div>
        </section>

        {/* 도움말 보기 섹션 */}
        <section
          className={`${styles.section} ${styles.help}`}
          onClick={() => setIsHelpOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.sectionTitle}>ℹ️ 도움말 보기</div>
        </section>

        {/* 긴급 연락처 섹션 */}
        <section className={styles.contactsSection}>
          <h2>긴급 연락처</h2>
          <div className={styles.contacts}>
            {EMERGENCY_CONTACTS.map((contact, index) => (
              <div key={index} className={styles.contact}>
                <div className={styles.contactName}>{contact.name}</div>
                <a
                  href={`tel:${contact.number}`}
                  className={styles.contactNumber}
                >
                  {contact.number}
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 채팅 영역 */}
      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.type === "user" ? styles.userMessage : styles.botMessage
              }`}
            >
              {message.type === "bot" && (
                <div className={styles.messageProfile}>
                  <img
                    src={counselorProfile}
                    alt="AI 상담사"
                    className={styles.profileImage}
                  />
                </div>
              )}
              <div className={styles.messageContent}>
                {renderMessageContent(message.content)}
                {message.options && (
                  <div className={styles.messageOptions}>
                    {message.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        className={styles.optionButton}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 폼 */}
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={inputMessage}
            onChange={handleMessageInput}
            onKeyPress={handleKeyPress}
            placeholder={isRetrying ? "재시도 중..." : "메시지를 입력하세요..."}
            className={`${styles.input} ${isRetrying ? styles.retrying : ""}`}
            disabled={isLoading || isRetrying}
          />
          <button
            onClick={() => {
              if (inputMessage.trim() && !isLoading && !isRetrying) {
                handleSendMessage(inputMessage);
                setInputMessage("");
              }
            }}
            className={`${styles.sendButton} ${
              isRetrying ? styles.retrying : ""
            }`}
            disabled={isLoading || !inputMessage.trim() || isRetrying}
          >
            {isLoading ? (
              <div className={styles.spinner} />
            ) : isRetrying ? (
              <div className={styles.retrySpinner} />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="24"
                height="24"
                className={styles.sendIcon}
              >
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 에러 메시지 표시 */}
      {error && (
        <div
          className={`${styles.errorMessage} ${
            isRetrying ? styles.retrying : ""
          }`}
        >
          {error}
        </div>
      )}

      {/* 시나리오 모달 */}
      {isScenarioOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>상황별 대처 시나리오</h2>
            <ul className={styles.scenarioList}>
              {SCENARIO_CONTENTS.map((scenario, index) => (
                <li key={index} className={styles.scenarioItem}>
                  <b>{scenario.title}</b>
                  {scenario.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className={styles.step}>
                      - {step}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsScenarioOpen(false)}
              className={styles.closeButton}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 도움말 모달 */}
      {isHelpOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>도움말</h2>
            <div className={styles.helpContent}>
              <div className={styles.helpSection}>
                <h3>AI 상담사 이용 방법</h3>
                <p>
                  AI 상담사는 24시간 여러분의 이야기를 듣고 도움을 드립니다.
                  다음과 같은 주제로 상담이 가능합니다:
                </p>
                <ul>
                  <li>법률 상담 및 신고 절차 안내</li>
                  <li>심리 상담 및 정서적 지원</li>
                  <li>긴급 상황 대처 방법</li>
                  <li>지원 기관 연계</li>
                </ul>
              </div>
              <div className={styles.helpSection}>
                <h3>주의사항</h3>
                <p>
                  AI 상담사는 전문 상담사를 대체할 수 없습니다. 긴급한 상황이나
                  전문적인 상담이 필요한 경우, 아래 연락처로 직접 연락하시기
                  바랍니다:
                </p>
                <ul>
                  <li>경찰청 학대피해상담: 112</li>
                  <li>여성긴급전화: 1366</li>
                  <li>청소년상담전화: 1388</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className={styles.closeButton}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;
