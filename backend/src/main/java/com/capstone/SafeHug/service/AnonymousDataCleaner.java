package com.capstone.SafeHug.service;

import com.capstone.SafeHug.entity.ChatUpload;
import com.capstone.SafeHug.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AnonymousDataCleaner {

    private final ChatUploadRepository chatUploadRepository;
    private final ChatbotLogRepository chatbotLogRepository;

    @Scheduled(fixedRate = 1000 * 60 * 30) // 30분마다 실행
    public void cleanAnonymousData() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(1);
        List<ChatUpload> targets = chatUploadRepository.findAnonymousUploadsBefore(threshold);

        for (ChatUpload upload : targets) {
            chatUploadRepository.delete(upload); // Cascade로 ChatMessage, KeywordAnalysis, ChatAnalysis까지 삭제됨
        }
    }

    @Scheduled(cron = "0 0 * * * *") // 매 시간 정각마다 실행
    public void deleteAnonymousLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
        int deleted = chatbotLogRepository.deleteAnonymousLogsBefore(cutoff);
    }
}