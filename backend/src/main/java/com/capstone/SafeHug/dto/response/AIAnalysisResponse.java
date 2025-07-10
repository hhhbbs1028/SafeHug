package com.capstone.SafeHug.dto.response;

import com.capstone.SafeHug.dto.common.MessageRisk;
import lombok.Data;
import java.util.List;

@Data
public class AIAnalysisResponse {
    private List<MessageAnalysis> messages;
    private List<KeywordAnalysis> keywords;

    @Data
    public static class MessageAnalysis {
        private int id;
        private String date;
        private String message;
        private List<MessageRisk> risks;
    }

    @Data
    public static class KeywordAnalysis {
        private String keyword;
        private int count;
        private String risk;
    }
} 