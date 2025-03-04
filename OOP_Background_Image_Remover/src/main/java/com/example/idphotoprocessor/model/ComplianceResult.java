package com.example.idphotoprocessor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceResult {
    private boolean isCompliant;
    private List<ComplianceIssue> issues;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceIssue {
        private IssueType type;
        private String message;
        private IssueSeverity severity;
        
        public enum IssueType {
            FACE,
            BACKGROUND,
            SIZE,
            QUALITY
        }
        
        public enum IssueSeverity {
            WARNING,
            ERROR
        }
    }
}