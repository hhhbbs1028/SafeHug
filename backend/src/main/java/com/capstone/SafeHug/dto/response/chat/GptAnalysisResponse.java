package com.capstone.SafeHug.dto.response.chat;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GptAnalysisResponse {
    private String summary;
    private List<String> reasons;
}
