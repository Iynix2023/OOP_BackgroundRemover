package com.example.idphotoprocessor.config;

import lombok.extern.slf4j.Slf4j;
import org.opencv.core.Core;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
@Slf4j
public class OpenCVConfig {

    @PostConstruct
    public void loadLibrary() {
        try {
            // Load the OpenCV native library
            nu.pattern.OpenCV.loadLocally();
            log.info("OpenCV loaded successfully. Version: {}", Core.VERSION);
        } catch (Exception e) {
            log.error("Failed to load OpenCV", e);
            throw new RuntimeException("Failed to load OpenCV", e);
        }
    }
}