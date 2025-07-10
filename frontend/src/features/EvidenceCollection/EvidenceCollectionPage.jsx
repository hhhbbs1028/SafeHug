import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./EvidenceCollectionPage.module.css";
import { useNavigate } from "react-router-dom";
import { evidenceApi } from "../../api/axios";
import { EvidenceCategory, CategoryDisplayName } from '../Analysis/AnalysisResultPage/EvidenceInfoModal';

const CATEGORY_LABEL = {
  SEXUAL: { text: "성적", color: styles.riskSEXUAL },
  STALKING: { text: "스토킹", color: styles.riskSTALKING },
  COERCION: { text: "강요", color: styles.riskCOERCION },
  THREAT: { text: "협박", color: styles.riskTHREAT },
  PERSONAL_INFO: { text: "개인정보", color: styles.riskPERSONAL_INFO },
  DISCRIMINATION: { text: "차별", color: styles.riskDISCRIMINATION },
  INSULT: { text: "모욕", color: styles.riskINSULT },
  NORMAL: { text: "일반", color: styles.riskNORMAL },
};

const EvidenceCollectionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evidenceList, setEvidenceList] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // 증거 목록 조회
  useEffect(() => {
    let isMounted = true;

    const fetchEvidenceList = async () => {
      if (!user) {
        setError("로그인이 필요합니다.");
        navigate("/login", {
          state: { from: "/evidence-collection" }
        });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await evidenceApi.getMyEvidence({
          search: search || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          sortOrder: sortOrder,
          date: dateFilter || undefined
        });

        if (!isMounted) return;

        console.log("API 응답:", response);

        // API 응답 구조 검증
        if (!response) {
          throw new Error("서버 응답이 없습니다.");
        }

        if (!response.success) {
          throw new Error(response.message || "서버 응답이 올바르지 않습니다.");
        }

        if (!Array.isArray(response.data)) {
          console.warn("예상치 못한 데이터 형식:", response.data);
          setEvidenceList([]);
          return;
        }

        console.log("처리할 증거 데이터:", response.data);
        setEvidenceList(response.data);
      } catch (err) {
        if (!isMounted) return;
        
        console.error("증거 목록 조회 중 에러 발생:", err);
        
        if (err.response?.status === 401) {
          setError("로그인이 필요합니다. 다시 로그인해주세요.");
          navigate("/login", {
            state: { from: "/evidence-collection" }
          });
        } else if (err.response?.status === 403) {
          setError("접근 권한이 없습니다.");
        } else if (err.response?.status === 404) {
          setError("요청한 데이터를 찾을 수 없습니다.");
        } else if (err.response?.status === 500) {
          setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } else {
          setError(err.message || "증거 목록을 불러오는데 실패했습니다.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvidenceList();

    return () => {
      isMounted = false;
    };
  }, [user?.id, search, categoryFilter, sortOrder, dateFilter, navigate]);

  // 카테고리 목록 추출
  const allCategories = useMemo(() => {
    return Object.keys(CATEGORY_LABEL);
  }, []);

  // 검색, 날짜, 카테고리 필터 적용된 리스트
  const filteredList = useMemo(() => {
    if (!evidenceList.length) return [];

    return evidenceList.filter((item) => {
      const matchesSearch = !search || 
        item.title?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || 
        item.report?.summary?.mainTypes?.some(type => type.type === categoryFilter);
      
      const matchesDate = !dateFilter || 
        new Date(item.report?.analyzedAt).toISOString().split("T")[0] === dateFilter;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [evidenceList, search, categoryFilter, dateFilter]);

  // 삭제
  const handleDelete = useCallback(async (id) => {
    if (window.confirm("정말로 이 증거를 삭제하시겠습니까? 삭제된 증거는 복구할 수 없습니다.")) {
      try {
        setDeletingId(id);
        const response = await evidenceApi.deleteEvidence(id);
        
        if (response.success) {
          setEvidenceList(prev => prev.filter(item => item.id !== id));
          alert("증거가 성공적으로 삭제되었습니다.");
        } else {
          throw new Error(response.message || "증거 삭제에 실패했습니다.");
        }
      } catch (err) {
        console.error("증거 삭제 중 에러 발생:", err);
        alert(err.response?.data?.message || "증거 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setDeletingId(null);
      }
    }
  }, []);

  // 분석 결과 보기(상세)
  const handleView = (id) => {
    navigate(`/analysis-detail/${id}`, {
      state: {
        recordId: id
      }
    });
  };

  // 새 증거 추가
  const handleAdd = () => {
    navigate("/analysis-upload");
  };

  // 검색 핸들러 최적화
  const handleSearch = useCallback((value) => {
    setSearch(value);
  }, []);

  // 카테고리 필터 핸들러 최적화
  const handleCategoryFilter = useCallback((value) => {
    setCategoryFilter(value);
  }, []);

  // 정렬 핸들러 최적화
  const handleSortOrder = useCallback((value) => {
    setSortOrder(value);
  }, []);

  // 날짜 필터 핸들러 최적화
  const handleDateFilter = useCallback((value) => {
    setDateFilter(value);
  }, []);

  // 바로가기 버튼
  const quickLinks = [
    { label: "홈으로", to: "/" },
    { label: "AI 챗봇 도움받기", to: "/chatbot" },
    { label: "전문기관 연결", to: "/organization-connection" },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>증거 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>증거 자료 관리</h1>
        <p>AI 분석 후 저장된 대화 증거를 한눈에 확인하고, PDF로 출력하거나 삭제할 수 있습니다.</p>
      </div>
      <div className={styles.quickLinks}>
        {quickLinks.map((link) => (
          <button
            key={link.to}
            className={styles.quickLinkBtn}
            onClick={() => navigate(link.to)}
          >
            {link.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        <div className={styles.topBar}>
          <h2 className={styles.sectionTitle}>저장된 증거</h2>
          <button className={styles.addButton} onClick={handleAdd}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            새 증거 추가
          </button>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="증거 이름으로 검색"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterControls}>
            <div className={styles.dateFilter}>
              <input
                type="date"
                className={styles.dateInput}
                value={dateFilter}
                onChange={(e) => handleDateFilter(e.target.value)}
              />
            </div>
            <select
              className={styles.typeSelect}
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
            >
              <option value="all">전체 유형</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABEL[category].text}
                </option>
              ))}
            </select>
            <div className={styles.sortBtns}>
              <button
                className={`${styles.sortBtn} ${
                  sortOrder === "desc" ? styles.activeSort : ""
                }`}
                onClick={() => handleSortOrder("desc")}
              >
                최신순
              </button>
              <button
                className={`${styles.sortBtn} ${
                  sortOrder === "asc" ? styles.activeSort : ""
                }`}
                onClick={() => handleSortOrder("asc")}
              >
                오래된순
              </button>
            </div>
          </div>
        </div>

        <div className={styles.evidenceList}>
          {filteredList.map((item) => (
            <div key={item.id} className={styles.evidenceItem}>
              <div className={styles.evidenceHeader}>
                <h3>{item.title}</h3>
                <div className={styles.evidenceActions}>
                  <button
                    onClick={() => handleView(item.id)}
                    className={styles.viewButton}
                  >
                    상세보기
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteButton}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
              <div className={styles.evidenceContent}>
                <div className={styles.evidenceInfo}>
                  <p>분석일: {new Date(item.report.analyzedAt).toLocaleDateString()}</p>
                  {item.report.summary && (
                    <>
                  <p>전체 메시지: {item.report.summary.totalMessages}개</p>
                  <p>위험 메시지: {item.report.summary.dangerMessages}개</p>
                    </>
                  )}
                </div>
                {item.report.summary?.mainTypes?.length > 0 && (
                  <div className={styles.evidenceTypes}>
                    <h4>주요 위험 유형</h4>
                    <ul>
                      {item.report.summary.mainTypes.map((type, index) => (
                        <li key={index}>
                          {CategoryDisplayName[type.type] || type.type} ({type.count}회)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvidenceCollectionPage;
