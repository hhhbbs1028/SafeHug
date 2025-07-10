import React from 'react';
import styles from './OutputOptionsSection.module.css';
import { FaFileAlt, FaList, FaHashtag, FaEye } from 'react-icons/fa';

const OutputOptionsSection = ({ outputOptions, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...outputOptions,
      [field]: value
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <FaFileAlt /> PDF 출력 옵션
      </h3>

      <div className={styles.formGroup}>
        <div className={styles.optionsGrid}>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.includeMessages}
              onChange={(e) => handleChange('includeMessages', e.target.checked)}
            />
            <span>대화 내용 포함</span>
          </label>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.includeCover}
              onChange={(e) => handleChange('includeCover', e.target.checked)}
            />
            <span>표지 포함</span>
          </label>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.includeToc}
              onChange={(e) => handleChange('includeToc', e.target.checked)}
            />
            <span>목차 포함</span>
          </label>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.pageNumbering}
              onChange={(e) => handleChange('pageNumbering', e.target.checked)}
            />
            <span>페이지 번호</span>
          </label>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.maskingOption}
              onChange={(e) => handleChange('maskingOption', e.target.checked)}
            />
            <span>개인정보 마스킹</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default OutputOptionsSection;
