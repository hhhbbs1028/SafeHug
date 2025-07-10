package com.capstone.SafeHug.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.BucketCrossOriginConfiguration;
import com.amazonaws.services.s3.model.CORSRule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
public class AmazonS3Config {

    @Value("${cloud.aws.credentials.accessKey}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secretKey}")
    private String secretKey;

    @Value("${cloud.aws.region.static}")
    private String region;

    @Value("${cloud.aws.s3.bucketName}")
    private String bucketName;

    @Bean
    @Primary
    public AmazonS3Client amazonS3Client() {
        try {
            log.info("Initializing Amazon S3 client with region: {}", region);
            BasicAWSCredentials awsCredentials = new BasicAWSCredentials(accessKey, secretKey);

            AmazonS3Client s3Client = (AmazonS3Client) AmazonS3ClientBuilder.standard()
                    .withRegion(region)
                    .withCredentials(new AWSStaticCredentialsProvider(awsCredentials))
                    .build();

            // Test connection
            s3Client.listBuckets();
            log.info("Successfully connected to Amazon S3");

            // Configure CORS
            configureCORS(s3Client);

            return s3Client;
        } catch (Exception e) {
            log.error("Failed to initialize Amazon S3 client: {}", e.getMessage());
            throw new RuntimeException("Failed to initialize Amazon S3 client", e);
        }
    }

    private void configureCORS(AmazonS3Client s3Client) {
        try {
            CORSRule rule = new CORSRule()
                    .withAllowedMethods(Arrays.asList(
                            CORSRule.AllowedMethods.GET,
                            CORSRule.AllowedMethods.POST,
                            CORSRule.AllowedMethods.PUT,
                            CORSRule.AllowedMethods.DELETE,
                            CORSRule.AllowedMethods.HEAD))
                    .withAllowedOrigins(Arrays.asList("http://localhost:3000"))
                    .withAllowedHeaders(Arrays.asList("*"))
                    .withMaxAgeSeconds(3000);

            BucketCrossOriginConfiguration configuration = new BucketCrossOriginConfiguration();
            configuration.setRules(Arrays.asList(rule));

            s3Client.setBucketCrossOriginConfiguration(bucketName, configuration);
            log.info("Successfully configured CORS for bucket: {}", bucketName);
        } catch (Exception e) {
            log.error("Failed to configure CORS for bucket {}: {}", bucketName, e.getMessage());
        }
    }
}