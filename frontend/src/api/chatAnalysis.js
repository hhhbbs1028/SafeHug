import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// 채팅 분석 API
export const chatAnalysisApi = {
  // 채팅 파일 업로드
  uploadChat: async (formData) => {
    try {
      // userName이 없으면 에러 발생
      if (!formData.get('userName')) {
        throw new Error('사용자 이름은 필수입니다.');
      }

      // 파일 크기 체크 (10MB 제한)
      const file = formData.get('file');
      if (file && file.size > 10 * 1024 * 1024) {
        throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
      }

      console.log("파일 업로드 요청:", formData);
      const response = await axios.post(`${API_BASE_URL}/api/upload/chat`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3분 타임아웃
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`업로드 진행률: ${percentCompleted}%`);
        },
      });
      
      console.log("파일 업로드 응답:", response);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || "파일 업로드에 실패했습니다.");
      }
      
      return response.data;
    } catch (error) {
      console.error("파일 업로드 중 에러 발생:", error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('업로드 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      
      if (error.response?.status === 413) {
        throw new Error('파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.');
      }
      
      if (error.response?.status === 500) {
        if (error.response.data?.message?.includes('S3')) {
          throw new Error('파일 저장소 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      throw new Error(error.message || "파일 업로드 중 오류가 발생했습니다.");
    }
  },

  // 채팅 분석 결과 조회
  getAnalysisResult: async (chatUploadId) => {
    const response = await axios.get(`${API_BASE_URL}/api/upload/analysis/${chatUploadId}`);
    return response.data;
  },

  // 채팅 분석 상태 조회
  getAnalysisStatus: async (chatUploadId) => {
    const response = await axios.get(`${API_BASE_URL}/api/upload/status/${chatUploadId}`);
    return response.data;
  },

  // 채팅 분석 이력 조회
  getAnalysisHistory: async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/api/upload/history/${userId}`);
    return response.data;
  },

  // 채팅 분석 결과 삭제
  deleteAnalysis: async (chatUploadId) => {
    const response = await axios.delete(`${API_BASE_URL}/api/upload/analysis/${chatUploadId}`);
    return response.data;
  },
}; 