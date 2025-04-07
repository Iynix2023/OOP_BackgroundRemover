package com.example.demo.service;

import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.core.MatOfDouble;
import org.opencv.core.Scalar;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;

import com.example.demo.processor.model.EnhanceOptions;

import java.util.HashMap;
import java.util.Map;

@Service
public class ImageEnhancementService{

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

    public Map<String, Integer> analyzeImage(byte[] imageData) {
        // Load image
        Mat image = Imgcodecs.imdecode(new MatOfByte(imageData), Imgcodecs.IMREAD_COLOR);
        Map<String, Integer> params = new HashMap<>();
        
        // 1. Calculate brightness recommendation
        MatOfDouble mean = new MatOfDouble();
        MatOfDouble stddev = new MatOfDouble();
        Core.meanStdDev(image, mean, stddev);
        double[] meanValues = mean.toArray();
        double averageBrightness = (meanValues[0] + meanValues[1] + meanValues[2]) / 3.0;
        
        // Target optimal brightness: 127 (mid-gray)
        int brightnessAdjustment = (int)Math.round((127 - averageBrightness) * 0.4);
        brightnessAdjustment = Math.max(-30, Math.min(30, brightnessAdjustment));
        
        // 2. Calculate contrast recommendation
        double[] stddevValues = stddev.toArray();
        double averageContrast = (stddevValues[0] + stddevValues[1] + stddevValues[2]) / 3.0;
        
        // Lower stddev means low contrast
        int contrastAdjustment = 0;
        if (averageContrast < 40) {
            contrastAdjustment = (int)Math.round((40 - averageContrast) / 2);
            contrastAdjustment = Math.min(25, contrastAdjustment);
        } else if (averageContrast > 80) {
            contrastAdjustment = (int)Math.round((80 - averageContrast) / 3);
            contrastAdjustment = Math.max(-15, contrastAdjustment);
        }
        
        // 3. Calculate saturation recommendation
        Mat hsvImage = new Mat();
        Imgproc.cvtColor(image, hsvImage, Imgproc.COLOR_BGR2HSV);
        MatOfDouble hsvMean = new MatOfDouble();
        Core.meanStdDev(hsvImage, hsvMean, new MatOfDouble());
        double[] hsvMeanValues = hsvMean.toArray();
        
        // Saturation is channel 1 in HSV
        int saturationAdjustment = 0;
        if (hsvMeanValues[1] < 100) {
            // Under-saturated
            saturationAdjustment = (int)Math.round((60 - hsvMeanValues[1]) / 3);
            saturationAdjustment = Math.min(20, saturationAdjustment);
        } else if (hsvMeanValues[1] > 100) {
            // Over-saturated - recommend reducing saturation
            saturationAdjustment = (int)Math.round((120 - hsvMeanValues[1]) / 3);
            saturationAdjustment = Math.max(-20, saturationAdjustment);
        }
        
        // Store all parameters
        params.put("brightness", brightnessAdjustment);
        params.put("contrast", contrastAdjustment);
        params.put("saturation", saturationAdjustment);
        
        return params;
    }
}