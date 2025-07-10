from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import json
import re
from datetime import datetime
import os
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from torch import nn
import logging
import sys
from collections import Counter, defaultdict
import jpype
import jpype.imports
from konlpy.tag import Okt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
import networkx as nx
import traceback
import boto3
from dotenv import load_dotenv
import io
from kobert_transformers import get_tokenizer, get_kobert_model
from enum import Enum
from safetensors.torch import load_file
import codecs
import json
from transformers.tokenization_utils import PreTrainedTokenizer
from transformers.tokenization_utils_base import BatchEncoding
from transformers.utils import logging as transformers_logging

# .env 파일 로드
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_server.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Windows 환경에서의 인코딩 설정
if sys.platform == 'win32':
    import locale
    locale.getpreferredencoding = lambda: 'UTF-8'
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수에서 설정 로드
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_DEFAULT_REGION = os.getenv('AWS_DEFAULT_REGION', 'ap-northeast-2')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
PORT = int(os.getenv('PORT', 5000))
HOST = os.getenv('HOST', '0.0.0.0')
MODEL_PATH = os.getenv('MODEL_PATH', 'multi_label_kobert_model/model.safetensors')
TOKENIZER_PATH = os.getenv('TOKENIZER_PATH', 'multi_label_kobert_model/tokenizer')
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 환경 변수 검증
if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION]):
    logger.error("AWS 자격 증명이 설정되지 않았습니다.")
    sys.exit(1)

# 모델 파일 존재 확인
if not os.path.exists(MODEL_PATH):
    logger.error(f"모델 파일을 찾을 수 없습니다: {MODEL_PATH}")
    sys.exit(1)

# 토크나이저 디렉토리 확인
if not os.path.exists(TOKENIZER_PATH):
    logger.warning(f"토크나이저 디렉토리를 찾을 수 없습니다: {TOKENIZER_PATH}")
    logger.info("기본 KoBERT 토크나이저를 사용합니다.")
    TOKENIZER_PATH = "monologg/kobert"

# S3 클라이언트 설정
session = boto3.Session(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION
)

s3_client = session.client(
    's3',
    config=boto3.session.Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'}
    )
)

# FastAPI 앱 설정
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NLTK 데이터 다운로드
nltk.download('punkt')
nltk.download('stopwords')

class RiskType(str, Enum):
    SEXUAL = "성적"
    STALKING = "스토킹"
    COERCION = "강요"
    THREAT = "협박"
    PERSONAL_INFO = "개인정보"
    DISCRIMINATION = "차별"
    INSULT = "모욕"
    REJECTION = "거절"
    NORMAL = "일반"

    @classmethod
    def get_by_index(cls, index):
        """인덱스로 RiskType 반환"""
        return list(cls)[index]

    @classmethod
    def get_by_value(cls, value):
        """값으로 RiskType 반환"""
        for risk_type in cls:
            if risk_type.value == value:
                return risk_type
        return cls.NORMAL

class RiskLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NORMAL = "NORMAL"

class KoBERTClassifier(nn.Module):
    def __init__(self, num_labels=9):
        super().__init__()
        self.kobert = AutoModel.from_pretrained(
            "monologg/kobert", 
            trust_remote_code=True
        )
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(self.kobert.config.hidden_size, num_labels)
        self.sigmoid = nn.Sigmoid()

    def forward(self, input_ids, attention_mask, token_type_ids=None, output_attentions=False):
        outputs = self.kobert(
            input_ids=input_ids, 
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
            output_attentions=output_attentions
        )
        pooled_output = outputs[1]
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        probs = self.sigmoid(logits)
        
        if output_attentions:
            return probs, outputs[2]  # outputs[2]는 어텐션 가중치
        return probs

