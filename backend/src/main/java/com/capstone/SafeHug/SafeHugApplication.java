package com.capstone.SafeHug;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SafeHug 애플리케이션의 메인 클래스
 * 
 * 이 클래스는 Spring Boot 애플리케이션의 시작점입니다.
 * 주요 기능:
 * 1. Spring Boot 애플리케이션 자동 구성
 * 2. 컴포넌트 스캔 및 빈 등록
 * 3. 내장 웹 서버 실행
 * 
 * 프로젝트 구조:
 * - config/: 보안, JWT, AWS 등 설정 클래스
 * - controller/: REST API 엔드포인트 정의
 * - service/: 비즈니스 로직 구현
 * - repository/: 데이터베이스 접근 계층
 * - entity/: 데이터베이스 엔티티 클래스
 * - dto/: 데이터 전송 객체
 * - security/: 인증/인가 관련 클래스
 * - exception/: 커스텀 예외 처리
 */
@SpringBootApplication
public class SafeHugApplication {

	/**
	 * 애플리케이션의 메인 메서드
	 * Spring Boot 애플리케이션을 시작합니다.
	 * 
	 * @param args 커맨드 라인 인자
	 */
	public static void main(String[] args) {
		SpringApplication.run(SafeHugApplication.class, args);
	}
}
