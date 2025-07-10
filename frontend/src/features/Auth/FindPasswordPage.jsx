import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FindPasswordPage.module.css";
import { userApi } from "../../api/axios";

const FindPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("올바른 이메일 형식이 아닙니다.");
      }

      // API 호출
      await userApi.findPassword({ email });
      setSuccess(true);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "비밀번호 찾기 요청 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>비밀번호 찾기</h1>
        <p className={styles.description}>
          가입 시 등록한 이메일 주소를 입력해주세요.
          <br />
          해당 이메일로 비밀번호 재설정 링크를 보내드립니다.
        </p>

        {success ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2>이메일이 발송되었습니다</h2>
            <p>
              {email}로 비밀번호 재설정 링크를 보냈습니다.
              <br />
              이메일을 확인해주세요.
            </p>
            <button
              className={styles.backButton}
              onClick={() => navigate("/login")}
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
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
              {isLoading ? "처리 중..." : "비밀번호 재설정 링크 받기"}
            </button>

            <div className={styles.links}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => navigate("/login")}
              >
                로그인으로 돌아가기
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => navigate("/signup")}
              >
                회원가입
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FindPasswordPage;
