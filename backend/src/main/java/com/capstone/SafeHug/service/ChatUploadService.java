package com.capstone.SafeHug.service;

import com.capstone.SafeHug.entity.ChatMessage;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.function.Function;

public class ChatUploadService {

    private Map<String, ChatMessage> createMessageMap(List<ChatMessage> messages) {
        return messages.stream()
            .collect(Collectors.toMap(
                message -> String.format("%s_%s_%s", 
                    message.getMessage(),
                    message.getSentAt().toString(),
                    message.getSender()),
                Function.identity(),
                (existing, replacement) -> existing
            ));
    }
} 