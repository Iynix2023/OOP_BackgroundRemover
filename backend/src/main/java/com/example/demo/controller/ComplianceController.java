package com.example.demo.controller;

import java.io.IOException;
// import java.util.List;

import org.springframework.web.bind.annotation.*;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.context.annotation.Bean;
// import org.springframework.http.MediaType;

// import org.springframework.scheduling.annotation.EnableAsync;
// import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
// import org.springframework.web.bind.annotation.CrossOrigin;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.service.ComplianceCheckerService;


@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {

    private final ComplianceCheckerService complianceCheckerService;

    public ComplianceController(ComplianceCheckerService complianceCheckerService) {
        this.complianceCheckerService = complianceCheckerService;
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkCompliance(@RequestParam("file") MultipartFile file) {
        try {
            byte[] imageBytes = file.getBytes();
            Map<String, Object> result = complianceCheckerService.analyzeCompliance(imageBytes);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to analyze image"));
        }
    }
}
