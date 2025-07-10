import React from "react";
import styles from "./AnalysisDetailModal.module.css";
import { FaTimes } from "react-icons/fa";

const AnalysisDetailModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const { reportConfig } = data;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-labelledby="report-config-title">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 id="report-config-title">리포트 설정</h2>
          <button 
            aria-label="닫기 버튼" 
            className={styles.closeButton} 
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.section}>
            <div className={styles.reportConfigWrap}>
              {reportConfig.title && (
                <div className={styles.configItem}>
                  <b>제목:</b>
                  <p>{reportConfig.title}</p>
                </div>
              )}
              {reportConfig.category && reportConfig.category.length > 0 && (
                <div className={styles.configItem}>
                  <b>사건 유형:</b>
                  <p>{reportConfig.category.join(", ")}</p>
                </div>
              )}
              {reportConfig.tags && reportConfig.tags.length > 0 && (
                <div className={styles.configItem}>
                  <b>태그:</b>
                  <p>{reportConfig.tags.join(", ")}</p>
                </div>
              )}
              {reportConfig.incidentDate && (
                <div className={styles.configItem}>
                  <b>사건일:</b>
                  <p>
                    {new Date(reportConfig.incidentDate.start).toLocaleDateString("ko-KR")} ~{" "}
                    {reportConfig.incidentDate.end
                      ? new Date(reportConfig.incidentDate.end).toLocaleDateString("ko-KR")
                      : "-"}
                  </p>
                </div>
              )}
              {reportConfig.incidentTime && (
                <div className={styles.configItem}>
                  <b>대표 시간:</b>
                  <p>{reportConfig.incidentTime}</p>
                </div>
              )}
              {reportConfig.location && (
                <div className={styles.configItem}>
                  <b>위치/플랫폼:</b>
                  <p>{reportConfig.location}</p>
                </div>
              )}
              {reportConfig.offenderInfo && (
                <div className={styles.configItem}>
                  <b>가해자 정보:</b>
                  <p>{reportConfig.offenderInfo}</p>
                </div>
              )}
              {reportConfig.witnesses && reportConfig.witnesses.length > 0 && (
                <div className={styles.configItem}>
                  <b>목격자:</b>
                  <p>{reportConfig.witnesses.join(", ")}</p>
                </div>
              )}
              {reportConfig.emotions && reportConfig.emotions.length > 0 && (
                <div className={styles.configItem}>
                  <b>감정:</b>
                  <p>{reportConfig.emotions.join(", ")}</p>
                </div>
              )}
              {reportConfig.otherEmotion && (
                <div className={styles.configItem}>
                  <b>기타 감정:</b>
                  <p>{reportConfig.otherEmotion}</p>
                </div>
              )}
              {reportConfig.details && (
                <div className={styles.configItem}>
                  <b>상세 내용:</b>
                  <p>{reportConfig.details}</p>
                </div>
              )}
              {reportConfig.outputOptions && (
                <div className={styles.configItem}>
                  <b>출력 옵션:</b>
                  <ul className={styles.outputOptionsList}>
                    <li>메시지 포함: {reportConfig.outputOptions.includeMessages ? "예" : "아니오"}</li>
                    <li>목차 포함: {reportConfig.outputOptions.includeToc ? "예" : "아니오"}</li>
                    <li>페이지 번호: {reportConfig.outputOptions.pageNumbering ? "예" : "아니오"}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetailModal;
