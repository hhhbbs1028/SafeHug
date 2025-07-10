/**
 * 카카오 OAuth 인증 응답을 처리하기 위한 DTO 클래스
 * 카카오 로그인 후 받는 토큰 정보를 담고 있습니다.
 * 
 * 주요 필드:
 * - tokenType: 토큰의 타입 (일반적으로 "bearer")
 * - accessToken: 카카오 API 접근에 사용되는 액세스 토큰
 * - idToken: 사용자 인증 정보를 담은 ID 토큰
 * - expiresIn: 액세스 토큰의 만료 시간(초)
 * - refreshToken: 액세스 토큰 갱신에 사용되는 리프레시 토큰
 * - refreshTokenExpiresIn: 리프레시 토큰의 만료 시간(초)
 * - scope: 부여받은 권한 범위
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
public class KakaoTokenResponseDto {

    @JsonProperty("token_type")
    public String tokenType;
    @JsonProperty("access_token")
    public String accessToken;
    @JsonProperty("id_token")
    public String idToken;
    @JsonProperty("expires_in")
    public Integer expiresIn;
    @JsonProperty("refresh_token")
    public String refreshToken;
    @JsonProperty("refresh_token_expires_in")
    public Integer refreshTokenExpiresIn;
    @JsonProperty("scope")
    public String scope;
    
}
