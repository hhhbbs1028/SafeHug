import React from "react";

// 🔒 개인정보처리방침 페이지
const Privacy = () => {
  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "4rem auto 2rem",
        padding: "2.5rem 2rem",
        background: "#fff",
        borderRadius: "18px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        border: "1px solid #eee",
        color: "#222",
        fontSize: "1.05rem",
        lineHeight: 1.7,
      }}
    >
      {/* 페이지 제목 */}
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: "2rem",
          textAlign: "center",
          letterSpacing: "-0.02em",
          color: "#222",
        }}
      >
        🔒 개인정보처리방침
      </h1>
      {/* 개인정보처리방침 본문 예시 */}
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제1조 (목적)
        </h2>
        <p>
          본 방침은 SafeHug(이하 "서비스")가 이용자의 개인정보를 어떻게 수집,
          이용, 보관, 파기하는지에 대한 기준을 안내합니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제2조 (수집하는 개인정보 항목)
        </h2>
        <p>
          1. 회원가입 시: 이름, 이메일, 비밀번호, 휴대폰번호 등<br />
          2. 서비스 이용 과정에서: 접속 IP, 쿠키, 서비스 이용 기록 등
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제3조 (개인정보의 수집 및 이용목적)
        </h2>
        <p>
          1. 회원 관리 및 본인 확인
          <br />
          2. 서비스 제공 및 맞춤형 서비스 제공
          <br />
          3. 문의 및 민원 처리, 공지사항 전달 등
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제4조 (개인정보의 보유 및 이용기간)
        </h2>
        <p>
          1. 회원 탈퇴 시 즉시 파기
          <br />
          2. 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제5조 (개인정보의 제3자 제공)
        </h2>
        <p>
          서비스는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단,
          법령에 의거하거나 수사기관의 요청이 있는 경우 등은 예외로 합니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제6조 (이용자의 권리와 행사방법)
        </h2>
        <p>
          이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제 요청할 수
          있습니다. 개인정보 관련 문의는 서비스 내 문의하기 또는 이메일로 접수
          가능합니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          부칙
        </h2>
        <p>본 방침은 2025년 3월 4일부터 시행합니다.</p>
      </section>
    </div>
  );
};

export default Privacy;
