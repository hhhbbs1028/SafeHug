package com.capstone.SafeHug.repository;

import com.capstone.SafeHug.common.RiskLevel;
import com.capstone.SafeHug.entity.ChatMessage;
import com.capstone.SafeHug.entity.ChatUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatUploadId(Long chatUploadId);
    List<ChatMessage> findByChatUpload(ChatUpload chatUpload);
    
    @Query("SELECT COUNT(DISTINCT m) FROM ChatMessage m JOIN m.risks r WHERE r.riskLevel = :riskLevel")
    long countByRiskLevel(@Param("riskLevel") RiskLevel riskLevel);
} 