class TextClassifier:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # 모델 초기화
        self.model = KoBERTClassifier()
        self.model.to(self.device)
        
        # 가중치 로드
        try:
            state_dict = load_file("multi_label_kobert_model/model.safetensors")
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)  # 가중치 로드 후 다시 GPU로 이동
            self.model.eval()
            logger.info("Model weights loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model weights: {str(e)}")
            raise
        
        # 토크나이저 초기화
        self.tokenizer = AutoTokenizer.from_pretrained("monologg/kobert", trust_remote_code=True)
        
        # 레이블 매핑
        self.id2label = {
            0: "성적",
            1: "스토킹",
            2: "강요",
            3: "협박",
            4: "개인정보",
            5: "차별",
            6: "모욕",
            7: "거절",
            8: "일반"
        }
        logger.info(f"레이블 매핑: {self.id2label}")

    def preprocess_text(self, text: str) -> str:
        """텍스트 전처리 함수."""
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"
            u"\U0001F300-\U0001F5FF"
            u"\U0001F680-\U0001F6FF"
            u"\U0001F1E0-\U0001F1FF"
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE)
        text = emoji_pattern.sub(r'', text)
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'[^\w\s가-힣]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def classify_text(self, text: str) -> Dict[str, Any]:
        """텍스트를 분류하고 위험도를 반환합니다."""
        try:
            # 입력 텍스트 로깅
            logger.info(f"Input text: {text}")
            
            # 토큰화
            inputs = self.tokenizer(
                text,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt",
                return_token_type_ids=False
            )
            
            # GPU 사용 가능시 GPU로 이동
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
                self.model.cuda()
            
            # 추론
            with torch.no_grad():
                outputs = self.model(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask']
                )
                
                # 시그모이드 적용 (한 번만)
                probs = torch.sigmoid(outputs)
                logger.info(f"Model outputs: {probs}")
                
                # CPU로 이동 후 numpy 변환
                probs = probs.cpu().numpy()[0]
                
                # 레이블별 확률 계산
                label_probs = {
                    self.id2label[i]: float(prob)
                    for i, prob in enumerate(probs)
                }
                logger.info(f"Label probabilities: {label_probs}")
                
       
                # 최대 위험도 점수와 위험 유형
                max_risk_score = float(np.max(probs))
                max_index = np.argmax(probs)
                dominant_risk_type = RiskType.get_by_index(max_index)
                logger.info(f"Max probability: {max_risk_score} at index {max_index} ({dominant_risk_type.value})")
        
                
                # 위험도 레벨 결정
                if max_risk_score >= 0.6:
                    risk_level = RiskLevel.HIGH
                elif max_risk_score >= 0.55:
                    risk_level = RiskLevel.MEDIUM
                elif max_risk_score >= 0.53:
                    risk_level = RiskLevel.LOW
                else:
                    risk_level = RiskLevel.NORMAL
                
                # 위험 유형 결정 (임계값 조정)
                threshold = 0.53  # 0.6 -> 0.5
                risk_types = []
                
                # 모든 위험 유형의 확률이 임계값 미만인지 확인
                all_below_threshold = True
                for i, prob in enumerate(probs[:-1]):  # 마지막 레이블(일반) 제외
                    if float(prob) > threshold:
                        all_below_threshold = False
                        risk_type = RiskType.get_by_index(i)
                        risk_types.append(risk_type)
                        logger.info(f"Detected risk type: {risk_type.value} with probability {prob:.4f}")
                
                # 모든 위험 유형의 확률이 임계값 미만이면 일반으로 판단
                if all_below_threshold:
                    risk_types = [RiskType.NORMAL]
                    logger.info("All risk types below threshold, defaulting to NORMAL")
                
                result = {
                    "risk_level": risk_level,
                    "confidence": max_risk_score,
                    "dominant_risk_type": dominant_risk_type,
                    "risk_types": risk_types,
                    "label_probs": label_probs
                }
                
                logger.info(f"Final analysis result: {result}")
                return result
            
        except Exception as e:
            logger.error(f"Error in text classification: {str(e)}")
            return {
                "risk_level": RiskLevel.NORMAL,
                "confidence": 0.0,
                "dominant_risk_type": RiskType.NORMAL,
                "risk_types": [RiskType.NORMAL],
                "label_probs": {}
            }

    def extract_keywords_okt(self, text: str) -> List[Dict[str, Any]]:

        okt = Okt()
        
        # 형태소 분석 (품사 포함)
        morphs = okt.pos(text, stem=True)  # stem=True: 원형 복원
        
        # 명사, 동사, 형용사만 추출
        target_pos = {'Noun', 'Adjective'} # "Verb" 제외
        words = [word for word, pos in morphs if pos in target_pos and len(word) > 1]

        # 빈도수 계산
        counter = Counter(words)

        # 상위 N개 추출
        top_keywords = counter.most_common(5)

        return [{'keyword': kw, 'count': cnt} for kw, cnt in top_keywords]

    # 키워드 추출 함수
    def extract_keywords(self, text: str) -> List[Dict[str, Any]]:
        """텍스트에서 중요한 키워드를 추출하고 각 키워드의 위험도를 분석합니다."""
        try:
            logger.info(f"키워드 추출 시작 - 입력 텍스트: {text}")
            
            # 텍스트 전처리
            text = text.strip()
            logger.info(f"전처리된 텍스트: {text}")
        
            # 입력 텍스트를 모델 입력 형식으로 변환
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # 토큰화 결과 저장
            tokens = self.tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
            logger.info(f"토큰화 결과: {tokens}")
            
            # 제외할 토큰 목록
            exclude_tokens = {
                '[CLS]', '[SEP]', '[PAD]',  # 특수 토큰
                '이런', '저런', '그런',  # 지시어
                '한테', '부터', '까지',  # 조사
                '하다', '되다', '있다', '없다', '이다', '아니다',  # 기본 동사
                '우리', '저희', '그들', '그녀',  # 대명사
                '이제', '지금', '그때', '언제', '어디', '왜', '어떻게', '얼마나',  # 의문사/부사
                '정말', '진짜', '아주', '매우', '너무', '조금', '약간', '거의', '대략',  # 정도 부사
                '또', '다시', '또다시', '계속', '자꾸', '계속해서',  # 반복 부사
                '그리고', '그래서', '그러면', '그런데', '하지만', '그렇지만', '그러나',  # 접속사
                '만약', '만일', '혹시', '설령', '비록', '아무리',  # 조건 접속사
                '왜냐하면', '그러므로', '그래서', '따라서', '그러니까',  # 인과 접속사
                '또한', '게다가', '더욱이', '특히', '특별히',  # 부가 접속사
                '결국', '마침내', '드디어', '마지막으로',  # 종결 접속사
                '예를', '들면', '말하자면', '즉', '다시', '말해서',  # 예시 접속사
                '물론', '당연히', '확실히', '분명히',  # 확신 접속사
                '아마', '아마도', '혹시', '어쩌면',  # 추측 접속사
                '실제로', '사실', '정말로', '진짜로',  # 사실 접속사
                '결과적으로', '최종적으로', '궁극적으로',  # 결과 접속사
                '일단', '우선', '먼저', '처음에',  # 순서 접속사
                '마지막으로', '끝으로', '마무리로',  # 종결 접속사
                '다시', '한번', '더', '또',  # 반복 접속사
                '그래도', '그럼에도', '그렇지만',  # 양보 접속사
                '그래서', '그러니까', '그러므로',  # 인과 접속사
                '그리고', '또한', '게다가',  # 부가 접속사
                '하지만', '그러나', '그런데',  # 대조 접속사
                '그래서', '그러니까', '그러므로',  # 인과 접속사
                '그리고', '또한', '게다가',  # 부가 접속사
                '하지만', '그러나', '그런데',  # 대조 접속사
            }
            
            # 유효한 토큰 인덱스 추출 (특수 토큰 제외)
            valid_token_indices = []
            for i, token in enumerate(tokens):
                if not token.startswith('##') and token not in exclude_tokens and len(token) > 2:
                    valid_token_indices.append(i)
            
            if not valid_token_indices:
                logger.warning("유효한 토큰이 없습니다.")
                return []
            
            # 모델 추론
            with torch.no_grad():
                probs, attention = self.model(**inputs, output_attentions=True)
            
            # 어텐션 가중치 계산
            attention_weights = attention[-1].mean(dim=1).mean(dim=1)  # 마지막 레이어의 어텐션 가중치 사용
            attention_weights = attention_weights[0]  # 첫 번째 배치 선택
            
            # 유효한 토큰에 대한 어텐션 가중치만 선택
            token_weights = attention_weights[valid_token_indices]
            
            # 토큰 정제 및 가중치 합산
            clean_tokens = {}
            for idx, token in enumerate(tokens):
                if idx in valid_token_indices:
                    clean_token = token.replace('▁', '').strip()
                    if clean_token and clean_token not in exclude_tokens:
                        if clean_token in clean_tokens:
                            clean_tokens[clean_token]['weight'] += token_weights[valid_token_indices.index(idx)].item()
                            clean_tokens[clean_token]['count'] += 1
                        else:
                            clean_tokens[clean_token] = {
                                'weight': token_weights[valid_token_indices.index(idx)].item(),
                                'count': 1
                            }
            
            # 가중치 기준으로 정렬하여 상위 5개 키워드 선택
            sorted_tokens = sorted(
                clean_tokens.items(),
                key=lambda x: x[1]['weight'],
                reverse=True
            )[:5]
            
            # 최종 결과 생성
            keywords = []
            for token, info in sorted_tokens:
                # 위험도 분석
                risk_result = self.classify_text(token)
                keywords.append({
                    'keyword': token,
                    'weight': info['weight'],
                    'count': info['count'],
                    'risk_level': risk_result['risk_level']
                })
            
            logger.info(f"추출된 키워드: {keywords}")
            logger.info(f"=====================")
            return keywords
            
        except Exception as e:
            logger.error(f"키워드 추출 중 오류 발생: {str(e)}")
            logger.error(traceback.format_exc())
            return []


