package com.capstone.SafeHug.dto.request;

import com.capstone.SafeHug.dto.common.IncidentDate;
import com.capstone.SafeHug.dto.common.OutputOptions;
import com.capstone.SafeHug.dto.common.Signature;
import com.capstone.SafeHug.entity.EvidenceRecord;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PdfCreateRequest {

    private String title;
    private List<EvidenceRecord.Category> category;
    private List<String> tags;
    private IncidentDate incidentDate;
    private String incidentTime;
    private String location;
    private String offenderInfo;
    private List<String> witnesses;
    private List<String> emotions;
    private String otherEmotion;
    private String details;
    private OutputOptions outputOptions;
    private Signature signature;
}
