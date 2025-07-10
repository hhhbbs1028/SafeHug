package com.capstone.SafeHug.controller;

import com.capstone.SafeHug.dto.response.chat.ChatAnalysisResponse;
import com.capstone.SafeHug.dto.response.ApiResponse;
import com.capstone.SafeHug.service.FileUploadService;
import com.capstone.SafeHug.service.ChatAnalysisService;
import com.capstone.SafeHug.entity.ChatUpload;
import com.capstone.SafeHug.entity.User;
import com.capstone.SafeHug.repository.ChatUploadRepository;
import com.capstone.SafeHug.repository.UserRepository;
import com.capstone.SafeHug.exception.UserNotFoundException;
import com.capstone.SafeHug.exception.FileUploadException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 채팅 파일 업로드를 처리하는 컨트롤러
 * 파일 업로드, 분석 요청 등의 기능을 제공합니다.
 */
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class ChatUploadController {

    private static final Logger log = LoggerFactory.getLogger(ChatUploadController.class);
    private final ChatUploadRepository chatUploadRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final ChatAnalysisService chatAnalysisService;

    /**
     * 채팅 파일을 업로드하고 분석을 요청합니다.
     * @param file 업로드할 채팅 파일
     * @param userId 사용자 ID
     * @param userName 사용자 이름
     * @return 업로드 및 분석 결과
     * @throws UserNotFoundException 사용자를 찾을 수 없는 경우
     * @throws FileUploadException 파일 업로드 중 오류가 발생한 경우
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatAnalysisResponse>> uploadFile(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam("userName") String userName) {
        log.warn("🚨 /chat 요청 발생 - IP: {}", request.getRemoteAddr());

        log.info("파일 업로드 시작 - userId: {}, userName: {}, 파일명: {}, 파일크기: {} bytes",
                userId, userName, file.getOriginalFilename(), file.getSize());
        long startTime = System.currentTimeMillis();
        log.info("post mapping chat");

        try {
            // 1. 파일 유효성 검사
            if (file.isEmpty()) {
                throw new FileUploadException("업로드된 파일이 비어있습니다.");
            }

            // 2. userName 유효성 검사
            if (userName == null || userName.trim().isEmpty()) {
                throw new FileUploadException("사용자 이름은 필수입니다.");
            }

            // 3. 사용자 확인 (선택적)
            User user = null;
            if (userId != null) {
                try {
                    user = userRepository.findById(userId)
                        .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다: " + userId));
                    log.debug("사용자 확인 완료 - userId: {}", userId);
                } catch (UserNotFoundException e) {
                    log.warn("사용자를 찾을 수 없음 - userId: {}", userId);
                    // 사용자를 찾을 수 없어도 계속 진행
                }
            }

            // 4. 파일 업로드
            String uploadedUrl = fileUploadService.uploadChatFile(file);
            log.debug("파일 업로드 완료 - URL: {}", uploadedUrl);

            // 5. 채팅 업로드 정보 저장
            ChatUpload chatUpload = ChatUpload.builder()
                    .user(user)  // user가 null이어도 저장 가능
                    .filePath(uploadedUrl)
                    .uploadedAt(LocalDateTime.now())
                    .userName(userName.trim())  // 공백 제거
                    .build();

            chatUpload = chatUploadRepository.save(chatUpload);
            log.debug("채팅 업로드 정보 저장 완료 - uploadId: {}", chatUpload.getId());
            
            // 6. 채팅 분석 실행 및 응답 반환
            try {
                ChatAnalysisResponse response = chatAnalysisService.analyzeChat(chatUpload.getId(), userName);
                log.info("채팅 분석 완료 - uploadId: {}, 처리시간: {}ms", 
                        chatUpload.getId(), System.currentTimeMillis() - startTime);

                return ResponseEntity.ok(ApiResponse.success("파일 업로드 및 분석이 완료되었습니다.", response));
            } catch (Exception e) {
                log.error("채팅 분석 중 오류 발생 - uploadId: {}, 오류: {}", chatUpload.getId(), e.getMessage());
                return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("채팅 분석 중 오류가 발생했습니다.", "CHAT_ANALYSIS_FAILED", List.of(e.getMessage())));
            }
            
        } catch (FileUploadException e) {
            log.error("파일 업로드 실패 - userId: {}, userName: {}, 파일명: {}, 오류: {}", 
                    userId, userName, file.getOriginalFilename(), e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("파일 업로드에 실패했습니다.", "FILE_UPLOAD_FAILED", List.of(e.getMessage())));
        } catch (Exception e) {
            log.error("예상치 못한 오류 발생 - userId: {}, userName: {}, 파일명: {}, 오류: {}", 
                    userId, userName, file.getOriginalFilename(), e.getMessage());
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("업로드 처리 중 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR", List.of(e.getMessage())));
        }
    }

}
