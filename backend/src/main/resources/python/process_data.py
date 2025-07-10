import pandas as pd
import os
import logging
import re
from datetime import datetime

# 로그 디렉토리 설정
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

# 로깅 설정
log_file = os.path.join(log_dir, 'data_processing.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def clean_text(text):
    """
    텍스트 전처리 함수
    - 특수문자, 이모지 제거
    - 여러 공백을 하나로
    - 앞뒤 공백 제거
    """
    # 특수문자, 이모지 제거
    text = re.sub(r'[^\w\s가-힣]', ' ', str(text))
    # 여러 공백을 하나로
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def process_and_save_data():
    """
    데이터를 처리하고 새로운 CSV 파일로 저장하는 함수
    """
    # 데이터 로드
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, 'legal_evidence_filtered.csv')
    
    logger.info(f"데이터 파일 경로: {csv_path}")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"데이터 파일을 찾을 수 없습니다: {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    # 데이터 분포 확인
    logger.info("\n=== 원본 데이터 분포 ===")
    for col in ['성적', '스토킹', '강요', '협박', '개인정보', '차별', '일반']:
        count = df[col].sum()
        logger.info(f"{col}: {count}개")
    
    # 텍스트 전처리
    logger.info("\n텍스트 전처리 시작...")
    df['text'] = df['text'].apply(clean_text)
    logger.info("텍스트 전처리 완료")
    
    # 각 카테고리별로 샘플링
    logger.info("\n카테고리별 샘플링 시작...")
    sampled_dfs = []
    for col in ['성적', '스토킹', '강요', '협박', '개인정보', '차별', '모욕', "거절", '일반']:
        # 해당 카테고리가 1인 데이터만 필터링
        class_df = df[df[col] == 1]
        # 샘플링 (데이터가 부족한 경우 전체 사용)
        n_samples = min(1000, len(class_df))
        sampled_df = class_df.sample(n=n_samples, random_state=42)
        sampled_dfs.append(sampled_df)
        logger.info(f"{col}: {len(sampled_df)}개 샘플링 완료")
    
    # 샘플링된 데이터 합치기
    balanced_df = pd.concat(sampled_dfs, ignore_index=True)
    # 중복 제거
    balanced_df = balanced_df.drop_duplicates()
    logger.info(f"\n중복 제거 후 남은 데이터 수: {len(balanced_df)}개")
    
    # 샘플링된 데이터 분포 확인
    logger.info("\n=== 샘플링된 데이터 분포 ===")
    for col in ['성적', '스토킹', '강요', '협박', '개인정보', '차별', '일반']:
        count = balanced_df[col].sum()
        logger.info(f"{col}: {count}개")
    
    # 새로운 CSV 파일로 저장
    output_path = os.path.join(current_dir, 'balanced_legal_evidence.csv')
    balanced_df.to_csv(output_path, index=False, encoding='utf-8')
    logger.info(f"\n샘플링된 데이터가 저장되었습니다: {output_path}")
    logger.info(f"총 {len(balanced_df)}개의 데이터가 저장되었습니다.")

if __name__ == "__main__":
    process_and_save_data() 