package com.capstone.SafeHug.service;

import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final AmazonS3Client amazonS3Client;

    @Value("${cloud.aws.s3.bucketName}")
    private String bucket;

    public String upload(MultipartFile file, String key) throws IOException {
        log.info("Uploading file to S3 with key: {}", key);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        try {
            amazonS3Client.putObject(
                    new PutObjectRequest(bucket, key, file.getInputStream(), metadata)
            );

            String fileUrl = amazonS3Client.getUrl(bucket, key).toString();
            log.info("File uploaded successfully. URL: {}", fileUrl);
            return fileUrl;
        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", e.getMessage());
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    public String download(String fileUrl) throws IOException {
        try {
            log.info("Starting download process for URL: {}", fileUrl);
            
            String key = extractKeyFromUrl(fileUrl);
            log.info("Extracted key for download: {}", key);
            
            // Verify if the object exists
            boolean exists = amazonS3Client.doesObjectExist(bucket, key);
            log.info("Object exists in S3: {}", exists);
            
            if (!exists) {
                log.error("Object does not exist in S3. Bucket: {}, Key: {}", bucket, key);
                throw new IOException("File not found in S3: " + key);
            }
            
            S3Object s3Object = amazonS3Client.getObject(bucket, key);
            log.info("Successfully retrieved S3 object");
            
            StringBuilder content = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(s3Object.getObjectContent()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    content.append(line).append("\n");
                }
            }
            
            log.info("File content read successfully");
            return content.toString();
        } catch (Exception e) {
            log.error("Error downloading file from S3: {}", e.getMessage());
            throw new IOException("Failed to download file from S3: " + e.getMessage(), e);
        }
    }

    private String extractKeyFromUrl(String fileUrl) {
        try {
            log.info("Extracting key from URL: {}", fileUrl);
            
            // If the URL is already a relative path (starts with chat-files/), return it as is
            if (fileUrl.startsWith("chat-files/")) {
                log.info("Using direct path as key: {}", fileUrl);
                return fileUrl;
            }

            // Extract the key from the full S3 URL
            String key;
            if (fileUrl.contains(bucket)) {
                // Full S3 URL인 경우
                String[] parts = fileUrl.split(bucket + "\\.s3\\.");
                if (parts.length < 2) {
                    log.error("Invalid S3 URL format. URL: {}", fileUrl);
                    throw new IllegalArgumentException("Invalid S3 URL format");
                }
                key = parts[1].substring(parts[1].indexOf("/") + 1);
            } else {
                // 이미 키만 있는 경우
                key = fileUrl;
            }

            // URL 디코딩
            String decodedKey = URLDecoder.decode(key, StandardCharsets.UTF_8);
            log.info("Extracted and decoded key from URL: {}", decodedKey);
            return decodedKey;
        } catch (Exception e) {
            log.error("Error extracting key from URL: {}", fileUrl);
            throw new IllegalArgumentException("Invalid S3 file URL format: " + e.getMessage());
        }
    }

    public String uploadFile(MultipartFile file, String dirName) throws IOException {
        String fileName = createFileName(file.getOriginalFilename());
        String filePath = dirName + "/" + fileName;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        amazonS3Client.putObject(new PutObjectRequest(
                bucket,
                filePath,
                file.getInputStream(),
                metadata
        ));

        return amazonS3Client.getUrl(bucket, filePath).toString();
    }

    public String uploadPdf(String localFilePath, String dirName) {
        File file = new File(localFilePath);
        String fileName = createFileName(file.getName());
        String filePath = dirName + "/" + fileName;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType("application/pdf");
        metadata.setContentLength(file.length());

        amazonS3Client.putObject(new PutObjectRequest(
                bucket,
                filePath,
                file
        ));

        return amazonS3Client.getUrl(bucket, filePath).toString();
    }

    private String createFileName(String originalFileName) {
        return UUID.randomUUID().toString() + "_" + originalFileName;
    }
}
