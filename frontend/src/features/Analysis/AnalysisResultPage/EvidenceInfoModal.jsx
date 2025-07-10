import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileAlt, FaCheck, FaInfoCircle } from 'react-icons/fa';
import styles from './EvidenceInfoModal.module.css';
import BasicInfoSection from './components/BasicInfoSection';
import OutputOptionsSection from './components/OutputOptionsSection';
import SignatureSection from './components/SignatureSection';
import axios from 'axios';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from '../../../api/axios';
import { evidenceApi } from '../../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

// EvidenceCategory enum 정의
const EvidenceCategory = {
  SEXUAL: { value: 'SEXUAL', label: '성적' },
  STALKING: { value: 'STALKING', label: '스토킹' },
  COERCION: { value: 'COERCION', label: '강요' },
  THREAT: { value: 'THREAT', label: '협박' },
  PERSONAL_INFO: { value: 'PERSONAL_INFO', label: '개인정보' },
  DISCRIMINATION: { value: 'DISCRIMINATION', label: '차별' },
  INSULT: { value: 'INSULT', label: '모욕' },
  REJECTION: { value: 'REJECTION', label: '거절' },
  NORMAL: { value: 'NORMAL', label: '기타' }
};

export const CategoryDisplayName = {
  [EvidenceCategory.NORMAL]: '일반',
  [EvidenceCategory.URGENT]: '긴급',
  [EvidenceCategory.SENSITIVE]: '민감'
};

// Emotion enum 정의
export const Emotion = {
  FEAR: 'FEAR',
  ANXIETY: 'ANXIETY',
  ANGER: 'ANGER',
  SHAME: 'SHAME',
  GUILT: 'GUILT',
  DEPRESSION: 'DEPRESSION',
  CONFUSION: 'CONFUSION',
  HELPLESSNESS: 'HELPLESSNESS',
  ISOLATION: 'ISOLATION',
  BETRAYAL: 'BETRAYAL',
  HUMILIATION: 'HUMILIATION',
  DISGUST: 'DISGUST',
  HOPELESSNESS: 'HOPELESSNESS'
};

// EmotionDisplayName 정의
export const EmotionDisplayName = {
  [Emotion.FEAR]: '두려움',
  [Emotion.ANXIETY]: '불안',
  [Emotion.ANGER]: '분노',
  [Emotion.SHAME]: '수치심',
  [Emotion.GUILT]: '죄책감',
  [Emotion.DEPRESSION]: '우울',
  [Emotion.CONFUSION]: '혼란',
  [Emotion.HELPLESSNESS]: '무력감',
  [Emotion.ISOLATION]: '고립감',
  [Emotion.BETRAYAL]: '배신감',
  [Emotion.HUMILIATION]: '모욕감',
  [Emotion.DISGUST]: '혐오감',
  [Emotion.HOPELESSNESS]: '절망감'
};

