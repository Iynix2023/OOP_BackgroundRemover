package com.example.oop.oop.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class PhotoService {

    private final String uploadDir = "uploads/";

    public PhotoService() {
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public String storePhoto(MultipartFile file) {
        try {
            String photoId = UUID.randomUUID().toString();
            String extension = getFileExtension(file.getOriginalFilename());
            String fileName = photoId + "." + extension;
            Path path = Paths.get(uploadDir + fileName);
            Files.write(path, file.getBytes());
            return photoId;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    public File getPhotoFile(String photoId, String extension) {
        return new File(uploadDir + photoId + "." + extension);
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex >= 0) ? filename.substring(dotIndex + 1) : "";
    }
}
