import React, { useState, useEffect, useCallback } from "react";
import styles from "./OrganizationConnectionPage.module.css";
import { getOrganizations } from "./organizationService";

const OrganizationConnectionPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    services: [],
    operatingHours: "",
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [expandedFilters, setExpandedFilters] = useState({
    services: true,
    operatingHours: true,
  });

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrganizations(filters);
      setOrganizations(data);
    } catch (error) {
      console.error("기관 목록 조회 실패:", error);
      setError(
        "기관 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // 검색어 변경 핸들러 (디바운스 적용)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 이전 타이머 취소
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 새로운 타이머 설정 (300ms 후 검색 실행)
    const timeout = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: value,
      }));
    }, 300);

    setSearchTimeout(timeout);
  };

  // 검색어 초기화 핸들러
  const handleSearchReset = () => {
    setSearchQuery("");
    setFilters((prev) => ({
      ...prev,
      search: "",
    }));
  };

  // 서비스 필터 변경 핸들러
  const handleServiceFilterChange = (service) => {
    setFilters((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  // 운영시간 필터 변경 핸들러
  const handleOperatingHoursChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      operatingHours: e.target.value,
    }));
  };

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setFilters({
      services: [],
      operatingHours: "",
      search: "",
    });
    setSearchQuery("");
  };

  // 필터 그룹 토글 핸들러
  const toggleFilterGroup = (groupName) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // 필터링된 기관 목록
  const filteredOrganizations = organizations.filter((org) => {
    // 검색어 필터링
    if (filters.search) {
      const searchFields = [
        org.name,
        org.description,
        org.location,
        ...org.services,
      ];
      const searchKeywords = filters.search.toLowerCase().split(/\s+/);
      const matchesSearch = searchKeywords.every((keyword) =>
        searchFields.some((field) =>
          field.toLowerCase().includes(keyword)
        )
      );
      if (!matchesSearch) return false;
    }

    // 서비스 필터링
    if (filters.services.length > 0) {
      const matchesServices = filters.services.every((service) =>
        org.services.includes(service)
      );
      if (!matchesServices) return false;
    }

    // 운영시간 필터링
    if (filters.operatingHours) {
      if (!org.operatingHours.includes(filters.operatingHours)) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>기관 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button className={styles.retryButton} onClick={fetchOrganizations}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>전문기관 연결</h1>

      {/* 검색 및 필터 섹션 */}
      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="기관명, 서비스, 지역 등으로 검색해보세요"
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              className={styles.searchResetButton}
              onClick={handleSearchReset}
              aria-label="검색어 초기화"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.filters}>
          {/* 서비스 필터 */}
          <div className={styles.filterGroup}>
            <div
              className={styles.filterHeader}
              onClick={() => toggleFilterGroup("services")}
            >
              <h3>서비스</h3>
              <span
                className={`${styles.expandIcon} ${
                  expandedFilters.services ? styles.expanded : ""
                }`}
              >
                ▼
              </span>
            </div>
            {expandedFilters.services && (
              <div className={styles.serviceFilters}>
                {[
                  "전화상담",
                  "법률상담",
                  "의료지원",
                  "심리상담",
                  "보호시설",
                ].map((service) => (
                  <label key={service} className={styles.serviceFilter}>
                    <input
                      type="checkbox"
                      checked={filters.services.includes(service)}
                      onChange={() => handleServiceFilterChange(service)}
                    />
                    {service}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 운영시간 필터 */}
          <div className={styles.filterGroup}>
            <div
              className={styles.filterHeader}
              onClick={() => toggleFilterGroup("operatingHours")}
            >
              <h3>운영시간</h3>
              <span
                className={`${styles.expandIcon} ${
                  expandedFilters.operatingHours ? styles.expanded : ""
                }`}
              >
                ▼
              </span>
            </div>
            {expandedFilters.operatingHours && (
              <select
                value={filters.operatingHours}
                onChange={handleOperatingHoursChange}
                className={styles.operatingHoursSelect}
              >
                <option value="">전체</option>
                <option value="24시간">24시간</option>
                <option value="평일 09:00-18:00">평일 09:00-18:00</option>
                <option value="평일 09:00-22:00">평일 09:00-22:00</option>
              </select>
            )}
          </div>

          {/* 필터 초기화 버튼 */}
          <button className={styles.resetButton} onClick={handleResetFilters}>
            필터 초기화
          </button>
        </div>
      </div>

      {/* 기관 목록 */}
      <div className={styles.organizationList}>
        {filteredOrganizations.length === 0 ? (
          <div className={styles.noResults}>
            <p>검색 결과가 없습니다.</p>
            <button className={styles.resetButton} onClick={handleResetFilters}>
              필터 초기화
            </button>
          </div>
        ) : (
          filteredOrganizations.map((org) => (
            <div key={org.id} className={styles.organizationCard}>
              <div className={styles.organizationInfo}>
                <h2>{org.name}</h2>
                <p className={styles.description}>{org.description}</p>
                <div className={styles.services}>
                  {org.services.map((service) => (
                    <span key={service} className={styles.serviceTag}>
                      {service}
                    </span>
                  ))}
                </div>
                <div className={styles.details}>
                  <p>
                    <strong>위치:</strong> {org.location}
                  </p>
                  <p>
                    <strong>운영시간:</strong> {org.operatingHours}
                  </p>
                  <p>
                    <strong>연락처:</strong> {org.phone || org.contact}
                  </p>
                </div>
                <div className={styles.contact}>
                  <a
                    href={`tel:${org.phone || org.contact}`}
                    className={styles.contactButton}
                  >
                    전화하기
                  </a>
                  {org.homepage && (
                    <a
                      href={org.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.homepageButton}
                    >
                      홈페이지
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrganizationConnectionPage;