def analyze_risk(text: str) -> Dict[str, Any]:
    """텍스트의 위험도를 분석합니다."""
    try:
        # 텍스트 전처리
        text = classifier.preprocess_text(text)
        logger.info(f"\n{'='*50}")
        logger.info(f"분석 시작 - 입력 텍스트: {text}")
        
        # 토큰화
        inputs = classifier.tokenizer(
            text,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
            return_token_type_ids=False
        )
        logger.info(f"토큰화 결과: {classifier.tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])}")
        
        # GPU 사용 가능시 GPU로 이동
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
            classifier.model.cuda()
        
        # 추론
        with torch.no_grad():
            outputs = classifier.model(
                input_ids=inputs['input_ids'],
                attention_mask=inputs['attention_mask']
            )
            
            # 모델 출력 확인
            logger.info(f"모델 출력 shape: {outputs.shape}")
            logger.info(f"모델 출력: {outputs}")
            logger.info(f"Raw logits mean: {outputs.mean().item():.4f}")
            logger.info(f"Raw logits std: {outputs.std().item():.4f}")
            
            # 시그모이드 적용 (한 번만)
            probs = torch.sigmoid(outputs)
            logger.info(f"Sigmoid probabilities: {probs}")
            logger.info(f"Sigmoid mean: {probs.mean().item():.4f}")
            logger.info(f"Sigmoid std: {probs.std().item():.4f}")
            
            # GPU에서 직접 계산
            max_risk_score = float(probs.max().item())
            max_index = int(probs.argmax().item())
            dominant_risk_type = RiskType.get_by_index(max_index)
            logger.info(f"Max probability: {max_risk_score} at index {max_index} ({dominant_risk_type.value})")
            
            # 위험도 레벨 결정 (임계값 조정)
            if max_risk_score >= 0.6:  # 0.8 -> 0.7
                risk_level = RiskLevel.HIGH
            elif max_risk_score >= 0.55:  # 0.6 -> 0.5
                risk_level = RiskLevel.MEDIUM
            elif max_risk_score >= 0.53:  # 0.4 -> 0.3
                risk_level = RiskLevel.LOW
            else:
                risk_level = RiskLevel.NORMAL
            
            # 위험 유형 결정 (임계값 조정)
            threshold = 0.53  # 0.6 -> 0.5
            risk_types = []
            
            # 모든 위험 유형의 확률이 임계값 미만인지 확인
            all_below_threshold = True
            for i in range(probs.size(1)-1):  # 마지막 레이블(일반) 제외
                prob = float(probs[0, i].item())
                if prob > threshold:
                    all_below_threshold = False
                    risk_type = RiskType.get_by_index(i)
                    risk_types.append(risk_type)
                    logger.info(f"Detected risk type: {risk_type.value} with probability {prob:.4f}")
            
            # 모든 위험 유형의 확률이 임계값 미만이면 일반으로 판단
            if all_below_threshold:
                risk_types = [RiskType.NORMAL]
                logger.info("All risk types below threshold, defaulting to NORMAL")
            
            # 레이블별 확률 계산 (GPU에서 직접)
            label_probs = {
                classifier.id2label[i]: float(probs[0, i].item())
                for i in range(probs.size(1))
            }
            logger.info(f"Label probabilities: {label_probs}")
            
            result = {
                "risk_level": risk_level,
                "confidence": max_risk_score,
                "dominant_risk_type": dominant_risk_type,
                "risk_types": risk_types,
                "label_probs": label_probs
            }
            
            logger.info(f"\n최종 분석 결과:")
            logger.info(f"- 위험도 레벨: {result['risk_level']}")
            logger.info(f"- 신뢰도: {result['confidence']:.4f}")
            logger.info(f"- 주요 위험 유형: {result['dominant_risk_type']}")
            logger.info("- 감지된 위험 유형들:")
            for risk_type in result['risk_types']:
                logger.info(f"  * {risk_type.value}")
            logger.info(f"{'='*50}\n")
            
            return result
            
    except Exception as e:
        logger.error(f"위험도 분석 중 오류 발생: {str(e)}")
        logger.error(f"상세 오류: {traceback.format_exc()}")
        return {
            "risk_level": RiskLevel.NORMAL,
            "confidence": 0.0,
            "dominant_risk_type": RiskType.NORMAL,
            "risk_types": [RiskType.NORMAL],
            "label_probs": {}
        }

