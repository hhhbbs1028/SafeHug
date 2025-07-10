package com.capstone.SafeHug.service.login;

import com.capstone.SafeHug.dto.response.NaverTokenResponseDto;
import com.capstone.SafeHug.dto.response.NaverUserInfoResponseDto;
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
public class NaverService {

    @Value("${naver.client_id}")
    private String clientId;

    @Value("${naver.client_secret}")
    private String clientSecret;

    @Value("${naver.redirect_uri}")
    private String redirectUri;

    private final String NAVER_AUTH_URI = "https://nid.naver.com";
    private final String NAVER_API_URI = "https://openapi.naver.com";

    public String getNaverLogin() {
        return NAVER_AUTH_URI + "/oauth2.0/authorize" + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code";
    }

    public String getAccessTokenFromNaver(String code) {
        try {
            NaverTokenResponseDto tokenResponse = WebClient.create(NAVER_AUTH_URI)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/oauth2.0/token")
                            .queryParam("grant_type", "authorization_code")
                            .queryParam("client_id", clientId)
                            .queryParam("client_secret", clientSecret)
                            .queryParam("redirect_uri", redirectUri)
                            .queryParam("code", code)
                            .build())
                    .header(HttpHeaders.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED.toString())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> Mono.error(new RuntimeException("네이버 인증 실패: " + errorBody))))
                    .onStatus(HttpStatusCode::is5xxServerError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> Mono.error(new RuntimeException("네이버 서버 오류: " + errorBody))))
                    .bodyToMono(NaverTokenResponseDto.class)
                    .block();

            if (tokenResponse == null || tokenResponse.getAccessToken() == null) {
                throw new RuntimeException("네이버 토큰 응답이 올바르지 않습니다.");
            }

            log.info("[Naver Service] Access Token ------> {}", tokenResponse.getAccessToken());
            log.info("[Naver Service] Refresh Token ------> {}", tokenResponse.getRefreshToken());
            log.info("[Naver Service] Token Type ------> {}", tokenResponse.getTokenType());
            log.info("[Naver Service] Expires In ------> {}", tokenResponse.getExpiresIn());

            return tokenResponse.getAccessToken();
        } catch (Exception e) {
            log.error("네이버 토큰 요청 실패", e);
            throw new RuntimeException("네이버 토큰 요청 실패: " + e.getMessage());
        }
    }

    public NaverUserInfoResponseDto getUserInfo(String accessToken) {
        try {
            NaverUserInfoResponseDto userInfo = WebClient.create(NAVER_API_URI)
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/nid/me")
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.CONTENT_TYPE, HttpHeaderValues.APPLICATION_X_WWW_FORM_URLENCODED.toString())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> Mono.error(new RuntimeException("네이버 사용자 정보 요청 실패: " + errorBody))))
                    .onStatus(HttpStatusCode::is5xxServerError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> Mono.error(new RuntimeException("네이버 서버 오류: " + errorBody))))
                    .bodyToMono(NaverUserInfoResponseDto.class)
                    .block();

            if (userInfo == null || userInfo.getResponse() == null) {
                throw new RuntimeException("네이버 사용자 정보 응답이 올바르지 않습니다.");
            }

            log.info("[Naver Service] User ID ---> {}", userInfo.getResponse().getId());
            log.info("[Naver Service] Email ---> {}", userInfo.getResponse().getEmail());
            log.info("[Naver Service] Name ---> {}", userInfo.getResponse().getName());

            return userInfo;
        } catch (Exception e) {
            log.error("네이버 사용자 정보 요청 실패", e);
            throw new RuntimeException("네이버 사용자 정보 요청 실패: " + e.getMessage());
        }
    }
}
