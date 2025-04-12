package com.example.demo.controller;

import java.util.Map;
import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.ExportOptions;
import com.example.demo.service.SheetGeneratorService;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/photo")
public class SheetGeneratorController {
    private static final Logger LOGGER = Logger.getLogger(SheetGeneratorController.class.getName());
    
    @Autowired
    private SheetGeneratorService sheetGeneratorService;
    
    @PostMapping("/generate-sheet")
    public ResponseEntity<Map<String, String>> generatePhotoSheet(@RequestBody Map<String, Object> request) {
        try {
            // Extract the base64 image data
            String imageData = (String) request.get("imageData");
            if (imageData == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Extract export options
            Map<String, Object> exportOptionsMap = (Map<String, Object>) request.get("exportOptions");
            if (exportOptionsMap == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Convert to ExportOptions object
            ExportOptions exportOptions = new ExportOptions();
            
            // Map format
            String formatStr = (String) exportOptionsMap.get("format");
            if ("JPEG".equals(formatStr)) {
                exportOptions.setFormat(ExportOptions.ExportFormat.JPEG);
            } else {
                exportOptions.setFormat(ExportOptions.ExportFormat.PNG);
            }
            
            // Map size
            String sizeStr = (String) exportOptionsMap.get("size");
            if (sizeStr != null) {
                try {
                    exportOptions.setSize(ExportOptions.ExportSize.valueOf(sizeStr));
                } catch (Exception e) {
                    LOGGER.warning("Invalid size value: " + sizeStr + ". Using default.");
                    exportOptions.setSize(ExportOptions.ExportSize.STANDARD_35x45);
                }
            } else {
                exportOptions.setSize(ExportOptions.ExportSize.STANDARD_35x45);
            }
            
            // Map layout
            String layoutStr = (String) exportOptionsMap.get("layout");
            if ("GRID_2x2".equals(layoutStr)) {
                exportOptions.setLayout(ExportOptions.ExportLayout.GRID_2x2);
            } else if ("GRID_4x6".equals(layoutStr)) {
                exportOptions.setLayout(ExportOptions.ExportLayout.GRID_4x6);
            } else {
                exportOptions.setLayout(ExportOptions.ExportLayout.SINGLE);
            }
            
            // Set custom dimensions if applicable
            if (exportOptions.getSize() == ExportOptions.ExportSize.CUSTOM) {
                Integer customWidth = (Integer) exportOptionsMap.get("customWidth");
                Integer customHeight = (Integer) exportOptionsMap.get("customHeight");
                exportOptions.setCustomWidth(customWidth != null ? customWidth : 600);
                exportOptions.setCustomHeight(customHeight != null ? customHeight : 800);
            }
            
            // Generate the sheet
            String processedImageData = sheetGeneratorService.generatePhotoSheet(imageData, exportOptions);
            
            // Return the processed image
            Map<String, String> response = Map.of("imageData", processedImageData);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            LOGGER.severe("Error generating photo sheet: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}