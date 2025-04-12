package com.example.demo.service;

import com.example.demo.model.ExportOptions;

import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.logging.Logger;

@Service
public class ImageExportService {
    private static final Logger LOGGER = Logger.getLogger(ImageExportService.class.getName());

    /**
     * Process an image according to export options for final output
     */
    public byte[] processImageForExport(byte[] imageBytes, ExportOptions exportOptions) throws IOException {
        // Calculate DPI based on output quality
        final int DPI = 600; // High quality

        // Get the image dimensions based on the size option
        int width, height;
        float targetAspectRatio;

        LOGGER.info("Processing image with size option: " + exportOptions.getSize());

        // Calculate dimensions based on selected size
        switch (exportOptions.getSize()) {
            case STANDARD_35x45:
                // Standard ID photo size (35mm x 45mm)
                width = Math.round(35 * DPI / 25.4f); // 25.4mm = 1 inch
                height = Math.round(45 * DPI / 25.4f);
                targetAspectRatio = 35.0f / 45.0f;
                break;
            case US_PASSPORT_2x2:
                // US Passport size (2 inch x 2 inch)
                width = 2 * DPI;
                height = 2 * DPI;
                targetAspectRatio = 1.0f;
                break;
            case CHINA_VISA:
                // China visa (33mm x 48mm)
                width = Math.round(33 * DPI / 25.4f);
                height = Math.round(48 * DPI / 25.4f);
                targetAspectRatio = 33.0f / 48.0f;
                break;
            case MALAYSIA_PASSPORT:
                // Malaysia passport (35mm x 50mm)
                width = Math.round(35 * DPI / 25.4f);
                height = Math.round(50 * DPI / 25.4f);
                targetAspectRatio = 35.0f / 50.0f;
                break;
            case AUSTRALIA_VISA:
                // Australia visa (35mm x 45mm)
                width = Math.round(35 * DPI / 25.4f);
                height = Math.round(45 * DPI / 25.4f);
                targetAspectRatio = 35.0f / 45.0f;
                break;
            case INDIA_PASSPORT:
                // India passport (35mm x 35mm)
                width = Math.round(35 * DPI / 25.4f);
                height = Math.round(35 * DPI / 25.4f);
                targetAspectRatio = 1.0f;
                break;
            case SMU_ID:
                // SMU ID (400x514 pixels)
                width = 400;
                height = 514;
                targetAspectRatio = 400.0f / 514.0f;
                break;
            case CUSTOM:
                // Custom size
                width = exportOptions.getCustomWidth();
                height = exportOptions.getCustomHeight();
                targetAspectRatio = (float) width / height;
                break;
            default:
                // Default to standard ID size
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

        // Crop to the target aspect ratio
        BufferedImage croppedImage = cropToAspectRatio(originalImage, targetAspectRatio);
        LOGGER.info("Cropped dimensions: " + croppedImage.getWidth() + "x" + croppedImage.getHeight());

        // Process based on the layout type
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
                processedImage = resizeImageHighQuality(croppedImage, width, height);
        }

        // Convert to byte array with high quality
        return convertToByteArray(processedImage, exportOptions.getFormat());
    }

    /**
     * Crops an image to match the target aspect ratio while keeping as much content
     * as possible
     */
    private BufferedImage cropToAspectRatio(BufferedImage image, float targetAspectRatio) {
        int originalWidth = image.getWidth();
        int originalHeight = image.getHeight();
        float originalAspectRatio = (float) originalWidth / originalHeight;

        LOGGER.info("Original aspect ratio: " + originalAspectRatio + ", target: " + targetAspectRatio);

        int x = 0, y = 0;
        int croppedWidth = originalWidth;
        int croppedHeight = originalHeight;

        // Calculate the cropping rectangle
        if (originalAspectRatio > targetAspectRatio) {
            // Original is wider than target, crop width
            croppedWidth = Math.round(originalHeight * targetAspectRatio);
            x = (originalWidth - croppedWidth) / 2; // Center horizontally
        } else if (originalAspectRatio < targetAspectRatio) {
            // Original is taller than target, crop height
            croppedHeight = Math.round(originalWidth / targetAspectRatio);
            y = (originalHeight - croppedHeight) / 4; // Crop from upper portion
        }

        // Ensure we're within bounds
        x = Math.max(0, x);
        y = Math.max(0, y);
        croppedWidth = Math.min(croppedWidth, originalWidth - x);
        croppedHeight = Math.min(croppedHeight, originalHeight - y);

        // Perform the crop
        return image.getSubimage(x, y, croppedWidth, croppedHeight);
    }

