# SafeHug 🤖

**AI 기반 성범죄 피해자 지원 플랫폼**  
AI-Powered Sexual Violence Support Platform

## 📝 프로젝트 소개 | Project Overview

SafeHug는 성범죄 피해자를 위한 AI 기반 지원 플랫폼입니다.  
피해자가 직접 신고하거나 증거를 수집하기 어려운 현실을 반영하여, AI가 위험 발언을 자동 분석하고 법적 증거화 과정을 지원합니다.

SafeHug is an AI-powered support platform for sexual violence victims.  
Recognizing the challenges victims face in reporting and collecting evidence, our platform uses AI to automatically analyze threatening messages and support the legal evidence collection process.

## ✨ 주요 기능 | Key Features

- 📂 카카오톡 대화 파일 업로드 및 분석
  - KakaoTalk chat file upload and analysis
- ⚠️ GPT 기반 위험 발언 자동 분류
  - GPT-based automatic classification of threatening messages
  - 성적/강요/협박/스토킹 등 분류
  - Classification of sexual/coercion/threats/stalking
- 📊 대화 내용 위험도 시각화
  - Conversation risk level visualization
  - 그래프/통계 카드 제공
  - Graph/statistics cards
- 🧠 피해 상담 챗봇
  - Victim counseling chatbot
  - 상황별 응답 시나리오 제공
  - Response scenarios for different situations
- 🗂️ 증거 자동 정리 및 PDF 출력
  - Automatic evidence organization and PDF export
- 🔒 보안 기능
  - Security features
  - 데이터 암호화 및 즉시 삭제 시스템
  - Data encryption and instant deletion system
- 📎 전문기관 연결 기능 (준비 중)
  - Professional organization connection (Coming soon)

## 🛠️ 기술 스택 | Tech Stack

### Frontend
- React 19.1.0
- React Router DOM 7.5.1
- Styled Components 6.1.17
- Recharts 2.15.3 (데이터 시각화)
- React Date Range 2.0.1
- React Toastify 11.0.5
- jsPDF 3.0.1 (PDF 생성)

### Backend
- Spring Boot 3.4.4
- Java 21
- Spring Security
- Spring Data JPA
- Spring WebFlux
- JWT (JSON Web Token)

### AI/ML
- KoBERT (한국어 BERT)
- OpenAI GPT API
- PyTorch
- SafeTensors

### Database & Storage
- MySQL 8.0
- AWS S3 (파일 저장)
- AWS RDS (데이터베이스)

### Infrastructure
- AWS EC2
- Docker
- Nginx

### Security
- Spring Security
- JWT Authentication
- AWS IAM

## ⚙️ 설치 및 실행 | Installation & Setup

### 1. 사전 요구사항 | Prerequisites

- Java 21
- Node.js 18 이상
- MySQL 8.0
- Python 3.10 이상
- AWS 계정 및 인증 정보

### 2. 백엔드 | Backend

```bash
# 1. 프로젝트 클론
git clone https://github.com/your-username/SafeHug.git
cd SafeHug

# 2. 백엔드 디렉토리로 이동
cd backend

# 3. Gradle 빌드
./gradlew build

# 4. 애플리케이션 실행
./gradlew bootRun
```

### 3. 프론트엔드 | Frontend

```bash
# 1. 프론트엔드 디렉토리로 이동
cd frontend

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm start
```

### 4. AI 서버 | AI Server

```bash
# 1. AI 디렉토리로 이동
cd ai

# 2. Python 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. AI 서버 실행
python ai_server.py
```

### 5. 환경 설정 | Environment Setup

각 디렉토리에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

#### Backend (.env)
```properties
# Database
DB_URL=jdbc:mysql://localhost:3306/safehug
DB_USERNAME=your_username
DB_PASSWORD=your_password

# AWS
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your_bucket_name

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400000

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

#### Frontend (.env)
```properties
REACT_APP_API_URL=http://localhost:8080
REACT_APP_AI_SERVER_URL=http://localhost:5000
```

#### AI Server (.env)
```properties
OPENAI_API_KEY=your_openai_api_key
MODEL_PATH=./multi_label_kobert_model
```

### 6. 데이터베이스 설정 | Database Setup

```sql
CREATE DATABASE safehug CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 📁 프로젝트 구조 | Project Structure

```
SafeHug/
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── api/           # API 통신 관련
│   │   ├── assets/        # 이미지, 폰트 등 정적 파일
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── contexts/      # React Context
│   │   ├── features/      # 기능별 모듈
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── routes/        # 라우팅 설정
│   │   ├── services/      # 비즈니스 로직
│   │   ├── styles/        # 전역 스타일
│   │   └── types/         # TypeScript 타입 정의
│   └── public/            # 정적 파일
│
├── backend/                # Spring Boot 백엔드
│   └── src/main/java/com/capstone/SafeHug/
│       ├── config/        # 설정 파일
│       ├── controller/    # API 엔드포인트
│       ├── service/       # 비즈니스 로직
│       ├── repository/    # 데이터 접근 계층
│       ├── entity/        # 데이터베이스 엔티티
│       ├── dto/          # 데이터 전송 객체
│       ├── security/     # 보안 관련
│       ├── common/       # 공통 유틸리티
│       └── exception/    # 예외 처리
│
├── ai/                    # AI 서버
│   ├── multi_label_kobert_model/  # KoBERT 모델
│   ├── ai_server.py      # AI 서버 메인
│   ├── kobert.py         # KoBERT 구현
│   ├── train_final.py    # 모델 학습
│   ├── gpt-label.py      # GPT 라벨링
│   └── requirements.txt  # Python 의존성
│
├── docs/                  # 문서
├── logs/                  # 로그 파일
└── README.md             # 프로젝트 설명
```

### 주요 디렉토리 설명 | Key Directories

#### Frontend
- `components/`: 재사용 가능한 UI 컴포넌트
- `features/`: 주요 기능별 모듈화된 코드
- `pages/`: 각 페이지 컴포넌트
- `services/`: API 통신 및 비즈니스 로직

#### Backend
- `controller/`: REST API 엔드포인트 정의
- `service/`: 비즈니스 로직 구현
- `repository/`: 데이터베이스 접근 계층
- `security/`: 인증/인가 관련 구현

#### AI
- `multi_label_kobert_model/`: 학습된 KoBERT 모델
- `ai_server.py`: AI 서버 메인 로직
- `kobert.py`: KoBERT 모델 구현
- `train_final.py`: 모델 학습 코드