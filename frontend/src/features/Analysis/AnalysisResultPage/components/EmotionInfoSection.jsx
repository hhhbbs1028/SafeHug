import React from "react";
import styles from "./EmotionInfoSection.module.css";

const EmotionInfoSection = ({ data = {}, onChange }) => {
  const { emotions = [], otherEmotion = "" } = data;

  const handleChange = (field, value) => {
    onChange?.({ ...data, [field]: value });
  };

  const handleEmotionChange = (emotion) => {
    const newEmotions = emotions.includes(emotion)
      ? emotions.filter((e) => e !== emotion)
      : [...emotions, emotion];
    handleChange("emotions", newEmotions);
  };

  const emotionOptions = [
    { value: "불안", icon: "😰" },
    { value: "공포", icon: "😨" },
    { value: "수치심", icon: "😳" },
    { value: "당혹", icon: "😖" },
    { value: "혼란", icon: "😕" },
    { value: "무기력감", icon: "😔" },
    { value: "분노", icon: "😠" },
    { value: "슬픔", icon: "😢" },
    { value: "기타", icon: "❓" },
  ];

  return (
    <div className={styles.section}>
      <h3>감정 정보</h3>
      <div className={styles.content}>
        <div className={styles.infoGroup}>
          <label>피해자가 느낀 감정</label>
          <div className={styles.emotionGrid}>
            {emotionOptions.map(({ value, icon }) => (
              <label key={value} className={styles.emotionLabel}>
                <input
                  type="checkbox"
                  checked={emotions.includes(value)}
                  onChange={() => handleEmotionChange(value)}
                />
                <span className={styles.emotionText}>
                  {icon} {value}
                </span>
              </label>
            ))}
          </div>
        </div>

        {emotions.includes("기타") && (
          <div className={styles.infoGroup}>
            <label>기타 감정</label>
            <input
              type="text"
              value={otherEmotion}
              onChange={(e) => handleChange("otherEmotion", e.target.value)}
              className={styles.input}
              placeholder="느낀 감정을 자유롭게 입력하세요"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionInfoSection;
