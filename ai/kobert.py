import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
from safetensors.torch import load_file
import numpy as np
from enum import Enum
import logging
import sys
import codecs
import re
import os
from typing import Dict, Any

# 한글 인코딩 설정
if sys.stdout.encoding != 'utf-8':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('kobert.log'),  # kobert.log 파일에 로그 저장
        logging.StreamHandler()  # 콘솔에도 출력
    ]
)
logger = logging.getLogger(__name__)

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
    NONE = "NONE"

class KoBERTClassifier(nn.Module):
    def __init__(self, num_labels=9):
        super().__init__()
        self.kobert = AutoModel.from_pretrained("monologg/kobert", trust_remote_code=True)
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(self.kobert.config.hidden_size, num_labels)
        self.sigmoid = nn.Sigmoid()

    def forward(self, input_ids, attention_mask):
        outputs = self.kobert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs[1]
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        return self.sigmoid(logits)

class TextClassifier:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # 모델 초기화
        self.model = KoBERTClassifier()
        self.model.to(self.device)  # 모델을 GPU로 이동
        
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
        logger.info(f"Label mapping: {self.id2label}")

    def preprocess_text(self, text: str) -> str:
        """텍스트 전처리 함수"""
        # 이모지 제거
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"
            u"\U0001F300-\U0001F5FF"
            u"\U0001F680-\U0001F6FF"
            u"\U0001F1E0-\U0001F1FF"
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE)
        text = emoji_pattern.sub(r'', text)
        
        # URL 제거
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # 특수문자 제거
        text = re.sub(r'[^\w\s가-힣]', ' ', text)
        
        # 연속된 공백 제거
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
            
            # 토큰화된 입력 상세 로깅
            logger.info(f"Tokenized input_ids: {inputs['input_ids']}")
            logger.info(f"Tokenized attention_mask: {inputs['attention_mask']}")
            
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
                
                # 모델 출력 상세 로깅
                logger.info(f"Model outputs type: {type(outputs)}")
                logger.info(f"Model outputs: {outputs}")
                
                # KoBERT 모델은 직접 logits를 반환
                logits = outputs
                logger.info(f"Raw logits shape: {logits.shape}")
                logger.info(f"Raw logits values: {logits}")
                logger.info(f"Raw logits mean: {logits.mean().item():.4f}")
                logger.info(f"Raw logits std: {logits.std().item():.4f}")
                
                # 시그모이드 적용
                probs = torch.sigmoid(logits)
                logger.info(f"Sigmoid probabilities: {probs}")
                logger.info(f"Sigmoid mean: {probs.mean().item():.4f}")
                logger.info(f"Sigmoid std: {probs.std().item():.4f}")
                
                # CPU로 이동 후 numpy 변환
                probs = probs.cpu().numpy()[0]
                logger.info(f"Final probabilities: {probs}")
                
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
                
                # 위험도 레벨 결정 (임계값 조정)
                if max_risk_score >= 0.6:  # 0.8 -> 0.7
                    risk_level = RiskLevel.HIGH
                elif max_risk_score >= 0.55:  # 0.6 -> 0.5
                    risk_level = RiskLevel.MEDIUM
                elif max_risk_score >= 0.53:  # 0.4 -> 0.3
                    risk_level = RiskLevel.LOW
                else:
                    risk_level = RiskLevel.NONE
                
                # 위험 유형 결정 (임계값 조정)
                threshold = 0.53  # 0.6 -> 0.5
                risk_types = []
                for i, prob in enumerate(probs):
                    if float(prob) > threshold:
                        risk_type = RiskType.get_by_index(i)
                        risk_types.append(risk_type)
                        logger.info(f"Detected risk type: {risk_type.value} with probability {prob:.4f}")
                
                if not risk_types:
                    risk_types = [RiskType.NORMAL]
                    logger.info("No risk types detected, defaulting to NORMAL")
                
                return {
                    "risk_level": risk_level,
                    "confidence": max_risk_score,
                    "dominant_risk_type": dominant_risk_type,
                    "risk_types": risk_types,
                    "label_probs": label_probs
                }
            
        except Exception as e:
            logger.error(f"Error in text classification: {str(e)}")
            return {
                "risk_level": RiskLevel.NONE,
                "confidence": 0.0,
                "dominant_risk_type": RiskType.NORMAL,
                "risk_types": [RiskType.NORMAL],
                "label_probs": {}
            }

def main():
    """메인 함수"""
    try:
        # 모델 초기화
        classifier = TextClassifier()
        
        print("\n=== 텍스트 위험도 분석 시스템 ===")
        print("종료하려면 'q'를 입력하세요.")
        
        while True:
            # 사용자 입력 받기
            text = input("\n분석할 문장을 입력하세요 (종료하려면 'q' 입력): ")
            
            if text.lower() == 'q':
                print("\n프로그램을 종료합니다.")
                break
            
            # 텍스트 분류
            result = classifier.classify_text(text)
            
            # 결과 출력
            print("\n=== 분석 결과 ===")
            print(f"위험도: {result['risk_level']}")
            print(f"신뢰도: {result['confidence']:.2%}")
            print(f"\n주요 위험 유형: {result['dominant_risk_type'].value}")
            
            print("\n=== 레이블별 확률 ===")
            # 레이블별 확률을 내림차순으로 정렬하여 출력
            sorted_probs = sorted(
                [(label, prob) for label, prob in result['label_probs'].items()],
                key=lambda x: x[1],
                reverse=True
            )
            for label, prob in sorted_probs:
                # 확률이 0.1% 이상인 경우에만 출력
                if prob >= 0.001:
                    print(f"{label}: {prob:.2%}")
            
            print("\n=== 감지된 위험 유형 ===")
            for risk_type in result['risk_types']:
                print(f"- {risk_type.value}")
            
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise

if __name__ == "__main__":
    main()
