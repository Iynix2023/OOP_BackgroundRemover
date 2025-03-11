

package com.example.oop.oop.controller;

import com.example.oop.oop.model.ResponseDTO;
import com.example.oop.oop.service.PhotoService;
import com.example.oop.oop.service.CropService;
import com.example.oop.oop.service.BackgroundService;
import com.example.oop.oop.service.ExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    @Autowired
    private CropService cropService;

    @Autowired
    private BackgroundService backgroundService;

    @Autowired
    private ExportService exportService;

    // a. File Upload and Display
    @PostMapping("/upload")
    public ResponseEntity<ResponseDTO> uploadPhoto(@RequestParam("file") MultipartFile file) {
        String photoId = photoService.storePhoto(file);
        if (photoId != null) {
            return ResponseEntity.ok(new ResponseDTO("Upload successful", photoId));
        }
        return ResponseEntity.badRequest().body(new ResponseDTO("Upload failed", null));
    }

    // b. Image Cropping and Resizing
    @PostMapping("/crop")
    public ResponseEntity<ResponseDTO> cropPhoto(
            @RequestParam("photoId") String photoId,
            @RequestParam("x") int x,
            @RequestParam("y") int y,
            @RequestParam("width") int width,
            @RequestParam("height") int height) {
        boolean success = cropService.cropPhoto(photoId, x, y, width, height);
        if (success) {
            return ResponseEntity.ok(new ResponseDTO("Crop successful", photoId));
        }
        return ResponseEntity.badRequest().body(new ResponseDTO("Crop failed", null));
    }

    // c. Background Removal and Replacement
    @PostMapping("/remove-background")
    public ResponseEntity<ResponseDTO> removeBackground(
            @RequestParam("photoId") String photoId,
            @RequestParam(value = "mode", defaultValue = "automatic") String mode,
            @RequestParam(value = "hints", required = false) String hints) {
        boolean success = backgroundService.removeBackground(photoId, mode, hints);
        if (success) {
            return ResponseEntity.ok(new ResponseDTO("Background removal successful", photoId));
        }
        return ResponseEntity.badRequest().body(new ResponseDTO("Background removal failed", null));
    }

    // d. Photo Export
    @GetMapping("/export/{photoId}")
    public ResponseEntity<ResponseDTO> exportPhoto(
            @PathVariable("photoId") String photoId,
            @RequestParam(value = "format", defaultValue = "png") String format) {
        String filePath = exportService.exportPhoto(photoId, format);
        if (filePath != null) {
            return ResponseEntity.ok(new ResponseDTO("Export successful", filePath));
        }
        return ResponseEntity.badRequest().body(new ResponseDTO("Export failed", null));
    }
}
