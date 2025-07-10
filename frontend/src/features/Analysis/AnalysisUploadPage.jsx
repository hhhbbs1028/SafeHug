import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AnalysisUploadPage.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { analysisApi } from "../../api/axios";
import { handleError, showInfo } from "../../utils/notification";
import { chatAnalysisApi } from "../../api/chatAnalysis";
import { 
  Button, 
  CircularProgress, 
  Typography, 
  Box, 
  Paper, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  TextField,
  useTheme,
  alpha,
  createTheme,
  ThemeProvider
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

/**
 * AnalysisUploadPage 컴포넌트
 *
 * 주요 기능:
 * - 파일 드래그&드롭/클릭 업로드
 * - 파일명 및 용량 제한 안내
 * - 개인정보 보호 안내
 * - 분석 시작 버튼
 * - 이용 가이드 모달
 * - 반응형 디자인 지원
 * - 실시간 업로드 진행 상태 표시
 * - 상세한 에러 처리
 * - 대화 참여자 이름 추출 및 선택
 */

// SafeHug 테마 정의
const safeHugTheme = createTheme({
  palette: {
    primary: {
      main: '#6B4EFF', // SafeHug 메인 컬러
      light: '#8A7AFF',
      dark: '#4B3BB5',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAF7F2',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Pretendard", "Noto Sans KR", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

const UploadBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(4),
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.5)}`,
  borderRadius: theme.shape.borderRadius * 2,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 800,
  margin: '6rem auto 2rem',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  boxShadow: theme.shadows[8],
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    margin: '5rem 1rem 1rem',
  },
}));

const UploadIcon = styled(CloudUploadIcon)(({ theme }) => ({
  fontSize: '4rem',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const AnalysisUploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(location.state?.error || "");
  const [uploadCanceled, setUploadCanceled] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [isExtractingNames, setIsExtractingNames] = useState(false);
  const inputRef = useRef();
  const uploadControllerRef = useRef(null);
  const [uploadController, setUploadController] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryCountRef = useRef(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    bytesUploaded: 0,
    totalBytes: 0,
    speed: 0,
    timeRemaining: 0,
    startTime: null
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef(null);
  const uploadStartTimeRef = useRef(null);
  const [showGuide, setShowGuide] = useState(false);
  const [chatUploadId, setChatUploadId] = useState(null);
  const theme = useTheme();

  // 정규식에서 불필요한 이스케이프 제거
  const namePattern = /[가-힣a-zA-Z]{2,}/;
  const datePattern = /\d{4}[-/]\d{1,2}[-/]\d{1,2}/;

  // 이름 유효성 검사 함수 (시간, 시스템 메시지, 특수문자, 숫자 등 제외)
  const isValidName = (name) => {
    if (!name) return false;
    if (datePattern.test(name)) return false;
    const invalidKeywords = [
      "카카오톡",
      "채팅방",
      "채팅방 관리자",
      "알림",
      "초대",
      "나갔습니다",
      "들어왔습니다"
    ];
    return (
      name.length >= 2 &&
      !invalidKeywords.some(keyword => name.includes(keyword)) &&
      !/^\d+$/.test(name) &&
      !/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(name)
    );
  };

  // 파일에서 이름 추출 함수
  const extractNames = async (file) => {
    setIsExtractingNames(true);
    try {
      const text = await file.text();
      const names = new Set();
      let match;

      // 1. [이름] [오전 10:08] 메시지
      const mobileNameTimeRegex = /^\[([^\]]+)\] \[(오전|오후) \d{1,2}:\d{2}\]/gm;
      while ((match = mobileNameTimeRegex.exec(text)) !== null) {
        const name = match[1].trim();
        if (isValidName(name)) names.add(name);
      }

      // 2. [오전 10:08] 이름 : 메시지
      const mobileTimeNameRegex = /^\[(오전|오후) \d{1,2}:\d{2}\] ([^:]+) :/gm;
      while ((match = mobileTimeNameRegex.exec(text)) !== null) {
        const name = match[2].trim();
        if (isValidName(name)) names.add(name);
      }

      // 3. PC: 이름 : 메시지
      const pcRegex = /^([^:\[]+) :/gm;
      while ((match = pcRegex.exec(text)) !== null) {
        const name = match[1].trim();
        if (isValidName(name)) names.add(name);
      }

      // 4. [이름] 메시지 (시간 없이)
      const mobileSimpleNameRegex = /^\[([^\]]+)\] /gm;
      while ((match = mobileSimpleNameRegex.exec(text)) !== null) {
        const name = match[1].trim();
        if (isValidName(name)) names.add(name);
      }

      if (names.size === 0) {
        throw new Error("대화 내용에서 이름을 찾을 수 없습니다. 카카오톡 내보내기 파일이 맞는지 확인해주세요.");
      }

      const nameArray = Array.from(names);
      setUsers(nameArray);
      
      // 이름이 하나만 있으면 자동 선택
      if (nameArray.length === 1) {
        setSelectedUserName(nameArray[0]);
      }
    } catch (err) {
      setError(err.message);
      setUsers([]);
      setSelectedUserName("");
    } finally {
      setIsExtractingNames(false);
    }
  };

  // 카카오톡 대화 형식 검증 함수
  const validateKakaoChatFormat = async (file) => {
    try {
      const text = await file.text();
      // 카카오톡 대화 형식의 기본 패턴들
      const kakaoPatterns = [
        /^\[([^\]]+)\] \[(오전|오후) \d{1,2}:\d{2}\]/, // [이름] [오전/오후 HH:MM]
        /^\[(오전|오후) \d{1,2}:\d{2}\] ([^:]+) :/, // [오전/오후 HH:MM] 이름 :
        /^([^:\[]+) :/, // 이름 :
        /^\[([^\]]+)\] /, // [이름]
      ];

      // 파일 내용이 카카오톡 대화 형식인지 확인
      const isKakaoChat = kakaoPatterns.some(pattern => pattern.test(text));
      if (!isKakaoChat) {
        throw new Error("카카오톡 대화 내보내기 파일이 아닙니다. 올바른 파일을 업로드해주세요.");
      }
      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // 파일 업로드 관련 상수
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = ['text/plain', 'application/txt'];
  const UPLOAD_TIMEOUT = 180000; // 3분 타임아웃
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  // 파일 유효성 검사 함수
  const validateFile = (file) => {
    if (!file) {
      throw new Error('파일을 선택해주세요.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`파일 크기는 ${MAX_FILE_SIZE / (1024 * 1024)}MB 이하여야 합니다.`);
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('텍스트 파일만 업로드 가능합니다.');
    }

    return true;
  };

  // 바이트를 읽기 쉬운 형식으로 변환
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // 남은 시간을 읽기 쉬운 형식으로 변환
  const formatTimeRemaining = (seconds) => {
    if (seconds === Infinity || isNaN(seconds)) return '계산 중...';
    if (seconds < 60) return `${Math.ceil(seconds)}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}분 ${remainingSeconds}초`;
  };

  // 업로드 속도 계산
  const calculateUploadSpeed = (loaded, total, startTime) => {
    const elapsedTime = (Date.now() - startTime) / 1000; // 초 단위
    if (elapsedTime === 0) return 0;
    return loaded / elapsedTime; // 바이트/초
  };

  // 남은 시간 계산
  const calculateTimeRemaining = (loaded, total, speed) => {
    if (speed === 0) return Infinity;
    return (total - loaded) / speed;
  };

  // 업로드 상태 초기화
  const resetUploadState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStats({
      bytesUploaded: 0,
      totalBytes: 0,
      speed: 0,
      timeRemaining: 0,
      startTime: null
    });
    setUploadCanceled(false);
    setIsCancelled(false);
    retryCountRef.current = 0;
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      resetUploadState();
    };
  }, []);

  // 업로드 취소 핸들러
  const handleCancelUpload = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
      setIsCancelled(true);
      setError('업로드가 취소되었습니다.');
      resetUploadState();
    }
  };

  // 재시도 처리
  const handleRetry = async () => {
    if (retryCountRef.current >= MAX_RETRIES) {
      setError('최대 재시도 횟수를 초과했습니다. 다시 시도해주세요.');
      resetUploadState();
      return;
    }

    retryCountRef.current += 1;
    setIsRetrying(true);
    setError(`업로드 실패. ${retryCountRef.current}번째 재시도 중...`);

    try {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      await handleUpload();
    } catch (error) {
      console.error('재시도 중 오류 발생:', error);
      setError(error.message || '재시도 중 오류가 발생했습니다.');
      resetUploadState();
    } finally {
      setIsRetrying(false);
    }
  };

  // 파일 업로드 함수
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("파일을 선택해주세요.");
      return;
    }

    if (!selectedUserName) {
      setError("본인의 이름을 선택해주세요.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setUploadProgress(0);
      uploadStartTimeRef.current = Date.now();

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userName", selectedUserName);
      
      if (user?.id) {
        formData.append("userId", user.id);
      }

      const response = await analysisApi.uploadChat(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          
          const currentTime = Date.now();
          const elapsedTime = (currentTime - uploadStartTimeRef.current) / 1000;
          const speed = progressEvent.loaded / elapsedTime;
          
          setUploadStats(prev => ({
            ...prev,
            bytesUploaded: progressEvent.loaded,
            totalBytes: progressEvent.total,
            speed: speed,
            timeRemaining: calculateTimeRemaining(progressEvent.loaded, progressEvent.total, speed),
            startTime: uploadStartTimeRef.current
          }));
        },
        timeout: UPLOAD_TIMEOUT
      });

      if (response.data.success) {
        const analysisId = response.data.data.id;
        if (!analysisId) {
          throw new Error("분석 ID를 받지 못했습니다.");
        }
        
        navigate(`/analysis-result/${analysisId}`, {
          state: {
            initialData: response.data.data
          }
        });
      } else {
        throw new Error(response.data.message || "업로드 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      
      // 타임아웃 에러 처리
      if (err.message.includes('timeout') || err.code === 'ECONNABORTED') {
        setError('업로드 시간이 초과되었습니다. 다시 시도해주세요.');
      } else {
        setError(err.message || "업로드 중 오류가 발생했습니다.");
      }
      
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setTimeout(() => {
          if (!isCancelled) {
            handleRetry();
          }
        }, RETRY_DELAY);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 수동 재시도 핸들러
  const handleManualRetry = () => {
    resetUploadState();
    handleUpload();
  };

  // 파일 선택 핸들러
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        validateFile(file);
        await validateKakaoChatFormat(file);
        setSelectedFile(file);
        setError("");
        await extractNames(file);
      } catch (err) {
        setError(err.message);
        setSelectedFile(null);
        setUsers([]);
        setSelectedUserName("");
      }
    }
  };

  // 드래그 이벤트 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // 드롭 이벤트 핸들러
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        validateFile(file);
        await validateKakaoChatFormat(file);
        setSelectedFile(file);
        setError("");
        await extractNames(file);
      } catch (err) {
        setError(err.message);
        setSelectedFile(null);
        setUsers([]);
        setSelectedUserName("");
      }
    }
  };

  // 업로드 영역 클릭 핸들러
  const handleAreaClick = () => {
    inputRef.current?.click();
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsGuideModalOpen(false);
  };

  // 모달 외부 클릭 시 닫기
  const handleModalOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsExtractingNames(true);
      setError(null);

      // 파일 형식 검사
      if (!file.name.endsWith('.txt')) {
        throw new Error('카카오톡 대화 내보내기 파일(.txt)만 업로드 가능합니다.');
      }

      // 파일 크기 검사 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
      }

      // 파일에서 대화 참여자 이름 추출
      await extractNames(file);

      // 본인의 이름이 선택되지 않았으면 에러
      if (!selectedUserName) {
        throw new Error('본인의 이름을 선택해주세요.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userName', selectedUserName);
      
      // 로그인한 경우에만 사용자 ID 추가
      if (user) {
        formData.append('userId', user.id);
      }

      console.log('업로드할 파일 정보:', {
        fileName: file.name,
        fileSize: file.size,
        userName: selectedUserName,
        userId: user?.id
      });

      const response = await chatAnalysisApi.uploadChat(formData);
      console.log('업로드 응답:', response);

      if (response.success) {
        setChatUploadId(response.data.id);
        setUsers(response.data.users || []);
        showInfo('파일이 성공적으로 업로드되었습니다.');
      } else {
        // AI 서버 통신 오류 처리
        if (response.error?.includes('AI 서버 통신 실패')) {
          throw new Error('AI 분석 서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        throw new Error(response.message || '파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      setError(error.message);
    } finally {
      setIsExtractingNames(false);
    }
  };

  const handleGuideClose = () => {
    setShowGuide(false);
  };

  // 이름 선택 UI 렌더링
  const renderNameSelection = () => {
    if (!selectedFile || users.length === 0) return null;

    return (
      <div className={styles.nameSelection}>
        <Typography variant="subtitle1" gutterBottom>
          본인의 이름을 선택해주세요
        </Typography>
        <FormControl fullWidth>
          <Select
            value={selectedUserName}
            onChange={(e) => setSelectedUserName(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              <em>이름을 선택하세요</em>
            </MenuItem>
            {users.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  };

  return (
    <ThemeProvider theme={safeHugTheme}>
      <Box sx={{ minHeight: '100vh', pt: { xs: 2, sm: 4 }, bgcolor: 'background.default' }}>
        <StyledPaper elevation={3}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{ 
              fontWeight: 700,
              color: 'primary.main',
              mb: 4
            }}
          >
            채팅 분석
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4,
              textAlign: 'center',
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            카카오톡 대화 내보내기 파일을 업로드하여 분석을 시작하세요.
            <br />
            안전하고 전문적인 분석 서비스를 제공해 드립니다.
          </Typography>

          <UploadBox
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleAreaClick}
            className={`${dragActive ? styles.uploadAreaActive : ''} ${isUploading ? styles.uploading : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              onChange={handleFileChange}
              accept=".txt"
              style={{ display: 'none' }}
            />
            <UploadIcon />
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              파일을 드래그하거나 클릭하여 업로드
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                maxWidth: '400px',
                mx: 'auto'
              }}
            >
              카카오톡 대화 내보내기 파일(.txt)만 지원됩니다.
              <br />
              최대 파일 크기: 10MB
            </Typography>
          </UploadBox>

          {selectedFile && (
            <Box 
              sx={{ 
                mt: 3,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                선택된 파일: {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                크기: {formatBytes(selectedFile.size)}
              </Typography>
            </Box>
          )}

          {isExtractingNames && (
            <Box 
              sx={{ 
                mt: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1
              }}
            >
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                대화 참여자 이름 추출 중...
              </Typography>
            </Box>
          )}

          {renderNameSelection()}

          {selectedFile && selectedUserName && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <ActionButton
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={isUploading}
                size="large"
                fullWidth
              >
                {isUploading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    업로드 중...
                  </>
                ) : (
                  '분석 시작하기'
                )}
              </ActionButton>
            </Box>
          )}

          {error && (
            <Typography 
              color="error" 
              sx={{ 
                mt: 2,
                p: 2,
                bgcolor: alpha(safeHugTheme.palette.error.main, 0.1),
                borderRadius: 1,
                textAlign: 'center'
              }}
            >
              {error}
            </Typography>
          )}
        </StyledPaper>
      </Box>
    </ThemeProvider>
  );
};

export default AnalysisUploadPage;
