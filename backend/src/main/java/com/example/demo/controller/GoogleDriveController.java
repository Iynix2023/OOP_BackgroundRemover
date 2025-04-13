package com.example.demo.controller;

import java.io.IOException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.service.GoogleDriveService;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.services.drive.model.File;

import jakarta.servlet.http.HttpServletResponse;



@Controller
public class GoogleDriveController {

    private static final Logger log = LoggerFactory.getLogger(GoogleDriveController.class);
    private final GoogleDriveService googleDriveService;

    public GoogleDriveController(GoogleDriveService googleDriveService) {
        this.googleDriveService = googleDriveService;
    }

    @GetMapping("/")
    public String homePage(Model model) {
        try {
            List<File> images = googleDriveService.listImages();
            model.addAttribute("images", images);
        } catch (IOException e) {
            log.error("Error loading images from Google Drive", e);
            model.addAttribute("error", "Failed to load images from Google Drive: " + e.getMessage());
        }
        return "index";
    }

    @GetMapping("/images")
    public String listImages(Model model) {
        try {
            List<File> images = googleDriveService.listImages();
            model.addAttribute("images", images);
        } catch (IOException e) {
            log.error("Error listing images", e);
            model.addAttribute("error", "Failed to list images: " + e.getMessage());
        }
        return "images";
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String fileId) {
        try {
            byte[] fileContent = googleDriveService.downloadFile(fileId);
            
            // Get the file metadata to determine content type
            // File fileMetadata = googleDriveService.driveService.files().get(fileId)
            File fileMetadata = googleDriveService.getDriveForUser("user").files().get(fileId)

                    .setFields("name,mimeType")
                    .execute();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(fileMetadata.getMimeType()));
            headers.setContentDispositionFormData("attachment", fileMetadata.getName());
            
            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Error downloading file", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e){
            log.error("General error downloading file metadata", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }

    @PostMapping("/upload")
    @org.springframework.web.bind.annotation.ResponseBody
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
                                        @RequestParam(value = "description", required = false) String description) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    java.util.Map.of("error", "Please select a file to upload")
                );
            }

        String fileId = googleDriveService.uploadFile(file, description);
        String fileName = file.getOriginalFilename();
        String driveUrl = "https://drive.google.com/file/d/" + fileId + "/view";

        return ResponseEntity.ok(java.util.Map.of(
            "fileName", fileName,
            "driveUrl", driveUrl
        ));
    } catch (IOException e) {
        log.error("Error uploading file", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            java.util.Map.of("error", "Failed to upload file: " + e.getMessage())
        );
    }
}

    // @PostMapping("/upload")
    // public String uploadFile(@RequestParam("file") MultipartFile file,
    //                          @RequestParam(value = "description", required = false) String description,
    //                          Model model) {
    //     try {
    //         if (file.isEmpty()) {
    //             model.addAttribute("error", "Please select a file to upload");
    //             return "redirect:/?error=Please select a file to upload";
    //         }

    //         String fileId = googleDriveService.uploadFile(file, description);
    //         model.addAttribute("success", "File uploaded successfully with ID: " + fileId);
    //         return "redirect:/?success=File uploaded successfully";
    //     } catch (IOException e) {
    //         log.error("Error uploading file", e);
    //         model.addAttribute("error", "Failed to upload file: " + e.getMessage());
    //         return "redirect:/?error=Failed to upload file";
    //     }
    // }

    @PostMapping("/update/{fileId}")
    public ResponseEntity<String> updateFile(@PathVariable String fileId,
                                            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Please select a file to update");
            }

            String updatedFileId = googleDriveService.updateFile(fileId, file.getBytes(), file.getContentType());
            return ResponseEntity.ok("File updated successfully with ID: " + updatedFileId);
        } catch (IOException e) {
            log.error("Error updating file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update file: " + e.getMessage());
        }
    }

    @PostMapping("/create-folder")
    public ResponseEntity<String> createFolder(@RequestParam("folderName") String folderName) {
        try {
            String folderId = googleDriveService.createFolder(folderName);
            return ResponseEntity.ok("Folder created successfully with ID: " + folderId);
        } catch (IOException e) {
            log.error("Error creating folder", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create folder: " + e.getMessage());
        }
    }

    @Autowired
    private GoogleAuthorizationCodeFlow authorizationCodeFlow;

    @GetMapping("/authorize")
    public void authorize(HttpServletResponse response) throws IOException {
        String redirectUri = "http://localhost:8080/oauth2callback";
        
        String authorizationUrl = authorizationCodeFlow.newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .build();
        response.sendRedirect(authorizationUrl);
    }

    @GetMapping("/oauth2callback")
    public String oauth2Callback(@RequestParam("code") String code) throws IOException {
        String redirectUri = "http://localhost:8080/oauth2callback";
        TokenResponse response = authorizationCodeFlow.newTokenRequest(code)
                .setRedirectUri(redirectUri)
                .execute();
        Credential credential = authorizationCodeFlow.createAndStoreCredential(response, "user");

        return "redirect:http://localhost:5173/?authorized=true";
    }




}