import { toast } from 'react-toastify';

/**
 * 에러 메시지를 토스트로 표시하고 가이드 모달을 열어야 하는지 여부를 반환
 * @param {Error|string} error - 에러 객체 또는 에러 메시지
 * @param {Object} options - 옵션
 * @param {boolean} [options.showGuide=false] - 가이드 모달을 표시할지 여부
 * @param {string} [options.guideMessage] - 가이드 모달에 표시할 메시지
 * @returns {boolean} 가이드 모달을 열어야 하는지 여부
 */
export const handleError = (error, options = {}) => {
  const { showGuide = false, guideMessage } = options;
  const message = error.message || error;

  // 에러 메시지 표시
  toast.error(message, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });

  // 가이드가 필요한 경우 true 반환
  if (showGuide) {
    // 가이드 메시지가 있으면 토스트로 표시
    if (guideMessage) {
      toast.info(guideMessage, {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    return true;
  }

  return false;
};

/**
 * 성공 메시지를 토스트로 표시
 * @param {string} message - 성공 메시지
 */
export const showSuccess = (message) => {
  toast.success(message, {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * 정보 메시지를 토스트로 표시
 * @param {string} message - 정보 메시지
 * @param {Object} options - 토스트 옵션
 */
export const showInfo = (message, options = {}) => {
  toast.info(message, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
}; 