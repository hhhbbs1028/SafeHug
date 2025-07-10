import requests
import json
from pprint import pprint

def test_ai_analysis(s3_path: str, bucket_name: str):
    # API 엔드포인트 URL
    url = "http://localhost:5000/analyze"
    
    # 요청 데이터
    data = {
        "s3_path": s3_path,
        "bucket_name": bucket_name
    }
    
    try:
        # POST 요청 보내기
        response = requests.post(url, json=data)
        
        # 응답 상태 코드 확인
        response.raise_for_status()
        
        # JSON 응답 파싱
        result = response.json()
        
        # 결과 출력
        print("\n=== 분석 결과 ===")
        print("\n1. 메시지 분석:")
        for msg in result["messages"]:
            print(f"\nID: {msg['id']}")
            print(f"날짜: {msg['date']}")
            print(f"메시지: {msg['message']}")
            print("\n위험 분석:")
            for risk in msg['risks']:
                print(f"- 유형: {risk['type']}")
                print(f"  레벨: {risk['level']}")
        
        print("\n2. 키워드 분석:")
        for keyword in result["keywords"]:
            print(f"\n키워드: {keyword['keyword']}")
            print(f"출현 횟수: {keyword['count']}")
            print(f"위험도: {keyword['risk']}")
            
    except requests.exceptions.RequestException as e:
        print(f"API 호출 중 오류 발생: {e}")
    except json.JSONDecodeError as e:
        print(f"JSON 파싱 중 오류 발생: {e}")
    except Exception as e:
        print(f"예상치 못한 오류 발생: {e}")
        print("응답 데이터:", result)  # 디버깅을 위해 응답 데이터 출력

if __name__ == "__main__":
    # 테스트할 S3 경로와 버킷 이름 입력
    s3_path = "s3://safehug-bucket/chat-files/test.txt"
    bucket_name = "safehug-bucket"    
    # 분석 실행
    test_ai_analysis(s3_path, bucket_name) 