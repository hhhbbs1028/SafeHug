import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "./AnalysisResultPage.module.css";
import "../../../styles/common.css";
import {
  FaFilePdf,
  FaExclamationTriangle,
  FaArchive,
  FaUserMd,
  FaChartLine,
  FaCalendarAlt,
  FaShieldAlt,
  FaLock,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaChartBar,
  FaChartPie,
  FaSpinner,
  FaTimes,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";
import { useAuth } from "../../../contexts/AuthContext";
import "jspdf-autotable";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api, { analysisApi, evidenceApi } from "../../../api/axios";

// 컴포넌트 임포트
import RiskCalendar from "./RiskCalendar";
import EvidenceInfoModal from './EvidenceInfoModal';

// 상수 임포트
import {
  RISK_LEVELS,
  RISK_TYPES,
  EvidenceCategory,
  getRiskInfo,
  getRiskTypeInfo,
  getRiskColor,
  getRiskIcon,
  getRiskKor,
  getRiskDescription,
  getRiskTypeColor,
  getRiskTypeIcon,
  getRiskTypeKor,
  safeSortByRiskLevel
} from "../../../constants/riskConstants";

// 데이터 검증 함수
const validateAnalysisData = (data) => {
  if (!data || typeof data !== 'object') {
    console.error('❌ 유효하지 않은 데이터 형식:', data);
    return false;
  }

  const requiredFields = ['id', 'report', 'messages', 'roomRiskLevel'];
  if (!requiredFields.every(field => field in data)) {
    console.error('❌ 필수 필드 누락:', { data, missingFields: requiredFields.filter(field => !(field in data)) });
    return false;
  }

  if (!data.report?.summary || typeof data.report.summary !== 'object') {
    console.error('❌ 유효하지 않은 report.summary:', data.report?.summary);
    return false;
  }

  const requiredSummaryFields = ['totalMessages', 'dangerMessages', 'duration', 'keyPhrasePercent'];
  if (!requiredSummaryFields.every(field => field in data.report.summary)) {
    console.error('❌ 필수 summary 필드 누락:', {
      summary: data.report.summary,
      missingFields: requiredSummaryFields.filter(field => !(field in data.report.summary))
    });
    return false;
  }

  return true;
};

const AnalysisResultPage = () => {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingType, setSavingType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEvidenceSaved, setIsEvidenceSaved] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    id: null,
    duration: 0,
    keyPhrasePercent: 0,
    messageCount: 0,
    messages: [],
    report: {
      summary: {
        totalMessages: 0,
        dangerMessages: 0,
        mainTypes: [],
        analyzedAt: null
      },
      aiRisk: {
        level: 'NORMAL',
        description: {
          summary: '',
          reasons: []
        }
      },
      guides: [],
      riskCalendar: [],
      keywords: []
    },
    roomRiskLevel: 'NORMAL'
  });
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("analysis");
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'asc'
  });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reportConfig, setReportConfig] = useState({
    title: `성범죄 대화 분석 ${!!user ? "증거보고서" : "결과"} - ${new Date().toLocaleDateString()}`,
    category: [EvidenceCategory.NORMAL],
    incidentDate: {
      start: null,
      end: null,
    },
    incidentTime: "",
    location: "",
    offenderInfo: "",
    emotions: [],
    otherEmotion: "",
    details: "",
    outputOptions: {
      includeMessages: true,
      includeToc: true,
      pageNumbering: true,
      orientation: "PORTRAIT",
      maskingOption: true,
    },
    signature: {
      signedBy: "",
      signedAt: new Date().toISOString(),
    },
  });
  const [pdfConfig, setPdfConfig] = useState({
    title: `${user?.name || ''} 분석 보고서 - ${new Date().toLocaleDateString()}`,
    category: EvidenceCategory.NORMAL.value,
    tags: [],
    incidentDate: {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    incidentTime: '',
    location: '',
    offenderInfo: '',
    witnesses: [],
    emotions: [],
    otherEmotion: '',
    details: '',
    outputOptions: {
      includeMessages: true,
      includeCover: false,
      includeToc: false,
      pageNumbering: true,
      orientation: 'PORTRAIT',
      maskingOption: true
    },
    signature: {
      signedBy: user?.name || '',
      signedAt: new Date().toISOString(),
      hashAlgorithm: 'SHA256',
      signatureAlgorithm: 'SHA256WithRSA'
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('content');
  const [searchWarning, setSearchWarning] = useState('');
  const [modalMode, setModalMode] = useState('save');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // analysisData가 변경될 때 messages 상태도 업데이트
  useEffect(() => {
    if (analysisData?.messages) {
      setMessages(analysisData.messages);
    }
  }, [analysisData]);

  // 분석 ID 유효성 검사
  useEffect(() => {
    const targetId = location.state?.initialData?.id || analysisId;
    
    if (!targetId) {
      console.error('❌ 분석 ID가 없습니다:', { 
        analysisId,
        initialDataId: location.state?.initialData?.id 
      });
      setError('분석 ID가 없습니다. 페이지를 새로고침하고 다시 시도해주세요.');
      return;
    }

    // URL에서 추출한 ID가 유효한지 확인
    if (isNaN(Number(targetId))) {
      console.error('❌ 유효하지 않은 분석 ID:', { targetId });
      setError('유효하지 않은 분석 ID입니다. 다시 시도해주세요.');
      return;
    }
  }, [analysisId, location.state?.initialData?.id]);

  // 분석 결과 데이터 로드
  const fetchAnalysisData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!analysisId) {
        throw new Error("분석 ID를 찾을 수 없습니다.");
      }

      // location.state에서 초기 데이터 확인
      const initialData = location.state?.initialData;
      if (initialData) {
        console.log("초기 데이터 사용:", initialData);
        // 백엔드 데이터 구조에 맞게 매핑
        const mappedData = {
          id: initialData.id,
          duration: initialData.duration || 0,
          keyPhrasePercent: initialData.keyPhrasePercent || 0,
          messageCount: initialData.messageCount || 0,
          messages: initialData.messages || [],
          report: {
            summary: {
              totalMessages: initialData.messageCount || 0,
              dangerMessages: initialData.report?.summary?.dangerMessages || 0,
              mainTypes: initialData.report?.summary?.mainTypes || [],
              analyzedAt: initialData.report?.analyzedAt || null
            },
            aiRisk: initialData.report?.aiRisk || {
              level: 'NORMAL',
              description: {
                summary: '',
                reasons: []
              }
            },
            guides: initialData.report?.guides || [],
            riskCalendar: initialData.report?.riskCalendar || [],
            keywords: initialData.report?.keywords || []
          },
          roomRiskLevel: initialData.roomRiskLevel || 'NORMAL'
        };
        setAnalysisData(mappedData);
        setIsLoading(false);
        return;
      }

      // 인증 상태 확인
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.log("인증 토큰이 없습니다. 초기 데이터를 사용합니다.");
        // 초기 데이터가 없는 경우에만 로그인 페이지로 이동
        if (!initialData) {
          navigate('/login', {
            state: {
              from: `/analysis-result/${analysisId}`,
              message: '분석 결과를 보려면 로그인이 필요합니다.'
            }
          });
        }
        return;
      }

      const response = await analysisApi.getAnalysisResult(analysisId);
      if (response.data.success) {
        // 백엔드 데이터 구조에 맞게 매핑
        const mappedData = {
          id: response.data.data.id,
          duration: response.data.data.duration || 0,
          keyPhrasePercent: response.data.data.keyPhrasePercent || 0,
          messageCount: response.data.data.messageCount || 0,
          messages: response.data.data.messages || [],
          report: {
            summary: {
              totalMessages: response.data.data.messageCount || 0,
              dangerMessages: response.data.data.report?.summary?.dangerMessages || 0,
              mainTypes: response.data.data.report?.summary?.mainTypes || [],
              analyzedAt: response.data.data.report?.analyzedAt || null
            },
            aiRisk: response.data.data.report?.aiRisk || {
              level: 'NORMAL',
              description: {
                summary: '',
                reasons: []
              }
            },
            guides: response.data.data.report?.guides || [],
            riskCalendar: response.data.data.report?.riskCalendar || [],
            keywords: response.data.data.report?.keywords || []
          },
          roomRiskLevel: response.data.data.roomRiskLevel || 'NORMAL'
        };
        setAnalysisData(mappedData);
      } else {
        throw new Error(response.data.message || "분석 결과를 가져오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("Error fetching analysis data:", err);
      if (err.response?.status === 401) {
        // 인증 오류 시 로그인 페이지로 리다이렉트
        navigate('/login', {
          state: {
            from: `/analysis-result/${analysisId}`,
            message: '세션이 만료되었습니다. 다시 로그인해주세요.'
          }
        });
      } else {
        setError(err.message || "분석 결과를 불러오는데 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [analysisId]);

  useEffect(() => {
    console.log('API 응답 전체 데이터 구조:', analysisData);
  }, [analysisData]);

  // 가장 최근 대화 날짜로 캘린더 자동 포커스
  useEffect(() => {
    if (messages && messages.length > 0) {
      // 날짜만 추출해서 Date 객체로 변환
      const dates = messages
        .map(msg => msg.date)
        .filter(Boolean)
        .map(dateStr => new Date(dateStr.replace(/\./g, '-')))
        .filter(dateObj => !isNaN(dateObj));
      if (dates.length > 0) {
        // 가장 최근 날짜 찾기
        const latestDate = new Date(Math.max(...dates));
        setSelectedDate(latestDate); // Date 객체로 저장
      }
    }
  }, [messages]);

  // 검색된 메시지 목록
  const searchedMessages = useMemo(() => {
    if (!searchQuery.trim() && !selectedDate) return messages;

    return messages.filter(message => {
      switch (searchType) {
        case 'content':
          return message.content?.toLowerCase().includes(searchQuery.toLowerCase());
        case 'sender':
          return message.sender?.toLowerCase().includes(searchQuery.toLowerCase());
        case 'date':
          if (selectedDate) {
            const messageDate = new Date(message.date);
            return messageDate.toDateString() === selectedDate.toDateString();
          }
          return message.date?.includes(searchQuery) || message.time?.includes(searchQuery);
        default:
          return true;
      }
    });
  }, [messages, searchQuery, searchType, selectedDate]);

  // 정렬된 메시지 목록
  const sortedMessages = useMemo(() => {
    let result = [...searchedMessages];

    // 정렬
    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortConfig.key === 'sender') {
        return sortConfig.direction === 'asc' 
          ? a.sender.localeCompare(b.sender)
          : b.sender.localeCompare(a.sender);
      }
      if (sortConfig.key === 'riskLevel') {
        const getHighestRisk = (message) => {
          const levels = { '심각': 4, '경고': 3, '주의': 2, '일반': 1 };
          return Math.max(...message.risks.map(r => levels[r.level] || 0));
        };
        return sortConfig.direction === 'asc'
          ? getHighestRisk(a) - getHighestRisk(b)
          : getHighestRisk(b) - getHighestRisk(a);
      }
      return 0;
    });

    return result;
  }, [searchedMessages, sortConfig]);

  // 위험도 통계 데이터
  const riskStatsData = useMemo(() => {
    if (!messages.length) return null;

    const stats = {
      byLevel: {
        심각: 0,
        경고: 0,
        주의: 0,
        일반: 0,
      },
      byType: {},
      byDate: new Map(),
      bySender: new Map(),
    };

    messages.forEach((message) => {
      if (!message) return;

      // 위험도별 카운트
      message.risks?.forEach(risk => {
        if (risk.level) {
          stats.byLevel[risk.level]++;
        }
        if (risk.type) {
          stats.byType[risk.type] = (stats.byType[risk.type] || 0) + 1;
        }
      });

      // 날짜별 카운트
      if (message.date) {
        stats.byDate.set(message.date, (stats.byDate.get(message.date) || 0) + 1);
      }

      // 발신자별 카운트
      if (message.sender) {
        stats.bySender.set(message.sender, (stats.bySender.get(message.sender) || 0) + 1);
      }
    });

    return stats;
  }, [messages]);

  // 정렬 헤더 클릭 핸들러
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // 정렬 버튼 렌더링 함수 추가
  const renderSortButton = (key, label, tooltip) => (
    <button 
      className={`${styles.sortButton} ${sortConfig.key === key ? styles.active : ''}`}
      onClick={() => handleSort(key)}
      title={tooltip}
    >
      {label} {renderSortIcon(key)}
    </button>
  );

  // PDF 생성 핸들러
  const handleGeneratePdf = async () => {
    try {
      setIsSaving(true);
      setSavingType('pdf');
      
      const response = await evidenceApi.generatePdf(analysisId, pdfConfig);
      
      if (response.success) {
        window.open(response.data.pdfUrl, '_blank');
      } else {
        throw new Error(response.message || 'PDF 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('PDF 생성 중 오류:', error);
      setError(error.message || 'PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
      setSavingType(null);
    }
  };

  // 증거 저장 핸들러
  const handleSaveEvidence = async (evidenceConfig) => {
    try {
      setIsSaving(true);
      setSavingType('evidence');
      
      const response = await evidenceApi.createEvidence(analysisId, evidenceConfig);
      
      if (response.success) {
        setIsEvidenceSaved(true);
        setShowEvidenceModal(false);
      } else {
        throw new Error(response.message || '증거 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('증거 저장 중 오류:', error);
      setError(error.message || '증거 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
      setSavingType(null);
    }
  };

  // 위험도 색상 반환 함수
  const getRiskColor = (level) => {
    switch ((level || '').toUpperCase()) {
      case 'HIGH': 
      case '심각': 
        return { 
          bg: RISK_LEVELS.HIGH.color, 
          text: '#ffffff',
          progress: RISK_LEVELS.HIGH.color,
          border: RISK_LEVELS.HIGH.color
        };
      case 'MEDIUM': 
      case '경고': 
        return { 
          bg: RISK_LEVELS.MEDIUM.color, 
          text: '#000000',
          progress: RISK_LEVELS.MEDIUM.color,
          border: RISK_LEVELS.MEDIUM.color
        };
      case 'LOW': 
      case '주의': 
        return { 
          bg: RISK_LEVELS.LOW.color, 
          text: '#ffffff',
          progress: RISK_LEVELS.LOW.color,
          border: RISK_LEVELS.LOW.color
        };
      case 'NORMAL': 
      case '일반': 
        return { 
          bg: RISK_LEVELS.NORMAL.color, 
          text: '#ffffff',
          progress: RISK_LEVELS.NORMAL.color,
          border: RISK_LEVELS.NORMAL.color
        };
      default: 
        return { 
          bg: '#e0e0e0', 
          text: '#333',
          progress: '#e0e0e0',
          border: '#e0e0e0'
        };
    }
  };

  // 위험도 아이콘 반환 함수
  const getRiskIcon = (level) => {
    switch ((level || '').toUpperCase()) {
      case 'HIGH':
      case '심각':
        return '⚠️';
      case 'MEDIUM':
      case '경고':
        return '⚡';
      case 'LOW':
      case '주의':
        return 'ℹ️';
      default:
        return '✓';
    }
  };

  // 위험도 한글 변환 함수
  const getRiskKor = (level) => {
    switch ((level || '').toUpperCase()) {
      case 'HIGH': return '위험';
      case 'MEDIUM': return '경고';
      case 'LOW': return '주의';
      case 'NORMAL': return '일반';
      default: return level;
    }
  };

  // 통계 섹션 렌더링 함수
  const renderStatsSection = () => {
    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
    };

    return (
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {/* 위험 메시지 카드 */}
          <div className={`${styles.statsCard} ${styles.danger}`}>
            <div className={styles.statsHeader}>
              <div className={styles.statsIcon}>
                <FaExclamationTriangle />
              </div>
              <h3 className={styles.statsTitle}>위험 메시지</h3>
            </div>
            <div className={styles.statsValue}>
              {analysisData?.report?.summary?.dangerMessages || 0}
              <span className={styles.statsSubValue}>/ {analysisData?.report?.summary?.totalMessages || 0}개</span>
            </div>
            <div className={styles.statsProgress}>
              <div 
                className={styles.statsProgressBar} 
                style={{ 
                  width: `${((analysisData?.report?.summary?.dangerMessages || 0) / (analysisData?.report?.summary?.totalMessages || 1)) * 100}%` 
                }} 
              />
            </div>
            <p className={styles.statsDescription}>
              전체 메시지 대비 위험 메시지 비율
            </p>
          </div>

          {/* 대화 지속 시간 카드 */}
          <div className={`${styles.statsCard} ${styles.warning}`}>
            <div className={styles.statsHeader}>
              <div className={styles.statsIcon}>
                <FaClock />
              </div>
              <h3 className={styles.statsTitle}>대화 지속 시간</h3>
            </div>
            <div className={styles.statsValue}>
              {formatDuration(analysisData?.duration || 0)}
            </div>
            <p className={styles.statsDescription}>
              분석된 대화의 총 지속 시간
            </p>
          </div>

          {/* 위험 키워드 비율 카드 */}
          <div className={`${styles.statsCard} ${styles.info}`}>
            <div className={styles.statsHeader}>
              <div className={styles.statsIcon}>
                <FaSearch />
              </div>
              <h3 className={styles.statsTitle}>위험 키워드 비율</h3>
            </div>
            <div className={styles.statsValue}>
              {analysisData?.keyPhrasePercent || 0}%
            </div>
            <div className={styles.statsProgress}>
              <div 
                className={styles.statsProgressBar} 
                style={{ width: `${analysisData?.keyPhrasePercent || 0}%` }} 
              />
            </div>
            <p className={styles.statsDescription}>
              메시지 및 키워드 분석 기준
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 검색 섹션 렌더링 함수
  const renderSearchSection = () => (
    <div className={styles.searchSection}>
      <div className={styles.searchTypeSelector}>
        <button
          className={`${styles.searchTypeButton} ${searchType === 'content' ? styles.active : ''}`}
          onClick={() => handleSearchTypeChange('content')}
        >
          내용
        </button>
        <button
          className={`${styles.searchTypeButton} ${searchType === 'sender' ? styles.active : ''}`}
          onClick={() => handleSearchTypeChange('sender')}
        >
          화자
        </button>
        <button
          className={`${styles.searchTypeButton} ${searchType === 'date' ? styles.active : ''}`}
          onClick={() => handleSearchTypeChange('date')}
        >
          날짜
        </button>
      </div>
      
      {searchWarning && (
        <div className={styles.searchWarning}>
          <FaExclamationTriangle />
          <span>{searchWarning}</span>
          <div className={styles.warningActions}>
            <button onClick={() => {
              if (searchType === 'date') {
                setSearchQuery('');
              } else {
                setSelectedDate(null);
              }
              setSearchWarning('');
            }}>
              확인
            </button>
            <button onClick={() => setSearchWarning('')}>
              취소
            </button>
          </div>
        </div>
      )}
      
      <div className={styles.searchInputWrapper}>
        {searchType === 'date' ? (
          <div className={styles.datePickerWrapper}>
            <FaCalendarAlt className={styles.calendarIcon} />
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateSelect(e.target.value ? new Date(e.target.value) : null)}
              className={styles.datePickerInput}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        ) : (
          <>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={`${searchType === 'content' ? '메시지 내용' : '화자 이름'} 검색...`}
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              className={styles.searchInput}
            />
          </>
        )}
      </div>
    </div>
  );

  // 가이드라인 렌더링 함수
  const renderGuidelines = () => {
    console.log('가이드라인 렌더링 시작:', {
      hasAnalysisData: !!analysisData,
      hasReport: !!analysisData?.report,
      hasGuides: !!analysisData?.report?.guides,
      guidesLength: analysisData?.report?.guides?.length
    });

    const guides = analysisData?.report?.guides || [];
    
    if (guides.length === 0) {
      return (
        <div className={styles.guidelineSection}>
          <h3>기본 가이드라인</h3>
          <div className={styles.guidelineList}>
            <div className={styles.guidelineItem}>
              <div className={styles.guidelineHeader}>
                <span className={styles.guidelineType}>증거 수집</span>
                <span className={styles.guidelineLevel}>중요</span>
              </div>
              <ul className={styles.guidelineAdvice}>
                <li>대화 내용을 스크린샷으로 저장</li>
                <li>음성 메시지나 사진이 있다면 백업</li>
                <li>날짜와 시간 기록 유지</li>
              </ul>
            </div>
            <div className={styles.guidelineItem}>
              <div className={styles.guidelineHeader}>
                <span className={styles.guidelineType}>전문가 상담</span>
                <span className={styles.guidelineLevel}>필수</span>
              </div>
              <ul className={styles.guidelineAdvice}>
                <li>가까운 성폭력상담소 연락</li>
                <li>법률 전문가와 상담</li>
                <li>필요시 경찰 신고 준비</li>
              </ul>
            </div>
            <div className={styles.guidelineItem}>
              <div className={styles.guidelineHeader}>
                <span className={styles.guidelineType}>신고 시 고려사항</span>
                <span className={styles.guidelineLevel}>중요</span>
              </div>
              <ul className={styles.guidelineAdvice}>
                <li>증거 자료 정리</li>
                <li>상황 발생 시간순 정리</li>
                <li>목격자나 참고인 확보</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.guidelineSection}>
        <h3>상황별 가이드라인</h3>
        <div className={styles.guidelineList}>
          {guides.map((guide, index) => (
            <div key={index} className={styles.guidelineItem}>
              <div className={styles.guidelineHeader}>
                <div className={styles.guidelineTypeWrapper}>
                  <span className={styles.guidelineType}>{guide.type}</span>
                  <span className={styles.guidelineIcon}>
                    {RISK_TYPES[guide.type]?.icon || '⚠️'}
                  </span>
                </div>
                <div className={styles.guidelineLevelWrapper}>
                  <span 
                    className={styles.guidelineLevel}
                    style={{
                      backgroundColor: getRiskColor(guide.level).bg,
                      color: getRiskColor(guide.level).text
                    }}
                  >
                    {guide.level}
                  </span>
                </div>
              </div>
              <ul className={styles.guidelineAdvice}>
                {guide.advice.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 검색 조건 변경 핸들러
  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    if (type === 'date') {
      setSearchQuery('');
    } else {
      setSelectedDate(null);
    }
    setSearchWarning('');
  };

  // 검색어 변경 핸들러
  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
    if (selectedDate) {
      setSearchWarning('날짜 검색이 활성화되어 있습니다. 날짜 검색을 해제하시겠습니까?');
    }
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (searchQuery) {
      setSearchWarning('검색어가 입력되어 있습니다. 검색어를 초기화하시겠습니까?');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>오류가 발생했습니다</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>❓</div>
        <h3>데이터를 찾을 수 없습니다</h3>
        <p>요청하신 분석 데이터가 존재하지 않습니다.</p>
        <button 
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 상단 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>분석 상세 정보</h1>
        <p className={styles.subtitle}>
          저장된 대화 분석 결과를 확인하고 관리하세요
        </p>
        
        {/* 요약 통계 카드 */}
        <div className={styles.headerStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📄</div>
            <div className={styles.statValue}>
              {analysisData?.report?.summary?.totalMessages || 0}
            </div>
            <div className={styles.statLabel}>전체 메시지</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⚠️</div>
            <div className={styles.statValue}>
              {analysisData?.report?.summary?.dangerMessages || 0}
            </div>
            <div className={styles.statLabel}>위험 메시지</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statValue}>
              {analysisData?.report?.analyzedAt 
                ? new Date(analysisData.report.analyzedAt).toLocaleDateString() 
                : new Date().toLocaleDateString()}
            </div>
            <div className={styles.statLabel}>분석 일시</div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tab} ${activeTab === "analysis" ? styles.active : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          <FaShieldAlt className={styles.tabIcon} />
          AI 분석
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "messages" ? styles.active : ""}`}
          onClick={() => setActiveTab("messages")}
        >
          <FaChartLine className={styles.tabIcon} />
          전체 대화
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className={styles.content}>
        {/* 왼쪽: 메인 분석 영역 */}
        <div className={styles.mainSection}>
          {activeTab === "analysis" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleWrapper}>
                  <FaShieldAlt className={styles.sectionIcon} />
                  <h3 className={styles.sectionTitle}>AI 위험도 평가</h3>
                </div>
                <div className={styles.sectionSubtitle}>
                  저장된 대화의 종합적 위험도 분석 결과입니다
                </div>
              </div>
              <div className={styles.sectionContent}>
                {/* AI 분석 결과 */}
                {analysisData?.report?.aiRisk && (
                  <div className={styles.aiAnalysisResult}>
                    {/* 위험도 레벨 카드 - 상단에 강조 */}
                    <div className={styles.riskLevelOverview}>
                      <div className={styles.riskLevelCard}
                        style={{
                          background: getRiskColor(analysisData.report.aiRisk.level).bg,
                          color: getRiskColor(analysisData.report.aiRisk.level).text,
                          borderRadius: '8px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '1rem',
                          marginBottom: '1.5rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontWeight: 600,
                          fontSize: '1.1rem'
                        }}>
                        <div style={{ fontSize: '1.5rem' }}>
                          {getRiskIcon(analysisData.report.aiRisk.level)}
                        </div>
                        <div>
                          <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                            {getRiskKor(analysisData.report.aiRisk.level)}
                          </div>
                          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                            {getRiskDescription(analysisData.report.aiRisk.level)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.analysisGrid}>
                      {/* 첫 번째 줄: 분석 요약과 판단 근거 */}
                      <div className={styles.firstRow}>
                        {/* 분석 요약 섹션 */}
                        <div className={styles.analysisCard}>
                          <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>📋</span>
                            <h4 className={styles.cardTitle}>분석 요약</h4>
                          </div>
                          <div className={styles.cardContent}>
                            <p className={styles.analysisText}>
                              {analysisData.report.aiRisk.description.summary.split('.').map((sentence, index, array) => (
                                <React.Fragment key={index}>
                                  {sentence.trim()}
                                  {index < array.length - 1 && '.'}
                                  {index < array.length - 1 && <br />}
                                </React.Fragment>
                              ))}
                            </p>
                          </div>
                        </div>

                        {/* 주요 판단 근거 섹션 */}
                        <div className={styles.analysisCard}>
                          <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>💡</span>
                            <h4 className={styles.cardTitle}>주요 판단 근거</h4>
                          </div>
                          <div className={styles.cardContent}>
                            <div className={styles.reasonsList}>
                              {analysisData.report?.aiRisk?.description?.reasons?.length > 0 ? (
                                analysisData.report.aiRisk.description.reasons.map((reason, index) => (
                                  <div key={index} className={styles.reasonItem}>
                                    <div className={styles.reasonNumber}>{index + 1}</div>
                                    <div className={styles.reasonText}>
                                      {reason}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className={styles.noData}>
                                  <FaExclamationTriangle className={styles.noDataIcon} />
                                  <div className={styles.noDataContent}>
                                    <h5>판단 근거 정보가 없습니다</h5>
                                    <p>AI가 충분한 판단 근거를 찾지 못했습니다. 대화 내용을 더 자세히 분석해보세요.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 두 번째 줄: 키워드와 위험 유형 */}
                      <div className={styles.secondRow}>
                        {/* 주요 키워드 섹션 */}
                        <div className={styles.analysisCard}>
                          <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>🔍</span>
                            <h4 className={styles.cardTitle}>주요 키워드</h4>
                          </div>
                          <div className={styles.cardContent}>
                            <div className={styles.keywordsGrid}>
                              {analysisData.report?.keywords && analysisData.report.keywords.length > 0 ? (
                                analysisData.report.keywords.map((keyword, index) => {
                                  const keywordName = keyword.text || keyword.name || keyword.keyword || '이름 없음';
                                  const keywordCount = keyword.count || keyword.횟수 || 1;
                                  return (
                                    <div key={index} className={styles.keywordCard}>
                                      <div className={styles.keywordHeader}>
                                        <span className={styles.keywordText}>{keywordName}</span>
                                        <span className={styles.keywordCount}>{keywordCount}회</span>
                                      </div>
                                      <div className={styles.keywordLevel}>
                                        <span className={styles.levelBadge}>
                                          {keyword.riskLevel || keyword.level || '일반'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className={styles.noData}>감지된 키워드가 없습니다.</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 주요 위험 유형 섹션 */}
                        <div className={styles.analysisCard}>
                          <div className={styles.cardHeader}>
                            <FaExclamationTriangle className={styles.cardIcon} />
                            <h4 className={styles.cardTitle}>주요 위험 유형</h4>
                          </div>
                          <div className={styles.cardContent}>
                            <div className={styles.riskTypesGrid}>
                              {Array.isArray(analysisData.report?.summary?.mainTypes) && analysisData.report.summary.mainTypes.length > 0 ? (
                                [...analysisData.report.summary.mainTypes]
                                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                                  .map((type, index) => (
                                    <div key={index} className={styles.riskTypeCard}>
                                      <div className={styles.riskTypeHeader}>
                                        <div className={styles.riskTypeIcon}>
                                          {RISK_TYPES[type.type]?.icon || '⚠️'}
                                        </div>
                                        <div className={styles.riskTypeInfo}>
                                          <span className={styles.riskTypeTitle}>{type.type}</span>
                                          <span className={styles.riskTypeCount}>
                                            {type.count}회 발생
                                          </span>
                                        </div>
                                      </div>
                                      <div className={styles.riskTypeProgress}>
                                        <div 
                                          className={styles.progressBar}
                                          style={{
                                            width: `${(type.count / Math.max(...analysisData.report.summary.mainTypes.map(t => t.count))) * 100}%`,
                                            backgroundColor: getRiskColor(type.level).progress
                                          }}
                                        />
                                      </div>
                                      <div className={styles.riskTypeLevel}>
                                        <span 
                                          className={styles.levelBadge}
                                          style={{
                                            backgroundColor: getRiskColor(type.level).bg,
                                            color: getRiskColor(type.level).text
                                          }}
                                        >
                                          {type.level}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                              ) : (
                                <div className={styles.noData}>주요 위험 유형이 감지되지 않았습니다.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 위험도 캘린더 섹션 */}
                    <div className={styles.calendarSection}>
                      {/* 위험 분석 통계 그래프 추가 */}
                      <div className={styles.analysisCard}>
                        <div className={styles.cardHeader}>
                          <FaChartBar className={styles.cardIcon} />
                          <h4 className={styles.cardTitle}>위험 분석 통계</h4>
                        </div>
                        <div className={styles.cardContent}>
                          {renderStatsSection()}
                        </div>
                      </div>

                      <div className={styles.cardHeader}>
                        <FaCalendarAlt className={styles.cardIcon} />
                        <h4 className={styles.cardTitle}>위험도 캘린더</h4>
                      </div>
                      <div className={styles.calendarContent}>
                        <RiskCalendar 
                          messages={messages}
                          selectedDate={selectedDate}
                          onDateSelect={setSelectedDate}
                          calendarData={analysisData.report?.riskCalendar || []}
                          report={analysisData.report}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 전체 대화 탭 */}
          {activeTab === "messages" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleWrapper}>
                  <FaChartLine className={styles.sectionIcon} />
                  <h3 className={styles.sectionTitle}>전체 대화</h3>
                </div>
                <div className={styles.sectionSubtitle}>
                  분석된 모든 대화 내용을 확인하세요
                </div>
              </div>
              <div className={styles.sectionContent}>
                {/* 메시지 목록 헤더 */}
                <div className={styles.messageListHeader}>
                  <div className={styles.messageListTitle}>
                    <h3>전체 대화</h3>
                    <button 
                      className={styles.statsButton}
                      onClick={() => setShowStatsModal(true)}
                    >
                      <FaChartBar /> 통계 보기
                    </button>
                  </div>
                  <div className={styles.headerControls}>
                    {renderSearchSection()}
                    
                    {/* 정렬 버튼 */}
                    <div className={styles.sortButtons}>
                      {renderSortButton('date', '날짜', '최신순/과거순으로 정렬')}
                      {renderSortButton('sender', '화자', '화자 이름 알파벳순으로 정렬')}
                      {renderSortButton('riskLevel', '위험도', '심각 &gt; 경고 &gt; 주의 &gt; 일반 순으로 정렬')}
                      <div className={styles.sortInfo}>
                        <FaInfoCircle />
                        <span>위험도 정렬 순서: 심각 &gt; 경고 &gt; 주의 &gt; 일반</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메시지 목록 */}
                <div className={styles.messageListContent}>
                  <div className={styles.messagesList}>
                    {sortedMessages && sortedMessages.length > 0 ? (
                      sortedMessages.map((message) => (
                        <div key={message.id} className={styles.messageItem}>
                          <div className={styles.messageHeader}>
                            <div className={styles.messageInfo}>
                              <span className={styles.sender}>{message.sender || '알 수 없음'}</span>
                              <span className={styles.time}>
                                {message.date} {message.time}
                              </span>
                            </div>
                            {message.risks && message.risks.length > 0 && (
                              <div className={styles.messageRisks}>
                                {message.risks.map((risk, index) => {
                                  const riskLevel = risk.level?.toLowerCase() || 'normal';
                                  return (
                                    <span 
                                      key={index} 
                                      className={`${styles.riskTag} ${styles[riskLevel]}`}
                                      style={{
                                        backgroundColor: getRiskColor(riskLevel).bg,
                                        color: getRiskColor(riskLevel).text,
                                        borderColor: getRiskColor(riskLevel).border
                                      }}
                                    >
                                      {risk.type || '알 수 없음'} ({getRiskKor(riskLevel)})
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className={styles.messageContent}>
                            {message.content || '내용 없음'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noMessages}>
                        <p>{searchQuery ? '검색 결과가 없습니다.' : '메시지가 없습니다.'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 사이드바 */}
        <div className={styles.right}>
          {/* 분석 요약 카드 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrapper}>
                <FaChartBar className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>분석 요약</h3>
              </div>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIcon}>📄</div>
                    <div className={styles.summaryContent}>
                      <span className={styles.summaryLabel}>전체 메시지 수</span>
                      <span className={styles.summaryValue}>
                        {analysisData?.report?.summary?.totalMessages || messages.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIcon}>⚠️</div>
                    <div className={styles.summaryContent}>
                      <span className={styles.summaryLabel}>위험 메시지 수</span>
                      <span className={styles.summaryValue}>
                        {analysisData?.report?.summary?.dangerMessages || 
                         messages.filter(msg => msg.risks?.some(risk => risk.level === '심각' || risk.level === '경고')).length || 0}
                      </span>
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIcon}>🔍</div>
                    <div className={styles.summaryContent}>
                      <span className={styles.summaryLabel}>주요 위험 유형</span>
                      <div className={styles.summaryValue}>
                        {analysisData?.report?.summary?.mainTypes?.length > 0 ? (
                          <div className={styles.riskTypes}>
                            {analysisData.report.summary.mainTypes.map((type, index) => (
                              <span key={index} className={styles.riskType}>
                                {type.type} ({type.count}회)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={styles.noData}>감지된 위험 유형 없음</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIcon}>📅</div>
                    <div className={styles.summaryContent}>
                      <span className={styles.summaryLabel}>분석 일시</span>
                      <span className={`${styles.summaryValue} ${styles.dateTime}`}>
                        {analysisData?.report?.analyzedAt 
                          ? new Date(analysisData.report.analyzedAt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                              hour12: true
                            }).replace(',', '\n')
                          : new Date().toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                              hour12: true
                            }).replace(',', '\n')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 가이드라인 카드 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrapper}>
                <FaUserMd className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>전문가 가이드라인</h3>
              </div>
              <div className={styles.sectionSubtitle}>
                상황에 맞는 전문가의 조언을 확인하세요
              </div>
            </div>
            <div className={styles.sectionContent}>
              {renderGuidelines()}
            </div>
          </div>

          {/* 저장 버튼 섹션 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrapper}>
                <FaArchive className={styles.sectionIcon} />
                <h3 className={styles.sectionTitle}>저장 및 내보내기</h3>
              </div>
              <div className={styles.sectionSubtitle}>
                분석 결과를 저장하거나 PDF로 내보내세요
              </div>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.actionButtons}>
                {user && (
                  <button
                    className={`${styles.evidenceButton} ${isSaving ? styles.disabled : ''}`}
                    onClick={() => setShowEvidenceModal(true)}
                    disabled={isSaving}
                  >
                    {savingType === 'evidence' ? (
                      <>
                        <FaSpinner className={styles.spinner} />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <FaArchive />
                        증거함에 저장
                      </>
                    )}
                  </button>
                )}
                <button
                  className={`${styles.pdfButton} ${isSaving || !isEvidenceSaved ? styles.disabled : ''}`}
                  onClick={handleGeneratePdf}
                  disabled={isSaving || !isEvidenceSaved}
                  title={!isEvidenceSaved ? "증거함에 먼저 저장해주세요" : "PDF 다운로드"}
                >
                  {savingType === 'pdf' ? (
                    <>
                      <FaSpinner className={styles.spinner} />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <FaFilePdf />
                      PDF 저장
                    </>
                  )}
                </button>
                <button 
                  className={`${styles.backButton} ${isSaving ? styles.disabled : ''}`}
                  onClick={() => navigate(-1)}
                  disabled={isSaving}
                >
                  목록으로 돌아가기
                </button>
              </div>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 통계 모달 */}
      {showStatsModal && (
        <div className={styles.statsModal}>
          <div className={styles.statsModalContent}>
            <div className={styles.statsModalHeader}>
              <h3>위험도 통계</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowStatsModal(false)}
              >
                ×
              </button>
            </div>
            {renderStatsSection()}
          </div>
        </div>
      )}

      {/* 증거함 저장 모달 */}
      {showEvidenceModal && (
        <EvidenceInfoModal
          isOpen={showEvidenceModal}
          onClose={() => setShowEvidenceModal(false)}
          onSaveSuccess={() => {
            setIsEvidenceSaved(true);
            setShowEvidenceModal(false);
            alert("증거함에 저장되었습니다.");
          }}
          chatAnalysisId={analysisId}
          user={user}
        />
      )}
    </div>
  );
};

export default AnalysisResultPage;
