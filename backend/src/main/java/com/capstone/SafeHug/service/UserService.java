package com.capstone.SafeHug.service;

import com.capstone.SafeHug.dto.response.KakaoUserInfoResponseDto;
import com.capstone.SafeHug.dto.response.NaverUserInfoResponseDto;
import com.capstone.SafeHug.dto.request.UserRequestDTO;
import com.capstone.SafeHug.entity.User;
import com.capstone.SafeHug.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User signup(UserRequestDTO dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }

        if (userRepository.findByPhoneNumber(dto.getPhoneNumber()).isPresent()){
            throw new RuntimeException("이미 존재하는 번호입니다.");
        }

        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .phoneNumber(dto.getPhoneNumber())
                .socialType(User.SocialType.None)
                .build();

        return userRepository.save(user);
    }

    public User login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));
    }

    public Optional<User> findByEmail(String email){
        return userRepository.findByEmail(email);
    }

    @Transactional
    public User processKakaoUser(KakaoUserInfoResponseDto kakaoUserInfo) {
        // 카카오 ID로 기존 사용자 확인
        String socialId = String.valueOf(kakaoUserInfo.getId());
        return userRepository.findBySocialId(socialId)
                .map(user -> {
                    // 기존 사용자 정보 업데이트
                    if (kakaoUserInfo.getKakaoAccount() != null && kakaoUserInfo.getKakaoAccount().getProfile() != null) {
                        user.setName(kakaoUserInfo.getKakaoAccount().getProfile().getNickName());
                        user.setEmail(kakaoUserInfo.getKakaoAccount().getEmail());
                        user.setSocialType(User.SocialType.Kakao);
                        return userRepository.save(user);
                    }
                    return user;
                })
                .orElseGet(() -> {
                    // 새로운 사용자 생성
                    User newUser = User.builder()
                            .name(kakaoUserInfo.getKakaoAccount() != null && 
                                  kakaoUserInfo.getKakaoAccount().getProfile() != null ? 
                                  kakaoUserInfo.getKakaoAccount().getProfile().getNickName() : 
                                  "카카오사용자")
                            .email(kakaoUserInfo.getKakaoAccount() != null ? 
                                  kakaoUserInfo.getKakaoAccount().getEmail() : 
                                  socialId + "@kakao.com")
                            .socialType(User.SocialType.Kakao)
                            .socialId(socialId)
                            .build();
                    return userRepository.save(newUser);
                });
    }

    @Transactional
    public User processNaverUser(NaverUserInfoResponseDto naverUserInfo) {
        // 네이버 ID로 기존 사용자 확인
        String socialId = naverUserInfo.getResponse().getId();
        return userRepository.findBySocialId(socialId)
                .map(user -> {
                    // 기존 사용자 정보 업데이트
                    if (naverUserInfo.getResponse() != null) {
                        user.setName(naverUserInfo.getResponse().getName());
                        user.setEmail(naverUserInfo.getResponse().getEmail());
                        user.setSocialType(User.SocialType.Naver);
                        return userRepository.save(user);
                    }
                    return user;
                })
                .orElseGet(() -> {
                    // 새로운 사용자 생성
                    User newUser = User.builder()
                            .name(naverUserInfo.getResponse().getName())
                            .email(naverUserInfo.getResponse().getEmail())
                            .socialType(User.SocialType.Naver)
                            .socialId(socialId)
                            .build();
                    return userRepository.save(newUser);
                });
    }

    @Transactional
    public void updatePassword(Long userId, String newPassword) {
        User user = findById(userId);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = findById(userId);
        
        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }
        
        // 새 비밀번호 유효성 검사
        if (newPassword.length() < 8) {
            throw new RuntimeException("새 비밀번호는 8자 이상이어야 합니다.");
        }
        
        // 새 비밀번호로 업데이트
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void withdrawUser(Long userId, String password) {
        User user = findById(userId);
        
        // 비밀번호 확인
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }
        
        // 소셜 로그인 사용자인 경우
        if (user.getSocialType() != User.SocialType.None) {
            throw new RuntimeException("소셜 로그인 사용자는 회원 탈퇴가 불가능합니다.");
        }
        
        // 사용자 삭제
        userRepository.delete(user);
    }
}
