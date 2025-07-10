import os
import pandas as pd
import torch
from torch.utils.data import Dataset
from transformers import Trainer, TrainingArguments, AutoTokenizer, AutoModel
from sklearn.model_selection import train_test_split
import logging
import numpy as np
import torch.nn as nn
import shutil
from multiprocessing import freeze_support
from sklearn.metrics import f1_score

# CUDA 디버깅을 위한 환경 변수 설정
os.environ['CUDA_LAUNCH_BLOCKING'] = "1"

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)

# ✅ 라벨 정의
LABELS = ["성적", "스토킹", "강요", "협박", "개인정보", "차별", "모욕", "거절", "일반"]
NUM_LABELS = len(LABELS)

class KobertForMultiLabelClassification(nn.Module):
    def __init__(self, num_labels):
        super().__init__()
        self.kobert = AutoModel.from_pretrained("monologg/kobert", trust_remote_code=True)
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(self.kobert.config.hidden_size, num_labels)
        self.sigmoid = nn.Sigmoid()

    def forward(self, input_ids, attention_mask, labels=None):
        outputs = self.kobert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs[1]  # [CLS] 토큰의 출력
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        logits = self.sigmoid(logits)

        if labels is not None:
            loss_fct = nn.BCELoss()
            loss = loss_fct(logits, labels)
            return loss, logits
        return logits

def validate_data(texts, labels):
    """데이터 유효성 검사"""
    valid_texts = []
    valid_labels = []
    
    for text, label in zip(texts, labels):
        if isinstance(text, str) and len(text.strip()) > 0 and isinstance(label, list) and len(label) == NUM_LABELS:
            valid_texts.append(text)
            valid_labels.append(label)
    
    return valid_texts, valid_labels

class MultiLabelDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        try:
            text = str(self.texts[idx])
            label = self.labels[idx]
            
            # 토크나이징
            encoding = self.tokenizer(
                text,
                truncation=True,
                padding='max_length',
                max_length=self.max_length,
                return_tensors='pt'
            )
            
            # 텐서 변환 및 차원 확인
            input_ids = encoding['input_ids'].squeeze()
            attention_mask = encoding['attention_mask'].squeeze()
            labels_tensor = torch.FloatTensor(label)
            
            # 차원 검증
            assert input_ids.shape[0] == self.max_length, f"Invalid input_ids shape: {input_ids.shape}"
            assert attention_mask.shape[0] == self.max_length, f"Invalid attention_mask shape: {attention_mask.shape}"
            assert labels_tensor.shape[0] == NUM_LABELS, f"Invalid labels shape: {labels_tensor.shape}"
            
            return {
                'input_ids': input_ids,
                'attention_mask': attention_mask,
                'labels': labels_tensor
            }
            
        except Exception as e:
            logging.error(f"Error processing item {idx}: {str(e)}")
            raise

def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    # sigmoid를 통과시켜 0과 1 사이의 값으로 변환
    predictions = (predictions > 0).astype(int)
    
    # 각 레이블에 대한 F1 score 계산
    f1_scores = {}
    for i, label in enumerate(LABELS):
        f1 = f1_score(labels[:, i], predictions[:, i], average='binary')
        f1_scores[f'f1_{label}'] = f1
    
    # 전체 평균 F1 score 계산
    f1_scores['f1_macro'] = f1_score(labels, predictions, average='macro')
    f1_scores['f1_micro'] = f1_score(labels, predictions, average='micro')
    
    return f1_scores

def main():
    # ✅ 데이터 로드
    try:
        data_dir = "labeled-output"
        all_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir) if f.endswith(".csv")]
        
        if not all_files:
            raise ValueError("No CSV files found in the data directory")
        
        dfs = []
        for f in all_files:
            try:
                df = pd.read_csv(f)
                # 필요한 컬럼이 있는지 확인
                required_columns = ["text"] + LABELS
                if not all(col in df.columns for col in required_columns):
                    logging.error(f"File {f} is missing required columns. Required: {required_columns}, Found: {df.columns.tolist()}")
                    continue
                    
                dfs.append(df)
                logging.info(f"Successfully loaded {f}")
            except Exception as e:
                logging.error(f"Error loading file {f}: {str(e)}")
                continue
        if not dfs:
            raise ValueError("No data files were loaded successfully")
        df = pd.concat(dfs, ignore_index=True)
        df = df.dropna(subset=["text"])
        df[LABELS] = df[LABELS].astype(int)
        df["text"] = df["text"].astype(str).str.strip()
        df = df[df["text"].str.len() > 0]
        df["text"] = df["text"].str.slice(0, 512)
        texts = df["text"].tolist()
        labels = df[LABELS].values.tolist()
        texts, labels = validate_data(texts, labels)
        logging.info(f"Total samples loaded: {len(texts)}")
    except Exception as e:
        logging.error(f"Error in data loading: {str(e)}")
        raise

    output_dir = "./multi_label_kobert_model"

    try:
        tokenizer = AutoTokenizer.from_pretrained("monologg/kobert", trust_remote_code=True)
        model = KobertForMultiLabelClassification(NUM_LABELS)
        logging.info("Model and tokenizer loaded successfully")
    except Exception as e:
        logging.error(f"Error loading model: {str(e)}")
        raise

    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.1, random_state=42
    )
    train_dataset = MultiLabelDataset(train_texts, train_labels, tokenizer)
    val_dataset = MultiLabelDataset(val_texts, val_labels, tokenizer)
    logging.info(f"Train dataset size: {len(train_dataset)}")
    logging.info(f"Validation dataset size: {len(val_dataset)}")

    # ✅ 학습 설정
    training_args = TrainingArguments(
        output_dir=output_dir,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        num_train_epochs=5,
        weight_decay=0.01,
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,
        gradient_accumulation_steps=8,
        dataloader_num_workers=0,
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics
    )

    try:
        logging.info("Starting training...")
        trainer.train()
        logging.info("Training completed successfully")
    except Exception as e:
        logging.error(f"Error during training: {str(e)}")
        raise

    try:
        trainer.save_model(output_dir)
        
        # 토크나이저 저장
        tokenizer_dir = os.path.join(output_dir, "tokenizer")
        os.makedirs(tokenizer_dir, exist_ok=True)
        
        # KoBERT 토크나이저 파일 복사
        kobert_tokenizer_path = os.path.dirname(tokenizer.vocab_file)
        for file in os.listdir(kobert_tokenizer_path):
            if file.endswith('.txt') or file.endswith('.json'):
                shutil.copy2(
                    os.path.join(kobert_tokenizer_path, file),
                    os.path.join(tokenizer_dir, file)
                )
        
        logging.info(f"Model and tokenizer saved to '{output_dir}'")
    except Exception as e:
        logging.error(f"Error saving model: {str(e)}")
        raise

if __name__ == "__main__":
    freeze_support()
    main() 