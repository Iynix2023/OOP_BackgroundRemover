package com.example.demo.service;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Iterator;
import java.util.logging.Logger;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.stereotype.Service;

import com.example.demo.model.ExportOptions;

@Service
public class SheetGeneratorService {
    private static final Logger LOGGER = Logger.getLogger(SheetGeneratorService.class.getName());
    
    // DPI settings for high quality output
    private static final int HIGH_QUALITY_DPI = 600;

    /**
     * Generates a sheet of ID photos with the specified layout
     * 
     * @param imageData Base64 encoded image data
     * @param exportOptions Export options containing format, size, and layout
     * @return Base64 encoded image data of the generated sheet
     */
    public String generatePhotoSheet(String imageData, ExportOptions exportOptions) {
        try {
            LOGGER.info("Generating sheet with layout: " + exportOptions.getLayout());
            
            // Decode base64 string to byte array (first remove data URL prefix if present)
            String base64Image = imageData;
            if (base64Image.contains(",")) {
                base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
            }
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            
            // Process the image to generate high-quality sheet
            byte[] processedImageBytes = generateHighQualitySheet(imageBytes, exportOptions);
            
            // Convert processed image back to base64
            String format = exportOptions.getFormat() == ExportOptions.ExportFormat.JPEG ? "jpeg" : "png";
            String contentType = "image/" + format;
            String encodedImage = Base64.getEncoder().encodeToString(processedImageBytes);
            
            return "data:" + contentType + ";base64," + encodedImage;
            
        } catch (Exception e) {
            LOGGER.severe("Error generating photo sheet: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate photo sheet: " + e.getMessage());
        }
    }
    
    /**
     * Generate a high-quality photo sheet from image data
     */
    public byte[] generateHighQualitySheet(byte[] imageBytes, ExportOptions exportOptions) throws Exception {
        // Calculate dimensions based on the export options
        int width, height;
        float targetAspectRatio;
        
        switch (exportOptions.getSize()) {
            case STANDARD_35x45:
                // Standard ID photo size (35mm x 45mm)
                width = Math.round(35 * HIGH_QUALITY_DPI / 25.4f); // 25.4mm = 1 inch
                height = Math.round(45 * HIGH_QUALITY_DPI / 25.4f);
                targetAspectRatio = 35.0f / 45.0f;
                break;
            case US_PASSPORT_2x2:
                // US Passport size (2 inch x 2 inch)
                width = 2 * HIGH_QUALITY_DPI;
                height = 2 * HIGH_QUALITY_DPI;
                targetAspectRatio = 1.0f;
                break;
            case CHINA_VISA:
                // China Visa (33mm x 48mm)
                width = Math.round(33 * HIGH_QUALITY_DPI / 25.4f);
                height = Math.round(48 * HIGH_QUALITY_DPI / 25.4f);
                targetAspectRatio = 33.0f / 48.0f;
                break;
            case MALAYSIA_PASSPORT:
                // Malaysia Passport (35mm x 50mm)
                width = Math.round(35 * HIGH_QUALITY_DPI / 25.4f);
                height = Math.round(50 * HIGH_QUALITY_DPI / 25.4f);
                targetAspectRatio = 35.0f / 50.0f;
                break;
            case AUSTRALIA_VISA:
                // Australia Visa (35mm x 45mm)
                width = Math.round(35 * HIGH_QUALITY_DPI / 25.4f);
                height = Math.round(45 * HIGH_QUALITY_DPI / 25.4f);
                targetAspectRatio = 35.0f / 45.0f;
                break;
            case INDIA_PASSPORT:
                // India Passport (35mm x 35mm)
                width = Math.round(35 * HIGH_QUALITY_DPI / 25.4f);
                height = Math.round(35 * HIGH_QUALITY_DPI / 25.4f);
                targetAspectRatio = 1.0f;
                break;
            case SMU_ID:
                // SMU Student ID (custom dimensions)
                width = Math.round(35 * HIGH_QUALITY_DPI / 25.4f);
                height = Math.round(45 * HIGH_QUALITY_DPI / 25.4f);
                targetAspectRatio = 35.0f / 45.0f;
                break;
            case CUSTOM:
                // Custom dimensions
                width = exportOptions.getCustomWidth() != null ? exportOptions.getCustomWidth() : 600;
                height = exportOptions.getCustomHeight() != null ? exportOptions.getCustomHeight() : 800;
                targetAspectRatio = (float) width / height;
                break;
            default:
                // Default to standard
                width = Math.round(35 * HIGH_QUALITY_DPI / 25.4f);
                height = Math.round(45 * HIGH_QUALITY_DPI / 25.4f);
                targetAspectRatio = 35.0f / 45.0f;
        }
        
        LOGGER.info("Processing image with dimensions: " + width + "x" + height + ", aspect ratio: " + targetAspectRatio);
        
        // Load the image
        BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (originalImage == null) {
            throw new IllegalArgumentException("Failed to read image data");
        }
        
        // Crop the image to match the target aspect ratio
        BufferedImage croppedImage = cropToAspectRatio(originalImage, targetAspectRatio);
        
        // Process the image based on the layout
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
                LOGGER.info("Creating single layout");
                // Resize the cropped image for single layout
                processedImage = resizeImageHighQuality(croppedImage, width, height);
        }
        