def extract_s3_key(s3_path):
    try:
        # s3:// 형식의 URL 처리
        if s3_path.startswith('s3://'):
            # s3://bucket-name/path/to/file 형식에서 path/to/file 부분만 추출
            parts = s3_path.split('/', 3)
            if len(parts) >= 4:
                return parts[3]
            return ''
            
        # http(s):// 형식의 URL 처리
        elif s3_path.startswith(('http://', 'https://')):
            # URL에서 마지막 두 부분 추출 (예: bucket-name/path/to/file)
            parts = s3_path.split('/')
            if len(parts) >= 2:
                return '/'.join(parts[-2:])
            return ''
            
        # 일반 경로 처리
        return s3_path
    except Exception as e:
        logger.error(f"S3 키 추출 중 오류 발생: {str(e)}")
        return s3_path

def read_s3_file(bucket_name, s3_path):
    try:
        s3_key = extract_s3_key(s3_path)
        logger.info(f"S3 파일 읽기 시도: bucket={bucket_name}, original_path={s3_path}, extracted_key={s3_key}")
        
        if not s3_key:
            raise ValueError("유효하지 않은 S3 경로입니다.")
            
        response = s3_client.get_object(
            Bucket=bucket_name,
            Key=s3_key
        )
        content = response['Body'].read().decode('utf-8')
        logger.info("S3 파일 읽기 성공")
        return content
            
    except Exception as e:
        logger.error(f"S3 파일 읽기 오류: {str(e)}")
        logger.error(f"버킷: {bucket_name}, 원본 경로: {s3_path}, 추출된 키: {s3_key}")
        raise

