import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./LoginPage.module.css";
import handImage from "../../assets/hand.jpg";
import kakaoLoginBtn from "../../assets/kakao_login_large_narrow.png";
import naverLoginBtn from "../../assets/btnG_완성형.png";
import EyeIcon from "../../assets/Eye.png";
import HideIcon from "../../assets/Hide.png";

// 로그인 페이지 컴포넌트
const LoginPage = () => {
  const navigate = useNavigate();
  const { login, socialLogin } = useAuth();

  // 입력값 상태 관리
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // 오류 상태 관리
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [keepLogin, setKeepLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 입력값이 변경되면 해당 필드의 오류 메시지 초기화
    setErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  };

  // 이메일 유효성 검사
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "이메일을 입력해주세요";
    if (!emailRegex.test(email)) return "올바른 이메일 형식이 아닙니다";
    return "";
  };

  // 비밀번호 유효성 검사
  const validatePassword = (password) => {
    if (!password) return "비밀번호를 입력해주세요";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다";
    return "";
  };

  // 로그인 버튼 클릭 시
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 모든 필드 유효성 검사
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      general: ""
    };

    setErrors(newErrors);

    // 유효성 검사 실패 시
    if (Object.values(newErrors).some(error => error)) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password, keepLogin);
      if (!result.success) {
        // 서버에서 전달한 에러 구조에 맞게 처리
        if (result.error?.errors?.length > 0) {
          setErrors(prev => ({
            ...prev,
            general: result.error.errors[0]
          }));
        } else if (result.error?.message) {
          setErrors(prev => ({
            ...prev,
            general: result.error.message
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            general: "이메일 또는 비밀번호가 올바르지 않습니다."
          }));
        }
        return;
      }
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      // 서버에서 전달한 에러 구조에 맞게 처리
      if (error.response?.data?.errors?.length > 0) {
        setErrors(prev => ({
          ...prev,
          general: error.response.data.errors[0]
        }));
      } else if (error.response?.data?.message) {
        setErrors(prev => ({
          ...prev,
          general: error.response.data.message
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: "로그인 중 오류가 발생했습니다. 다시 시도해주세요."
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 핸들러
  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      setErrors(prev => ({ ...prev, general: "" }));
      await socialLogin("kakao");
    } catch (error) {
      console.error("Kakao login error:", error);
      setErrors(prev => ({
        ...prev,
        general: error.message || "카카오 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요."
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    try {
      setIsLoading(true);
      setErrors(prev => ({ ...prev, general: "" }));
      await socialLogin("naver");
    } catch (error) {
      console.error("Naver login error:", error);
      setErrors(prev => ({
        ...prev,
        general: error.message || "네이버 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요."
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainContent}>
        {/* 좌측: 소개 섹션 */}
        <div className={styles.leftPanel}>
          <div className={styles.imageBox}>
            <img src={handImage} alt="손 이미지" className={styles.handImg} />
          </div>
          <div className={styles.introBox}>
            <h1 className={styles.introTitle}>안전한 대화를 위한 첫걸음</h1>
            <p className={styles.introDesc}>
              SafeHug는 당신의 대화를 분석하고 보호합니다.
              <br />
              더 안전하고 건강한 대화를 시작하세요.
            </p>
          </div>
          <div className={styles.featuresRow}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3 className={styles.featureTitle}>안전한 분석</h3>
              <p className={styles.featureDesc}>
                AI 기반의 정확한 대화 분석으로
                <br />
                위험 요소를 사전에 감지합니다
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💬</div>
              <h3 className={styles.featureTitle}>실시간 피드백</h3>
              <p className={styles.featureDesc}>
                대화 내용을 실시간으로 분석하여
                <br />
                즉각적인 피드백을 제공합니다
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3 className={styles.featureTitle}>상세한 리포트</h3>
              <p className={styles.featureDesc}>
                대화 패턴과 위험도를
                <br />
                상세하게 분석해드립니다
              </p>
            </div>
          </div>
        </div>

        {/* 우측: 로그인 폼 */}
        <div className={styles.rightPanel}>
          <div className={styles.loginBox}>
            <h2 className={styles.loginTitle}>로그인</h2>
            <p className={styles.loginSubtitle}>안전한 공간에 오신 것을 환영합니다</p>
            
            <form className={styles.form} onSubmit={handleLogin}>
              {/* 이메일 입력 */}
              <label className={styles.label} htmlFor="email">이메일</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.error : ''}`}
                placeholder="이메일을 입력해주세요"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}

              {/* 비밀번호 입력 */}
              <label className={styles.label} htmlFor="password">비밀번호</label>
              <div className={styles.passwordRow}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`${styles.input} ${errors.password ? styles.error : ''}`}
                  placeholder="비밀번호를 입력해주세요"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className={styles.showPwBtn}
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  <img
                    src={showPassword ? HideIcon : EyeIcon}
                    alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  />
                </button>
              </div>
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}

              {/* 로그인 상태 유지 & 비밀번호 찾기 */}
              <div className={styles.optionsRow}>
                <label className={styles.keepLoginLabel}>
                  <input
                    type="checkbox"
                    checked={keepLogin}
                    onChange={(e) => setKeepLogin(e.target.checked)}
                  />
                  로그인 상태 유지
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/find-password")}
                  className={styles.forgotPw}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              {/* 일반 오류 메시지 표시 */}
              {errors.general && (
                <div className={styles.errorMessage}>
                  <p>{errors.general}</p>
                </div>
              )}

              {/* 로그인 버튼 */}
              <button 
                type="submit" 
                className={styles.loginBtn}
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            {/* 구분선 */}
            <div className={styles.divider}>간편 로그인</div>

            {/* 소셜 로그인 버튼들 */}
            <div className={styles.socialLoginButtons}>
              <button 
                className={styles.kakaoBtn} 
                onClick={handleKakaoLogin}
                disabled={isLoading}
                aria-label="카카오 로그인"
              >
                <img
                  src={kakaoLoginBtn}
                  alt="카카오 로그인"
                  className={styles.kakaoLoginImage}
                />
              </button>
              <button 
                className={styles.naverBtn} 
                onClick={handleNaverLogin}
                disabled={isLoading}
                aria-label="네이버 로그인"
              >
                <img
                  src={naverLoginBtn}
                  alt="네이버 로그인"
                  className={styles.naverLoginImage}
                />
              </button>
            </div>

            {/* 회원가입 링크 */}
            <div className={styles.signupRow}>
              <span>아직 계정이 없으신가요?</span>
              <Link to="/signup" className={styles.signupLink}>
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
