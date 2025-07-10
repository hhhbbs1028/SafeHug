package com.capstone.SafeHug.repository;

import com.capstone.SafeHug.entity.ChatUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatUploadRepository extends JpaRepository<ChatUpload, Long> {
    Optional<ChatUpload> findByFilePath(String filePath);

    @Query("SELECT cu FROM ChatUpload cu WHERE cu.user IS NULL AND cu.uploadedAt < :threshold")
    List<ChatUpload> findAnonymousUploadsBefore(@Param("threshold") LocalDateTime threshold);

}
