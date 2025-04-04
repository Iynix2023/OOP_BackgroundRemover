package com.example.demo.controller;

// import com.example.demo.service.ImageProcessingService;
import com.example.demo.service.ImageProcessingService_v2;

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
public class ImageController {
    
    private static final Logger logger = LoggerFactory.getLogger(ImageController.class);

    @Autowired
    // private ImageProcessingService imageProcessingService;
    private ImageProcessingService_v2 imageProcessingService_v2;

    @PostMapping("/process-image")
    public ResponseEntity<byte[]> processImage(@RequestParam("image") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                logger.error("Uploaded file is empty");
                return ResponseEntity.badRequest().build();
            }
            
            logger.info("Processing image: " + file.getOriginalFilename());
            // byte[] processedImage = imageProcessingService.removeBackground(file);
            byte[] processedImage = imageProcessingService_v2.removeBackground(file);
            
            if (processedImage == null || processedImage.length == 0) {
                logger.error("Processed image is null or empty");
                return ResponseEntity.internalServerError().build();
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(processedImage);
        } catch (Exception e) {
            logger.error("Error processing image: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}