package com.capstone.SafeHug.repository;

import com.capstone.SafeHug.entity.ChatAnalysis;
import com.capstone.SafeHug.entity.KeywordAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KeywordAnalysisRepository extends JpaRepository<KeywordAnalysis, Long> {
    List<KeywordAnalysis> findByChatAnalysis(ChatAnalysis chatAnalysis);
}
