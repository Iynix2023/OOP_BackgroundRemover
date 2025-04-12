package com.example.demo.controller;

import com.example.demo.model.ExportOptions;
import com.example.demo.service.SheetGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/photo")
@CrossOrigin(origins = "*")
public class SheetGeneratorController {

    @Autowired
    private SheetGeneratorService sheetGeneratorService;

    @PostMapping("/generate-sheet")
    public ResponseEntity<?> generatePhotoSheet(
            @RequestBody PhotoSheetRequest request) {
        try {
            String resultImageData = sheetGeneratorService.generatePhotoSheet(
                request.getImageData(), 
                request.getExportOptions()
            );
            
            return ResponseEntity.ok(new PhotoSheetResponse(resultImageData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Request and Response classes
    public static class PhotoSheetRequest {
        private String imageData;
        private ExportOptions exportOptions;
        
        // Getters and setters
        public String getImageData() {
            return imageData;
        }
        
        public void setImageData(String imageData) {
            this.imageData = imageData;
        }
        
        public ExportOptions getExportOptions() {
            return exportOptions;
        }
        
        public void setExportOptions(ExportOptions exportOptions) {
            this.exportOptions = exportOptions;
        }
    }
    
    public static class PhotoSheetResponse {
        private String imageData;
        
        public PhotoSheetResponse(String imageData) {
            this.imageData = imageData;
        }
        
        public String getImageData() {
            return imageData;
        }
    }
    
    public static class ErrorResponse {
        private String error;
        
        public ErrorResponse(String error) {
            this.error = error;
        }
        
        public String getError() {
            return error;
        }
    }
}