    /**
     * Create a grid layout of the image with specified rows and columns
     */
    private BufferedImage createGridLayout(BufferedImage originalImage, int rows, int cols, int singleWidth,
            int singleHeight) {
        // Calculate grid dimensions
        int gridWidth = singleWidth * cols;
        int gridHeight = singleHeight * rows;
        int padding = Math.min(singleWidth, singleHeight) / 30; // Small padding

        LOGGER.info("Creating " + rows + "x" + cols + " grid with dimensions " + gridWidth + "x" + gridHeight);

        // Create a new high-quality image for the grid
        BufferedImage gridImage = new BufferedImage(gridWidth, gridHeight, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = gridImage.createGraphics();

        // Set rendering hints for high quality
        setHighQualityRenderingHints(g2d);

        // Fill with white background
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, gridWidth, gridHeight);

        // Resize the original image to fit the single photo dimensions
        BufferedImage resizedImage = resizeImageHighQuality(originalImage, singleWidth - padding,
                singleHeight - padding);

        // Draw the resized image in a grid
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                int x = col * singleWidth + (padding / 2);
                int y = row * singleHeight + (padding / 2);
                g2d.drawImage(resizedImage, x, y, null);

                // Draw subtle border
                g2d.setColor(new Color(240, 240, 240));
                g2d.drawRect(x, y, singleWidth - padding, singleHeight - padding);
            }
        }

        g2d.dispose();
        return gridImage;
    }

    /**
     * Set high quality rendering hints on Graphics2D
     */
    private void setHighQualityRenderingHints(Graphics2D g2d) {
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_DITHERING, RenderingHints.VALUE_DITHER_ENABLE);
        g2d.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
    }

    /**
     * Resize an image to specified dimensions with high quality
     */
    private BufferedImage resizeImageHighQuality(BufferedImage originalImage, int width, int height) {
        LOGGER.info("Resizing from " + originalImage.getWidth() + "x" + originalImage.getHeight() +
                " to " + width + "x" + height);

        // Create a new image with the target dimensions
        BufferedImage resizedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = resizedImage.createGraphics();

        // Set high quality rendering hints
        setHighQualityRenderingHints(g2d);

        // Fill with white background for non-transparent images
        if (originalImage.getTransparency() == BufferedImage.OPAQUE) {
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, width, height);
        }

        // Two-step resize for higher quality when downsizing significantly
        if (originalImage.getWidth() > width * 2 || originalImage.getHeight() > height * 2) {
            // First resize to an intermediate size
            int intermediateWidth = (originalImage.getWidth() + width) / 2;
            int intermediateHeight = (originalImage.getHeight() + height) / 2;

            BufferedImage intermediateImage = new BufferedImage(
                    intermediateWidth, intermediateHeight, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2dIntermediate = intermediateImage.createGraphics();
            setHighQualityRenderingHints(g2dIntermediate);
            g2dIntermediate.drawImage(originalImage, 0, 0, intermediateWidth, intermediateHeight, null);
            g2dIntermediate.dispose();

            // Now draw the intermediate image at target size
            g2d.drawImage(intermediateImage, 0, 0, width, height, null);
        } else {
            // Direct resize for smaller adjustments
            g2d.drawImage(originalImage, 0, 0, width, height, null);
        }

        g2d.dispose();
        return resizedImage;
    }

    /**
     * Convert a BufferedImage to a byte array with high quality settings
     */
    private byte[] convertToByteArray(BufferedImage image, ExportOptions.ExportFormat format) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        if (format == ExportOptions.ExportFormat.JPEG) {
            // For JPEG, ensure no transparency by converting to RGB
            if (image.getType() == BufferedImage.TYPE_INT_ARGB ||
                    image.getType() == BufferedImage.TYPE_4BYTE_ABGR) {

                BufferedImage rgbImage = new BufferedImage(
                        image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = rgbImage.createGraphics();
                g2d.setColor(Color.WHITE);
                g2d.fillRect(0, 0, rgbImage.getWidth(), rgbImage.getHeight());
                g2d.drawImage(image, 0, 0, null);
                g2d.dispose();
                image = rgbImage;
            }

            // Use high quality JPEG writer
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
            if (writers.hasNext()) {
                ImageWriter writer = writers.next();
                ImageWriteParam param = writer.getDefaultWriteParam();

                // Set maximum quality
                if (param.canWriteCompressed()) {
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(1.0f);
                }

                ImageOutputStream ios = ImageIO.createImageOutputStream(baos);
                writer.setOutput(ios);
                writer.write(null, new IIOImage(image, null, null), param);
                ios.close();
                writer.dispose();
            } else {
                // Fallback
                ImageIO.write(image, "jpg", baos);
            }
        } else {
            // PNG format
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("png");
            if (writers.hasNext()) {
                ImageWriter writer = writers.next();
                ImageOutputStream ios = ImageIO.createImageOutputStream(baos);
                writer.setOutput(ios);
                writer.write(null, new IIOImage(image, null, null), null);
                ios.close();
                writer.dispose();
            } else {
                // Fallback
                ImageIO.write(image, "png", baos);
            }
        }

        return baos.toByteArray();
    }
}
