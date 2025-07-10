/**
 * 표준화된 에러 객체를 생성하는 유틸리티 함수
 * @param {Error|string} error - 원본 에러 객체 또는 에러 메시지
 * @param {string} [userMessage] - 사용자에게 보여줄 메시지
 * @returns {Object} 표준화된 에러 객체
 */
export const createError = (error, userMessage) => {
  // 에러가 문자열인 경우 Error 객체로 변환
  const originalError = typeof error === 'string' ? new Error(error) : error;
  
  // 백엔드 응답에서 에러 정보 추출
  const responseData = originalError.response?.data;
  const backendErrors = responseData?.errors || [];
  
  return {
    userMessage: userMessage || getDefaultUserMessage(originalError),
    detail: responseData?.message || originalError.message,
    status: originalError.response?.status,
    code: responseData?.errorCode,
    errors: backendErrors,
    timestamp: new Date().toISOString()
  };
};

/**
 * 에러 타입에 따른 기본 사용자 메시지를 반환
 * @param {Error} error - 에러 객체
 * @returns {string} 사용자 메시지
 */
const getDefaultUserMessage = (error) => {
  const status = error.response?.status;
  
  switch (status) {
    case 400:
      return "잘못된 요청입니다. 입력값을 확인해주세요.";
    case 401:
      return "로그인이 필요합니다.";
    case 403:
      return "접근 권한이 없습니다.";
    case 404:
      return "요청하신 리소스를 찾을 수 없습니다.";
    case 500:
      return "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    default:
      return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};

/**
 * API 에러를 처리하는 함수
 * @param {Error} error - API 에러 객체
 * @returns {Object} 처리된 에러 객체
 */
export const handleApiError = (error) => {
  console.error("API 에러 발생:", {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    config: error.config
  });
  
  return createError(error);
}; 