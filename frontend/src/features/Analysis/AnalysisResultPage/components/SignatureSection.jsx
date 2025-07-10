import React from 'react';
import styles from './SignatureSection.module.css';
import { FaSignature, FaLock, FaShieldAlt, FaUser, FaCalendar, FaInfoCircle } from 'react-icons/fa';

const SignatureSection = ({ signature, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...signature,
      [field]: value
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <FaSignature /> 전자서명
      </h3>

      <div className={styles.description}>
        전자서명은 증거의 진위 여부를 확인하는 중요한 요소입니다.
        아래에 서명자 이름을 입력해주세요.
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          <FaSignature className={styles.icon} /> 서명자 이름
        </label>
        <input
          type="text"
          className={styles.input}
          value={signature.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="서명자 이름을 입력하세요"
          required
        />
      </div>

      {/* 전자 서명 안내 */}
      <div className={styles.infoBox}>
        <h4>전자 서명 안내</h4>
        <p>
          전자 서명은 문서의 무결성과 진위성을 보장합니다.
          서명된 문서는 법적 효력이 있으며, 변조가 불가능합니다.
        </p>
      </div>
    </div>
  );
};

export default SignatureSection;
