package com.capstone.SafeHug.controller;

import com.capstone.SafeHug.dto.request.ChatbotRequest;
import com.capstone.SafeHug.dto.response.ChatbotResponse;
import com.capstone.SafeHug.service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatbotResponse> processMessage(@RequestBody ChatbotRequest request) {
        try {
            ChatbotResponse response = chatbotService.processMessage(request);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ChatbotResponse("죄송합니다. 오류가 발생했습니다.", null, "error"));
        }
    }
} 