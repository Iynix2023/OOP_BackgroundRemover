package com.example.idphotoprocessor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportOptions {
    private ExportFormat format;
    private ExportSize size;
    private ExportLayout layout;
    
    public enum ExportFormat {
        JPEG,
        PNG
    }
    
    public enum ExportSize {
        STANDARD_35x45,
        US_PASSPORT_2x2,
        CUSTOM
    }
    
    public enum ExportLayout {
        SINGLE,
        GRID_2x2,
        GRID_4x6
    }
}