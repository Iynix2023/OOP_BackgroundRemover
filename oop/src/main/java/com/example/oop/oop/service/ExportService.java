package com.example.oop.oop.service;

import com.example.oop.oop.util.ImageUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class ExportService {

    @Autowired
    private PhotoService photoService;

    private final String exportDir = "exports/";

    public ExportService() {
        File dir = new File(exportDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public String exportPhoto(String photoId, String format) {
        // Assume the source file is stored as PNG.
        File sourceFile = photoService.getPhotoFile(photoId, "png");
        String exportedFileName = photoId + "_exported." + format;
        File exportFile = new File(exportDir + exportedFileName);
        try {
            // Convert the image to the desired format.
            ImageUtils.convertImageFormat(sourceFile, exportFile, format);
            return exportFile.getAbsolutePath();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
