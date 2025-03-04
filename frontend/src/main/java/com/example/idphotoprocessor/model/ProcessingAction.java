package com.example.idphotoprocessor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingAction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "processed_photo_id")
    private ProcessedPhoto processedPhoto;
    
    @Enumerated(EnumType.STRING)
    private ActionType actionType;
    
    @Column(columnDefinition = "TEXT")
    private String actionParameters;
    
    private LocalDateTime timestamp;
    
    public enum ActionType {
        CROP,
        RESIZE,
        BACKGROUND,
        CLOTHES,
        ENHANCE
    }
}