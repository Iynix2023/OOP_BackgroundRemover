package com.example.demo.service;


import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.opencv.global.opencv_core;
import org.bytedeco.opencv.global.opencv_imgcodecs;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.*;
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ComplianceCheckerService {

    private final CascadeClassifier faceDetector;

    public ComplianceCheckerService() {
        // String faceCascadePath = getClass().getClassLoader().getResource("static/haarcascade_frontalface_default.xml").getPath();

        String faceCascadePath = "src/main/resources/static/haarcascade_frontalface_default.xml"; // Put this in resources or absolute path
        faceDetector = new CascadeClassifier(faceCascadePath);
    }

    public Map<String, Object> analyzeCompliance(byte[] imageBytes) {
        Map<String, Object> result = new LinkedHashMap<>();
        Mat image = opencv_imgcodecs.imdecode(new Mat(new BytePointer(imageBytes)), opencv_imgcodecs.IMREAD_COLOR);

        RectVector faces = new RectVector();
        faceDetector.detectMultiScale(image, faces);

        if (faces.size() == 0) {
            result.put("faceDetected", false);
            result.put("compliant", false);
            return result;
        }

        Rect face = faces.get(0);
        int imgHeight = image.rows();
        int imgWidth = image.cols();
        int faceHeight = face.height();
        int faceCenterX = face.x() + face.width() / 2;

        // Criteria
        boolean faceDetected = true;
        boolean sizeOk = faceHeight > 0.5 * imgHeight && faceHeight < 0.9 * imgHeight;
        boolean centered = faceCenterX > 0.4 * imgWidth && faceCenterX < 0.6 * imgWidth;
        boolean uniformBg = isBackgroundUniform(image, face);

        System.out.println("Face height: " + faceHeight + ", Image height: " + imgHeight);
        System.out.println("Face % of image: " + (double) faceHeight / imgHeight);


        boolean compliant = faceDetected && sizeOk && centered && uniformBg;

        result.put("faceDetected", true);
        result.put("faceSizeOk", sizeOk);
        result.put("faceCentered", centered);
        result.put("uniformBackground", uniformBg);
        result.put("boundingBox", Map.of("x", face.x(), "y", face.y(), "width", face.width(), "height", face.height()));
        result.put("compliant", compliant);

        return result;
    }

    private boolean isBackgroundUniform(Mat image, Rect faceRect) {
        // Blur to reduce noise
        Mat blurred = new Mat();
        opencv_imgproc.GaussianBlur(image, blurred, new Size(5, 5), 0);

        // Crop out face region
        // opencv_imgproc.rectangle(blurred, faceRect, new Scalar(0, 0, 0, 0), opencv_imgproc.FILLED);  // Mask the face
        // Point topLeft = new Point(faceRect.x(), faceRect.y());
        // Point bottomRight = new Point(faceRect.x() + faceRect.width(), faceRect.y() + faceRect.height());
        // opencv_imgproc.rectangle(blurred, topLeft, bottomRight, new Scalar(0, 0, 0, 0), opencv_imgproc.FILLED);
        Point topLeft = new Point(faceRect.x(), faceRect.y());
        Point bottomRight = new Point(faceRect.x() + faceRect.width(), faceRect.y() + faceRect.height());
        opencv_imgproc.rectangle(blurred, topLeft, bottomRight, new Scalar(0, 0, 0, 0));


        // Reshape for clustering
        Mat reshaped = blurred.reshape(1, image.rows() * image.cols());
        Mat reshaped32F = new Mat();
        reshaped.convertTo(reshaped32F, opencv_core.CV_32F);

        // Run KMeans
        int clusterCount = 2;
        Mat labels = new Mat();
        TermCriteria criteria = new TermCriteria(TermCriteria.COUNT + TermCriteria.EPS, 10, 1.0);
        Mat centers = new Mat();
        opencv_core.kmeans(reshaped32F, clusterCount, labels, criteria, 3, opencv_core.KMEANS_PP_CENTERS, centers);

        return clusterCount == 2;
    }
}

