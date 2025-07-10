import React from "react";
import PropTypes from "prop-types";
import styles from "./RiskAnalysisSection.module.css";
import RiskGauge from "./RiskGauge";
import { analysisData } from "./mockData";

const RiskAnalysisSection = ({ report }) => {
  // 위험도 수준에 따른 게이지 값 계산
  const getRiskGaugeValue = (level) => {
    switch (level) {
      case "심각":
        return "심각";
      case "경고":
        return "경고";
      case "주의":
        return "주의";
      default:
        return "일반";
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>위험도 분석</h2>

      <div className={styles.content}>
        <div className={styles.mainAnalysis}>
          <div className={styles.gaugeContainer}>
            <RiskGauge value={getRiskGaugeValue(report?.aiRisk?.level || 'NORMAL')} />
            <div className={styles.gaugeLabel}>
              <span className={styles.currentLevel}>{report?.aiRisk?.level || 'NORMAL'}</span>
              <span className={styles.levelDescription}>
                {report?.aiRisk?.description?.summary || '분석 내용이 없습니다.'}
              </span>
            </div>
          </div>

          <div className={styles.analysisDetails}>
            <div className={styles.detailItem}>
              <h3 className={styles.detailTitle}>주요 위험 요소</h3>
              {report?.aiRisk?.description?.reasons?.length > 0 ? (
                <ul className={styles.riskList}>
                  {report.aiRisk.description.reasons.map((reason, index) => (
                    <li key={index} className={styles.riskItem}>
                      <span className={styles.riskType}>위험 요소</span>
                      <p className={styles.riskDescription}>{reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noData}>위험 요소가 없습니다.</p>
              )}
            </div>

            <div className={styles.detailItem}>
              <h3 className={styles.detailTitle}>패턴 분석</h3>
              {report?.summary?.mainTypes?.length > 0 ? (
                <div className={styles.patternGrid}>
                  {report.summary.mainTypes.map((type, index) => (
                    <div key={index} className={styles.patternCard}>
                      <div className={styles.patternHeader}>
                        <span className={styles.patternType}>{type.type || '알 수 없음'}</span>
                        <span className={`${styles.patternLevel} ${styles[type.level || 'NORMAL']}`}>
                          {type.level || 'NORMAL'}
                        </span>
                      </div>
                      <p className={styles.patternDescription}>
                        {type.count || 0}회 발생
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noData}>패턴 분석 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.recommendations}>
          <h3 className={styles.recommendationTitle}>권장 조치사항</h3>
          {report?.guides?.length > 0 ? (
            <ul className={styles.recommendationList}>
              {report.guides.map((guide, index) => (
                <li key={index} className={styles.recommendationItem}>
                  <div className={styles.recommendationHeader}>
                    <span className={styles.recommendationType}>
                      {guide.type || '알 수 없음'}
                    </span>
                    <span className={`${styles.recommendationPriority} ${styles[guide.level?.toLowerCase() || 'normal']}`}>
                      {guide.level || 'NORMAL'}
                    </span>
                  </div>
                  <p className={styles.recommendationContent}>
                    {guide.advice || '권장 조치사항이 없습니다.'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>권장 조치사항이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

RiskAnalysisSection.propTypes = {
  report: PropTypes.shape({
    summary: PropTypes.shape({
      totalMessages: PropTypes.number.isRequired,
      dangerMessages: PropTypes.number.isRequired,
      mainTypes: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired,
          level: PropTypes.string.isRequired,
          count: PropTypes.number.isRequired,
        })
      ).isRequired,
      averageRiskLevel: PropTypes.string.isRequired,
    }).isRequired,
    aiRisk: PropTypes.shape({
      level: PropTypes.string.isRequired,
      description: PropTypes.shape({
        summary: PropTypes.string.isRequired,
        reasons: PropTypes.arrayOf(PropTypes.string).isRequired,
      }).isRequired,
    }).isRequired,
    guides: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        level: PropTypes.string.isRequired,
        advice: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default RiskAnalysisSection;
