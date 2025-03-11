package com.example.oop.oop.service;

import com.example.oop.oop.util.ImageUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class CropService {

    @Autowired
    private PhotoService photoService;

    public boolean cropPhoto(String photoId, int x, int y, int width, int height) {
        // For demonstration, assume the file is stored as PNG.
        File inputFile = photoService.getPhotoFile(photoId, "png");
        try {
            // Crop and resize using the ImageUtils helper.
            // This overwrites the original file; alternatively, save as a new file.
            ImageUtils.cropImage(inputFile, inputFile, x, y, width, height);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
