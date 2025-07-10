package com.capstone.SafeHug.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatbotRequest {
    private String message;
    private String sessionId;
    private Long userId;
} 