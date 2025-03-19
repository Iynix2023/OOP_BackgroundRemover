package com;

import com.idphoto.processor.*;


import java.nio.file.Files;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import nu.pattern.OpenCV; 
import org.opencv.core.Core; 


@SpringBootApplication
public class Application {
    static {
        // Load the OpenCV native library during class initialization
        try {
            OpenCV.loadLocally();
            System.err.println("OpenCV loaded");
        } catch (Exception e) {
            throw new RuntimeException("Failed to load OpenCV", e);
        }
    }
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);

    }
    @Bean  
    CommandLineRunner run(BatchProcessingApplication batchProcessor) {
        return args -> {
            
        };
    }
}