class MessageInfo(BaseModel):
    id: int
    date: str
    message: str
    risk_types: List[RiskType]  # risks -> risk_types로 변경

class Keywords(BaseModel):
    keyword: str
    count: int
    riskLevel: RiskLevel

class MessageRisk(BaseModel):
    type: str
    level: str
    # probability: float

class MessageAnalysis(BaseModel):
    id: int
    date: str
    message: str
    risks: List[MessageRisk]

class KeywordAnalysis(BaseModel):
    keyword: str
    count: int
    risk: RiskLevel

class AIAnalysisResponse(BaseModel):
    messages: List[MessageAnalysis]
    keywords: List[KeywordAnalysis]

class AnalysisRequest(BaseModel):
    s3_path: str
    bucket_name: str

def extract_messages_from_chat(chat_content: str) -> Dict[str, List[str]]:
    """
    카카오톡 채팅 내용에서 메시지를 추출하는 함수
    
    Args:
        chat_content (str): 카카오톡 채팅 내용 전체 텍스트
        
    Returns:
        Dict[str, List[str]]: 날짜를 키로 하고, 해당 날짜의 메시지 리스트를 값으로 하는 딕셔너리
        예시: {
            "2025년 5월 31일": ["메시지1", "메시지2", ...],
            "2025년 6월 1일": ["메시지3", "메시지4", ...]
        }
    """
    try:
        # 날짜별로 메시지를 저장할 딕셔너리 초기화
        # defaultdict를 사용하여 새로운 날짜가 나올 때마다 자동으로 빈 리스트 생성
        messages_by_date = defaultdict(list)
        
        # 채팅 내용을 줄 단위로 분리
        lines = chat_content.split('\n')
        
        # 모바일 버전 여부를 확인하는 플래그
        is_mobile_version = False
        # 현재 처리 중인 날짜를 저장하는 변수
        current_date = None
        
        # 모바일 버전 체크
        # 모바일 버전은 "저장한 날짜 :"와 "년", "월", "일"이 모두 포함된 형식
        if "저장한 날짜 :" in chat_content and "년" in chat_content and "월" in chat_content and "일" in chat_content:
            is_mobile_version = True
        
        if is_mobile_version:
            # 모바일 버전 처리
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # 날짜 라인 처리
                if "년" in line and "월" in line and "일" in line:
                    if ":" not in line:  # 날짜만 있는 라인 (예: "2025년 4월 30일")
                        current_date = line
                    else:  # 날짜와 시간이 있는 라인 (예: "2025년 4월 30일 오전 3:58, 권재희 : 메시지")
                        date_part = line.split(",", 1)[0].strip()
                        current_date = date_part
                        message = line.split(":", 1)[1].strip()
                        if message and not message.startswith("파일:"):
                            messages_by_date[current_date].append(message)
                # 메시지 라인 처리 (예: "메시지 줄1", "메시지 줄2")
                elif ":" in line and current_date:
                    message = line.split(":", 1)[1].strip()
                    if message and not message.startswith("파일:"):
                        messages_by_date[current_date].append(message)
        else:
            # PC 버전 처리
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # 날짜 구분선 처리 (예: "--------------- 2025년 5월 31일 토요일 ---------------")
                if "---------------" in line:
                    # 날짜와 요일을 추출 (예: "2025년 5월 31일 토요일")
                    date_match = re.search(r'(\d{4}년 \d{1,2}월 \d{1,2}일 [월화수목금토일]요일)', line)
                    if date_match:
                        # 요일 제거하고 날짜만 사용
                        full_date = date_match.group(1)
                        current_date = re.sub(r' [월화수목금토일]요일$', '', full_date)
                # 메시지 라인 처리 (예: "[오빠] [오후 10:08] 요즘 왜 자꾸 답장 늦게 해?")
                elif "]" in line and current_date:
                    # [이름] [시간] 메시지 형식 처리
                    # 정규식을 사용하여 이름, 시간, 메시지를 정확하게 분리
                    message_match = re.match(r'\[(.*?)\] \[(.*?)\] (.*)', line)
                    if message_match:
                        name, time, message = message_match.groups()
                        if message and not message.startswith("파일:"):
                            messages_by_date[current_date].append(message.strip())
        
        # 결과 로깅
        logger.info(f"추출된 메시지 수: {sum(len(msgs) for msgs in messages_by_date.values())}")
        for date, messages in messages_by_date.items():
            logger.info(f"날짜 {date}의 메시지 수: {len(messages)}")
        
        return dict(messages_by_date)
        
    except Exception as e:
        # 오류 발생 시 로그 기록 및 빈 딕셔너리 반환
        logger.error(f"메시지 추출 중 오류 발생: {str(e)}\n{traceback.format_exc()}")
        return {}

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    try:
        logger.info(f"분석 요청 시작: bucket={request.bucket_name}, path={request.s3_path}")
        
        # S3에서 파일 읽기
        try:
            chat_content = read_s3_file(request.bucket_name, request.s3_path)
            if not chat_content:
                logger.error("채팅 파일 내용이 비어있습니다.")
                raise HTTPException(status_code=400, detail="채팅 파일을 읽을 수 없습니다.")
        except Exception as e:
            logger.error(f"S3 파일 읽기 실패: {str(e)}")
            raise HTTPException(status_code=500, detail=f"S3 파일 읽기 실패: {str(e)}")

        # 메시지 추출
        try:
            messages_by_date = extract_messages_from_chat(chat_content)
            logger.info(f"추출된 메시지 수: {sum(len(msgs) for msgs in messages_by_date.values())}")
        except Exception as e:
            logger.error(f"메시지 추출 실패: {str(e)}")
            raise HTTPException(status_code=500, detail=f"메시지 추출 실패: {str(e)}")
        
        classifier = TextClassifier()
        # 메시지 분석
        analyzed_messages = []
        message_id = 1
        all_messages = []
        
        try:
            for date, messages in messages_by_date.items():
                clean_date = date.replace('---------------', '').strip()
                for message in messages:
                    try:
                        clean_message = message
                        if ']' in message:
                            clean_message = message.split(']', 1)[1].strip()
                        
                        logger.info(f"분석 메시지: {clean_message}")
                        result = classifier.classify_text(clean_message)
                        logger.info(f"분석 결과: {result}")
                        
                        # 위험 유형별 분석 결과 생성
                        risks = []
                        for risk_type in result["risk_types"]:
                            prob = result["label_probs"].get(risk_type.value, 0.0)
                            # 위험 유형이 '일반'이면 위험도 레벨을 'NORMAL'으로 설정
                            risk_level = RiskLevel.NORMAL if risk_type == RiskType.NORMAL else result["risk_level"]
                            risks.append(MessageRisk(
                                type=risk_type.name,
                                level=risk_level.name
                                # probability=prob
                            ))
                        
                        analyzed_messages.append(MessageAnalysis(
                            id=message_id,
                            date=clean_date,
                            message=clean_message,
                            risks=risks
                        ))
                        all_messages.append(clean_message)
                        message_id += 1
                    except Exception as e:
                        logger.error(f"개별 메시지 분석 실패 (ID: {message_id}): {str(e)}")
                        continue
        except Exception as e:
            logger.error(f"메시지 분석 중 오류 발생: {str(e)}")
            raise HTTPException(status_code=500, detail=f"메시지 분석 실패: {str(e)}")

        # 키워드 추출
        try:
            combined_text = " ".join(all_messages)
            keywords = classifier.extract_keywords(combined_text)
            
            # 정제된 키워드로 결과 생성
            formatted_keywords = []
            for keyword in keywords:
                formatted_keywords.append(KeywordAnalysis(
                    keyword=keyword['keyword'],
                    count=keyword['count'],
                    risk=keyword['risk_level']
                ))
            
        except Exception as e:
            logger.error(f"키워드 추출 실패: {str(e)}")
            raise HTTPException(status_code=500, detail=f"키워드 추출 실패: {str(e)}")

        logger.info("분석 완료")
        return AIAnalysisResponse(
            messages=analyzed_messages,
            keywords=formatted_keywords
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"분석 요청 처리 중 예상치 못한 오류 발생: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")


