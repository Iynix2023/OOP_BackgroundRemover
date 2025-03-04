package com.example.idphotoprocessor.service;

import com.example.idphotoprocessor.model.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface ImageProcessingService {
    ProcessedPhoto processImage(MultipartFile file, PhotoProcessingRequest request);
    
    CompletableFuture<List<ProcessedPhoto>> processBatchImages(List<MultipartFile> files, PhotoProcessingRequest request);
    
    ProcessedPhoto applyBackgroundRemoval(Long photoId, BackgroundOptions options);
    
    ProcessedPhoto applyClothesReplacement(Long photoId, ClothesOptions options);
    
    ProcessedPhoto applyEnhancement(Long photoId, EnhanceOptions options);
    
    ProcessedPhoto cropImage(Long photoId, CropOptions options);
    
    byte[] getProcessedImageBytes(Long photoId);
    
    ComplianceResult checkCompliance(Long photoId);
    
    ProcessedPhoto undoAction(Long photoId);
    
    ProcessedPhoto redoAction(Long photoId);
    
    List<ProcessedPhoto> getProcessingHistory();
    
    void deleteProcessedPhoto(Long photoId);
}