// package com.oop_project.photo_bg_remover.service;

// import com.oop_project.photo_bg_remover.ExportOptions;
// import org.opencv.core.*;
// import org.opencv.imgcodecs.Imgcodecs;
// import org.opencv.imgproc.Imgproc;
// import org.springframework.stereotype.Service;

// import java.util.Base64;

// @Service
// public class SheetGeneratorService {

//     /**
//      * Generates a sheet of ID photos with the specified layout
//      * 
//      * @param imageData Base64 encoded image data
//      * @param exportOptions Export options containing format, size, and layout
//      * @return Base64 encoded image data of the generated sheet
//      */
//     public String generatePhotoSheet(String imageData, ExportOptions exportOptions) {
//         try {
//             // Decode base64 image
//             String base64Image = imageData.split(",")[1];
//             byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            
//             // Read the image using OpenCV
//             Mat originalImage = Imgcodecs.imdecode(new MatOfByte(imageBytes), Imgcodecs.IMREAD_UNCHANGED);
//             Mat result;
            
//             // Generate sheet based on layout
//             switch (exportOptions.getLayout()) {
//                 case GRID_2x2:
//                     result = createPhotoGrid(originalImage, 2, 2, exportOptions.getSize());
//                     break;
//                 case GRID_4x6:
//                     result = createPhotoGrid(originalImage, 4, 6, exportOptions.getSize());
//                     break;
//                 case SINGLE:
//                 default:
//                     // For single photo, just resize according to the specified size
//                     result = resizeImageToStandardSize(originalImage, exportOptions.getSize());
//                     break;
//             }
            
//             // Encode the result image as base64
//             MatOfByte matOfByte = new MatOfByte();
//             String formatExt = exportOptions.getFormat() == ExportOptions.ExportFormat.JPEG ? ".jpg" : ".png";
//             Imgcodecs.imencode(formatExt, result, matOfByte);
            
//             String formatMime = exportOptions.getFormat() == ExportOptions.ExportFormat.JPEG ? "image/jpeg" : "image/png";
//             return "data:" + formatMime + ";base64," + Base64.getEncoder().encodeToString(matOfByte.toArray());
            
//         } catch (Exception e) {
//             System.err.println("Error generating photo sheet: " + e.getMessage());
//             throw new RuntimeException("Failed to generate photo sheet: " + e.getMessage());
//         }
//     }

package com.oop_project.photo_bg_remover.service;

import com.oop_project.photo_bg_remover.ExportOptions;
import org.springframework.stereotype.Service;

@Service
public class SheetGeneratorService {

    /**
     * Generates a sheet of ID photos with the specified layout
     * 
     * @param imageData Base64 encoded image data
     * @param exportOptions Export options containing format, size, and layout
     * @return Base64 encoded image data of the generated sheet
     */
    public String generatePhotoSheet(String imageData, ExportOptions exportOptions) {
        try {
            // For now, just return the original image (mock implementation)
            System.out.println("Generating sheet with layout: " + exportOptions.getLayout());
            
            // In a real implementation, we would process the image with OpenCV
            // For now, just return the original image
            return imageData;
            
        } catch (Exception e) {
            System.err.println("Error generating photo sheet: " + e.getMessage());
            throw new RuntimeException("Failed to generate photo sheet: " + e.getMessage());
        }
    }
}

    
//     /**
//      * Creates a grid of photos with the specified dimensions
//      * 
//      * @param image The source image
//      * @param rows Number of rows in the grid
//      * @param cols Number of columns in the grid
//      * @param sizeType The standard size type of each photo in the grid
//      * @return Mat object with the photo grid
//      */
//     private Mat createPhotoGrid(Mat image, int rows, int cols, ExportOptions.ExportSize sizeType) {
//         // Get the dimensions for a single photo based on the requested size
//         Size photoSize = getPhotoSizeInPixels(sizeType);
//         double photoWidth = photoSize.width;
//         double photoHeight = photoSize.height;
        
//         // Resize the source image to match the standard dimensions
//         Mat resizedPhoto = new Mat();
//         Imgproc.resize(image, resizedPhoto, photoSize);
        
//         // Calculate the dimensions of the sheet
//         int padding = 20; // Padding between photos
//         int borderWidth = 30; // Border around the entire sheet
        
//         int sheetWidth = borderWidth * 2 + (int)(cols * photoWidth) + (cols - 1) * padding;
//         int sheetHeight = borderWidth * 2 + (int)(rows * photoHeight) + (rows - 1) * padding;
        
//         // Create a white sheet
//         Mat sheet = new Mat(sheetHeight, sheetWidth, CvType.CV_8UC4, new Scalar(255, 255, 255, 255));
        
//         // Place photos on the sheet
//         for (int row = 0; row < rows; row++) {
//             for (int col = 0; col < cols; col++) {
//                 int x = borderWidth + col * (int)(photoWidth + padding);
//                 int y = borderWidth + row * (int)(photoHeight + padding);
                
//                 Rect roi = new Rect(x, y, (int)photoWidth, (int)photoHeight);
//                 Mat submat = sheet.submat(roi);
//                 resizedPhoto.copyTo(submat);
//             }
//         }
        
//         return sheet;
//     }
    
//     /**
//      * Resizes the image to the standard ID photo size
//      * 
//      * @param image The source image
//      * @param sizeType The standard size type
//      * @return Mat object with the resized image
//      */
//     private Mat resizeImageToStandardSize(Mat image, ExportOptions.ExportSize sizeType) {
//         Size targetSize = getPhotoSizeInPixels(sizeType);
//         Mat resizedImage = new Mat();
//         Imgproc.resize(image, resizedImage, targetSize);
//         return resizedImage;
//     }
    
//     /**
//      * Converts standard ID photo sizes to pixel dimensions
//      * 
//      * @param sizeType The standard size type
//      * @return Size object with width and height in pixels
//      */
//     private Size getPhotoSizeInPixels(ExportOptions.ExportSize sizeType) {
//         // Standard sizes with 300 DPI resolution
//         switch (sizeType) {
//             case US_PASSPORT_2x2:
//                 // 2x2 inches at 300 DPI = 600x600 pixels
//                 return new Size(600, 600);
//             case CUSTOM:
//                 // Default to 35x45mm if custom is selected but no custom size is provided
//                 // This would be replaced with actual custom dimensions in a real implementation
//                 return new Size(413, 531);
//             case STANDARD_35x45:
//             default:
//                 // 35x45mm at 300 DPI = 413x531 pixels
//                 // (35mm = 1.38 inches, 45mm = 1.77 inches)
//                 return new Size(413, 531);
//         }
//     }
// }