package com.idphoto.processor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import org.springframework.http.MediaType;

@Service
@EnableAsync
@RestController
@CrossOrigin("*") // Allow all origins for testing
public class BatchProcessingApplication {


    // Async configuration
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("BatchProcessor-");
        executor.initialize();
        return executor;
    }

    // BatchProcessingService
    private final Map<String, BatchStatus> batchStatuses = new ConcurrentHashMap<>();
    private final Map<String, List<ProcessedImage>> batchResults = new ConcurrentHashMap<>();

    // Controller endpoints
    @PostMapping("/api/batch/process")
    public ResponseEntity<Map<String, String>> startBatchProcessing(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "backgroundType", defaultValue = "color") String backgroundType,
            @RequestParam(value = "backgroundValue", defaultValue = "#FFFFFF") String backgroundValue) {
        
        // Generate batch ID
        String batchId = UUID.randomUUID().toString();
        
        // Create batch status
        BatchStatus status = new BatchStatus();
        status.setBatchId(batchId);
        status.setTotalImages(files.size());
        status.setProcessedCount(0);
        status.setCompleted(false);
        
        List<ImageInfo> imageInfos = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            ImageInfo info = new ImageInfo();
            info.setIndex(i);
            info.setOriginalName(files.get(i).getOriginalFilename());
            info.setStatus("pending");
            imageInfos.add(info);
        }
        status.setImages(imageInfos);
        
        // Store batch status
        batchStatuses.put(batchId, status);
        batchResults.put(batchId, new ArrayList<>());
        
        // Start processing
        processImagesAsync(batchId, files, backgroundType, backgroundValue);
        
        Map<String, String> response = new HashMap<>();
        response.put("batchId", batchId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/batch/status/{batchId}")
    public ResponseEntity<BatchStatus> getBatchStatus(@PathVariable String batchId) {
        BatchStatus status = batchStatuses.get(batchId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/api/batch/result/{batchId}/{imageIndex}")
    public ResponseEntity<?> getProcessedImage(
            @PathVariable String batchId, 
            @PathVariable int imageIndex) {
        
        List<ProcessedImage> results = batchResults.get(batchId);
        if (results == null || imageIndex >= results.size()) {
            return ResponseEntity.notFound().build();
        }
        
        ProcessedImage result = results.get(imageIndex);
        
        // Return image as a byte array with the correct content type
        return ResponseEntity
            .ok()
            .contentType(MediaType.IMAGE_JPEG) // Or determine dynamically based on file type
            .body(result.getProcessedImage());
    }
    // Async processing method
    @Async
    public void processImagesAsync(String batchId, List<MultipartFile> files, 
                                   String backgroundType, String backgroundValue) {
        BatchStatus status = batchStatuses.get(batchId);
        List<ProcessedImage> results = batchResults.get(batchId);
        
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            ImageInfo imageInfo = status.getImages().get(i);
            
            try {
                // Update status to processing
                imageInfo.setStatus("processing");
                
                // Create result object
                ProcessedImage result = new ProcessedImage();
                result.setIndex(i);
                result.setOriginalName(file.getOriginalFilename());
                
                // Store original image bytes
                result.setOriginalImage(file.getBytes());
                
                // Simulate image processing (replace with your actual OpenCV code)
                Thread.sleep(2000); // Simulate processing time
                
                // For testing, just copy the original image as processed
                result.setProcessedImage(file.getBytes());
                result.setStatus("completed");
                
                // Update image info status
                imageInfo.setStatus("completed");
                
                // Add to results
                results.add(result);
            } catch (Exception e) {
                // Update status on error
                imageInfo.setStatus("failed");
                imageInfo.setError(e.getMessage());
                
                // Create error result
                ProcessedImage errorResult = new ProcessedImage();
                errorResult.setIndex(i);
                errorResult.setOriginalName(file.getOriginalFilename());
                errorResult.setStatus("failed");
                errorResult.setError(e.getMessage());
                results.add(errorResult);
            }
            
            // Increment processed count
            status.incrementProcessed();
        }
    }
    
    // Model classes
    public static class BatchStatus {
        private String batchId;
        private int totalImages;
        private int processedCount;
        private boolean completed;
        private List<ImageInfo> images = new ArrayList<>();
        
        public void incrementProcessed() {
            this.processedCount++;
            if (this.processedCount >= this.totalImages) {
                this.completed = true;
            }
        }

        // Getters and setters
        public String getBatchId() { return batchId; }
        public void setBatchId(String batchId) { this.batchId = batchId; }
        public int getTotalImages() { return totalImages; }
        public void setTotalImages(int totalImages) { this.totalImages = totalImages; }
        public int getProcessedCount() { return processedCount; }
        public void setProcessedCount(int processedCount) { this.processedCount = processedCount; }
        public boolean isCompleted() { return completed; }
        public void setCompleted(boolean completed) { this.completed = completed; }
        public List<ImageInfo> getImages() { return images; }
        public void setImages(List<ImageInfo> images) { this.images = images; }
    }
    
    public static class ImageInfo {
        private int index;
        private String originalName;
        private String status; // "pending", "processing", "completed", "failed"
        private String error;
        
        // Getters and setters
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }
        public String getOriginalName() { return originalName; }
        public void setOriginalName(String originalName) { this.originalName = originalName; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public static class ProcessedImage {
        private int index;
        private String originalName;
        private byte[] originalImage;
        private byte[] processedImage;
        private String status;
        private String error;
        
        // Getters and setters
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }
        public String getOriginalName() { return originalName; }
        public void setOriginalName(String originalName) { this.originalName = originalName; }
        public byte[] getOriginalImage() { return originalImage; }
        public void setOriginalImage(byte[] originalImage) { this.originalImage = originalImage; }
        public byte[] getProcessedImage() { return processedImage; }
        public void setProcessedImage(byte[] processedImage) { this.processedImage = processedImage; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}