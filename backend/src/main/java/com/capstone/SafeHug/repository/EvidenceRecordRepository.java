package com.capstone.SafeHug.repository;

import com.capstone.SafeHug.entity.ChatAnalysis;
import com.capstone.SafeHug.entity.EvidenceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceRecordRepository extends JpaRepository<EvidenceRecord, Long> {

    List<EvidenceRecord> findByUserId(Long userId);
    boolean existsByChatAnalysisId(Long chatAnalysisId);

} 