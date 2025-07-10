import React, { useState } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaUsers, FaHeart, FaFileAlt, FaTimes, FaTag, FaInfoCircle } from 'react-icons/fa';
import styles from './BasicInfoSection.module.css';
import { Emotion, EmotionDisplayName } from '../EvidenceInfoModal';
import { EvidenceCategory } from '../../../../constants/EvidenceCategory';

const BasicInfoSection = ({ basicInfo, onChange }) => {
  const [tagInput, setTagInput] = useState('');
  const [witnessInput, setWitnessInput] = useState('');
  const [otherEmotion, setOtherEmotion] = useState('');

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...basicInfo.tags, tagInput.trim()];
      onChange({ ...basicInfo, tags: newTags });
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    const newTags = basicInfo.tags.filter((_, index) => index !== indexToRemove);
    onChange({ ...basicInfo, tags: newTags });
  };

  const handleWitnessInputChange = (e) => {
    setWitnessInput(e.target.value);
  };

  const handleWitnessInputKeyDown = (e) => {
    if (e.key === 'Enter' && witnessInput.trim()) {
      e.preventDefault();
      const newWitnesses = [...basicInfo.witnesses, witnessInput.trim()];
      onChange({ ...basicInfo, witnesses: newWitnesses });
      setWitnessInput('');
    }
  };

  const handleRemoveWitness = (indexToRemove) => {
    const newWitnesses = basicInfo.witnesses.filter((_, index) => index !== indexToRemove);
    onChange({ ...basicInfo, witnesses: newWitnesses });
  };

  const handleEmotionChange = (emotion) => {
    const newEmotions = basicInfo.emotions.includes(emotion)
      ? basicInfo.emotions.filter(e => e !== emotion)
      : [...basicInfo.emotions, emotion];
    onChange({ ...basicInfo, emotions: newEmotions });
  };

  const handleOtherEmotionChange = (e) => {
    setOtherEmotion(e.target.value);
    onChange({ ...basicInfo, otherEmotion: e.target.value });
  };

  const handleCategoryChange = (e) => {
    onChange({ ...basicInfo, category: [e.target.value] });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <FaFileAlt /> 기본 정보
      </h3>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaFileAlt /> 제목 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={styles.input}
          value={basicInfo.title}
          onChange={(e) => onChange({ ...basicInfo, title: e.target.value })}
          placeholder="증거 제목을 입력하세요"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaTag /> 카테고리 <span className={styles.required}>*</span>
        </label>
        <select
          className={styles.select}
          value={basicInfo.category?.[0] || EvidenceCategory.NORMAL.value}
          onChange={handleCategoryChange}
          required
        >
          {Object.entries(EvidenceCategory).map(([key, { value, label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaTag /> 태그
        </label>
        <div className={styles.tagInput}>
          {basicInfo.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
              <button onClick={() => handleRemoveTag(index)}>
                <FaTimes />
              </button>
            </span>
          ))}
        <input
          type="text"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            placeholder="태그 입력 후 엔터"
          />
        </div>
        <div className={styles.helpText}>
          엔터를 눌러 태그를 추가하세요
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaCalendarAlt /> 사건 발생일 <span className={styles.required}>*</span>
        </label>
        <div className={styles.dateRange}>
          <input
            type="date"
            className={styles.input}
            value={basicInfo.incidentDate.start}
            onChange={(e) => onChange({
              ...basicInfo,
              incidentDate: { ...basicInfo.incidentDate, start: e.target.value }
            })}
            required
          />
          <span className={styles.dateSeparator}>~</span>
          <input
            type="date"
            className={styles.input}
            value={basicInfo.incidentDate.end}
            onChange={(e) => onChange({
              ...basicInfo,
              incidentDate: { ...basicInfo.incidentDate, end: e.target.value }
            })}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaClock /> 사건 발생 시간
        </label>
        <input
          type="time"
          className={styles.input}
          value={basicInfo.incidentTime}
          onChange={(e) => onChange({ ...basicInfo, incidentTime: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaMapMarkerAlt /> 장소
        </label>
        <div className={styles.locationType}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="locationType"
              value="ONLINE"
              checked={basicInfo.locationType === 'ONLINE'}
              onChange={(e) => onChange({ ...basicInfo, locationType: e.target.value })}
            />
            <span>온라인</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="locationType"
              value="OFFLINE"
              checked={basicInfo.locationType === 'OFFLINE'}
              onChange={(e) => onChange({ ...basicInfo, locationType: e.target.value })}
            />
            <span>오프라인</span>
          </label>
        </div>
        <input
          type="text"
          className={styles.input}
          value={basicInfo.location}
          onChange={(e) => onChange({ ...basicInfo, location: e.target.value })}
          placeholder="장소를 입력하세요"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaUser /> 가해자 정보
        </label>
        <input
          type="text"
          className={styles.input}
          value={basicInfo.offenderInfo}
          onChange={(e) => onChange({ ...basicInfo, offenderInfo: e.target.value })}
          placeholder="가해자 정보를 입력하세요"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaUsers /> 목격자
        </label>
        <div className={styles.tagInput}>
          {basicInfo.witnesses.map((witness, index) => (
            <span key={index} className={styles.tag}>
              {witness}
              <button onClick={() => handleRemoveWitness(index)}>
                <FaTimes />
              </button>
            </span>
          ))}
        <input
          type="text"
            value={witnessInput}
            onChange={handleWitnessInputChange}
            onKeyDown={handleWitnessInputKeyDown}
            placeholder="목격자 입력 후 엔터"
          />
        </div>
        <div className={styles.helpText}>
          엔터를 눌러 목격자를 추가하세요
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaHeart /> 감정
        </label>
        <div className={styles.emotionGrid}>
          {Object.entries(EmotionDisplayName).map(([emotion, displayName]) => (
            <label key={emotion} className={styles.emotionLabel}>
              <input
                type="checkbox"
                checked={basicInfo.emotions.includes(emotion)}
                onChange={(e) => {
                  const newEmotions = e.target.checked
                    ? [...basicInfo.emotions, emotion]
                    : basicInfo.emotions.filter(e => e !== emotion);
                  onChange({ ...basicInfo, emotions: newEmotions });
                }}
              />
              <span>{displayName}</span>
            </label>
          ))}
        </div>
        <input
          type="text"
          className={styles.input}
          value={otherEmotion}
          onChange={handleOtherEmotionChange}
          placeholder="기타 감정을 입력하세요"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaInfoCircle /> 상세 내용
        </label>
        <textarea
          className={styles.textarea}
          value={basicInfo.details}
          onChange={(e) => onChange({ ...basicInfo, details: e.target.value })}
          placeholder="사건의 상세 내용을 입력하세요"
          rows={5}
        />
      </div>
    </div>
  );
};

export default BasicInfoSection;
