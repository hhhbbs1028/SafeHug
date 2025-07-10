package com.capstone.SafeHug.service.login;

import com.capstone.SafeHug.dto.response.KakaoTokenResponseDto;
import com.capstone.SafeHug.dto.response.KakaoUserInfoResponseDto;
import io.netty.handler.codec.http.HttpHeaderValues;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@Slf4j
@RequiredArgsConstructor
public class KakaoService {

    @Value("${kakao.client_id}")
    private String clientId;
    
    @Value("${kakao.redirect_uri}")
    private String redirectUri;
    
    private final String KAUTH_TOKEN_URL_HOST = "https://kauth.kakao.com";
    private final String KAUTH_USER_URL_HOST = "https://kapi.kakao.com";

    public String getKakaoLogin() {
        return KAUTH_TOKEN_URL_HOST + "/oauth/authorize" 
            + "?client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&response_type=code";
    }

    public String getAccessTokenFromKakao(String code) {
        try {
            log.info("[Kakao Service] Getting access token with code: {}", code);
            log.info("[Kakao Service] Redirect URI: {}", redirectUri);
            
            KakaoTokenResponseDto kakaoTokenResponseDto = WebClient.create(KAUTH_TOKEN_URL_HOST).post()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .path("/oauth/token")
                            .queryParam("grant_type", "authorization_code")
                            .queryParam("client_id", clientId)
                            .queryParam("redirect_uri", redirectUri)
                            .queryParam("code", code)
                            .build(true))
                    .header(HttpHeaders.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED.toString())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> 
                        clientResponse.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                log.error("[Kakao Service] 4xx Error: {}", errorBody);
                                return Mono.error(new RuntimeException("카카오 인증 실패: " + errorBody));
                            }))
                    .onStatus(HttpStatusCode::is5xxServerError, clientResponse -> 
                        clientResponse.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                log.error("[Kakao Service] 5xx Error: {}", errorBody);
                                return Mono.error(new RuntimeException("카카오 서버 오류: " + errorBody));
                            }))
                    .bodyToMono(KakaoTokenResponseDto.class)
                    .block();

            if (kakaoTokenResponseDto == null || kakaoTokenResponseDto.getAccessToken() == null) {
                log.error("[Kakao Service] Invalid token response: {}", kakaoTokenResponseDto);
                throw new RuntimeException("카카오 토큰 응답이 올바르지 않습니다.");
            }

            log.info("[Kakao Service] Successfully received tokens");
            log.info("[Kakao Service] Access Token: {}", kakaoTokenResponseDto.getAccessToken());
            log.info("[Kakao Service] Refresh Token: {}", kakaoTokenResponseDto.getRefreshToken());
            log.info("[Kakao Service] Id Token: {}", kakaoTokenResponseDto.getIdToken());
            log.info("[Kakao Service] Scope: {}", kakaoTokenResponseDto.getScope());

            return kakaoTokenResponseDto.getAccessToken();
        } catch (Exception e) {
            log.error("[Kakao Service] Failed to get access token", e);
            throw new RuntimeException("카카오 토큰 요청 실패: " + e.getMessage());
        }
    }

    public KakaoUserInfoResponseDto getUserInfo(String accessToken) {
        try {
            log.info("[Kakao Service] Getting user info with access token");
            
            KakaoUserInfoResponseDto userInfo = WebClient.create(KAUTH_USER_URL_HOST)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .path("/v2/user/me")
                            .build(true))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED.toString())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse -> 
                        clientResponse.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                log.error("[Kakao Service] 4xx Error getting user info: {}", errorBody);
                                return Mono.error(new RuntimeException("카카오 사용자 정보 요청 실패: " + errorBody));
                            }))
                    .onStatus(HttpStatusCode::is5xxServerError, clientResponse -> 
                        clientResponse.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                log.error("[Kakao Service] 5xx Error getting user info: {}", errorBody);
                                return Mono.error(new RuntimeException("카카오 서버 오류: " + errorBody));
                            }))
                    .bodyToMono(KakaoUserInfoResponseDto.class)
                    .block();

            if (userInfo == null) {
                log.error("[Kakao Service] Invalid user info response");
                throw new RuntimeException("카카오 사용자 정보 응답이 올바르지 않습니다.");
            }

            log.info("[Kakao Service] Successfully received user info");
            log.info("[Kakao Service] User ID: {}", userInfo.getId());
            log.info("[Kakao Service] User Email: {}", userInfo.getKakaoAccount().getEmail());
            log.info("[Kakao Service] User Nickname: {}", userInfo.getKakaoAccount().getProfile().getNickName());

            return userInfo;
        } catch (Exception e) {
            log.error("[Kakao Service] Failed to get user info", e);
            throw new RuntimeException("카카오 사용자 정보 요청 실패: " + e.getMessage());
        }
    }
}
