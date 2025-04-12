package com.example.demo.service;

// Packages for deep learning model
import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.modality.cv.output.CategoryMask;
import ai.djl.modality.cv.translator.SemanticSegmentationTranslatorFactory;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import ai.djl.translate.TranslateException;

import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

// Image conversion libraries
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

// Logger
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// BG Image Generation
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
// import java.awt.image.BufferedImage;

@Service
public class ImageProcessingService_v2 {

    private static final Logger logger = LoggerFactory.getLogger(ImageProcessingService_v2.class);

    /**
     * Backup function, not the mainone
     */
    public byte[] removeBackground(MultipartFile file) throws IOException {
        return removeBackground(file, "color", "#AADBE6"); // Light blue default
    }

    /**
     * Removes the background from the input image, centers the person, and applies
     * the specified background color or type
     *
     * @param file            the uploaded image file
     * @param backgroundType  the type of background to apply (color, transparent,
     *                        etc.)
     * @param backgroundColor the color to use when backgroundType is "color"
     * @return a byte array containing the processed image in PNG format
     * @throws IOException if processing fails
     */
    public byte[] removeBackground(
            MultipartFile file,
            String backgroundType,
            String backgroundColor) throws IOException {

        try {
            // Convert the uploaded file to a DJL Image
            Image img = ImageFactory.getInstance().fromInputStream(file.getInputStream());

            // URL of the pre-trained DeepLabV3 model packaged as a zip file
            String url = "djl://ai.djl.pytorch/deeplabv3/0.0.1/deeplabv3";

            // Build the criteria to load the model
            Criteria<Image, CategoryMask> criteria = Criteria.builder()
                    .setTypes(Image.class, CategoryMask.class)
                    .optModelUrls(url)
                    .optTranslatorFactory(new SemanticSegmentationTranslatorFactory())
                    .optEngine("PyTorch")
                    .optProgress(new ProgressBar())
                    .build();

            try (ZooModel<Image, CategoryMask> model = criteria.loadModel();
                    Predictor<Image, CategoryMask> predictor = model.newPredictor()) {

                // Predict the segmentation mask
                CategoryMask mask = predictor.predict(img);

                // Get the original image as BufferedImage
                BufferedImage originalBuffered = (BufferedImage) img.getWrappedImage();
                int imgWidth = originalBuffered.getWidth();
                int imgHeight = originalBuffered.getHeight();

                // Extract person from the original image using the mask
                BufferedImage personOnly = new BufferedImage(
                        imgWidth,
                        imgHeight,
                        BufferedImage.TYPE_INT_ARGB);

                // Create the person mask image and convert to BufferedImage
                Image personMaskImage = mask.getMaskImage(img, 15); // 15 is the category ID for person

                // Ensure the mask is properly sized to match the original image
                personMaskImage = personMaskImage.resize(imgWidth, imgHeight, true);
                BufferedImage maskBuffered = (BufferedImage) personMaskImage.getWrappedImage();

                // Extract the person from original image using mask
                for (int y = 0; y < imgHeight; y++) {
                    for (int x = 0; x < imgWidth; x++) {
                        // Safety check for array bounds
                        if (x >= maskBuffered.getWidth() || y >= maskBuffered.getHeight()) {
                            continue;
                        }

                        int maskPixel = maskBuffered.getRGB(x, y);
                        // Check if this pixel is part of the person in the mask (not transparent)
                        if ((maskPixel >> 24) != 0) {
                            // Copy pixel from original image
                            personOnly.setRGB(x, y, originalBuffered.getRGB(x, y));
                        }
                    }
                }

                // Calculate bounding box of the person in the extracted image
                int left = imgWidth;
                int right = 0;
                int top = imgHeight;
                int bottom = 0;
                boolean personFound = false;

                // Find the bounding box coordinates
                for (int y = 0; y < imgHeight; y++) {
                    for (int x = 0; x < imgWidth; x++) {
                        int pixel = personOnly.getRGB(x, y);
                        // Check if this pixel is not transparent (part of the person)
                        if ((pixel >> 24) != 0) {
                            left = Math.min(left, x);
                            right = Math.max(right, x);
                            top = Math.min(top, y);
                            bottom = Math.max(bottom, y);
                            personFound = true;
                        }
                    }
                }

                // Create background with the specified color or transparent
                BufferedImage resultImage = new BufferedImage(
                        imgWidth,
                        imgHeight,
                        BufferedImage.TYPE_INT_ARGB);

                Graphics2D g2d = resultImage.createGraphics();

                if (!"transparent".equals(backgroundType)) {
                    // Get background color
                    Color bgColor;
                    try {
                        // Parse the color from the hex string
                        if (backgroundColor.startsWith("#")) {
                            bgColor = Color.decode(backgroundColor);
                        } else {
                            bgColor = Color.decode("#" + backgroundColor);
                        }
                    } catch (NumberFormatException e) {
                        // Default to light blue if parsing fails
                        logger.warn("Failed to parse background color: " + backgroundColor + ". Using default.");
                        bgColor = new Color(173, 216, 230); // Light blue default
                    }

                    // Fill with background color
                    g2d.setColor(bgColor);
                    g2d.fillRect(0, 0, imgWidth, imgHeight);
                }
                g2d.dispose();

                // If no person is detected, use the basic approach
                if (!personFound || left >= right || top >= bottom) {
                    logger.info("No person detected for centering, using basic background replacement");

                    // Convert to DJL image and draw person
                    Image background = ImageFactory.getInstance().fromImage(resultImage);
                    background.drawImage(personMaskImage, true);

                    // Convert to byte array and return
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    background.save(baos, "png");
                    return baos.toByteArray();
                }

                // If person is detected, center them

                // Ensure bounding box is within image bounds
                left = Math.max(0, left);
                top = Math.max(0, top);
                right = Math.min(imgWidth - 1, right);
                bottom = Math.min(imgHeight - 1, bottom);

                // Calculate the width and height of the person
                int personWidth = right - left + 1;
                int personHeight = bottom - top + 1;

                // Calculate centering offsets
                int xOffset = (imgWidth - personWidth) / 2 - left;
                int yOffset = (imgHeight - personHeight) / 2 - top;

                // Copy the person pixels to the centered position
                for (int y = top; y <= bottom; y++) {
                    for (int x = left; x <= right; x++) {
                        // Get the pixel from the extracted person image
                        int pixelColor = personOnly.getRGB(x, y);

                        // Skip transparent pixels
                        if ((pixelColor >> 24) == 0) {
                            continue;
                        }

                        // Calculate destination coordinates with offset
                        int destX = x + xOffset;
                        int destY = y + yOffset;

                        // Ensure we're within bounds of the output image
                        if (destX >= 0 && destX < imgWidth && destY >= 0 && destY < imgHeight) {
                            // Copy the pixel to the centered position
                            resultImage.setRGB(destX, destY, pixelColor);
                        }
                    }
                }

                // Convert the final image to a byte array
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(resultImage, "png", baos);
                return baos.toByteArray();
            }
        } catch (ModelException | TranslateException e) {
            throw new IOException("Error processing image", e);
        } catch (Exception e) {
            logger.error("Unexpected error in removeBackground: " + e.getMessage(), e);
            throw new IOException("Error processing image", e);
        }
    }

