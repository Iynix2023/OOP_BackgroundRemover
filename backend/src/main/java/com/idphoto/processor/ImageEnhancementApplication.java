package com.idphoto.processor;


import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;


@RestController
@RequestMapping("/api/image")
@CrossOrigin("*") // Allow all origins for testing
class ImageProcessingController {

    private final ImageProcessingService imageProcessingService;

    public ImageProcessingController(ImageProcessingService imageProcessingService) {
        this.imageProcessingService = imageProcessingService;
    }

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
            
            byte[] enhancedImage = imageProcessingService.enhanceImage(imageData, options);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(enhancedImage);
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

@Service
class ImageProcessingService {

    public byte[] enhanceImage(byte[] imageData, EnhanceOptions options) {
        // Load image with alpha channel preserved
        Mat image = Imgcodecs.imdecode(new MatOfByte(imageData), Imgcodecs.IMREAD_UNCHANGED);
        
        // Check if image has alpha channel (4 channels)
        boolean hasAlpha = image.channels() == 4;
        Mat rgbImage, alphaChannel = null;
        
        // If image has alpha channel, split it to process RGB separately
        if (hasAlpha) {
            // Split channels to preserve alpha
            java.util.List<Mat> channels = new java.util.ArrayList<>();
            Core.split(image, channels);
            
            // Extract the alpha channel
            alphaChannel = channels.get(3);
            
            // Create RGB image from first three channels
            rgbImage = new Mat();
            Core.merge(channels.subList(0, 3), rgbImage);
        } else {
            rgbImage = image;
        }
        
        // Scale the UI values appropriately
        double scaledBrightness = options.getBrightness(); 
        double scaledContrast = 1.0 + (options.getContrast() / 50.0); 
        double scaledSaturation = 1.0 + (options.getSaturation() / 50.0); 

        // Apply brightness and contrast to RGB channels only
        rgbImage.convertTo(rgbImage, -1, scaledContrast, scaledBrightness);

        // Apply saturation
        Mat hsv = new Mat();
        Imgproc.cvtColor(rgbImage, hsv, Imgproc.COLOR_BGR2HSV);
        Core.multiply(hsv, new Scalar(1, scaledSaturation, 1), hsv);
        Imgproc.cvtColor(hsv, rgbImage, Imgproc.COLOR_HSV2BGR);
        
        // Apply smoothing with valid kernel size
        int smoothingValue = options.getSmoothing();
        if (smoothingValue > 0) {
            // Ensure kernel size is odd
            if (smoothingValue % 2 == 0) smoothingValue++;
            smoothingValue = Math.max(3, smoothingValue);
            Imgproc.GaussianBlur(rgbImage, rgbImage, new Size(smoothingValue, smoothingValue), 0);
        }
        
        // Reconstruct the image with alpha channel if original had one
        Mat result;
        if (hasAlpha) {
            result = new Mat();
            java.util.List<Mat> resultChannels = new java.util.ArrayList<>();
            java.util.List<Mat> rgbChannels = new java.util.ArrayList<>();
            Core.split(rgbImage, rgbChannels);
            
            // Add RGB channels
            resultChannels.addAll(rgbChannels);
            // Add alpha channel as the 4th channel
            resultChannels.add(alphaChannel);
            
            Core.merge(resultChannels, result);
        } else {
            result = rgbImage;
        }

        // Encode as PNG to preserve transparency
        MatOfByte mob = new MatOfByte();
        Imgcodecs.imencode(".png", result, mob);
        return mob.toArray();
    }
}

class EnhanceOptions {
    private int brightness;
    private int contrast;
    private int saturation;
    private int smoothing;

    // Getters and setters
    public int getBrightness() { return brightness; }
    public void setBrightness(int brightness) { this.brightness = brightness; }

    public int getContrast() { return contrast; }
    public void setContrast(int contrast) { this.contrast = contrast; }

    public int getSaturation() { return saturation; }
    public void setSaturation(int saturation) { this.saturation = saturation; }

    public int getSmoothing() { return smoothing; }
    public void setSmoothing(int smoothing) { this.smoothing = Math.max(0, smoothing); }
}