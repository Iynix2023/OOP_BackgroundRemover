package com.example.demo.service;

import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier; // Added this import for OpenCV's CascadeClassifier
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
public class ImageProcessingServiceGrabcut {
    private static final Logger logger = LoggerFactory.getLogger(ImageProcessingServiceGrabcut.class);

    @Autowired
    private ResourceLoader resourceLoader;

    static {
        logger.info("Loading OpenCV native library...");
        nu.pattern.OpenCV.loadLocally();
        logger.info("OpenCV native library loaded successfully");
    }

    public byte[] removeBackground(MultipartFile file) throws IOException {
        try {
            // Convert MultipartFile to Mat
            Mat image = Imgcodecs.imdecode(new MatOfByte(file.getBytes()), Imgcodecs.IMREAD_COLOR);
            if (image.empty()) {
                throw new IOException("Failed to load image");
            }
            logger.info("Image loaded, size: {}x{}", image.width(), image.height());

            // Create a copy of the original image
            Mat originalImage = image.clone();

            // Final mask that will contain the person segmentation
            Mat personMask;

            // Run the GrabCut Algorithm to generate person Mask
            logger.info("Using GrabCut Approach... ");
            personMask = segmentWithGrabCutApproach(image);

            // Create inverted mask for background
            Mat backgroundMask = new Mat();
            Core.bitwise_not(personMask, backgroundMask);

            // Create background with desired color
            Mat background = new Mat(image.size(), CvType.CV_8UC3, new Scalar(230, 216, 173));

            // Create final result
            Mat foreground = new Mat();
            Mat backgroundRegion = new Mat();
            Mat result = new Mat();

            originalImage.copyTo(result);
            Core.bitwise_and(result, result, foreground, personMask);
            Core.bitwise_and(background, background, backgroundRegion, backgroundMask);
            Core.add(foreground, backgroundRegion, result);

            // Encode to jpg
            MatOfByte mob = new MatOfByte();
            Imgcodecs.imencode(".jpg", result, mob);

            // Clean up resources
            image.release();
            originalImage.release();
            personMask.release();
            backgroundMask.release();
            foreground.release();
            backgroundRegion.release();
            background.release();
            result.release();

            byte[] imageData = mob.toArray();
            logger.info("Processing complete, returning {} bytes", imageData.length);
            return imageData;
        } catch (Exception e) {
            logger.error("Error during image processing: ", e);
            throw new IOException("Error processing image: " + e.getMessage(), e);
        }
    }

    private Mat segmentWithGrabCutApproach(Mat image) {
        logger.info("Using hybrid approach for segmentation (model not available)");

        // Create grayscale image for additional processing
        Mat gray = new Mat();
        Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);

        // Try face detection first to locate the person
        MatOfRect faces = new MatOfRect();
        CascadeClassifier faceDetector = null;

        try {
            // Try to load the face detector cascade
            Path tempFile = Files.createTempFile("haarcascade_", ".xml");
            Resource cascadeResource = resourceLoader.getResource("classpath:haarcascade_frontalface_default.xml");
            if (cascadeResource.exists()) {
                try (InputStream is = cascadeResource.getInputStream()) {
                    Files.copy(is, tempFile, StandardCopyOption.REPLACE_EXISTING);
                }

                // Use OpenCV's CascadeClassifier instead of our custom one
                faceDetector = new CascadeClassifier();
                if (!faceDetector.load(tempFile.toString())) {
                    logger.warn("Could not load face cascade classifier");
                    faceDetector = null;
                } else {
                    faceDetector.detectMultiScale(gray, faces);
                    logger.info("Face detection found {} faces", faces.toArray().length);
                }
            } else {
                logger.warn("Face cascade XML file not found in resources");
            }
        } catch (Exception e) {
            logger.warn("Face detection unavailable, using GrabCut only: " + e.getMessage());
        }

        // Apply GrabCut algorithm for segmentation
        Mat bgModel = new Mat();
        Mat fgModel = new Mat();
        Mat mask = new Mat(image.size(), CvType.CV_8UC1, new Scalar(Imgproc.GC_PR_FGD));

        // Initialize rectangle for GrabCut
        Rect rect;

        if (!faces.empty()) {
            // If faces detected, use that to guide segmentation
            Rect faceRect = faces.toArray()[0];
            int width = image.width();
            int height = image.height();

            // Expand the face region to include the body
            int x = Math.max(0, faceRect.x - faceRect.width / 2);
            int y = Math.max(0, faceRect.y - faceRect.height / 2);
            int w = Math.min(width - x, faceRect.width * 3);
            int h = Math.min(height - y, faceRect.height * 4);

            rect = new Rect(x, y, w, h);
        } else {
            // If no faces detected, assume person is centered
            int margin = Math.min(image.width(), image.height()) / 8;
            rect = new Rect(
                    margin,
                    margin,
                    image.width() - 2 * margin,
                    image.height() - 2 * margin);
        }

        // Apply GrabCut algorithm
        Imgproc.grabCut(image, mask, rect, bgModel, fgModel, 5, Imgproc.GC_INIT_WITH_RECT);

        // Convert GrabCut result to binary mask
        Mat personMask = new Mat();
        Core.compare(mask, new Scalar(Imgproc.GC_PR_FGD), personMask, Core.CMP_EQ);

        // Cleanup and post-processing
        Mat kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, new Size(9, 9));
        Imgproc.morphologyEx(personMask, personMask, Imgproc.MORPH_CLOSE, kernel);
        Imgproc.GaussianBlur(personMask, personMask, new Size(11, 11), 0);
        Imgproc.threshold(personMask, personMask, 128, 255, Imgproc.THRESH_BINARY);

        // Clean up
        gray.release();
        bgModel.release();
        fgModel.release();
        mask.release();
        kernel.release();

        return personMask;
    }
}