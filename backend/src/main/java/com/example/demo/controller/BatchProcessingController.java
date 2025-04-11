package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.service.ImageProcessingService_v2;
import com.example.demo.service.ImageEnhancementService;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;

/**
 * Controller for handling batch image processing operations
 */
@RestController
@CrossOrigin("*")
@EnableAsync
public class BatchProcessingController {

    @Autowired
    private ImageProcessingService_v2 imageProcessingService;

    @Autowired
    private ImageEnhancementService imageEnhancementService;

    // In-memory storage for batch processing
    private final Map<String, BatchStatus> batchStatuses = new ConcurrentHashMap<>();
    private final Map<String, List<ProcessedImage>> batchResults = new ConcurrentHashMap<>();

    // Async configuration
    @Bean
    public Executor batchTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("BatchProcessor-");
        executor.initialize();
        return executor;
    }

    /**
     * Start batch processing for multiple images
     */
    @PostMapping("/api/batch/process")
    public ResponseEntity<Map<String, String>> startBatchProcessing(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "backgroundType", defaultValue = "color") String backgroundType,
            @RequestParam(value = "backgroundValue", defaultValue = "#FFFFFF") String backgroundValue,
            @RequestParam(value = "brightness", defaultValue = "0") int brightness,
            @RequestParam(value = "contrast", defaultValue = "0") int contrast,
            @RequestParam(value = "saturation", defaultValue = "0") int saturation,
            @RequestParam(value = "exportFormat", defaultValue = "jpeg") String exportFormat,
            @RequestParam(value = "exportSize", defaultValue = "35x45") String exportSize) {

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
            info.setOriginalName(files.get(i).getOriginalFilename()); // The correct method name is
                                                                      // getOriginalFilename()
            info.setStatus("pending");
            imageInfos.add(info);
        }
        status.setImages(imageInfos);

        // Store batch status
        batchStatuses.put(batchId, status);
        batchResults.put(batchId, new ArrayList<>());

        // Start processing
        processImagesAsync(batchId, files, backgroundType, backgroundValue, brightness, contrast, saturation, exportFormat, exportSize);

        Map<String, String> response = new HashMap<>();
        response.put("batchId", batchId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the status of a batch processing job
     */
    @GetMapping("/api/batch/status/{batchId}")
    public ResponseEntity<BatchStatus> getBatchStatus(@PathVariable String batchId) {
        BatchStatus status = batchStatuses.get(batchId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    /**
     * Get a processed image result
     */
    @GetMapping("/api/batch/result/{batchId}/{imageIndex}")
    public ResponseEntity<?> getProcessedImage(
            @PathVariable String batchId,
            @PathVariable int imageIndex) {

        List<ProcessedImage> results = batchResults.get(batchId);
        if (results == null || imageIndex >= results.size()) {
            return ResponseEntity.notFound().build();
        }

        ProcessedImage result = results.get(imageIndex);
        if (result.getStatus().equals("failed") || result.getProcessedImage() == null) {
            return ResponseEntity.badRequest().body("Image processing failed: " + result.getError());
        }

        // Return image as a byte array with the correct content type
        return ResponseEntity
                .ok()
                .contentType(MediaType.IMAGE_PNG) // Using PNG since your service returns PNG
                .body(result.getProcessedImage());
    }

    /**
     * Process images asynchronously
     */
    @Async("batchTaskExecutor")
    public void processImagesAsync(
            String batchId,
            List<MultipartFile> files,
            String backgroundType,
            String backgroundValue,
            int brightness,
            int contrast,
            int saturation,
            String exportFormat,
            String exportSize) {

        BatchStatus status = batchStatuses.get(batchId);
        List<ProcessedImage> results = batchResults.get(batchId);

        com.example.demo.processor.model.EnhanceOptions enhanceOptions = new com.example.demo.processor.model.EnhanceOptions();
        enhanceOptions.setBrightness(brightness);
        enhanceOptions.setContrast(contrast);
        enhanceOptions.setSaturation(saturation);

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            ImageInfo imageInfo = status.getImages().get(i);

            try {
                // Update status to processing
                imageInfo.setStatus("processing");

                // Create result object
                ProcessedImage result = new ProcessedImage();
                result.setIndex(i);
                result.setOriginalName(file.getOriginalFilename()); // Corrected here too

                // Store original image bytes
                byte[] originalBytes = file.getBytes();
                result.setOriginalImage(originalBytes);

                // Process image - Background removal using deep learning
                byte[] processedImageBytes = imageProcessingService.removeBackground(file);

                byte[] enhancedImage = imageEnhancementService.enhanceImage(processedImageBytes, enhanceOptions);

                // Store processed image
                result.setProcessedImage(processedImageBytes);
                result.setProcessedImage(enhancedImage);
                result.setStatus("completed");

                // Update image info status
                imageInfo.setStatus("completed");

                // Add to results
                results.add(result);

            } catch (Exception e) {
                e.printStackTrace();
                // Update status on error
                imageInfo.setStatus("failed");
                imageInfo.setError(e.getMessage());

                // Create error result
                ProcessedImage errorResult = new ProcessedImage();
                errorResult.setIndex(i);
                errorResult.setOriginalName(file.getOriginalFilename()); // Corrected here too
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
        public String getBatchId() {
            return batchId;
        }

        public void setBatchId(String batchId) {
            this.batchId = batchId;
        }

        public int getTotalImages() {
            return totalImages;
        }

        public void setTotalImages(int totalImages) {
            this.totalImages = totalImages;
        }

        public int getProcessedCount() {
            return processedCount;
        }

        public void setProcessedCount(int processedCount) {
            this.processedCount = processedCount;
        }

        public boolean isCompleted() {
            return completed;
        }

        public void setCompleted(boolean completed) {
            this.completed = completed;
        }

        public List<ImageInfo> getImages() {
            return images;
        }

        public void setImages(List<ImageInfo> images) {
            this.images = images;
        }
    }

    public static class ImageInfo {
        private int index;
        private String originalName;
        private String status; // "pending", "processing", "completed", "failed"
        private String error;

        // Getters and setters
        public int getIndex() {
            return index;
        }

        public void setIndex(int index) {
            this.index = index;
        }

        public String getOriginalName() {
            return originalName;
        }

        public void setOriginalName(String originalName) {
            this.originalName = originalName;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }

    public static class ProcessedImage {
        private int index;
        private String originalName;
        private byte[] originalImage;
        private byte[] processedImage;
        private String status;
        private String error;

        // Getters and setters
        public int getIndex() {
            return index;
        }

        public void setIndex(int index) {
            this.index = index;
        }

        public String getOriginalName() {
            return originalName;
        }

        public void setOriginalName(String originalName) {
            this.originalName = originalName;
        }

        public byte[] getOriginalImage() {
            return originalImage;
        }

        public void setOriginalImage(byte[] originalImage) {
            this.originalImage = originalImage;
        }

        public byte[] getProcessedImage() {
            return processedImage;
        }

        public void setProcessedImage(byte[] processedImage) {
            this.processedImage = processedImage;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }
}