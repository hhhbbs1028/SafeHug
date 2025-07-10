import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import { userApi } from "../../api/axios";

// 비밀번호 유효성 검사 규칙 상수
const PASSWORD_RULES = {
  minLength: 8,
  hasNumber: /[0-9]/,
  hasLowerCase: /[a-z]/,
  hasUpperCase: /[A-Z]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

const Profile = () => {
  const { user, updateUserProfile, setUser } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");

  // 사용자 정보 상태 관리
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    socialAccount: null,
  });

  // 에러 메시지 상태 관리
  const [errors, setErrors] = useState({});
  // 성공 메시지 상태 관리
  const [successMessage, setSuccessMessage] = useState("");
  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(false);

  // 초기 사용자 데이터 설정
  useEffect(() => {
    if (user) {
      // user 객체 구조를 콘솔에 출력 (디버깅용)
      console.log("[Profile] user 객체 구조:", user);
      setUserInfo((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        socialAccount: user.socialAccount || null,
      }));
    }
  }, [user]);

  // 비밀번호 유효성 검사 함수
  const validatePassword = useCallback((password) => {
    const failedRules = [];

    if (password.length < PASSWORD_RULES.minLength)
      failedRules.push("8자 이상");
    if (!PASSWORD_RULES.hasNumber.test(password)) failedRules.push("숫자");
    if (!PASSWORD_RULES.hasLowerCase.test(password) && !PASSWORD_RULES.hasUpperCase.test(password))
      failedRules.push("영문자");
    if (!PASSWORD_RULES.hasSpecialChar.test(password))
      failedRules.push("특수문자");

    return failedRules;
  }, []);

  // 입력값 유효성 검사
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (userInfo.newPassword) {
      const failedRules = validatePassword(userInfo.newPassword);

      if (failedRules.length > 0) {
        newErrors.newPassword = `비밀번호는 ${failedRules.join(
          ", "
        )}를 포함해야 합니다.`;
      }

      if (userInfo.newPassword !== userInfo.confirmPassword) {
        newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [userInfo.newPassword, userInfo.confirmPassword, validatePassword]);

  // 프로필 수정 핸들러
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      // 현재 비밀번호가 비어있는지 확인
      if (!userInfo.password) {
        setErrors({ submit: "현재 비밀번호를 입력해주세요." });
        return;
      }

      // 새 비밀번호가 비어있는지 확인
      if (!userInfo.newPassword) {
        setErrors({ submit: "새 비밀번호를 입력해주세요." });
        return;
      }

      try {
        setIsLoading(true);
        console.log("비밀번호 변경 요청 데이터:", {
          currentPassword: userInfo.password,
          newPassword: userInfo.newPassword,
        });
        
        const result = await userApi.changePassword({
          currentPassword: userInfo.password,
          newPassword: userInfo.newPassword,
        });

        if (result.success) {
          setSuccessMessage("비밀번호가 성공적으로 변경되었습니다.");
          setUserInfo((prev) => ({
            ...prev,
            password: "",
            newPassword: "",
            confirmPassword: "",
          }));
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setErrors({ submit: result.message || "비밀번호 변경에 실패했습니다." });
        }
      } catch (error) {
        console.error("비밀번호 변경 오류:", error);
        setErrors({
          submit: error.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [userInfo, validateForm]
  );

  // 입력 필드 변경 핸들러
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setUserInfo((prev) => ({
        ...prev,
        [name]: value,
      }));
      // 에러 메시지 초기화
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [errors]
  );

  // 소셜 계정 정보 메모이제이션
  const socialAccountInfo = useMemo(() => {
    if (!userInfo.socialAccount) return null;

    const providerMap = {
      google: "Google",
      kakao: "카카오",
      naver: "네이버",
    };

    return {
      provider:
        providerMap[userInfo.socialAccount.provider] ||
        userInfo.socialAccount.provider,
      connectedAt: new Date(
        userInfo.socialAccount.connectedAt
      ).toLocaleDateString(),
    };
  }, [userInfo.socialAccount]);

  // 회원탈퇴 핸들러
  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      setIsLoading(true);
      await userApi.delete("/users/me");
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      window.dispatchEvent(new Event("authChange"));
      navigate("/login?message=" + encodeURIComponent("계정이 성공적으로 삭제되었습니다. 이용해 주셔서 감사합니다."));
    } catch (error) {
      console.error("Account deletion error:", error);
      setError("계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.loadingState}>사용자 정보를 불러오는 중...</div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>프로필 정보</h1>

      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}

      {errors.fetch && (
        <div className={styles.errorMessage}>{errors.fetch}</div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.basicInfo}>
          <h2>기본 정보</h2>
          <div className={styles.infoRow}>
            <span className={styles.label}>이름</span>
            <span className={styles.value}>{userInfo.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>이메일</span>
            <span className={styles.value}>{userInfo.email}</span>
          </div>
        </div>

        <div className={styles.passwordSection}>
          <h2>비밀번호 변경</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="password">현재 비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={userInfo.password}
              onChange={handleChange}
              placeholder="현재 비밀번호를 입력하세요"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={userInfo.newPassword}
              onChange={handleChange}
              placeholder="새 비밀번호를 입력하세요"
            />
            {errors.newPassword && (
              <span className={styles.errorText}>{errors.newPassword}</span>
            )}
            <span className={styles.passwordHint}>
              비밀번호는 8자 이상, 영문(소문자 또는 대문자), 숫자, 특수문자를 포함해야
              합니다.
            </span>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">새 비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={userInfo.confirmPassword}
              onChange={handleChange}
              placeholder="새 비밀번호를 다시 입력하세요"
            />
            {errors.confirmPassword && (
              <span className={styles.errorText}>{errors.confirmPassword}</span>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </div>

        <div className={styles.deleteAccountSection}>
          <h2>회원 탈퇴</h2>
          <p className={styles.deleteWarning}>
            회원 탈퇴 시 모든 개인정보와 데이터가 삭제되며, 복구가 불가능합니다.
            정말로 탈퇴하시겠습니까?
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => setShowDeleteConfirm(true)}
            >
              회원 탈퇴
            </button>
          ) : (
            <div className={styles.deleteConfirmBox}>
              <div className={styles.inputGroup}>
                <label htmlFor="deletePassword">비밀번호 확인</label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  disabled={isLoading}
                />
                {deleteError && (
                  <span className={styles.errorText}>{deleteError}</span>
                )}
              </div>

              <div className={styles.deleteConfirmButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  disabled={isLoading}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.confirmDeleteButton}
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? "처리 중..." : "탈퇴 확인"}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Profile;