const EvidenceInfoModal = ({ isOpen, onClose, onSubmit, initialData, mode = 'save', onSaveSuccess, chatAnalysisId, user }) => {
  const [evidenceData, setEvidenceData] = useState({
    title: '',
    description: '',
    category: [EvidenceCategory.NORMAL],
    tags: [],
    incidentDate: {
      start: '',
      end: ''
    },
    incidentTime: '',
    location: '',
    locationType: 'ONLINE',
    offenderInfo: '',
    witnesses: [],
    emotions: [],
    otherEmotion: '',
    details: '',
    outputOptions: {
      includeMessages: true,
      includeCover: true,
      includeToc: true,
      pageNumbering: true,
      orientation: 'PORTRAIT',
      maskingOption: false
    },
    signature: {
      name: '',
      title: '',
      date: new Date().toISOString().split('T')[0] // yyyy-MM-dd 형식으로 변환
    }
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // initialData가 있으면 evidenceData 업데이트
  useEffect(() => {
    if (initialData) {
      setEvidenceData(prevData => ({
        ...prevData,
        ...initialData,
        signature: {
          ...prevData.signature,
          ...initialData.signature,
          date: initialData.signature?.date ? new Date(initialData.signature.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }
      }));
    }
  }, [initialData]);

  // 모달 상태 관리
  useEffect(() => {
    if (isOpen && !isModalOpen) {
      setIsModalOpen(true);
    } else if (!isOpen && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // chatAnalysisId 검증
      if (!chatAnalysisId || chatAnalysisId === 'undefined') {
        console.error('chatAnalysisId가 유효하지 않습니다:', { chatAnalysisId });
        throw new Error('분석 ID가 유효하지 않습니다. 페이지를 새로고침하고 다시 시도해주세요.');
      }
      
      // 날짜 형식을 yyyy-MM-dd로 변환
      const formattedDate = new Date().toISOString().split('T')[0];
      
      const requestData = {
        title: evidenceData.title || '증거자료',
        description: evidenceData.description || '',
        category: [EvidenceCategory.NORMAL.value], // 기본 카테고리 설정
        tags: evidenceData.tags || [],
        incidentDate: evidenceData.incidentDate || {
          start: formattedDate,
          end: formattedDate
        },
        incidentTime: evidenceData.incidentTime || '',
        location: evidenceData.location || '',
        locationType: evidenceData.locationType || 'UNKNOWN',
        offenderInfo: evidenceData.offenderInfo || '',
        witnesses: evidenceData.witnesses || [],
        emotions: evidenceData.emotions || [],
        otherEmotion: evidenceData.otherEmotion || '',
        details: evidenceData.details || '',
        outputOptions: {
          includeMessages: evidenceData.outputOptions.includeMessages ?? true,
          includeCover: evidenceData.outputOptions.includeCover ?? false,
          includeToc: evidenceData.outputOptions.includeToc ?? false,
          pageNumbering: evidenceData.outputOptions.pageNumbering ?? true,
          orientation: evidenceData.outputOptions.orientation || 'PORTRAIT',
          maskingOption: evidenceData.outputOptions.maskingOption || 'NONE'
        },
        signature: {
          name: evidenceData.signature.name || '익명',
          date: formattedDate,
          title: evidenceData.signature.title || '증거자료',
          organization: 'SafeHug',
          position: '사용자'
        },
        user: {
          id: user?.id,
          name: user?.name || '익명',
          email: user?.email
        }
      };

      console.log('📄 저장 요청 데이터:', {
        chatAnalysisId,
        requestData
      });

      // 증거함 저장 API 호출
      const response = await evidenceApi.createEvidence(chatAnalysisId, requestData);

      if (!response.success) {
        throw new Error(response.message || '증거 저장에 실패했습니다.');
      }

      console.log('📄 저장 응답:', response);
      toast.success('증거자료가 성공적으로 저장되었습니다.');
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error('증거자료 저장 실패:', error);
      toast.error(error.response?.data?.message || error.message || '증거자료 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      // 필수 필드 검증
      if (!evidenceData.title) {
        throw new Error('제목을 입력해주세요.');
      }
      if (!evidenceData.incidentDate.start) {
        throw new Error('시작일을 입력해주세요.');
      }
      
      // PDF 저장 모드일 때만 서명자 이름 검증
      if (mode === 'pdf' && !evidenceData.signature.name) {
        throw new Error('서명자 이름을 입력해주세요.');
      }

      await handleSave();

      setSuccess('증거 정보가 성공적으로 저장되었습니다.');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      closeTimeoutMS={400}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>증거 정보 {mode === 'pdf' ? '저장' : '입력'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <FaInfoCircle /> {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <FaCheck /> {success}
          </div>
        )}

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <BasicInfoSection
              basicInfo={evidenceData}
              onChange={setEvidenceData}
            />

            {mode === 'pdf' && (
              <>
                <OutputOptionsSection
                  outputOptions={evidenceData.outputOptions}
                  onChange={(options) => setEvidenceData({ ...evidenceData, outputOptions: options })}
                />

                <SignatureSection
                  signature={evidenceData.signature}
                  onChange={(signature) => setEvidenceData({ ...evidenceData, signature })}
                />
              </>
            )}

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isSubmitting || saving}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || saving}
              >
                {isSubmitting ? '저장 중...' : saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default EvidenceInfoModal; 