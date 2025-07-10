import React, { useState } from "react";
import styles from "./PdfUploadPage.module.css";
import { useNavigate } from "react-router-dom";
import { FaFileUpload, FaSpinner, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { analysisApi } from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

// 검증 결과 타입 정의
const VerificationStatus = {
  VALID: "VALID",
  INVALID: "INVALID",
  ERROR: "ERROR"
};

// 메타데이터 키 정의
const MetadataKeys = {
  HASH_VALUE: "HashValue",
  SIGNATURE_VALUE: "SignatureValue",
  SIGNED_BY: "SignedBy",
  SIGNED_AT: "SignedAt"
};

const PdfUploadPage = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
      setVerificationResult(null);
    } else {
      setError("PDF 파일만 업로드 가능합니다.");
      setFile(null);
      setVerificationResult(null);
    }
  };

  const verifyPdf = async (file) => {
    setIsVerifying(true);
    setError("");
    setVerificationResult(null);

    try {
      const response = await analysisApi.verifyPdf(file);
      const result = response.data;
      
      // 백엔드 응답 구조와 정확히 일치하도록 설정
      const verificationResults = {
        metadata: result.verificationResults?.metadata || {},
        hashValid: Boolean(result.verificationResults?.hashValid),
        signatureValid: Boolean(result.verificationResults?.signatureValid)
      };

      // 메타데이터 유효성 검사
      const metadata = verificationResults.metadata;
      const hasRequiredMetadata = 
        metadata[MetadataKeys.HASH_VALUE] &&
        metadata[MetadataKeys.SIGNATURE_VALUE] &&
        metadata[MetadataKeys.SIGNED_BY] &&
        metadata[MetadataKeys.SIGNED_AT];

      setVerificationResult({
        status: result.status || VerificationStatus.ERROR,
        message: result.message || "검증 결과를 확인할 수 없습니다.",
        verificationResults: {
          ...verificationResults,
          metadata: hasRequiredMetadata ? metadata : {}
        }
      });

      return result.status === VerificationStatus.VALID;
    } catch (err) {
      console.error("PDF 검증 실패:", err);
      setError(err.message || "PDF 검증 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("파일을 선택해주세요.");
      return;
    }

    // PDF 검증
    const isValid = await verifyPdf(file);
    if (!isValid) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const response = await analysisApi.uploadAndAnalyze(
        file,
        user?.id || null
      );
      // 분석 결과 페이지로 이동 (결과 ID 전달)
      navigate(`/analysis/detail/${response.data.id}`);
    } catch (err) {
      console.error("PDF 업로드 실패:", err);
      setError(err.message || "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderVerificationDetails = () => {
    if (!verificationResult?.verificationResults) return null;

    const { metadata, hashValid, signatureValid } = verificationResult.verificationResults;
    const hasMetadata = metadata && Object.keys(metadata).length > 0;

    return (
      <div className={styles.verificationDetails}>
        <h4>검증 상세 결과:</h4>
        <ul>
          {hasMetadata && (
            <li>
              <strong>메타데이터:</strong>
              <ul>
                {Object.entries(metadata).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value?.toString() || '없음'}
                  </li>
                ))}
              </ul>
            </li>
          )}
          <li>
            <strong>해시값 검증:</strong>{" "}
            <span className={hashValid ? styles.validText : styles.invalidText}>
              {hashValid ? "성공" : "실패"}
            </span>
          </li>
          <li>
            <strong>서명 검증:</strong>{" "}
            <span className={signatureValid ? styles.validText : styles.invalidText}>
              {signatureValid ? "성공" : "실패"}
            </span>
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.uploadBox}>
        <h1 className={styles.title}>PDF 파일 업로드</h1>
        <p className={styles.description}>
          분석이 필요한 PDF 파일을 업로드해주세요.
          {!user && (
            <span className={styles.loginNotice}>
              {" "}
              (로그인하시면 분석 결과를 저장할 수 있습니다)
            </span>
          )}
        </p>

        <div className={styles.uploadArea}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className={styles.fileInput}
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className={styles.uploadLabel}>
            <FaFileUpload className={styles.uploadIcon} />
            <span>PDF 파일 선택</span>
          </label>

          {file && (
            <div className={styles.fileInfo}>
              <p>선택된 파일: {file.name}</p>
              <p>크기: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>

        {verificationResult && (
          <div className={`${styles.verificationResult} ${
            verificationResult.status === VerificationStatus.VALID ? styles.valid : styles.invalid
          }`}>
            <div className={styles.verificationHeader}>
              {verificationResult.status === VerificationStatus.VALID ? (
                <FaCheckCircle className={styles.validIcon} />
              ) : (
                <FaExclamationTriangle className={styles.invalidIcon} />
              )}
              <span>{verificationResult.message}</span>
            </div>
            {renderVerificationDetails()}
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          disabled={!file || isUploading || isVerifying}
        >
          {isVerifying ? (
            <>
              <FaSpinner className={styles.spinner} />
              PDF 검증 중...
            </>
          ) : isUploading ? (
            <>
              <FaSpinner className={styles.spinner} />
              업로드 중...
            </>
          ) : (
            "분석 시작하기"
          )}
        </button>

        {!user && (
          <div className={styles.loginPrompt}>
            <p>로그인하시면 더 많은 기능을 이용하실 수 있습니다:</p>
            <ul>
              <li>분석 결과 저장 및 관리</li>
              <li>이전 분석 결과 확인</li>
              <li>전문가 상담 서비스 이용</li>
            </ul>
            <button
              className={styles.loginButton}
              onClick={() => navigate("/login")}
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfUploadPage;
