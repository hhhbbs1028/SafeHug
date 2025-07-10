package com.capstone.SafeHug.repository;

import com.capstone.SafeHug.entity.EvidencePdf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EvidencePdfRepository extends JpaRepository<EvidencePdf, Long> {
} 