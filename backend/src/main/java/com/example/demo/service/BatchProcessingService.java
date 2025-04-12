package com.example.demo.service;

import com.example.demo.model.BatchStatus;
import com.example.demo.model.EnhanceOptions;
import com.example.demo.model.ExportOptions;
import com.example.demo.model.ImageInfo;
import com.example.demo.model.ProcessedImage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

@Service
public class BatchProcessingService {

    private static final Logger LOGGER = Logger.getLogger(BatchProcessingService.class.getName());

    @Autowired
    private ImageProcessingService_v2 imageProcessingService;

    @Autowired
    private ImageEnhancementService imageEnhancementService;

    @Autowired
    private ImageExportService imageExportService;

    // In-memory storage for batch processing
    private final Map<String, BatchStatus> batchStatuses = new ConcurrentHashMap<>();
    private final Map<String, List<ProcessedImage>> batchResults = new ConcurrentHashMap<>();

    /**
     * Initialize a new batch processing job
     */
    public void initializeBatch(String batchId, BatchStatus status) {
        batchStatuses.put(batchId, status);
        batchResults.put(batchId, new ArrayList<>());
    }

    /**
     * Get batch status by ID
     */
    public BatchStatus getBatchStatus(String batchId) {
        return batchStatuses.get(batchId);
    }

    /**
     * Get batch results by ID
     */
    public List<ProcessedImage> getBatchResults(String batchId) {
        return batchResults.get(batchId);
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
            EnhanceOptions enhanceOptions,
            ExportOptions exportOptions) {

        BatchStatus status = batchStatuses.get(batchId);
        List<ProcessedImage> results = batchResults.get(batchId);

        if (status == null || results == null) {
            LOGGER.severe("Batch " + batchId + " not found");
            return;
        }

        // Pre-read all files to byte arrays to avoid temp file deletion issues
        List<byte[]> fileContents = new ArrayList<>();
        List<String> fileNames = new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                byte[] content = safeReadFile(file);
                if (content == null || content.length == 0) {
                    throw new IOException("Could not read file: " + file.getOriginalFilename());
                }
                fileContents.add(content);
                fileNames.add(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.png");
            }

            LOGGER.info("Successfully pre-read " + fileContents.size() + " files for batch " + batchId);
        } catch (Exception e) {
            LOGGER.severe("Failed to pre-read files: " + e.getMessage());
            status.setCompleted(true); // Mark as completed with error
            return;
        }

        // Process each image using the pre-read contents
        for (int i = 0; i < fileContents.size(); i++) {
            ImageInfo imageInfo = status.getImages().get(i);
            byte[] fileContent = fileContents.get(i);
            String fileName = fileNames.get(i);

            try {
                // Update status to processing
                imageInfo.setStatus("processing");

                // Create result object
                ProcessedImage result = new ProcessedImage();
                result.setIndex(i);
                result.setOriginalName(fileName);
                result.setFormat(exportOptions.getFormat());

                // Store original image bytes
                result.setOriginalImage(fileContent);

                // Create a new MultipartFile from the bytes
                MultipartFile processableFile = new MockMultipartFile(
                        "image",
                        fileName,
                        "image/png",
                        fileContent);

                // Step 1: Process image - Background removal using deep learning
                LOGGER.info("Starting background removal for image " + i);
                byte[] backgroundRemovedBytes = imageProcessingService.removeBackground(
                        processableFile, backgroundType, backgroundValue);
                LOGGER.info("Background removed for image " + i);

                // Step 2: Apply image enhancement
                LOGGER.info("Starting enhancement for image " + i);
                byte[] enhancedBytes = imageEnhancementService.enhanceImage(backgroundRemovedBytes, enhanceOptions);
                LOGGER.info("Enhancement applied for image " + i);

                // Step 3: Resize the image based on export size and generate layout if needed
                LOGGER.info("Starting export processing for image " + i);
                byte[] processedImageBytes = imageExportService.processImageForExport(enhancedBytes, exportOptions);
                LOGGER.info("Size processing completed for image " + i);

                // Store processed image
                result.setProcessedImage(processedImageBytes);
                result.setStatus("completed");

                // Update image info status
                imageInfo.setStatus("completed");

                // Add to results
                results.add(result);

            } catch (Exception e) {
                LOGGER.severe("Error processing image " + i + ": " + e.getMessage());
                e.printStackTrace();

                // Update status on error
                imageInfo.setStatus("failed");
                imageInfo.setError(e.getMessage());

                // Create error result
                ProcessedImage errorResult = new ProcessedImage();
                errorResult.setIndex(i);
                errorResult.setOriginalName(fileName);
                errorResult.setStatus("failed");
                errorResult.setError(e.getMessage());
                results.add(errorResult);
            }

            // Increment processed count
            status.incrementProcessed();
        }