if __name__ == '__main__':
    try:    
        # # 테스트 케이스 실행
        # test_cases = [
        #     {
        #         "message": "요즘 왜 자꾸 답장 늦게 해?",
        #         "expected_risk": "일반"
        #     },
        #     {
        #         "message": "그냥 좀 바빴어, 미안해.",
        #         "expected_risk": "일반"
        #     },
        #     {
        #         "message": "내가 바빠도 너한테는 항상 답장했잖아.",
        #         "expected_risk": "일반"
        #     },
        #     {
        #         "message": "혹시 내가 전에 말했던 거 때문이야?",
        #         "expected_risk": "일반"
        #     },
        #     {
        #         "message": "그 얘기 다시 꺼내지 말자, 불편했어 솔직히.",
        #         "expected_risk": "거부"
        #     },
        #     {
        #         "message": "나는 진심이었고, 너도 그때 아무 말 안 했잖아.",
        #         "expected_risk": "강요"
        #     },
        #     {
        #         "message": "우리 둘만 아는 얘긴데 왜 갑자기 그렇게 나와?",
        #         "expected_risk": "일반"
        #     },
        #     {
        #         "message": "그때는 그냥 분위기 때문에 말 못 한 거야.",
        #         "expected_risk": "거부"
        #     },
        #     {
        #         "message": "그럼 그 사진은 왜 나한테 줬는데?",
        #         "expected_risk": "일반"
        #     },
        #     {
        #         "message": "그건 오빠가 계속 요구해서 어쩔 수 없이 보낸 거야...",
        #         "expected_risk": "거부"
        #     },
        #     {
        #         "message": "그럼 나 혼자만 이상한 놈 만들지 말고, 우리 얘기 책임져.",
        #         "expected_risk": "강요"
        #     },
        #     {
        #         "message": "사진은 아직 가지고 있어, 어떻게 할지 너한테 달려 있어.",
        #         "expected_risk": "협박"
        #     },
        #     {
        #         "message" : "지금 그거 협박이야?",
        #         "expected_risk": "협박"
        #     },
        #     {
        #         "message" : " 협박이 아니라 경고야, 내가 얼마나 참았는지 알지?",
        #         "expected_risk": "협박"
        #     },
        #     {
        #         "message" : "내일 밤에 잠깐만 보자, 딱 1시간이면 돼.",
        #         "expected_risk": "일반"
        #     },
        #     {
        #         "message" : "싫어, 나 이제 무서워서 오빠 못 만나겠어.",
        #         "expected_risk": "거부"
        #     },
        #     {
        #         "message" : "그럼 더 이상 내 방식대로 안 갈 수 없어.",
        #         "expected_risk": "강요"
        #     }
        # ]
    
        # classifier = TextClassifier()
        
        # # 전체 메시지를 하나로 결합
        # all_messages = " ".join([case['message'] for case in test_cases])
        
        # # 키워드 추출
        # print("\n=== 키워드 분석 결과 ===")
        # keywords = classifier.extract_keywords(all_messages)
        # print("\n추출된 키워드:")
        # for keyword in keywords:
        #     print(f"- {keyword['keyword']} (위험도: {keyword['risk_level']}, 점수: {keyword['weight']:.4f})")
        
        # # 개별 메시지 분석
        # for i, test_case in enumerate(test_cases, 1):
        #     result = classifier.classify_text(test_case['message'])
        #     print("\n=== 분석 결과 ===")
        #     print(f"테스트 케이스 {i}:")
        #     print(f"메시지: {test_case['message']}")
        #     print(f"위험도: {result['risk_level']}")
        #     print(f"신뢰도: {result['confidence']:.2%}")
        #     print(f"\n주요 위험 유형: {result['dominant_risk_type'].value}")
            
        #     print("\n=== 레이블별 확률 ===")
        #     # 레이블별 확률을 내림차순으로 정렬하여 출력
        #     sorted_probs = sorted(
        #         [(label, prob) for label, prob in result['label_probs'].items()],
        #         key=lambda x: x[1],
        #         reverse=True
        #     )
        #     for label, prob in sorted_probs:
        #         # 확률이 0.1% 이상인 경우에만 출력
        #         if prob >= 0.001:
        #             print(f"{label}: {prob:.2%}")
            
        #     print("\n=== 감지된 위험 유형 ===")
        #     for risk_type in result['risk_types']:
        #         print(f"- {risk_type.value}")

        # FastAPI 서버 실행
        print("\n=== FastAPI 서버 시작 ===")
        uvicorn.run(app, host=HOST, port=PORT)

    except Exception as e:
        logger.error(f"서버 시작 중 오류 발생: {str(e)}")
        sys.exit(1)