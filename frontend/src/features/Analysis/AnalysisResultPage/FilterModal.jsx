import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './AnalysisResultPage.module.css';

const FilterModal = ({ isOpen, onClose, onApply, initialFilters, analysisData }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [dateRange, setDateRange] = useState({
    start: initialFilters.dateRange.start,
    end: initialFilters.dateRange.end
  });

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
      setDateRange({
        start: initialFilters.dateRange.start,
        end: initialFilters.dateRange.end
      });
    }
  }, [isOpen, initialFilters]);

  const handleDateChange = (type, value) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value ? new Date(value) : null
    }));
  };

  const handleRiskLevelChange = (level) => {
    setFilters(prev => ({
      ...prev,
      riskLevels: prev.riskLevels.includes(level)
        ? prev.riskLevels.filter(l => l !== level)
        : [...prev.riskLevels, level]
    }));
  };

  const handleRiskTypeChange = (type) => {
    setFilters(prev => ({
      ...prev,
      riskTypes: prev.riskTypes.includes(type)
        ? prev.riskTypes.filter(t => t !== type)
        : [...prev.riskTypes, type]
    }));
  };

  const handleSenderChange = (sender) => {
    setFilters(prev => ({
      ...prev,
      senders: prev.senders.includes(sender)
        ? prev.senders.filter(s => s !== sender)
        : [...prev.senders, sender]
    }));
  };

  const handleKeywordAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const keyword = e.target.value.trim();
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
      e.target.value = '';
    }
  };

  const handleKeywordRemove = (keyword) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleApply = () => {
    onApply({
      ...filters,
      dateRange
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>필터 설정</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* 날짜 범위 필터 */}
          <div className={styles.filterSection}>
            <h3>날짜 범위</h3>
            <div className={styles.dateRangeInputs}>
              <input
                type="date"
                value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
              <span>~</span>
              <input
                type="date"
                value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>

          {/* 위험도 필터 */}
          <div className={styles.filterSection}>
            <h3>위험도</h3>
            <div className={styles.filterOptions}>
              {['심각', '경고', '주의', '일반'].map(level => (
                <label key={level} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={filters.riskLevels.includes(level)}
                    onChange={() => handleRiskLevelChange(level)}
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 위험 유형 필터 */}
          <div className={styles.filterSection}>
            <h3>위험 유형</h3>
            <div className={styles.filterOptions}>
              {['성희롱', '성추행', '성폭력', '기타'].map(type => (
                <label key={type} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={filters.riskTypes.includes(type)}
                    onChange={() => handleRiskTypeChange(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 발신자 필터 */}
          <div className={styles.filterSection}>
            <h3>발신자</h3>
            <div className={styles.filterOptions}>
              {Array.from(new Set(analysisData?.messages.map(m => m.sender))).map(sender => (
                <label key={sender} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={filters.senders.includes(sender)}
                    onChange={() => handleSenderChange(sender)}
                  />
                  <span>{sender}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 키워드 필터 */}
          <div className={styles.filterSection}>
            <h3>키워드</h3>
            <div className={styles.keywordInput}>
              <input
                type="text"
                placeholder="키워드 입력 후 Enter"
                onKeyPress={handleKeywordAdd}
              />
            </div>
            <div className={styles.keywordTags}>
              {filters.keywords.map(keyword => (
                <span key={keyword} className={styles.keywordTag}>
                  {keyword}
                  <button onClick={() => handleKeywordRemove(keyword)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
          <button className={styles.applyButton} onClick={handleApply}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal; 