import React from "react";

// 📄 이용약관 페이지
const Terms = () => {
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
        📄 이용약관
      </h1>
      {/* 약관 본문 예시 */}
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제1조 (목적)
        </h2>
        <p>
          이 약관은 SafeHug(이하 "서비스")가 제공하는 모든 서비스의 이용과
          관련하여, 서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한
          사항을 규정함을 목적으로 합니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제2조 (정의)
        </h2>
        <p>
          1. "이용자"란 본 약관에 따라 서비스가 제공하는 모든 기능을 이용하는
          회원 및 비회원을 말합니다.
          <br />
          2. "회원"이란 서비스에 개인정보를 제공하여 회원등록을 한 자로서,
          서비스의 정보를 지속적으로 제공받으며, 계속적으로 서비스를 이용할 수
          있는 자를 말합니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제3조 (약관의 효력 및 변경)
        </h2>
        <p>
          1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
          공지함으로써 효력을 발생합니다.
          <br />
          2. 서비스는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수
          있으며, 변경된 약관은 제1항과 같은 방법으로 공지 또는 통지함으로써
          효력을 발생합니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제4조 (서비스의 제공 및 변경)
        </h2>
        <p>
          1. 서비스는 다음과 같은 업무를 수행합니다.
          <br />
          - AI 기반 상담 및 정보 제공
          <br />
          - 증거 수집 및 관리 기능
          <br />- 기타 SafeHug가 정하는 서비스
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제5조 (이용자의 의무)
        </h2>
        <p>
          1. 이용자는 관계 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여
          공지한 주의사항, 서비스가 통지하는 사항 등을 준수하여야 하며, 기타
          서비스의 업무에 방해되는 행위를 하여서는 안 됩니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          제6조 (면책조항)
        </h2>
        <p>
          1. 서비스는 천재지변, 불가항력적 사유, 이용자의 귀책사유 등으로
          서비스를 제공할 수 없는 경우 책임을 지지 않습니다.
          <br />
          2. 서비스는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여
          책임을 지지 않습니다.
        </p>
      </section>
      <section style={{ marginBottom: "2.2rem" }}>
        <h2
          style={{ fontSize: "1.18rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          부칙
        </h2>
        <p>본 약관은 2025년 3월 4일부터 시행합니다.</p>
      </section>
    </div>
  );
};

export default Terms;
