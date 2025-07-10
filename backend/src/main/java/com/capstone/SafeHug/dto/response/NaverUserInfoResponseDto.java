/**
 * 네이버 사용자 정보 응답을 처리하기 위한 DTO 클래스
 * 네이버 로그인 후 받는 사용자 정보를 담고 있습니다.
 * 
 * 주요 필드:
 * - response: 사용자 정보를 담고 있는 내부 클래스
 *   - id: 네이버 사용자 고유 ID
 *   - email: 사용자 이메일
 *   - name: 사용자 이름
 *   - mobile: 사용자 휴대전화번호
 *   - mobileE164: E.164 형식의 휴대전화번호 (국제 표준 형식)
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
public class NaverUserInfoResponseDto {
    @JsonProperty("response")
    private Response response;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        @JsonProperty("id")
        private String id;

        @JsonProperty("email")
        private String email;

        @JsonProperty("name")
        private String name;
        
        @JsonProperty("mobile")
        private String mobile;
        
        @JsonProperty("mobile_e164")
        // 휴대전화번호의 E.164 형식
        private String mobileE164;
    }
} 