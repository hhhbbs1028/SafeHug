import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./ResetPasswordPage.module.css";
import { userApi } from "../../api/axios";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password) => {
    // 최소 8자, 영문(소문자 또는 대문자), 숫자, 특수문자 조합
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*#?&])[a-zA-Z\d@$!%*#?&]{8,20}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // 비밀번호 유효성 검사
    if (!validatePassword(formData.password)) {
      setError("비밀번호는 8~20자의 영문, 숫자, 특수문자를 포함해야 합니다.");
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      await userApi.resetPassword({
        token,
        newPassword: formData.password,
      });
      setSuccess(true);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "비밀번호 재설정 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.formBox}>
          <h1 className={styles.title}>잘못된 접근</h1>
          <p className={styles.description}>
            유효하지 않은 비밀번호 재설정 링크입니다.
            <br />
            비밀번호 찾기를 다시 시도해주세요.
          </p>
          <button
            className={styles.backButton}
            onClick={() => navigate("/find-password")}
          >
            비밀번호 찾기로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>비밀번호 재설정</h1>
        <p className={styles.description}>
          새로운 비밀번호를 입력해주세요.
          <br />
          비밀번호는 8자 이상, 영문(소문자 또는 대문자), 숫자, 특수문자를 포함해야 합니다.
        </p>

        {success ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2>비밀번호가 변경되었습니다</h2>
            <p>새로운 비밀번호로 로그인해주세요.</p>
            <button
              className={styles.backButton}
              onClick={() => navigate("/login")}
            >
              로그인 페이지로 이동
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">새 비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="새 비밀번호를 입력하세요"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
                required
                disabled={isLoading}
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "처리 중..." : "비밀번호 변경"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