        // Convert to byte array with high quality
        return convertToByteArray(processedImage, exportOptions.getFormat());
    }
    
    /**
     * Crops an image to match the target aspect ratio
     */
    private BufferedImage cropToAspectRatio(BufferedImage image, float targetAspectRatio) {
        int originalWidth = image.getWidth();
        int originalHeight = image.getHeight();
        float originalAspectRatio = (float)originalWidth / originalHeight;
        
        LOGGER.info("Original image dimensions: " + originalWidth + "x" + originalHeight + 
                    ", Original aspect ratio: " + originalAspectRatio + 
                    ", Target aspect ratio: " + targetAspectRatio);
        
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
            y = (originalHeight - croppedHeight) / 4; // Crop from the upper portion (face centered)
            LOGGER.info("Cropping height from " + originalHeight + " to " + croppedHeight);
        }
        
        // Ensure we don't exceed image bounds
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + croppedWidth > originalWidth) croppedWidth = originalWidth - x;
        if (y + croppedHeight > originalHeight) croppedHeight = originalHeight - y;
        
        // Perform the crop
        return image.getSubimage(x, y, croppedWidth, croppedHeight);
    }
    
    /**
     * Resize an image with high quality
     */
    private BufferedImage resizeImageHighQuality(BufferedImage originalImage, int width, int height) {
        LOGGER.info("Resizing image from " + originalImage.getWidth() + "x" + originalImage.getHeight() + 
                    " to " + width + "x" + height);
        
        // Create a new buffered image with TYPE_INT_ARGB for better quality
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
            // First resize to intermediate size
            int intermediateWidth = (originalImage.getWidth() + width) / 2;
            int intermediateHeight = (originalImage.getHeight() + height) / 2;
            
            LOGGER.info("Using two-step resize with intermediate size: " + 
                        intermediateWidth + "x" + intermediateHeight);
            
            BufferedImage intermediateImage = new BufferedImage(
                    intermediateWidth, intermediateHeight, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2dIntermediate = intermediateImage.createGraphics();
            
            // Apply same quality settings
            g2dIntermediate.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g2dIntermediate.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2dIntermediate.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            
            // Draw at intermediate size
            g2dIntermediate.drawImage(originalImage, 0, 0, intermediateWidth, intermediateHeight, null);
            g2dIntermediate.dispose();
            
            // Then draw the intermediate image at final size
            g2d.drawImage(intermediateImage, 0, 0, width, height, null);
        } else {
            // Direct resize for smaller adjustments
            g2d.drawImage(originalImage, 0, 0, width, height, null);
        }
        
        g2d.dispose();
        return resizedImage;
    }
    
    /**
     * Create a grid layout of the image
     */
    private BufferedImage createGridLayout(BufferedImage originalImage, int rows, int cols, int singleWidth, int singleHeight) {
        // Calculate grid dimensions
        int padding = Math.min(singleWidth, singleHeight) / 30; // 3.33% padding
        int gridWidth = cols * singleWidth + (cols - 1) * padding;
        int gridHeight = rows * singleHeight + (rows - 1) * padding;
        
        LOGGER.info("Creating grid layout " + rows + "x" + cols + " with dimensions " + 
                    gridWidth + "x" + gridHeight);
        
        // Create a new image for the grid with high quality
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
        
        // First resize the original image to fit the single photo size
        BufferedImage resizedImage = resizeImageHighQuality(originalImage, singleWidth, singleHeight);
        
        // Draw the resized image multiple times in a grid
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                int x = col * (singleWidth + padding);
                int y = row * (singleHeight + padding);
                g2d.drawImage(resizedImage, x, y, null);
                
                // Draw a subtle border around each photo
                g2d.setColor(new Color(240, 240, 240));
                g2d.drawRect(x, y, singleWidth - 1, singleHeight - 1);
            }
        }
        
        g2d.dispose();
        return gridImage;
    }
    
    /**
     * Convert a BufferedImage to byte array with high quality
     */
    private byte[] convertToByteArray(BufferedImage image, ExportOptions.ExportFormat format) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        if (format == ExportOptions.ExportFormat.JPEG) {
            // For JPEG, use TYPE_INT_RGB to avoid transparency issues
            if (image.getType() == BufferedImage.TYPE_INT_ARGB || 
                image.getType() == BufferedImage.TYPE_4BYTE_ABGR) {
                
                BufferedImage newImage = new BufferedImage(
                    image.getWidth(), 
                    image.getHeight(), 
                    BufferedImage.TYPE_INT_RGB
                );
                Graphics2D g = newImage.createGraphics();
                g.setColor(Color.WHITE);
                g.fillRect(0, 0, newImage.getWidth(), newImage.getHeight());
                g.drawImage(image, 0, 0, null);
                g.dispose();
                image = newImage;
            }
            
            // Use high quality JPEG encoding
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
            if (writers.hasNext()) {
                ImageWriter writer = writers.next();
                ImageWriteParam param = writer.getDefaultWriteParam();
                
                // Set JPEG quality to maximum
                if (param.canWriteCompressed()) {
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(1.0f); // Maximum quality
                }
                
                // Set output
                ImageOutputStream ios = ImageIO.createImageOutputStream(baos);
                writer.setOutput(ios);
                
                // Write with high quality
                writer.write(null, new IIOImage(image, null, null), param);
                ios.close();
                writer.dispose();
            } else {
                // Fall back to standard method if no JPEG writer
                ImageIO.write(image, "jpg", baos);
            }
        } else {
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
                writer.write(null, new IIOImage(image, null, null), param);
                ios.close();
                writer.dispose();
            } else {
                // Fall back to standard method if no PNG writer
                ImageIO.write(image, "png", baos);
            }
        }
        
        return baos.toByteArray();
    }
}