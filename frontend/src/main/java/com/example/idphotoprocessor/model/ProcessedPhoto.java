package com.example.idphotoprocessor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessedPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String originalFileName;
    private String processedFileName;
    private String originalFilePath;
    private String processedFilePath;
    private LocalDateTime processedAt;
    private ProcessingStatus status;
    
    @Enumerated(EnumType.STRING)
    private BackgroundOptions.BackgroundType backgroundType;
    private String backgroundValue;
    
    @Enumerated(EnumType.STRING)
    private ClothesOptions.ClothesType clothesType;
    private String clothesColor;
    
    private Integer brightness;
    private Integer contrast;
    private Integer saturation;
    private Integer smoothing;
    
    @Enumerated(EnumType.STRING)
    private ExportOptions.ExportFormat exportFormat;
    
    @Enumerated(EnumType.STRING)
    private ExportOptions.ExportSize exportSize;
    
    @OneToMany(mappedBy = "processedPhoto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcessingAction> actions = new ArrayList<>();
    
    public enum ProcessingStatus {
        PROCESSING,
        COMPLETED,
        FAILED
    }
}