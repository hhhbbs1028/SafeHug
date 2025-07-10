package com.capstone.SafeHug.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.mail.MailException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${email.from}")
    private String fromEmail;

    @Value("${email.reset-password-url}")
    private String resetPasswordUrl;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("SafeHug 비밀번호 재설정");

            String content = String.format(
                "안녕하세요, SafeHug입니다.<br><br>" +
                "비밀번호 재설정을 요청하셨습니다.<br>" +
                "아래 링크를 클릭하여 비밀번호를 재설정해주세요:<br><br>" +
                "<a href='%s?token=%s'>비밀번호 재설정</a><br><br>" +
                "이 링크는 30분 동안만 유효합니다.<br>" +
                "비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.<br><br>" +
                "감사합니다.<br>" +
                "SafeHug 팀",
                resetPasswordUrl, resetToken
            );

            helper.setText(content, true);
            mailSender.send(message);
            log.info("비밀번호 재설정 이메일 전송 완료 - 수신자: {}", toEmail);
        } catch (MailException | MessagingException e) {
            log.error("이메일 전송 실패: {}", e.getMessage());
            throw new RuntimeException("이메일 전송에 실패했습니다: " + e.getMessage());
        }
    }
} 