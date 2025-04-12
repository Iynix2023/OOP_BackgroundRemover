package com.example.demo.model;

public class ProcessedImage {
    private int index;
    private String originalName;
    private byte[] originalImage;
    private byte[] processedImage;
    private String status;
    private String error;
    private ExportOptions.ExportFormat format; // Image format (JPEG, PNG)

    // Getters and setters
    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public byte[] getOriginalImage() {
        return originalImage;
    }

    public void setOriginalImage(byte[] originalImage) {
        this.originalImage = originalImage;
    }

    public byte[] getProcessedImage() {
        return processedImage;
    }

    public void setProcessedImage(byte[] processedImage) {
        this.processedImage = processedImage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public ExportOptions.ExportFormat getFormat() {
        return format;
    }

    public void setFormat(ExportOptions.ExportFormat format) {
        this.format = format;
    }
}
