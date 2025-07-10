package com.capstone.SafeHug.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class ChatbotResponse {
    private String message;
    private List<String> options;
    private String type;
    
    public ChatbotResponse(String message, List<String> options, String type) {
        this.message = message;
        this.options = options;
        this.type = type;
    }
} 