    /**
     * Ensures the image file is in PNG format
     * 
     * @param file Input MultipartFile to check and potentially convert
     * @return Original file or converted PNG file
     * @throws IOException if file conversion fails
     */
    public MultipartFile ensurePngFormat(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            return file;
        }

        String lowerCaseName = fileName.toLowerCase();
        if (lowerCaseName.endsWith(".png")) {
            // Already PNG, no conversion needed
            return file;
        }

        // Check if it's JPEG/JPG
        if (lowerCaseName.endsWith(".jpg") || lowerCaseName.endsWith(".jpeg")) {
            logger.info("Converting JPEG image to PNG format");

            // Convert JPEG to PNG
            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(file.getBytes()));
            if (originalImage == null) {
                logger.error("Failed to read JPEG image");
                return file; // Return original if conversion fails
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(originalImage, "png", baos);
            byte[] pngBytes = baos.toByteArray();

            // Create new MultipartFile with PNG content
            String newFileName = fileName.substring(0, fileName.lastIndexOf('.')) + ".png";
            return new MockMultipartFile(
                    file.getName(),
                    newFileName,
                    "image/png",
                    pngBytes);
        }
        return file;
    }

    /**
     * Overlays a person onto a custom background image.
     * The person is centered on the background.
     *
     * @param personImage     the image containing the person with background to be
     *                        removed
     * @param backgroundImage the custom background image
     * @return a byte array containing the processed image in PNG format
     * @throws IOException if processing fails
     */
    public byte[] overlayPersonOnBackground(
            MultipartFile personImage,
            MultipartFile backgroundImage) throws IOException {

        try {
            // Convert the uploaded files to DJL Images
            Image personImg = ImageFactory.getInstance().fromInputStream(personImage.getInputStream());
            Image bgImg = ImageFactory.getInstance().fromInputStream(backgroundImage.getInputStream());

            // Get dimensions
            BufferedImage originalPersonBuffered = (BufferedImage) personImg.getWrappedImage();
            int personImgWidth = originalPersonBuffered.getWidth();
            int personImgHeight = originalPersonBuffered.getHeight();

            BufferedImage originalBgBuffered = (BufferedImage) bgImg.getWrappedImage();
            int bgWidth = originalBgBuffered.getWidth();
            int bgHeight = originalBgBuffered.getHeight();

            // Check if background is smaller than person image and scale if needed
            if (bgWidth < personImgWidth || bgHeight < personImgHeight) {
                logger.info("Background image is smaller than person image. Scaling up background.");

                // Calculate scale factors
                double scaleX = (double) personImgWidth / bgWidth;
                double scaleY = (double) personImgHeight / bgHeight;
                double scale = Math.max(scaleX, scaleY); // Use the larger scale to ensure both dimensions are covered

                // Calculate new dimensions (round up to ensure we're bigger than person image)
                int newWidth = (int) Math.ceil(bgWidth * scale);
                int newHeight = (int) Math.ceil(bgHeight * scale);

                // Create a new scaled background image
                BufferedImage scaledBgBuffered = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_ARGB);
                Graphics2D g2d = scaledBgBuffered.createGraphics();
                g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g2d.drawImage(originalBgBuffered, 0, 0, newWidth, newHeight, null);
                g2d.dispose();

                // Update background image and dimensions
                originalBgBuffered = scaledBgBuffered;
                bgWidth = newWidth;
                bgHeight = newHeight;

                // Update the DJL image object
                bgImg = ImageFactory.getInstance().fromImage(originalBgBuffered);
            }

            // URL of the pre-trained DeepLabV3 model packaged as a zip file
            String url = "djl://ai.djl.pytorch/deeplabv3/0.0.1/deeplabv3";

            // Build the criteria to load the model
            Criteria<Image, CategoryMask> criteria = Criteria.builder()
                    .setTypes(Image.class, CategoryMask.class)
                    .optModelUrls(url)
                    .optTranslatorFactory(new SemanticSegmentationTranslatorFactory())
                    .optEngine("PyTorch")
                    .optProgress(new ProgressBar())
                    .build();

            try (ZooModel<Image, CategoryMask> model = criteria.loadModel();
                    Predictor<Image, CategoryMask> predictor = model.newPredictor()) {

                // Predict the segmentation mask for the person image
                CategoryMask mask = predictor.predict(personImg);

                // // Get the original person image as BufferedImage
                // BufferedImage originalPersonBuffered = (BufferedImage)
                // personImg.getWrappedImage();
                // int personImgWidth = originalPersonBuffered.getWidth();
                // int personImgHeight = originalPersonBuffered.getHeight();

                // Extract person from the original image using the mask
                BufferedImage personOnly = new BufferedImage(
                        personImgWidth,
                        personImgHeight,
                        BufferedImage.TYPE_INT_ARGB);

                // Create the person mask image and convert to BufferedImage
                Image personMaskImage = mask.getMaskImage(personImg, 15); // 15 is the category ID for person

                // Ensure the mask is properly sized to match the original image
                personMaskImage = personMaskImage.resize(personImgWidth, personImgHeight, true);
                BufferedImage maskBuffered = (BufferedImage) personMaskImage.getWrappedImage();

                // Extract the person from original image using mask
                for (int y = 0; y < personImgHeight; y++) {
                    for (int x = 0; x < personImgWidth; x++) {
                        // Safety check for array bounds
                        if (x >= maskBuffered.getWidth() || y >= maskBuffered.getHeight()) {
                            continue;
                        }

                        int maskPixel = maskBuffered.getRGB(x, y);
                        // Check if this pixel is part of the person in the mask (not transparent)
                        if ((maskPixel >> 24) != 0) {
                            // Copy pixel from original image
                            personOnly.setRGB(x, y, originalPersonBuffered.getRGB(x, y));
                        }
                    }
                }

                // Calculate bounding box of the person in the extracted image
                int left = personImgWidth;
                int right = 0;
                int top = personImgHeight;
                int bottom = 0;
                boolean personFound = false;

                // Find the bounding box coordinates
                for (int y = 0; y < personImgHeight; y++) {
                    for (int x = 0; x < personImgWidth; x++) {
                        int pixel = personOnly.getRGB(x, y);
                        // Check if this pixel is not transparent (part of the person)
                        if ((pixel >> 24) != 0) {
                            left = Math.min(left, x);
                            right = Math.max(right, x);
                            top = Math.min(top, y);
                            bottom = Math.max(bottom, y);
                            personFound = true;
                        }
                    }
                }

                // Get background image dimensions
                // BufferedImage originalBgBuffered = (BufferedImage) bgImg.getWrappedImage();
                // int bgWidth = originalBgBuffered.getWidth();
                // int bgHeight = originalBgBuffered.getHeight();

                // Create a new image with the background dimensions
                BufferedImage resultImage = new BufferedImage(
                        bgWidth,
                        bgHeight,
                        BufferedImage.TYPE_INT_ARGB);

                // Draw the background image (now we're using the potentially scaled version)
                Graphics2D g2d = resultImage.createGraphics();
                g2d.drawImage(originalBgBuffered, 0, 0, null);
                g2d.dispose();

                // If no person is detected, return the background image as is
                if (!personFound || left >= right || top >= bottom) {
                    logger.info("No person detected, returning background image");
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    ImageIO.write(resultImage, "png", baos);
                    return baos.toByteArray();
                }

                // Calculate the width and height of the person
                int personWidth = right - left + 1;
                int personHeight = bottom - top + 1;

                // Calculate centering offsets
                int xOffset = (bgWidth - personWidth) / 2 - left;
                int yOffset = (bgHeight - personHeight) / 2 - top;

                // Copy the person pixels to the centered position on the background
                for (int y = top; y <= bottom; y++) {
                    for (int x = left; x <= right; x++) {
                        // Get the pixel from the extracted person image
                        int pixelColor = personOnly.getRGB(x, y);

                        // Skip transparent pixels
                        if ((pixelColor >> 24) == 0) {
                            continue;
                        }

                        // Calculate destination coordinates with offset
                        int destX = x + xOffset;
                        int destY = y + yOffset;

                        // Ensure we're within bounds of the output image
                        if (destX >= 0 && destX < bgWidth && destY >= 0 && destY < bgHeight) {
                            // Copy the pixel to the centered position
                            resultImage.setRGB(destX, destY, pixelColor);
                        }
                    }
                }

                // Convert the final image to a byte array
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(resultImage, "png", baos);
                return baos.toByteArray();
            }
        } catch (ModelException | TranslateException e) {
            throw new IOException("Error processing image", e);
        } catch (Exception e) {
            logger.error("Unexpected error in overlayPersonOnBackground: " + e.getMessage(), e);
            throw new IOException("Error processing image", e);
        }
    }
}
