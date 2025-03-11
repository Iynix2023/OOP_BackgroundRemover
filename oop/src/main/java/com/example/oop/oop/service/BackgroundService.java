package com.example.oop.oop.service;

import com.example.oop.oop.util.ImageUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class BackgroundService {

    @Autowired
    private PhotoService photoService;

    public boolean removeBackground(String photoId, String mode, String hints) {
        // Again, assume the photo is in PNG format.
        File inputFile = photoService.getPhotoFile(photoId, "png");
        try {
            if ("automatic".equalsIgnoreCase(mode)) {
                // Automatic mode could use face detection or a pre-set algorithm.
                ImageUtils.removeBackgroundAutomatic(inputFile, inputFile);
            } else if ("semi-automatic".equalsIgnoreCase(mode)) {
                // Semi-automatic mode uses hints provided by the user.
                ImageUtils.removeBackgroundWithHints(inputFile, inputFile, hints);
            } else {
                // Default to automatic mode if mode is unrecognized.
                ImageUtils.removeBackgroundAutomatic(inputFile, inputFile);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
