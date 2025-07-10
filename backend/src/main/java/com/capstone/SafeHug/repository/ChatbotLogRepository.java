package com.capstone.SafeHug.repository;

import com.capstone.SafeHug.entity.ChatbotLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ChatbotLogRepository extends JpaRepository<ChatbotLog, Long> {
    @Modifying
    @Query("DELETE FROM ChatbotLog c WHERE c.user IS NULL AND c.createdAt < :cutoff")
    int deleteAnonymousLogsBefore(@Param("cutoff") LocalDateTime cutoff);
} 