        // Mark batch as completed
        status.setCompleted(true);
    }

    /**
     * Safely read file content, with error handling
     */
    private byte[] safeReadFile(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                LOGGER.warning("Empty file encountered");
                return null;
            }
            return file.getBytes();
        } catch (Exception e) {
            LOGGER.severe("Error reading file: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Create a new MultipartFile with a simple name to avoid path issues
     */
    private MultipartFile createProcessableFile(MultipartFile originalFile, byte[] content) {
        String fileName = originalFile.getOriginalFilename();
        if (fileName == null || fileName.isEmpty()) {
            fileName = "image.png";
        } else {
            // Extract just the filename without path
            int lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
            if (lastSlash >= 0) {
                fileName = fileName.substring(lastSlash + 1);
            }

            // Ensure the filename has an extension
            if (!fileName.contains(".")) {
                fileName += ".png";
            }
        }

        return new MockMultipartFile(
                "image",
                fileName,
                originalFile.getContentType() != null ? originalFile.getContentType() : "image/png",
                content);
    }

    /**
     * Get processed image as HTTP response
     */
    public ResponseEntity<?> getProcessedImageResponse(String batchId, int imageIndex) {
        List<ProcessedImage> results = batchResults.get(batchId);
        if (results == null || imageIndex >= results.size()) {
            return ResponseEntity.notFound().build();
        }

        ProcessedImage result = results.get(imageIndex);
        if (result.getStatus().equals("failed") || result.getProcessedImage() == null) {
            return ResponseEntity.badRequest().body("Image processing failed: " + result.getError());
        }

        // Determine the correct media type based on the export format
        MediaType mediaType = result.getFormat() != null && result.getFormat().equals(ExportOptions.ExportFormat.JPEG)
                ? MediaType.IMAGE_JPEG
                : MediaType.IMAGE_PNG;

        return ResponseEntity
                .ok()
                .contentType(mediaType)
                .body(result.getProcessedImage());
    }

    /**
     * Helper method to map export size string to the appropriate enum value
     */
    public void mapExportSize(ExportOptions exportOptions, String exportSize) {
        try {
            // First, try to parse it directly as an enum value
            ExportOptions.ExportSize size = ExportOptions.ExportSize.valueOf(exportSize);
            exportOptions.setSize(size);
            LOGGER.info("Direct enum mapping: " + size);
        } catch (IllegalArgumentException e) {
            // If it's not a direct enum value, try to map common strings
            ExportOptions.ExportSize mappedSize;

            switch (exportSize.toLowerCase()) {
                case "35x45":
                case "standard":
                case "singapore":
                    mappedSize = ExportOptions.ExportSize.STANDARD_35x45;
                    break;
                case "2x2":
                case "us_passport":
                case "us":
                case "us_passport_2x2":
                    mappedSize = ExportOptions.ExportSize.US_PASSPORT_2x2;
                    break;
                case "china":
                case "china_visa":
                case "33x48":
                    mappedSize = ExportOptions.ExportSize.CHINA_VISA;
                    break;
                case "malaysia":
                case "malaysia_passport":
                case "35x50":
                    mappedSize = ExportOptions.ExportSize.MALAYSIA_PASSPORT;
                    break;
                case "australia":
                case "australia_visa":
                    mappedSize = ExportOptions.ExportSize.AUSTRALIA_VISA;
                    break;
                case "india":
                case "india_passport":
                case "35x35":
                    mappedSize = ExportOptions.ExportSize.INDIA_PASSPORT;
                    break;
                case "smu":
                case "smu_id":
                    mappedSize = ExportOptions.ExportSize.SMU_ID;
                    break;
                case "custom":
                    mappedSize = ExportOptions.ExportSize.CUSTOM;
                    break;
                default:
                    // Default to standard if nothing matches
                    mappedSize = ExportOptions.ExportSize.STANDARD_35x45;
            }

            exportOptions.setSize(mappedSize);
            LOGGER.info("String-based mapping: " + mappedSize);
        }
    }
}
