package com.capstone.SafeHug.controller.login;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/login")
public class SocialLoginPageController {

    @Value("${kakao.client_id}")
    private String kakaoClientId;

    @Value("${kakao.redirect_uri}")
    private String kakaoRedirectUri;

    @Value("${naver.client_id}")
    private String naverClientId;

    @Value("${naver.redirect_uri}")
    private String naverRedirectUri;

    @GetMapping("/page")
    public String loginPage(Model model) {
        // 카카오 로그인 URL
        String kakaoLocation = "https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=" 
            + kakaoClientId + "&redirect_uri=" + kakaoRedirectUri;
        
        // 네이버 로그인 URL
        String naverLocation = "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" 
            + naverClientId + "&redirect_uri=" + naverRedirectUri;

        model.addAttribute("kakaoLocation", kakaoLocation);
        model.addAttribute("naverLocation", naverLocation);

        return "login";
    }
}
