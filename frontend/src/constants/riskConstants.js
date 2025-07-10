// 위험도 레벨 상수
export const RISK_LEVELS = {
  HIGH: { 
    korean: '심각', 
    color: '#ff1744', 
    description: '즉각적인 조치 필요', 
    order: 4,
    icon: '⚠️',
    background: '#fee2e2',
    text: '#dc2626',
    progress: '#dc2626'
  },
  MEDIUM: { 
    korean: '경고', 
    color: '#ffd600', 
    description: '주의 깊은 모니터링 필요', 
    order: 3,
    icon: '⚡',
    background: '#fef3c7',
    text: '#d97706',
    progress: '#d97706'
  },
  LOW: { 
    korean: '주의', 
    color: '#ff9800', 
    description: '지속적인 관찰 필요', 
    order: 2,
    icon: 'ℹ️',
    background: '#dbeafe',
    text: '#2563eb',
    progress: '#2563eb'
  },
  NORMAL: { 
    korean: '일반', 
    color: '#4caf50', 
    description: '안전한 상태', 
    order: 1,
    icon: '✓',
    background: '#dcfce7',
    text: '#16a34a',
    progress: '#16a34a'
  }
};

// 위험 유형 상수
export const RISK_TYPES = {
  SEXUAL: { 
    korean: '성적', 
    icon: '🔞', 
    color: RISK_LEVELS.HIGH.color,
    description: '성적 관련 위험'
  },
  STALKING: { 
    korean: '스토킹', 
    icon: '👥', 
    color: RISK_LEVELS.MEDIUM.color,
    description: '스토킹 관련 위험'
  },
  COERCION: { 
    korean: '강요', 
    icon: '⚠️', 
    color: RISK_LEVELS.LOW.color,
    description: '강요 관련 위험'
  },
  THREAT: { 
    korean: '협박', 
    icon: '⚡', 
    color: RISK_LEVELS.HIGH.color,
    description: '협박 관련 위험'
  },
  PERSONAL_INFO: { 
    korean: '개인정보', 
    icon: '🔒', 
    color: RISK_LEVELS.LOW.color,
    description: '개인정보 관련 위험'
  },
  DISCRIMINATION: { 
    korean: '차별', 
    icon: '🚫', 
    color: RISK_LEVELS.HIGH.color,
    description: '차별 관련 위험'
  },
  INSULT: { 
    korean: '모욕', 
    icon: '😡', 
    color: RISK_LEVELS.HIGH.color,
    description: '모욕 관련 위험'
  },
  NORMAL: { 
    korean: '일반', 
    icon: '✅', 
    color: RISK_LEVELS.NORMAL.color,
    description: '일반적인 대화'
  }
};

// 증거 카테고리 enum
export const EvidenceCategory = {
  SEXUAL: "성적",
  STALKING: "스토킹",
  COERCION: "강요",
  THREAT: "협박",
  PERSONAL_INFO: "개인정보",
  DISCRIMINATION: "차별",
  INSULT: "모욕",
  NORMAL: "일반"
};

// 위험도 관련 유틸리티 함수들
export const getRiskInfo = (level) => {
  if (!level) return RISK_LEVELS.NORMAL;
  const upperLevel = level.toUpperCase();
  return RISK_LEVELS[upperLevel] || RISK_LEVELS.NORMAL;
};

export const getRiskTypeInfo = (type) => {
  if (!type) return RISK_TYPES.NORMAL;
  const upperType = type.toUpperCase();
  return RISK_TYPES[upperType] || RISK_TYPES.NORMAL;
};

export const getRiskColor = (level) => {
  const riskInfo = getRiskInfo(level);
  return {
    bg: riskInfo.background,
    text: riskInfo.text,
    progress: riskInfo.progress,
    border: riskInfo.color
  };
};

export const getRiskIcon = (level) => {
  return getRiskInfo(level).icon;
};

export const getRiskKor = (level) => {
  return getRiskInfo(level).korean;
};

export const getRiskDescription = (level) => {
  return getRiskInfo(level).description;
};

export const getRiskTypeColor = (type) => {
  return getRiskTypeInfo(type).color;
};

export const getRiskTypeIcon = (type) => {
  return getRiskTypeInfo(type).icon;
};

export const getRiskTypeKor = (type) => {
  return getRiskTypeInfo(type).korean;
};

// 위험도 정렬을 위한 비교 함수
export const compareRiskLevels = (a, b) => {
  const levelA = getRiskInfo(a).order;
  const levelB = getRiskInfo(b).order;
  return levelB - levelA;
};

// 위험도가 비어있는 경우를 처리하는 안전한 정렬 함수
export const safeSortByRiskLevel = (items, getRiskLevel) => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const levelA = getRiskLevel(a) || 'NORMAL';
    const levelB = getRiskLevel(b) || 'NORMAL';
    return compareRiskLevels(levelA, levelB);
  });
}; 