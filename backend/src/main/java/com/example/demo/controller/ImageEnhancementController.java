package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.demo.model.EnhanceOptions;
import com.example.demo.service.ImageEnhancementService;

import nu.pattern.OpenCV;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/image")
@CrossOrigin("*")
public class ImageEnhancementController {
    static {
        // Load the OpenCV native library during class initialization
        try {
            OpenCV.loadLocally();
            System.err.println("OpenCV loaded");
        } catch (Exception e) {
            throw new RuntimeException("Failed to load OpenCV", e);
        }
    }

    @Autowired
    private ImageEnhancementService imageEnhancementService;

    @PostMapping("/enhance")
    public ResponseEntity<byte[]> enhanceImage(
            @RequestParam("image") String base64Image,
            @RequestParam("options") String optionsJson) {
        try {
            // Parse the options JSON string
            ObjectMapper mapper = new ObjectMapper();
            EnhanceOptions options = mapper.readValue(optionsJson, EnhanceOptions.class);
            
            // Clean and decode the base64 image string
            String cleanBase64 = base64Image.trim();
            // Handle data URL format (e.g., "data:image/jpeg;base64,...")
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.split(",")[1];
            }
            // Remove any whitespace, newlines or other invalid characters
            cleanBase64 = cleanBase64.replaceAll("[^A-Za-z0-9+/=]", "");
            
            byte[] imageData;
            try {
                imageData = Base64.getDecoder().decode(cleanBase64);
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid Base64 string: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(("Invalid image format: " + e.getMessage()).getBytes());
            }
            byte[] enhancedImage = imageEnhancementService.enhanceImage(imageData, options);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(enhancedImage);
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Integer>> analyzeImage(@RequestParam("image") String base64Image) {
        try {
            // Clean and decode base64 image
            String cleanBase64 = base64Image.trim();
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.split(",")[1];
            }
            cleanBase64 = cleanBase64.replaceAll("[^A-Za-z0-9+/=]", "");
            
            byte[] imageData = Base64.getDecoder().decode(cleanBase64);
            
            // Analyze the image to determine optimal parameters
            Map<String, Integer> enhancementParams = imageEnhancementService.analyzeImage(imageData);
            
            return ResponseEntity.ok(enhancementParams);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}