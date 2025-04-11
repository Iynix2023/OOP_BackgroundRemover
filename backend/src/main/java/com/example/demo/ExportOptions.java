// package com.example.demo;

// public class ExportOptions {
//     private ExportFormat format;
//     private ExportSize size;
//     private ExportLayout layout;
    
//     // Default constructor
//     public ExportOptions() {
//     }
    
//     // Constructor with all fields
//     public ExportOptions(ExportFormat format, ExportSize size, ExportLayout layout) {
//         this.format = format;
//         this.size = size;
//         this.layout = layout;
//     }
    
//     // Getters and setters
//     public ExportFormat getFormat() {
//         return format;
//     }
    
//     public void setFormat(ExportFormat format) {
//         this.format = format;
//     }
    
//     public ExportSize getSize() {
//         return size;
//     }
    
//     public void setSize(ExportSize size) {
//         this.size = size;
//     }
    
//     public ExportLayout getLayout() {
//         return layout;
//     }
    
//     public void setLayout(ExportLayout layout) {
//         this.layout = layout;
//     }
    
//     public enum ExportFormat {
//         JPEG,
//         PNG
//     }
    
//     public enum ExportSize {
//         STANDARD_35x45,
//         US_PASSPORT_2x2,
//         CUSTOM
//     }
    
//     public enum ExportLayout {
//         SINGLE,
//         GRID_2x2,
//         GRID_4x6
//     }
// }