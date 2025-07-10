package com.capstone.SafeHug.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class ChatGPTConfig {
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.api.url}")
    private String apiUrl;
    
    @PostConstruct
    public void init() {
        log.info("✅ [ChatGPTConfig] API KEY = {}", apiKey);
        log.info("✅ [ChatGPTConfig] API URL = {}", apiUrl);
    }
    
    public String getApiKey() {
        return apiKey;
    }
    
    public String getApiUrl() {
        return apiUrl;
    }
} 