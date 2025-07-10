import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../../api/axios";
import styles from "./SignupPage.module.css";
import handImage from "../../assets/hand.jpg";
import kakaoLoginBtn from "../../assets/kakao_login_large_narrow.png";
import naverLoginBtn from "../../assets/btnG_완성형.png";
import EyeIcon from "../../assets/Eye.png";
import HideIcon from "../../assets/Hide.png";

// 회원가입 페이지 컴포넌트
// - 이메일, 비밀번호, 비밀번호 확인, 회원가입 버튼
const SignupPage = () => {
  const navigate = useNavigate();
  // 상태 관리
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone1: "",
    phone2: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone1: "",
    phone2: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [submitError, setSubmitError] = useState(""); // 회원가입 실패 메시지 상태 추가

  // 유효성 검사 함수들
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "이메일을 입력해주세요";
    if (!emailRegex.test(email)) return "올바른 이메일 형식이 아닙니다";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "비밀번호를 입력해주세요";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다";
    if (!/^[A-Za-z0-9!@#$%^&*]+$/.test(password))
      return "영어, 숫자, 특수문자(!@#$%^&*)만 사용 가능합니다";
    if (!/[A-Za-z]/.test(password)) return "영어를 포함해야 합니다";
    if (!/[0-9]/.test(password)) return "숫자를 포함해야 합니다";
    if (!/[!@#$%^&*]/.test(password)) return "특수문자를 포함해야 합니다";
    return "";
  };

  const validatePhone = (phone1, phone2) => {
    if (!phone1 || !phone2) return "전화번호를 입력해주세요";
    if (phone1.length !== 4 || phone2.length !== 4)
      return "전화번호는 4자리씩 입력해주세요";
    return "";
  };

  // 이메일 중복 확인 함수
  const checkEmailAvailability = async (email) => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: "이메일을 입력해주세요" }));
      setIsEmailVerified(false);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      setIsEmailVerified(false);
      return;
    }

    setIsEmailChecking(true);
    setErrors(prev => ({ ...prev, email: "" }));
    
    try {
      const response = await userApi.checkEmail(email);
      setIsEmailAvailable(!response.data);
      setIsEmailVerified(!response.data);
      if (response.data) {
        setErrors(prev => ({ ...prev, email: "이미 사용 중인 이메일입니다" }));
      }
    } catch (error) {
      console.error("이메일 확인 중 오류:", error);
      setErrors(prev => ({ ...prev, email: "이메일 확인 중 오류가 발생했습니다" }));
      setIsEmailVerified(false);
    } finally {
      setIsEmailChecking(false);
    }
  };

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 전화번호 입력 처리
    if (name === "phone1" || name === "phone2") {
      // 숫자만 허용
      const cleaned = value.replace(/[^\d]/g, "");

      // 최대 4자리로 제한
      const formatted = cleaned.slice(0, 4);

      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));

      // 유효성 검사
      const error = validatePhone(
        name === "phone1" ? formatted : formData.phone1,
        name === "phone2" ? formatted : formData.phone2
      );
      setErrors((prev) => ({
        ...prev,
        phone1: error,
        phone2: error,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 실시간 유효성 검사
    let error = "";
    switch (name) {
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "confirmPassword":
        error =
          formData.password !== value ? "비밀번호가 일치하지 않습니다" : "";
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(""); // 제출 전 에러 메시지 초기화
    // 모든 필드 유효성 검사
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword:
        formData.password !== formData.confirmPassword
          ? "비밀번호가 일치하지 않습니다"
          : "",
      phone1: validatePhone(formData.phone1, formData.phone2),
      phone2: validatePhone(formData.phone1, formData.phone2),
    };

    setErrors(newErrors);

    // 에러가 있거나 약관에 동의하지 않은 경우 제출 방지
    if (Object.values(newErrors).some((error) => error) || !agreeTerms) {
      return;
    }

    try {
      // 백엔드에서 요구하는 값만 추려서 전송 (name, email, password, phoneNumber)
      const submitData = {
        name: formData.name, // 이름
        email: formData.email, // 이메일
        password: formData.password, // 비밀번호
        phoneNumber: `010-${formData.phone1}-${formData.phone2}`, // 전화번호
      };

      await userApi.signup(submitData);
      // 회원가입 성공 시 로그인 페이지로 이동
      window.alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (error) {
      setSubmitError(error.message || "회원가입에 실패했습니다.");
      console.error("회원가입 실패:", error);
    }
  };

  // 소셜 로그인 핸들러 추가
  const handleSocialLogin = async (provider) => {
    try {
      const { data } = await userApi.getSocialLoginPage(provider);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setSubmitError(
        error.message || "소셜 로그인 처리 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* 메인 컨텐츠 */}
      <div className={styles.mainContent}>
        {/* 좌측: 소개/이미지/설명/특징 */}
        <div className={styles.leftPanel}>
          {/* 중앙 손 사진 */}
          <div className={styles.imageBox}>
            <img src={handImage} alt="손 사진" className={styles.handImg} />
          </div>
          {/* 소개 문구 */}
          <div className={styles.introBox}>
            <h1 className={styles.introTitle}>
              안전한 공간에서
              <br />
              당신의 이야기를 시작하세요
            </h1>
            <p className={styles.introDesc}>
              SafeHug는 당신의 모든 기록을 안전하게 보호합니다.
              <br />
              전문가와 함께 하는 회복의 여정을 시작해보세요.
            </p>
            <div className={styles.featuresRow}>
              <div className={styles.featureCard}>
                <span
                  className={styles.featureIcon}
                  role="img"
                  aria-label="보안"
                >
                  🔒
                </span>
                <span className={styles.featureTitle}>암호화 보안</span>
                <span className={styles.featureDesc}>
                  모든 데이터는 암호화되어 저장됩니다
                </span>
              </div>
              <div className={styles.featureCard}>
                <span
                  className={styles.featureIcon}
                  role="img"
                  aria-label="AI상담"
                >
                  🤖
                </span>
                <span className={styles.featureTitle}>AI 상담</span>
                <span className={styles.featureDesc}>
                  24시간 AI 챗봇이 함께합니다
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 회원가입 폼 */}
        <div className={styles.rightPanel}>
          <div className={styles.signupBox}>
            <h2 className={styles.signupTitle}>회원가입</h2>
            <p className={styles.signupSubtitle}>
              안전한 지원을 위해 필요한 정보를 입력해주세요
            </p>

            {/* 에러 메시지 표시 */}
            {submitError && (
              <div className={styles.errorText} style={{ marginBottom: 10 }}>
                {submitError}
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              {/* 이름 입력 */}
              <label className={styles.label} htmlFor="name">
                이름
              </label>
              <input
                id="name"
                type="text"
                name="name"
                className={`${styles.input} ${styles.formInput} ${
                  errors.name ? styles.inputError : ""
                }`}
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                required
              />
              {errors.name && (
                <span className={styles.errorText}>{errors.name}</span>
              )}

              {/* 이메일 입력 */}
              <label className={styles.label} htmlFor="email">
                이메일
              </label>
              <div className={styles.emailInputGroup}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={`${styles.input} ${styles.formInput} ${
                    errors.email ? styles.inputError : ""
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => checkEmailAvailability(formData.email)}
                  placeholder="example@email.com"
                  required
                />
                <button
                  type="button"
                  className={styles.checkEmailBtn}
                  onClick={() => checkEmailAvailability(formData.email)}
                  disabled={isEmailChecking || !formData.email}
                >
                  {isEmailChecking ? "확인 중..." : "중복 확인"}
                </button>
              </div>
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
              {isEmailAvailable !== null && (
                <span className={isEmailAvailable ? styles.successText : styles.errorText}>
                  {isEmailAvailable ? "사용 가능한 이메일입니다" : "이미 사용 중인 이메일입니다"}
                </span>
              )}

              {/* 비밀번호 입력 */}
              <label className={styles.label} htmlFor="password">
                비밀번호
              </label>
              <div className={styles.passwordRow}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`${styles.input} ${styles.formInput} ${
                    errors.password ? styles.inputError : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="영어, 숫자, 특수문자(!@#$%^&*) 포함 8자 이상"
                  required
                />
                <button
                  type="button"
                  className={styles.showPwBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img
                    src={showPassword ? HideIcon : EyeIcon}
                    alt={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  />
                </button>
              </div>
              {errors.password && (
                <span className={styles.errorText}>{errors.password}</span>
              )}

              {/* 비밀번호 확인 입력 */}
              <label className={styles.label} htmlFor="confirmPassword">
                비밀번호 확인
              </label>
              <div className={styles.passwordRow}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`${styles.input} ${styles.formInput} ${
                    errors.confirmPassword ? styles.inputError : ""
                  }`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력해주세요"
                />
                <button
                  type="button"
                  className={styles.showPwBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <img
                    src={showConfirmPassword ? HideIcon : EyeIcon}
                    alt={
                      showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                  />
                </button>
              </div>
              {errors.confirmPassword && (
                <span className={styles.errorText}>
                  {errors.confirmPassword}
                </span>
              )}

              {/* 전화번호 입력 */}
              <label className={styles.label} htmlFor="phone1">
                전화번호
              </label>
              <div className={styles.phoneInputGroup}>
                <span className={styles.phonePrefix}>010-</span>
                <input
                  id="phone1"
                  type="tel"
                  name="phone1"
                  className={`${styles.input} ${styles.formInput} ${
                    errors.phone1 ? styles.inputError : ""
                  }`}
                  value={formData.phone1}
                  onChange={handleChange}
                  placeholder="0000"
                  maxLength={4}
                  required
                />
                <span className={styles.phoneSeparator}>-</span>
                <input
                  id="phone2"
                  type="tel"
                  name="phone2"
                  className={`${styles.input} ${styles.formInput} ${
                    errors.phone2 ? styles.inputError : ""
                  }`}
                  value={formData.phone2}
                  onChange={handleChange}
                  placeholder="0000"
                  maxLength={4}
                  required
                />
              </div>
              {errors.phone1 && (
                <span className={styles.errorText}>{errors.phone1}</span>
              )}

              {/* 이용약관 동의 */}
              <div className={styles.termsRow}>
                <label className={styles.keepLoginLabel}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <Link to="/terms" className={styles.termsLink}>
                    이용약관
                  </Link>
                  과
                  <Link to="/privacy" className={styles.termsLink}>
                    개인정보처리방침
                  </Link>
                  에 동의합니다
                </label>
              </div>

              {/* 회원가입 버튼 */}
              <button
                type="submit"
                className={styles.signupBtn}
                disabled={
                  !agreeTerms || 
                  !isEmailVerified || 
                  Object.values(errors).some((error) => error)
                }
              >
                회원가입
              </button>
            </form>

            {/* 구분선 */}
            <div className={styles.divider}>간편 회원가입</div>

            {/* 소셜 회원가입 버튼들 */}
            <div className={styles.socialLoginButtons}>
              <button
                className={styles.kakaoBtn}
                onClick={() => handleSocialLogin("kakao")}
              >
                <img
                  src={kakaoLoginBtn}
                  alt="카카오 로그인"
                  className={styles.kakaoLoginImage}
                />
              </button>
              <button
                className={styles.naverBtn}
                onClick={() => handleSocialLogin("naver")}
              >
                <img
                  src={naverLoginBtn}
                  alt="네이버 로그인"
                  className={styles.naverLoginImage}
                />
              </button>
            </div>

            {/* 로그인 링크 */}
            <div className={styles.loginRow}>
              <span>이미 계정이 있으신가요?</span>
              <Link to="/login" className={styles.loginLink}>
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
