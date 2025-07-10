package com.capstone.SafeHug.entity;

import com.capstone.SafeHug.common.RiskLevel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class KeywordAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String keyword;
    private Integer count;
    private RiskLevel risk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_analysis_id")
    private ChatAnalysis chatAnalysis;
} 