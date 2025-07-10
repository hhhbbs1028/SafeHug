package com.capstone.SafeHug.repository;

import com.capstone.SafeHug.entity.ChatAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface ChatAnalysisRepository extends JpaRepository<ChatAnalysis, Long> {
    Optional<ChatAnalysis> findByChatUploadId(Long chatUploadId);

    List<ChatAnalysis> findByUserId(Long userId);

    Optional<ChatAnalysis> findByEvidenceRecordId(Long evidenceRecordId);
} 