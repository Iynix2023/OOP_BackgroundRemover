package com.example.demo.controller;

// import com.example.demo.service.ImageProcessingService;
import com.example.demo.service.ImageProcessingService_v2;

import nu.pattern.OpenCV;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@CrossOrigin(origins = "*")
public class ImageProcessController {

    static {
        // Load the OpenCV native library during class initialization
        try {
            OpenCV.loadLocally();
            System.err.println("OpenCV loaded");
        } catch (Exception e) {
            throw new RuntimeException("Failed to load OpenCV", e);
        }
    }

    private static final Logger logger = LoggerFactory.getLogger(ImageProcessController.class);

    @Autowired
    // private ImageProcessingService imageProcessingService;
    private ImageProcessingService_v2 imageProcessingService_v2;

    @PostMapping("/process-image")
    public ResponseEntity<byte[]> processImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam(value = "backgroundType", defaultValue = "color") String backgroundType,
            @RequestParam(value = "backgroundColor", defaultValue = "#AADBE6") String backgroundColor) {
        try {
            if (file.isEmpty()) {
                logger.error("Uploaded file is empty");
                return ResponseEntity.badRequest().build();
            }

            logger.info("Processing image: " + file.getOriginalFilename());
            logger.info("Background type: " + backgroundType + ", color: " + backgroundColor);

            // Check if file is JPG/JPEG and convert if needed
            MultipartFile processableFile = imageProcessingService_v2.ensurePngFormat(file);

            // Use the properly formatted file with background options
            byte[] processedImage = imageProcessingService_v2.removeBackground(
                    processableFile,
                    backgroundType,
                    backgroundColor);

            if (processedImage == null || processedImage.length == 0) {
                logger.error("Processed image is null or empty");
                return ResponseEntity.internalServerError().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(processedImage);

        } catch (Exception e) {
            logger.error("Error processing image: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/center-image")
    public ResponseEntity<byte[]> centerImage(@RequestParam("image") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                logger.error("Uploaded file is empty");
                return ResponseEntity.badRequest().build();
            }

            logger.info("Centering person in image: " + file.getOriginalFilename());

            // Check if file is JPG/JPEG and convert if needed
            MultipartFile processableFile = imageProcessingService_v2.ensurePngFormat(file);

            // Use the properly formatted file
            byte[] centeredImage = imageProcessingService_v2.centerPersonInImage(processableFile);

            if (centeredImage == null || centeredImage.length == 0) {
                logger.error("Centered image is null or empty");
                return ResponseEntity.internalServerError().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(centeredImage);

        } catch (Exception e) {
            logger.error("Error centering image: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}