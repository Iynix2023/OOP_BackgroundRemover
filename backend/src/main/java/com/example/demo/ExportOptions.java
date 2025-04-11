package com.example.demo;
 
public class ExportOptions {
    private ExportFormat format;
    private ExportSize size;
    private ExportLayout layout;
    private Integer customWidth;
    private Integer customHeight;
    
    // Default constructor
    public ExportOptions() {
    }
    
    // Constructor with all fields
    public ExportOptions(ExportFormat format, ExportSize size, ExportLayout layout) {
        this.format = format;
        this.size = size;
        this.layout = layout;
    }
    
    // Constructor with custom dimensions
    public ExportOptions(ExportFormat format, ExportSize size, ExportLayout layout, Integer customWidth, Integer customHeight) {
        this.format = format;
        this.size = size;
        this.layout = layout;
        this.customWidth = customWidth;
        this.customHeight = customHeight;
    }
    
    // Getters and setters
    public ExportFormat getFormat() {
        return format;
    }
    
    public void setFormat(ExportFormat format) {
        this.format = format;
    }
    
    public ExportSize getSize() {
        return size;
    }
    
    public void setSize(ExportSize size) {
        this.size = size;
    }
    
    public ExportLayout getLayout() {
        return layout;
    }
    
    public void setLayout(ExportLayout layout) {
        this.layout = layout;
    }
    
    public Integer getCustomWidth() {
        return customWidth;
    }
    
    public void setCustomWidth(Integer customWidth) {
        this.customWidth = customWidth;
    }
    
    public Integer getCustomHeight() {
        return customHeight;
    }
    
    public void setCustomHeight(Integer customHeight) {
        this.customHeight = customHeight;
    }
    
    public enum ExportFormat {
        JPEG,
        PNG
    }
    
    public enum ExportSize {
        STANDARD_35x45,      // Singapore NRIC/Passport (35x45mm)
        US_PASSPORT_2x2,     // US Passport/Visa (2x2 inch)
        CHINA_VISA,          // China Visa (33x48mm)
        MALAYSIA_PASSPORT,   // Malaysia Visa/Passport (35x50mm)
        AUSTRALIA_VISA,      // Australia Visa (35x45mm)
        INDIA_PASSPORT,      // Indian Passport/Visa (35x35mm)
        SMU_ID,              // SMU Student ID
        CUSTOM               // Custom size
    }
    
    public enum ExportLayout {
        SINGLE,
        GRID_2x2,
        GRID_4x6
    }
}