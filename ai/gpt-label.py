import os
import pandas as pd
from openai import OpenAI
from tqdm import tqdm

# ✅ OpenAI API 키 설정
client = OpenAI(api_key="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")
import os
import pandas as pd
from tqdm import tqdm

# 📁 폴더 경로
input_folder = 'temp-label'
output_folder = 'labeled-output'
os.makedirs(output_folder, exist_ok=True)

# 🎯 라벨 이름
labels = ["성적", "스토킹", "강요", "협박", "개인정보", "차별", "모욕", "일반"]
BATCH_SIZE = 10  # ← 배치 크기

# 🧠 GPT 라벨링 함수
def classify_text(text):
    prompt = (
        f"다음 문장을 보고 다음 카테고리 중 해당되는 것에 대해 1 또는 0으로 구분해줘. "
        f"여러 카테고리에 해당될 수 있어. "
        f"카테고리: {', '.join(labels)}\n"
        f"형식: label_name: 0 또는 1\n"
        f"문장: {text}\n"
        f"결과:"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 텍스트 라벨링을 잘하는 분류 도우미야."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        reply = response.choices[0].message.content

        # 🧹 결과 파싱
        label_dict = {label: 0 for label in labels}
        for line in reply.splitlines():
            if ':' in line:
                key, value = line.split(':')
                key, value = key.strip(), value.strip()
                if key in label_dict:
                    label_dict[key] = int(value)

        return [label_dict[label] for label in labels]

    except Exception as e:
        print(f"Error: {e}")
        return [0] * len(labels)

# 📦 CSV 배치 처리
for filename in os.listdir(input_folder):
    if filename.endswith(".csv"):
        filepath = os.path.join(input_folder, filename)
        df = pd.read_csv(filepath)

        print(f"Processing: {filename}")
        results = []
        output_path = os.path.join(output_folder, filename.replace('.csv', '_labeled.csv'))

        # 중간 저장된 파일이 있으면 이어서 처리
        if os.path.exists(output_path):
            existing_df = pd.read_csv(output_path)
            processed_count = len(existing_df)
            df = df.iloc[processed_count:]  # 나머지만 처리
            results.extend(existing_df[labels].values.tolist())
            print(f"Resuming from row {processed_count}")
        else:
            processed_count = 0

        for idx, text in enumerate(tqdm(df['text'].astype(str), desc="Labeling", initial=processed_count, total=processed_count + len(df))):
            result = classify_text(text)
            results.append(result)

            # BATCH_SIZE마다 중간 저장
            if (idx + 1) % BATCH_SIZE == 0 or (idx + 1) == len(df):
                labeled_so_far = pd.DataFrame(results, columns=labels)
                all_texts = pd.concat([df.iloc[:len(labeled_so_far)][['text']].reset_index(drop=True), labeled_so_far], axis=1)
                all_texts.to_csv(output_path, index=False, encoding='utf-8-sig')
                print(f"Saved progress to: {output_path}")

        print(f"Labeled file saved to: {output_path}")
