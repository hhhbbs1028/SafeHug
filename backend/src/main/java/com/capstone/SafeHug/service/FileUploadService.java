package com.capstone.SafeHug.service;

import com.capstone.SafeHug.entity.ChatUpload;
import com.capstone.SafeHug.repository.ChatUploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final S3Service s3Service;
    private final ChatUploadRepository chatUploadRepository;

    @Value("${cloud.aws.s3.chat-dir}")
    private String chatDir;

    public String uploadChatFile(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".txt";
            String uniqueFilename = UUID.randomUUID() + extension;

            // S3에 파일 업로드 (chatDir 경로 사용)
            String fileUrl = s3Service.upload(file, chatDir + uniqueFilename);
            log.info("File uploaded successfully: {}", fileUrl);

            return fileUrl;
        } catch (IOException e) {
            log.error("Failed to upload file to S3", e);
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to process file upload", e);
            throw new RuntimeException("Failed to process file upload: " + e.getMessage(), e);
        }
    }

    public String downloadChatFile(String fileUrl) {
        try {
            if (fileUrl == null || fileUrl.trim().isEmpty()) {
                throw new IllegalArgumentException("File URL is required");
            }

            String content = s3Service.download(fileUrl);
            return content;
        } catch (Exception e) {
            log.error("Failed to download chat file", e);
            throw new RuntimeException("Failed to download chat file: " + e.getMessage(), e);
        }
    }
} 