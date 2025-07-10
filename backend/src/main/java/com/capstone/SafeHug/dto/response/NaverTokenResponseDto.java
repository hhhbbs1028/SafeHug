/**
 * 네이버 OAuth 인증 응답을 처리하기 위한 DTO 클래스
 * 네이버 로그인 후 받는 토큰 정보와 에러 정보를 담고 있습니다.
 * 
 * 주요 필드:
 * - accessToken: 네이버 API 접근에 사용되는 액세스 토큰
 * - refreshToken: 액세스 토큰 갱신에 사용되는 리프레시 토큰
 * - tokenType: 토큰의 타입 (일반적으로 "bearer")
 * - expiresIn: 액세스 토큰의 만료 시간(초)
 * - error: 에러 발생 시 에러 코드
 * - errorDescription: 에러 발생 시 상세 설명
 * 
 * @JsonIgnoreProperties(ignoreUnknown = true): JSON 응답에 알 수 없는 필드가 있어도 무시
 */
package com.capstone.SafeHug.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NaverTokenResponseDto {
    @JsonProperty("access_token")
    private String accessToken;
    
    @JsonProperty("refresh_token")
    private String refreshToken;
    
    @JsonProperty("token_type")
    private String tokenType;
    
    @JsonProperty("expires_in")
    private Integer expiresIn;
    
    @JsonProperty("error")
    private String error;
    
    @JsonProperty("error_description")
    private String errorDescription;
} 