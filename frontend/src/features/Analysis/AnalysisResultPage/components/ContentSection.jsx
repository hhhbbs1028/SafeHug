import React from "react";
import styles from "./ContentSection.module.css";
import { FaFileAlt, FaList, FaHashtag, FaEye } from "react-icons/fa";

// PaperSize enum 정의
const PaperSize = {
  A4: { value: 'A4', displayName: 'A4' },
  LETTER: { value: 'LETTER', displayName: 'Letter' },
  LEGAL: { value: 'LEGAL', displayName: 'Legal' }
};

// Orientation enum 정의
const Orientation = {
  PORTRAIT: { value: 'PORTRAIT', displayName: '세로' },
  LANDSCAPE: { value: 'LANDSCAPE', displayName: '가로' }
};

const ContentSection = ({ pdfConfig = {}, handleChange }) => {
  const defaultOutputOptions = {
    includeMessages: true,
    includeToc: false,
    pageNumbering: true,
    orientation: 'PORTRAIT',
    maskingOption: true,
    paperSize: 'A4'
  };

  const outputOptions = pdfConfig.outputOptions || defaultOutputOptions;

  return (
    <div className={styles.contentSection}>
      <h3>PDF 내용 설정</h3>
      
      <div className={styles.contentOptions}>
        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.includeMessages}
              onChange={(e) => handleChange("includeMessages", e.target.checked)}
            />
            <span>대화 내용 포함</span>
          </label>
          <p className={styles.optionDescription}>
            분석된 대화 내용을 PDF에 포함합니다.
          </p>
        </div>

        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.includeToc}
              onChange={(e) => handleChange("includeToc", e.target.checked)}
            />
            <span>목차 포함</span>
          </label>
          <p className={styles.optionDescription}>
            PDF 문서에 목차를 추가합니다.
          </p>
        </div>

        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.pageNumbering}
              onChange={(e) => handleChange("pageNumbering", e.target.checked)}
            />
            <span>페이지 번호</span>
          </label>
          <p className={styles.optionDescription}>
            각 페이지에 번호를 표시합니다.
          </p>
        </div>

        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>
            <input
              type="checkbox"
              checked={outputOptions.maskingOption}
              onChange={(e) => handleChange("maskingOption", e.target.checked)}
            />
            <span>개인정보 마스킹</span>
          </label>
          <p className={styles.optionDescription}>
            민감한 개인정보를 자동으로 마스킹 처리합니다.
          </p>
        </div>
      </div>

      <div className={styles.formatOptions}>
        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>용지 크기</label>
          <select
            className={styles.select}
            value={outputOptions.paperSize}
            onChange={(e) => handleChange("outputOptions", {
              ...outputOptions,
              paperSize: e.target.value
            })}
          >
            {Object.values(PaperSize).map(size => (
              <option key={size.value} value={size.value}>
                {size.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>용지 방향</label>
          <select
            className={styles.select}
            value={outputOptions.orientation}
            onChange={(e) => handleChange("outputOptions", {
              ...outputOptions,
              orientation: e.target.value
            })}
          >
            {Object.values(Orientation).map(orientation => (
              <option key={orientation.value} value={orientation.value}>
                {orientation.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.previewNote}>
        <FaEye />
        <p>설정 변경 시 미리보기가 자동으로 업데이트됩니다.</p>
      </div>
    </div>
  );
};

export default ContentSection; 