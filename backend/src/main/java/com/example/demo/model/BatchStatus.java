package com.example.demo.model;

import java.util.ArrayList;
import java.util.List;

public class BatchStatus {
    private String batchId;
    private int totalImages;
    private int processedCount;
    private boolean completed;
    private List<ImageInfo> images = new ArrayList<>();

    public void incrementProcessed() {
        this.processedCount++;
        if (this.processedCount >= this.totalImages) {
            this.completed = true;
        }
    }

    // Getters and setters
    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public int getTotalImages() {
        return totalImages;
    }

    public void setTotalImages(int totalImages) {
        this.totalImages = totalImages;
    }

    public int getProcessedCount() {
        return processedCount;
    }

    public void setProcessedCount(int processedCount) {
        this.processedCount = processedCount;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public List<ImageInfo> getImages() {
        return images;
    }

    public void setImages(List<ImageInfo> images) {
        this.images = images;
    }
}