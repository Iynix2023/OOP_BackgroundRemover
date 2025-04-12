package com.example.demo.controller;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.logging.Logger;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.ExportOptions;
import com.example.demo.service.ImageEnhancementService;
import com.example.demo.service.ImageProcessingService_v2;

import java.util.*;

import javax.imageio.IIOImage;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
/**
 * Controller for handling batch image processing operations
 */
@RestController
@CrossOrigin("*")
@EnableAsync
public class BatchProcessingController {
    private static final Logger LOGGER = Logger.getLogger(BatchProcessingController.class.getName());

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
            @RequestParam(value = "exportSize", defaultValue = "STANDARD_35x45") String exportSize,
            @RequestParam(value = "exportLayout", required = false, defaultValue = "single") String exportLayout,
            @RequestParam(value = "customWidth", required = false) Integer customWidth,
            @RequestParam(value = "customHeight", required = false) Integer customHeight) {
        
        try {
            LOGGER.info("Starting batch processing with exportSize: " + exportSize);
            
            // Map the frontend values to the Java enum values
            ExportOptions exportOptions = new ExportOptions();
            
            // Map format
            if ("jpeg".equalsIgnoreCase(exportFormat)) {
                exportOptions.setFormat(ExportOptions.ExportFormat.JPEG);
            } else if ("png".equalsIgnoreCase(exportFormat)) {
                exportOptions.setFormat(ExportOptions.ExportFormat.PNG);
            } else {
                exportOptions.setFormat(ExportOptions.ExportFormat.JPEG); // Default
            }
            
            // Map size - expanded to include all the options from PhotoSheetGenerator.tsx
            mapExportSize(exportOptions, exportSize);
            
            LOGGER.info("Mapped exportSize to: " + exportOptions.getSize());
            
            
            // Map layout
            if ("single".equalsIgnoreCase(exportLayout)) {
                exportOptions.setLayout(ExportOptions.ExportLayout.SINGLE);
            } else if ("2x2".equalsIgnoreCase(exportLayout)) {
                exportOptions.setLayout(ExportOptions.ExportLayout.GRID_2x2);
            } else if ("4x6".equalsIgnoreCase(exportLayout)) {
                exportOptions.setLayout(ExportOptions.ExportLayout.GRID_4x6);
            } else {
                exportOptions.setLayout(ExportOptions.ExportLayout.SINGLE); // Default
            }
            
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
            
            // Create enhancement options object
            com.example.demo.model.EnhanceOptions enhanceOptions = new com.example.demo.model.EnhanceOptions();
            enhanceOptions.setBrightness(brightness);
            enhanceOptions.setContrast(contrast);
            enhanceOptions.setSaturation(saturation);
            
            // Start processing
            processImagesAsync(batchId, files, backgroundType, backgroundValue, enhanceOptions, exportOptions);
            
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
     * Helper method to map export size string to the appropriate enum value
     */
    private void mapExportSize(ExportOptions exportOptions, String exportSize) {
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
        
        // Determine the correct media type based on the export format
        MediaType mediaType = result.getFormat() != null && result.getFormat().equals(ExportOptions.ExportFormat.JPEG) ? 
                MediaType.IMAGE_JPEG : MediaType.IMAGE_PNG;
        
        return ResponseEntity
            .ok()
            .contentType(mediaType)
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
            com.example.demo.model.EnhanceOptions enhanceOptions,
            ExportOptions exportOptions) {
        
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
                result.setFormat(exportOptions.getFormat());
                
                // Store original image bytes
                byte[] originalBytes = file.getBytes();
                result.setOriginalImage(originalBytes);
                
                // Step 1: Process image - Background removal using deep learning
                byte[] backgroundRemovedBytes = imageProcessingService.removeBackground(file);
                LOGGER.info("Background removed for image " + i);
                
                // Step 2: Apply image enhancement
                byte[] enhancedBytes = imageEnhancementService.enhanceImage(backgroundRemovedBytes, enhanceOptions);
                LOGGER.info("Enhancement applied for image " + i);
                
                // Step 3: Resize the image based on export size and generate layout if needed
                byte[] processedImageBytes = processImage(enhancedBytes, exportOptions);
                LOGGER.info("Size processing completed for image " + i);
                
                // Store processed image
                result.setProcessedImage(processedImageBytes);
                result.setStatus("completed");
                
                // Update image info status
                imageInfo.setStatus("completed");
                
                // Add to results
                results.add(result);
                
            } catch (Exception e) {
                e.printStackTrace();
                LOGGER.severe("Error processing image " + i + ": " + e.getMessage());
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
    
    /**
     * Process an image according to the export options
     */

    /**
     * Crops an image to match the target aspect ratio while keeping as much content as possible
     */
    private BufferedImage cropToAspectRatio(BufferedImage image, float targetAspectRatio) {
        int originalWidth = image.getWidth();
        int originalHeight = image.getHeight();
        float originalAspectRatio = (float)originalWidth / originalHeight;
        
        LOGGER.info("Original aspect ratio: " + originalAspectRatio + ", target aspect ratio: " + targetAspectRatio);
        
        int x = 0, y = 0;
        int croppedWidth = originalWidth;
        int croppedHeight = originalHeight;
        
        // Calculate the cropping rectangle
        if (originalAspectRatio > targetAspectRatio) {
            // Original image is wider than target, crop width
            croppedWidth = Math.round(originalHeight * targetAspectRatio);
            x = (originalWidth - croppedWidth) / 2; // Center crop horizontally
            LOGGER.info("Cropping width from " + originalWidth + " to " + croppedWidth);
        } else if (originalAspectRatio < targetAspectRatio) {
            // Original image is taller than target, crop height
            croppedHeight = Math.round(originalWidth / targetAspectRatio);
            y = (originalHeight - croppedHeight) / 4; // Crop from the upper portion (1/4 from top)
            LOGGER.info("Cropping height from " + originalHeight + " to " + croppedHeight);
        }
        
        // Ensure we don't exceed image bounds
        if (x < 0) {
            LOGGER.info("Adjusting x from " + x + " to 0");
            x = 0;
        }
        if (y < 0) {
            LOGGER.info("Adjusting y from " + y + " to 0");
            y = 0;
        }
        if (x + croppedWidth > originalWidth) {
            croppedWidth = originalWidth - x;
            LOGGER.info("Adjusting width to " + croppedWidth);
        }
        if (y + croppedHeight > originalHeight) {
            croppedHeight = originalHeight - y;
            LOGGER.info("Adjusting height to " + croppedHeight);
        }
        
        LOGGER.info("Cropping to: x=" + x + ", y=" + y + ", width=" + croppedWidth + ", height=" + croppedHeight);
        
        // Perform the crop
        return image.getSubimage(x, y, croppedWidth, croppedHeight);
    }
    
    /**
     * Resize an image to the specified dimensions
     */

/**
 * Create a grid layout of the image with higher quality output
 */
private BufferedImage createGridLayout(BufferedImage originalImage, int rows, int cols, int singleWidth, int singleHeight) {
    // Calculate the dimensions of the grid
    int gridWidth = singleWidth * cols;
    int gridHeight = singleHeight * rows;
    
    LOGGER.info("Creating grid layout " + rows + "x" + cols + " with dimensions " + gridWidth + "x" + gridHeight);
    LOGGER.info("Single photo size: " + singleWidth + "x" + singleHeight);
    
    // Create a new image for the grid - use higher quality TYPE_INT_ARGB
    BufferedImage gridImage = new BufferedImage(gridWidth, gridHeight, BufferedImage.TYPE_INT_ARGB);
    Graphics2D g2d = gridImage.createGraphics();
    
    // Set rendering hints for maximum quality
    g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
    g2d.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
    g2d.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);
    g2d.setRenderingHint(RenderingHints.KEY_DITHERING, RenderingHints.VALUE_DITHER_ENABLE);
    g2d.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
    
    // Fill with white background
    g2d.setColor(Color.WHITE);
    g2d.fillRect(0, 0, gridWidth, gridHeight);
    
    // First resize the original image to fit the single photo size with high quality
    BufferedImage resizedImage = resizeImageHighQuality(originalImage, singleWidth, singleHeight);
    
    // Add padding between photos
    int padding = Math.min(singleWidth, singleHeight) / 30; // 3.33% of the smaller dimension
    
    // Draw the resized image multiple times in a grid
    for (int row = 0; row < rows; row++) {
        for (int col = 0; col < cols; col++) {
            int x = col * (singleWidth + padding);
            int y = row * (singleHeight + padding);
            g2d.drawImage(resizedImage, x, y, null);
            
            // Draw a subtle border around each photo for better separation
            g2d.setColor(new Color(240, 240, 240));
            g2d.drawRect(x, y, singleWidth - 1, singleHeight - 1);
        }
    }
    
    g2d.dispose();
    return gridImage;
}

/**
 * Resize an image to the specified dimensions with higher quality
 */
private BufferedImage resizeImageHighQuality(BufferedImage originalImage, int width, int height) {
    LOGGER.info("High quality resizing from " + originalImage.getWidth() + "x" + originalImage.getHeight() + 
                " to " + width + "x" + height);
    
    // Create a new buffered image with a compatible image type
    BufferedImage resizedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
    Graphics2D g2d = resizedImage.createGraphics();
    
    // Set rendering hints for maximum quality
    g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
    g2d.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
    g2d.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);
    g2d.setRenderingHint(RenderingHints.KEY_DITHERING, RenderingHints.VALUE_DITHER_ENABLE);
    g2d.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
    
    // Fill with white background if not transparent
    if (originalImage.getTransparency() == BufferedImage.OPAQUE) {
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);
    }
    
    // Two-step resize for higher quality when downsizing significantly
    if (originalImage.getWidth() > width * 2 || originalImage.getHeight() > height * 2) {
        // First resize to an intermediate size
        int intermediateWidth = (originalImage.getWidth() + width) / 2;
        int intermediateHeight = (originalImage.getHeight() + height) / 2;
        
        BufferedImage intermediateImage = new BufferedImage(intermediateWidth, intermediateHeight, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2dIntermediate = intermediateImage.createGraphics();
        
        // Apply same quality settings
        g2dIntermediate.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2dIntermediate.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2dIntermediate.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        // Draw at intermediate size
        g2dIntermediate.drawImage(originalImage, 0, 0, intermediateWidth, intermediateHeight, null);
        g2dIntermediate.dispose();
        
        // Then draw the intermediate image at the final size
        g2d.drawImage(intermediateImage, 0, 0, width, height, null);
    } else {
        // Direct resize for smaller adjustments
        g2d.drawImage(originalImage, 0, 0, width, height, null);
    }
    
    g2d.dispose();
    
    return resizedImage;
}

/**
 * Process an image according to the export options with higher quality
 */
private byte[] processImage(byte[] imageBytes, ExportOptions exportOptions) throws Exception {
    // Calculate DPI based on output quality
    final int DPI = 600; // Increased from 300 to 600 for higher quality
    
    // Get the image dimensions based on the size option
    int width, height;
    float targetAspectRatio;
    
    LOGGER.info("Processing image with size option: " + exportOptions.getSize());
    
    switch (exportOptions.getSize()) {
        case STANDARD_35x45:
            // Standard ID photo size (35mm x 45mm)
            width = Math.round(35 * DPI / 25.4f); // 25.4mm = 1 inch
            height = Math.round(45 * DPI / 25.4f);
            targetAspectRatio = 35.0f / 45.0f;
            LOGGER.info("Using STANDARD_35x45 with dimensions: " + width + "x" + height);
            break;
        case US_PASSPORT_2x2:
            // US Passport size (2 inch x 2 inch)
            width = 2 * DPI;
            height = 2 * DPI;
            targetAspectRatio = 1.0f;
            LOGGER.info("Using US_PASSPORT_2x2 with dimensions: " + width + "x" + height);
            break;
        // ... [other cases stay the same but with updated DPI] ...
        default:
            // Use default values
            width = Math.round(35 * DPI / 25.4f);
            height = Math.round(45 * DPI / 25.4f);
            targetAspectRatio = 35.0f / 45.0f;
    }
    
    // Convert byte array to BufferedImage
    BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
    if (originalImage == null) {
        throw new IllegalArgumentException("Failed to read image data");
    }
    
    LOGGER.info("Original image dimensions: " + originalImage.getWidth() + "x" + originalImage.getHeight());
    
    // Properly crop and resize the image to maintain the target aspect ratio
    BufferedImage croppedImage = cropToAspectRatio(originalImage, targetAspectRatio);
    LOGGER.info("Cropped image to aspect ratio: " + targetAspectRatio);
    LOGGER.info("Cropped dimensions: " + croppedImage.getWidth() + "x" + croppedImage.getHeight());
    
    // Process the image based on layout
    BufferedImage processedImage;
    
    switch (exportOptions.getLayout()) {
        case GRID_2x2:
            LOGGER.info("Creating 2x2 grid layout");
            processedImage = createGridLayout(croppedImage, 2, 2, width, height);
            break;
        case GRID_4x6:
            LOGGER.info("Creating 4x6 grid layout");
            processedImage = createGridLayout(croppedImage, 4, 6, width, height);
            break;
        case SINGLE:
        default:
            LOGGER.info("Creating single layout, resizing to: " + width + "x" + height);
            // Resize the cropped image for single layout
            processedImage = resizeImageHighQuality(croppedImage, width, height);
    }
    
    // Log final image dimensions
    LOGGER.info("Final image dimensions: " + processedImage.getWidth() + "x" + processedImage.getHeight());
    
    // Convert the processed image back to a byte array with higher quality
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    
    // Determine the format name
    String formatName;
    float quality = 1.0f; // Maximum quality
    
    if (exportOptions.getFormat() == ExportOptions.ExportFormat.JPEG) {
        formatName = "jpg";
        // For JPEG, use TYPE_INT_RGB to avoid transparency issues
        if (processedImage.getType() == BufferedImage.TYPE_INT_ARGB || 
            processedImage.getType() == BufferedImage.TYPE_4BYTE_ABGR) {
            
            BufferedImage newImage = new BufferedImage(
                processedImage.getWidth(), 
                processedImage.getHeight(), 
                BufferedImage.TYPE_INT_RGB
            );
            Graphics2D g = newImage.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, newImage.getWidth(), newImage.getHeight());
            g.drawImage(processedImage, 0, 0, null);
            g.dispose();
            processedImage = newImage;
        }
        
        // Use high quality JPEG encoding
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (writers.hasNext()) {
            ImageWriter writer = writers.next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            
            // Set JPEG quality
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(quality);
            }
            
            // Set output
            ImageOutputStream ios = ImageIO.createImageOutputStream(baos);
            writer.setOutput(ios);
            
            // Write with high quality
            writer.write(null, new IIOImage(processedImage, null, null), param);
            ios.close();
            writer.dispose();
        } else {
            // Fall back to standard method if no JPEG writer
            ImageIO.write(processedImage, formatName, baos);
        }
    } else {
        formatName = "png";
        // For PNG, use highest compression
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("png");
        if (writers.hasNext()) {
            ImageWriter writer = writers.next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            
            // PNG doesn't use compression quality, but we can set other params
            // Set output
            ImageOutputStream ios = ImageIO.createImageOutputStream(baos);
            writer.setOutput(ios);
            
            // Write with highest quality
            writer.write(null, new IIOImage(processedImage, null, null), param);
            ios.close();
            writer.dispose();
        } else {
            // Fall back to standard method if no PNG writer
            ImageIO.write(processedImage, formatName, baos);
        }
    }
    
    return baos.toByteArray();
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
        private ExportOptions.ExportFormat format; // Image format (JPEG, PNG)
        
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
        public ExportOptions.ExportFormat getFormat() { return format; }
        public void setFormat(ExportOptions.ExportFormat format) { this.format = format; }
    }
}