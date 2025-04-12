package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.BatchStatus;
import com.example.demo.model.EnhanceOptions;
import com.example.demo.model.ExportOptions;
import com.example.demo.model.ImageInfo;
import com.example.demo.service.BatchProcessingService;
// import com.example.demo.service.ImageProcessingServiceGrabcut;

import java.util.concurrent.Executor;
import java.util.ArrayList;

/**
 * Controller for handling batch image processing operations
 */
@RestController
@CrossOrigin("*")
@EnableAsync
public class BatchProcessingController {
    private static final Logger LOGGER = Logger.getLogger(BatchProcessingController.class.getName());

    @Autowired
    private BatchProcessingService batchProcessingService;

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
     * Create batch processing for group of images
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
            @RequestParam(value = "exportSize", defaultValue = "STANDARD_35x45") String exportSize,
            @RequestParam(value = "exportLayout", required = false, defaultValue = "single") String exportLayout,
            @RequestParam(value = "customWidth", required = false) Integer customWidth,
            @RequestParam(value = "customHeight", required = false) Integer customHeight) {

        try {
            LOGGER.info("Starting batch processing with exportSize: " + exportSize);

            // Create and configure export options
            ExportOptions exportOptions = new ExportOptions();

            // Set format (JPEG or PNG)
            exportOptions.setFormat("jpeg".equalsIgnoreCase(exportFormat) ? ExportOptions.ExportFormat.JPEG
                    : ExportOptions.ExportFormat.PNG);

            // Map size from string parameter
            batchProcessingService.mapExportSize(exportOptions, exportSize);
            LOGGER.info("Mapped exportSize to: " + exportOptions.getSize());

            // Set layout (single, 2x2, 4x6)
            if ("2x2".equalsIgnoreCase(exportLayout)) {
                exportOptions.setLayout(ExportOptions.ExportLayout.GRID_2x2);
            } else if ("4x6".equalsIgnoreCase(exportLayout)) {
                exportOptions.setLayout(ExportOptions.ExportLayout.GRID_4x6);
            } else {
                exportOptions.setLayout(ExportOptions.ExportLayout.SINGLE);
            }

            // Set custom dimensions if applicable
            if (exportOptions.getSize() == ExportOptions.ExportSize.CUSTOM) {
                exportOptions.setCustomWidth(customWidth != null ? customWidth : 600);
                exportOptions.setCustomHeight(customHeight != null ? customHeight : 800);
            }

            // Create enhancement options
            EnhanceOptions enhanceOptions = new EnhanceOptions();
            enhanceOptions.setBrightness(brightness);
            enhanceOptions.setContrast(contrast);
            enhanceOptions.setSaturation(saturation);

            // Generate batch ID
            String batchId = UUID.randomUUID().toString();

            // Create batch status
            BatchStatus status = new BatchStatus();
            status.setBatchId(batchId);
            status.setTotalImages(files.size());
            status.setProcessedCount(0);
            status.setCompleted(false);

            // Initialize images info
            List<ImageInfo> imageInfos = new ArrayList<>();
            for (int i = 0; i < files.size(); i++) {
                ImageInfo info = new ImageInfo();
                info.setIndex(i);
                info.setOriginalName(files.get(i).getOriginalFilename());
                info.setStatus("pending");
                imageInfos.add(info);
            }
            status.setImages(imageInfos);

            // Initialize the batch in the service
            batchProcessingService.initializeBatch(batchId, status);

            // Start processing images asynchronously
            batchProcessingService.processImagesAsync(batchId, files, backgroundType,
                    backgroundValue, enhanceOptions, exportOptions);

            // Return the batch ID to the client
            Map<String, String> response = new HashMap<>();
            response.put("batchId", batchId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Get the status of a batch processing job
     */
    @GetMapping("/api/batch/status/{batchId}")
    public ResponseEntity<BatchStatus> getBatchStatus(@PathVariable String batchId) {
        BatchStatus status = batchProcessingService.getBatchStatus(batchId);
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

        return batchProcessingService.getProcessedImageResponse(batchId, imageIndex);
    }
}