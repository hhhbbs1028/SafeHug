from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import BertModel, BertTokenizer
import torch
import torch.nn as nn
from typing import Optional, List, Dict
import uvicorn
import boto3
import json
from botocore.exceptions import ClientError
import re
from collections import Counter
from konlpy.tag import Okt
import numpy as np
import torch.nn.functional as F
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class S3FileRequest(BaseModel):
    s3_path: str
    bucket_name: str

class MessageAnalysis(BaseModel):
    message: str
    risk_type: str
    risk_level: str
    confidence: float

class KeywordAnalysis(BaseModel):
    keyword: str
    count: int
    risk: int

class AnalysisResponse(BaseModel):
    analyses: List[MessageAnalysis]
    keywords: List[KeywordAnalysis]

class KoBERTClassifier(nn.Module):
    def __init__(self, num_classes):
        super(KoBERTClassifier, self).__init__()
        self.bert = BertModel.from_pretrained('monologg/kobert')
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        pooled_output = outputs[1]
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        return logits

# 모델 및 토크나이저 초기화
try:
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    model = KoBERTClassifier(num_classes=7).to(device)
    model.load_state_dict(torch.load('kobert_classifier.pt', map_location=device))
    model.eval()
    tokenizer = BertTokenizer.from_pretrained('monologg/kobert')
    logger.info("Model and tokenizer loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise

# S3 클라이언트 초기화
s3_client = boto3.client('s3')

# 레이블 매핑
RISK_TYPES = ['NORMAL', 'SEXUAL', 'STALKING', 'COERCION', 'THREAT', 'PERSONAL_INFO', 'DISCRIMINATION']
RISK_LEVELS = ['NORMAL', 'MEDIUM', 'HIGH']

# 위험 키워드 사전 정의
RISK_KEYWORDS = {
    "HIGH": {
        "성폭력": 100, "강간": 100, "성추행": 100, "협박": 90, "위협": 90,
        "살인": 100, "폭력": 90, "학대": 90, "스토킹": 90, "따돌림": 80
    },
    "MEDIUM": {
        "욕설": 70, "비방": 70, "모욕": 70, "괴롭힘": 80, "따돌림": 80,
        "차별": 70, "혐오": 70, "폭언": 70, "갈취": 80, "강요": 80
    }
}

def analyze_message(text: str) -> MessageAnalysis:
    """단일 메시지 분석"""
    try:
        # 토큰화
        encoding = tokenizer(
            text,
            add_special_tokens=True,
            max_length=128,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        # 모델 추론
        with torch.no_grad():
            input_ids = encoding['input_ids'].to(device)
            attention_mask = encoding['attention_mask'].to(device)
            outputs = model(input_ids, attention_mask)
            probabilities = torch.softmax(outputs, dim=1)
            
            # 위험 유형 예측
            risk_type_idx = torch.argmax(probabilities).item()
            risk_type = RISK_TYPES[risk_type_idx]
            confidence = probabilities[0][risk_type_idx].item()
            
            # 위험도 결정 (임계값 기반)
            if confidence > 0.7:
                risk_level = 'HIGH'
            elif confidence > 0.5:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'NORMAL'
        
        return MessageAnalysis(
            message=text,
            risk_type=risk_type,
            risk_level=risk_level,
            confidence=confidence
        )
    except Exception as e:
        logger.error(f"Error analyzing message: {str(e)}")
        return MessageAnalysis(
            message=text,
            risk_type='NORMAL',
            risk_level='NORMAL',
            confidence=0.0
        )

def analyze_keywords(messages: List[str]) -> List[KeywordAnalysis]:
    """키워드 분석"""
    try:
        okt = Okt()
        word_freq = Counter()
        
        # 모든 메시지에서 명사 추출
        for message in messages:
            nouns = okt.nouns(message)
            word_freq.update(nouns)
        
        # 위험도 계산 및 키워드 분석
        keyword_analyses = []
        for word, count in word_freq.most_common(20):  # 상위 20개 키워드만 분석
            if len(word) < 2:  # 2글자 미만 단어 제외
                continue
                
            # 위험도 계산
            risk_score = 0
            for risk_level, keywords in RISK_KEYWORDS.items():
                for keyword, score in keywords.items():
                    if keyword in word:
                        risk_score = max(risk_score, score)
                        break
            
            if risk_score > 0:  # 위험 키워드가 포함된 경우만 추가
                keyword_analyses.append(KeywordAnalysis(
                    keyword=word,
                    count=count,
                    risk=risk_score
                ))
        
        return keyword_analyses[:10]  # 상위 10개만 반환
    except Exception as e:
        logger.error(f"Error analyzing keywords: {str(e)}")
        return []

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_file(request: S3FileRequest):
    """채팅 파일 분석 엔드포인트"""
    try:
        logger.info(f"Analyzing file: {request.s3_path} from bucket: {request.bucket_name}")
        
        # S3에서 파일 내용 읽기
        response = s3_client.get_object(
            Bucket=request.bucket_name,
            Key=request.s3_path
        )
        chat_content = response['Body'].read().decode('utf-8')
        
        # 채팅 내용 파싱
        messages = parse_chat_messages(chat_content)
        logger.info(f"Parsed {len(messages)} messages")
        
        # 각 메시지 분석
        analyses = []
        for message in messages:
            analysis = analyze_message(message)
            analyses.append(analysis)
        
        # 키워드 분석
        keywords = analyze_keywords(messages)
        
        return AnalysisResponse(
            analyses=analyses,
            keywords=keywords
        )
        
    except ClientError as e:
        logger.error(f"S3 error: {str(e)}")
        raise HTTPException(status_code=404, detail=f"S3 파일을 찾을 수 없습니다: {str(e)}")
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def parse_chat_messages(chat_content: str) -> List[str]:
    """채팅 메시지 파싱"""
    try:
        messages = []
        
        # PC 메시지 형식: [이름] [오전/오후 HH:mm] 메시지
        pc_pattern = r'\[(.*?)\]\s*\[(오전|오후)\s*(\d{1,2}:\d{2})\]\s*(.*?)(?=\n|$)'
        
        # Mobile 메시지 형식: YYYY년 MM월 DD일 오전/오후 HH:mm, 이름 : 메시지
        mobile_pattern = r'\d{4}년 \d{1,2}월 \d{1,2}일 (오전|오후) \d{1,2}:\d{2},\s*(.*?)\s*:\s*(.*?)(?=\n\d{4}년|$)'
        
        # PC 형식 메시지 파싱
        pc_matches = re.finditer(pc_pattern, chat_content)
        for match in pc_matches:
            message = match.group(4).strip()
            if message:  # 빈 메시지 제외
                messages.append(message)
        
        # Mobile 형식 메시지 파싱
        mobile_matches = re.finditer(mobile_pattern, chat_content)
        for match in mobile_matches:
            message = match.group(3).strip()
            if message:  # 빈 메시지 제외
                messages.append(message)
        return messages
    except Exception as e:
        logger.error(f"Error parsing messages: {str(e)}")
        return []

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000) 
