import React from "react";
import PropTypes from "prop-types";
import styles from "./MessageItem.module.css";
import {
  FaExclamationTriangle,
  FaUserSecret,
  FaHandHoldingHeart,
  FaShieldAlt,
  FaUserShield,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";
import {
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

const MessageItem = ({ message, isLast, isSelected, onSelect }) => {
  const { sender, date, time, content, risks } = message;

  const handleClick = (e) => {
    // 체크박스 클릭 시 이벤트 전파 방지
    if (e.target.classList.contains(styles.checkbox)) {
      e.stopPropagation();
    }
    onSelect(message.id);
  };

  // 가장 높은 위험도 찾기
  const getHighestRisk = (risks) => {
    if (!Array.isArray(risks) || risks.length === 0) {
      return { level: 'NORMAL' };
    }
    return safeSortByRiskLevel(risks, risk => risk.level)[0];
  };

  const highestRisk = getHighestRisk(risks);
  const riskInfo = getRiskInfo(highestRisk.level);
  const riskColor = getRiskColor(highestRisk.level);

  return (
    <div
      className={`${styles.messageItem} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
    >
      <div className={styles.messageHeader}>
        <div className={styles.senderInfo}>
          <span className={styles.sender}>{sender}</span>
          <span className={styles.timestamp}>{`${date} ${time}`}</span>
        </div>
        <div className={styles.riskIndicator} style={{ backgroundColor: riskColor.bg }}>
          <span className={styles.riskIcon}>{getRiskIcon(highestRisk.level)}</span>
          <span className={styles.riskLevel}>{getRiskKor(highestRisk.level)}</span>
        </div>
      </div>
      <div className={styles.messageContent}>{content}</div>
      {risks && risks.length > 0 && (
        <div className={styles.riskTags}>
          {risks.map((risk, index) => (
            <div
              key={index}
              className={styles.riskTag}
              style={{ backgroundColor: getRiskColor(risk.level).bg }}
            >
              <span className={styles.riskTypeIcon}>
                {getRiskTypeIcon(risk.type)}
              </span>
              <span className={styles.riskType}>
                {getRiskTypeKor(risk.type)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    risks: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        level: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
  isLast: PropTypes.bool,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

export default MessageItem;
