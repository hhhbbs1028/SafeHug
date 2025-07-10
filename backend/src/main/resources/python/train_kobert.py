import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import BertModel, BertTokenizer
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

class ChatDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def train_model(model, train_loader, val_loader, device, num_epochs=5):
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    
    best_val_loss = float('inf')
    
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0
        for batch in train_loader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            optimizer.zero_grad()
            outputs = model(input_ids, attention_mask)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        # 검증
        model.eval()
        val_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['labels'].to(device)
                
                outputs = model(input_ids, attention_mask)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        avg_train_loss = total_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        accuracy = 100 * correct / total
        
        logger.info(f'Epoch {epoch+1}/{num_epochs}:')
        logger.info(f'Average training loss: {avg_train_loss:.4f}')
        logger.info(f'Average validation loss: {avg_val_loss:.4f}')
        logger.info(f'Validation accuracy: {accuracy:.2f}%')
        
        # 최고 성능 모델 저장
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), 'kobert_classifier.pt')
            logger.info('Model saved!')

def main():
    # 데이터 로드 (예시 데이터)
    data = {
        'text': [
            "안녕하세요",
            "성폭력 관련 상담이 필요합니다",
            "스토킹 당하고 있습니다",
            "협박을 받고 있어요",
            "개인정보가 유출되었어요",
            "차별을 당하고 있습니다",
            "일반적인 대화입니다"
        ],
        'label': [
            'NORMAL',
            'SEXUAL',
            'STALKING',
            'THREAT',
            'PERSONAL_INFO',
            'DISCRIMINATION',
            'NORMAL'
        ]
    }
    
    df = pd.DataFrame(data)
    
    # 레이블 인코딩
    label_encoder = LabelEncoder()
    df['label'] = label_encoder.fit_transform(df['label'])
    
    # 데이터 분할
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        df['text'].values, df['label'].values, test_size=0.2, random_state=42
    )
    
    # 토크나이저 초기화
    tokenizer = BertTokenizer.from_pretrained('monologg/kobert')
    
    # 데이터셋 생성
    train_dataset = ChatDataset(train_texts, train_labels, tokenizer)
    val_dataset = ChatDataset(val_texts, val_labels, tokenizer)
    
    # 데이터로더 생성
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=16)
    
    # 모델 초기화
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = KoBERTClassifier(num_classes=len(label_encoder.classes_)).to(device)
    
    # 모델 학습
    train_model(model, train_loader, val_loader, device)
    
    # 레이블 매핑 저장
    label_mapping = {i: label for i, label in enumerate(label_encoder.classes_)}
    np.save('label_mapping.npy', label_mapping)
    logger.info('Label mapping saved!')

if __name__ == "__main__":
    main() 