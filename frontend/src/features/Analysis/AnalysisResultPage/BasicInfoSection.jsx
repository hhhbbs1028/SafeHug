import React, { useState } from 'react';
import styles from './BasicInfoSection.module.css';
import { EvidenceCategory } from '../../../constants/EvidenceCategory';

const BasicInfoSection = () => {
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    category: [EvidenceCategory.NORMAL.value],
    tags: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'text' || type === 'select-multiple') {
      setBasicInfo({
        ...basicInfo,
        [name]: type === 'select-multiple' ? (checked ? [value] : []) : value,
      });
    } else if (name === 'tags') {
      setBasicInfo({
        ...basicInfo,
        tags: value.split(',').map((tag) => tag.trim()),
      });
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>기본 정보</h3>
      <div className={styles.formGroup}>
        <label htmlFor="title" className={styles.label}>
          제목 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={basicInfo.title || ''}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="category" className={styles.label}>
          카테고리 <span className={styles.required}>*</span>
        </label>
        <select
          id="category"
          name="category"
          value={basicInfo.category?.[0] || EvidenceCategory.NORMAL.value}
          onChange={handleChange}
          className={styles.select}
          required
        >
          {Object.values(EvidenceCategory).map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="tags" className={styles.label}>
          태그
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={basicInfo.tags?.join(', ') || ''}
          onChange={handleChange}
          className={styles.input}
          placeholder="쉼표로 구분하여 입력"
        />
      </div>
    </div>
  );
};

export default BasicInfoSection; 