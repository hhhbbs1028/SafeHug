import pandas as pd
import numpy as np
import random
import re
from collections import defaultdict
import logging
import os
from datetime import datetime

# 로그 디렉토리 설정
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

# 로깅 설정
log_file = os.path.join(log_dir, 'data_augmentation.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DataAugmentor:
    def __init__(self):
        self.synonym_dict = self._load_synonyms()
        self.template_dict = self._load_templates()
        
    def _load_synonyms(self):
        """동의어 사전 로드"""
        return {
            '성적': ['성추행', '성희롱', '성폭력', '성폭행', '성적 괴롭힘', '성적 모욕'],
            '스토킹': ['따라다님', '미행', '추적', '감시', '괴롭힘', '위협', '스토킹', '괴롭힘'],
            '강요': ['강제', '억지로', '억압', '강요', '강요성', '억지', '강제성'],
            '협박': ['위협', '강요', '억지', '공갈', '협박', '위협성', '강요성'],
            '개인정보': ['신상정보', '프라이버시', '사생활', '개인정보', '개인 신상', '개인 데이터'],
            '차별': ['편견', '불공정', '부당', '차별', '불평등', '부당 대우'],
            '일반': ['보통', '평범', '일상', '일반', '일반적', '보통의']
        }
    
    def _load_templates(self):
        """인공 데이터 생성을 위한 템플릿"""
        return {
            '스토킹': [
                # 기본 패턴
                "계속해서 {장소}에서 {행동}하고 있어요",
                "{시간}마다 {장소}에 나타나서 {행동}해요",
                "제가 {장소}에 갈 때마다 {행동}하고 있어요",
                "제 {장소} 근처에서 계속 {행동}하고 있어요",
                "제가 {장소}에 있을 때 {행동}하는 것을 봤어요",
                
                # 상황별 패턴
                "{장소}에서 {행동}하다가 {감정}했어요",
                "{시간}에 {장소}에서 {행동}하는 것을 발견했어요",
                "제가 {장소}에 가려고 할 때마다 {행동}해서 {감정}해요",
                "{장소}에서 {행동}하는 사람을 {행동2}했어요",
                "제 {장소} 주변을 {행동}하는 사람이 {행동2}하고 있어요",
                
                # 특수 상황 패턴
                "{장소}에서 {행동}하다가 {행동2}하는 것을 봤어요",
                "제가 {장소}에 있을 때 {행동}하는 사람이 {행동2}했어요",
                "{시간}에 {장소}에서 {행동}하는 사람을 {행동2}했어요",
                "제 {장소} 근처에서 {행동}하는 사람이 {행동2}하고 있어요",
                "{장소}에서 {행동}하는 사람이 {행동2}해서 {감정}해요"
            ],
            '개인정보': [
                # 기본 패턴
                "제 {정보}를 {행동}하고 있어요",
                "제 {정보}를 다른 사람에게 {행동}했어요",
                "제 {정보}를 {장소}에 {행동}했어요",
                "제 {정보}를 {행동}해서 불안해요",
                "제 {정보}가 {장소}에 {행동}되어 있어요",
                
                # 상황별 패턴
                "제 {정보}가 {장소}에서 {행동}되는 것을 봤어요",
                "{시간}에 제 {정보}가 {행동}되는 것을 발견했어요",
                "제 {정보}가 {행동}되어서 {감정}해요",
                "제 {정보}가 {장소}에서 {행동}되어 {행동2}했어요",
                "제 {정보}가 {행동}되어 {장소}에 {행동2}되어 있어요",
                
                # 특수 상황 패턴
                "제 {정보}가 {행동}되어 {행동2}되는 것을 봤어요",
                "제 {정보}가 {장소}에서 {행동}되어 {행동2}했어요",
                "{시간}에 제 {정보}가 {행동}되어 {행동2}되는 것을 발견했어요",
                "제 {정보}가 {행동}되어 {행동2}되어 {감정}해요",
                "제 {정보}가 {장소}에서 {행동}되어 {행동2}되어 있어요"
            ]
        }
    
    def _get_synonyms(self, word):
        """단어의 동의어 반환"""
        return self.synonym_dict.get(word, [word])
    
    def _split_text(self, text):
        """텍스트를 단어 단위로 분리"""
        return re.findall(r'[\w가-힣]+', text)
    
    def _generate_artificial_data(self, category, n_samples):
        """인공 데이터 생성"""
        if category not in self.template_dict:
            return []
        
        templates = self.template_dict[category]
        artificial_data = []
        
        # 스토킹 카테고리용 변수
        locations = [
            '집', '학교', '회사', '카페', '지하철', '버스', '공원', '상가', '병원',
            '도서관', '편의점', '마트', '백화점', '영화관', '체육관', '수영장',
            '미용실', '약국', '은행', '우체국', '주차장', '엘리베이터', '화장실',
            '휴게실', '식당', '주변', '근처', '앞', '뒤', '옆'
        ]
        actions = [
            '기다리고', '따라다니고', '지켜보고', '찍고', '기록하고', '감시하고',
            '기다리고', '미행하고', '추적하고', '감시하고', '찍고', '기록하고',
            '기다리고', '따라다니고', '지켜보고', '찍고', '기록하고', '감시하고',
            '기다리고', '미행하고', '추적하고', '감시하고', '찍고', '기록하고'
        ]
        actions2 = [
            '도망가고', '숨고', '피하고', '도망치고', '숨고', '피하고',
            '도망가고', '숨고', '피하고', '도망치고', '숨고', '피하고',
            '도망가고', '숨고', '피하고', '도망치고', '숨고', '피하고'
        ]
        times = [
            '아침', '점심', '저녁', '밤', '새벽',
            '오전', '오후', '저녁', '밤', '새벽',
            '아침', '점심', '저녁', '밤', '새벽'
        ]
        emotions = [
            '무서웠어요', '불안했어요', '걱정됐어요', '두려웠어요', '불안해요',
            '무서워요', '걱정돼요', '두려워요', '불안해요', '걱정돼요',
            '무서워요', '걱정돼요', '두려워요', '불안해요', '걱정돼요'
        ]
        
        # 개인정보 카테고리용 변수
        info_types = [
            '전화번호', '주소', '이름', '사진', 'SNS 계정', '이메일', '직장 정보',
            '학교 정보', '가족 정보', '친구 정보', '개인 사진', '개인 정보',
            '신상 정보', '프라이버시', '사생활', '개인 데이터', '개인 기록',
            '개인 문서', '개인 파일', '개인 계정'
        ]
        info_actions = [
            '유출', '공개', '전파', '노출', '유포',
            '유출', '공개', '전파', '노출', '유포',
            '유출', '공개', '전파', '노출', '유포'
        ]
        
        for _ in range(n_samples):
            template = random.choice(templates)
            if category == '스토킹':
                text = template.format(
                    장소=random.choice(locations),
                    행동=random.choice(actions),
                    행동2=random.choice(actions2),
                    시간=random.choice(times),
                    감정=random.choice(emotions)
                )
            else:  # 개인정보
                text = template.format(
                    정보=random.choice(info_types),
                    행동=random.choice(info_actions),
                    행동2=random.choice(info_actions),
                    장소=random.choice(locations),
                    시간=random.choice(times),
                    감정=random.choice(emotions)
                )
            
            # 레이블 생성
            labels = {col: 0 for col in ['성적', '스토킹', '강요', '협박', '개인정보', '차별', '일반']}
            labels[category] = 1
            
            artificial_data.append({
                'text': text,
                **labels
            })
        
        return artificial_data
    
    def synonym_replacement(self, text, n=1):
        """동의어 치환"""
        words = self._split_text(text)
        n = min(n, len(words))
        new_words = words.copy()
        random_word_list = list(set([word for word in words if word in self.synonym_dict]))
        random.shuffle(random_word_list)
        
        num_replaced = 0
        for random_word in random_word_list:
            synonyms = self._get_synonyms(random_word)
            if len(synonyms) > 1:
                synonym = random.choice(synonyms)
                new_words = [synonym if word == random_word else word for word in new_words]
                num_replaced += 1
            if num_replaced >= n:
                break
                
        return ' '.join(new_words)
    
    def back_translation(self, text):
        """문장 구조 변형 (간단한 버전)"""
        words = self._split_text(text)
        if len(words) <= 3:
            return text
            
        # 문장 끝 부분을 앞으로 이동
        if random.random() < 0.5:
            words = words[-2:] + words[:-2]
        return ' '.join(words)
    
    def augment_text(self, text, n_aug=2):
        """텍스트 증강"""
        augmented_texts = []
        for _ in range(n_aug):
            if random.random() < 0.5:
                augmented_text = self.synonym_replacement(text)
            else:
                augmented_text = self.back_translation(text)
            augmented_texts.append(augmented_text)
        return augmented_texts

def augment_dataset(input_file, output_file, target_samples=None):
    """
    데이터셋 증강 및 밸런싱
    
    Args:
        input_file (str): 입력 CSV 파일 경로
        output_file (str): 출력 CSV 파일 경로
        target_samples (dict): 각 카테고리별 목표 샘플 수
    """
    if target_samples is None:
        target_samples = {
            '성적': 800,
            '스토킹': 500,
            '강요': 116,
            '협박': 176,
            '개인정보': 500,
            '차별': 800,
            '일반': 52
        }
    
    logger.info(f"데이터 증강 시작 - 입력 파일: {input_file}")
    
    # 데이터 로드
    df = pd.read_csv(input_file)
    
    # 원본 데이터 분포 확인
    logger.info("\n=== 원본 데이터 분포 ===")
    for col in ['성적', '스토킹', '강요', '협박', '개인정보', '차별', '일반']:
        count = df[col].sum()
        logger.info(f"{col}: {count}개")
    
    # 데이터 증강기 초기화
    augmentor = DataAugmentor()
    
    # 각 카테고리별로 데이터 증강
    augmented_dfs = []
    for col in ['성적', '스토킹', '강요', '협박', '개인정보', '차별', '일반']:
        target = target_samples[col]
        # 해당 카테고리가 1인 데이터만 필터링
        class_df = df[df[col] == 1]
        current_samples = len(class_df)
        
        if current_samples < target:
            # 부족한 만큼 증강
            n_needed = target - current_samples
            
            if col in ['스토킹', '개인정보']:
                # 인공 데이터 생성
                artificial_data = augmentor._generate_artificial_data(col, n_needed)
                artificial_df = pd.DataFrame(artificial_data)
                augmented_df = pd.concat([class_df, artificial_df], ignore_index=True)
            else:
                # 기존 데이터 증강
                n_aug_per_sample = (n_needed + current_samples - 1) // current_samples
                augmented_rows = []
                for _, row in class_df.iterrows():
                    augmented_texts = augmentor.augment_text(row['text'], n_aug=n_aug_per_sample)
                    for aug_text in augmented_texts:
                        new_row = row.copy()
                        new_row['text'] = aug_text
                        augmented_rows.append(new_row)
                
                # 증강된 데이터를 원본과 합치기
                augmented_df = pd.concat([class_df, pd.DataFrame(augmented_rows)], ignore_index=True)
        else:
            # 충분한 경우 그대로 사용
            augmented_df = class_df.sample(n=target, random_state=42)
        
        augmented_dfs.append(augmented_df)
        logger.info(f"{col}: {len(augmented_df)}개 샘플링 완료")
    
    # 모든 증강된 데이터 합치기
    balanced_df = pd.concat(augmented_dfs, ignore_index=True)
    # 중복 제거
    balanced_df = balanced_df.drop_duplicates()
    
    # 최종 데이터 분포 확인
    logger.info("\n=== 증강된 데이터 분포 ===")
    for col in ['성적', '스토킹', '강요', '협박', '개인정보', '차별', '일반']:
        count = balanced_df[col].sum()
        logger.info(f"{col}: {count}개")
    
    # 결과 저장
    balanced_df.to_csv(output_file, index=False, encoding='utf-8')
    logger.info(f"\n증강된 데이터가 저장되었습니다: {output_file}")
    logger.info(f"총 {len(balanced_df)}개의 데이터가 저장되었습니다.")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(current_dir, 'legal_evidence_filtered.csv')
    output_file = os.path.join(current_dir, 'augmented_legal_evidence.csv')
    
    # 각 카테고리별 목표 샘플 수 설정
    target_samples = {
        '성적': 800,  # 줄임
        '스토킹': 500,  # 늘림
        '강요': 116,  # 유지
        '협박': 176,  # 유지
        '개인정보': 500,  # 늘림
        '차별': 800,  # 줄임
        '일반': 52  # 유지
    }
    
    augment_dataset(input_file, output_file, target_samples) 