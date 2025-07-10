import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import styles from "./RiskCalendar.module.css";
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';

const RISK_COLORS = {
  심각: {
    background: "#ff1744",
    text: "#ffffff",
    border: "#ff1744",
  },
  경고: {
    background: "#ffd600",
    text: "#000000",
    border: "#ffd600",
  },
  주의: {
    background: "#ff9800",
    text: "#ffffff",
    border: "#ff9800",
  },
  일반: {
    background: "#4caf50",
    text: "#ffffff",
    border: "#4caf50",
  },
};

const RiskCalendar = ({ onDateSelect, selectedDate, report, messages, calendarData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDateMessages, setSelectedDateMessages] = useState([]);

  useEffect(() => {
    if (selectedDate instanceof Date && !isNaN(selectedDate)) {
      setCurrentDate(selectedDate);
    } else if (report?.analyzedAt) {
      setCurrentDate(new Date(report.analyzedAt));
    }
  }, [selectedDate, report]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];

    // 이전 달의 날짜들
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dateStr = currentDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\. /g, '-').replace('.', '');
      
      const dayData = calendarData?.find(day => day.date === dateStr);
      days.push({
        date: currentDate,
        level: dayData?.level || null
      });
    }

    return days;
  };

  const getDayMessages = (date) => {
    if (!messages) return [];
    return messages.filter((message) => {
      const [year, month, day] = message.date.split('-').map(Number);
      const messageDate = new Date(year, month - 1, day);
      
      return (
        messageDate.getDate() === date.getDate() &&
        messageDate.getMonth() === date.getMonth() &&
        messageDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDateClick = (date) => {
    if (isDateSelectable(date)) {
      onDateSelect(new Date(date));
      const dateMessages = messages.filter(msg => msg.date === date);
      setSelectedDateMessages(dateMessages);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const days = getDaysInMonth(currentDate);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  // 대화가 있는 날짜 목록 생성
  const messageDates = React.useMemo(() => {
    const dates = new Set();
    messages.forEach(message => {
      if (message.date) {
        dates.add(message.date);
      }
    });
    return Array.from(dates);
  }, [messages]);

  // 날짜 선택 가능 여부 확인
  const isDateSelectable = (date) => {
    return messageDates.includes(date);
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <FaCalendarAlt className={styles.calendarIcon} />
        <h3>대화 일정</h3>
      </div>
      <div className={styles.calendarGrid}>
        {messageDates.map((date) => (
          <div
            key={date}
            className={`${styles.calendarDate} ${
              selectedDate && selectedDate.toDateString() === new Date(date).toDateString()
                ? styles.selected
                : ''
            } ${isDateSelectable(date) ? styles.selectable : styles.disabled}`}
            onClick={() => handleDateClick(date)}
          >
            <span className={styles.dateNumber}>
              {new Date(date).getDate()}
            </span>
            <span className={styles.dateMonth}>
              {new Date(date).toLocaleString('ko-KR', { month: 'short' })}
            </span>
            {isDateSelectable(date) && (
              <span className={styles.messageCount}>
                {messages.filter(msg => msg.date === date).length}개
              </span>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>
                {selectedDate && new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })} 대화
              </h3>
              <button className={styles.closeButton} onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.messageList}>
              {selectedDateMessages.map((message, index) => (
                <div key={index} className={styles.message}>
                  <div className={styles.messageHeader}>
                    <span className={styles.sender}>{message.sender || '알 수 없음'}</span>
                    <span className={styles.time}>{message.time}</span>
                  </div>
                  <div className={styles.content}>{message.content}</div>
                  {message.risks && message.risks.length > 0 && (
                    <div className={styles.messageRisks}>
                      {message.risks.map((risk, idx) => (
                        <span
                          key={idx}
                          className={`${styles.riskLevel} ${styles[risk.level]}`}
                        >
                          {risk.type} ({risk.level})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

RiskCalendar.propTypes = {
  onDateSelect: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  report: PropTypes.shape({
    analyzedAt: PropTypes.string,
  }),
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      sender: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      risks: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
          level: PropTypes.string,
          description: PropTypes.string
        })
      )
    })
  ),
  calendarData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      level: PropTypes.string,
    })
  ),
};

export default RiskCalendar;
