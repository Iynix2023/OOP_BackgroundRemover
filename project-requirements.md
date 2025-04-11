## Project Functional Requirements

### Core Features (Mandatory):

1. **Photo Upload and Display:**
- Allow users to upload an image file (JPEG, PNG) from their local device.
- Display the uploaded image in the application for preview.

2. **Image Cropping and Resizing:**
- Provide tools for users to manually crop the image to fit standard ID photo dimensions (e.g., 
35mm x 45mm).
- Automatically resize the cropped image to the specified dimensions while maintaining 
aspect ratio.

3. **Background Removal and Replacement:**
- Implement a feature to remove the background of the uploaded photo automatically.
- Allow users to replace the background with a solid color (e.g., white, blue) or a custom 
image uploaded by the user.
- This function should be either automatic or semi-automatic (interactive) or both modes are 
implemented. Algorithms like graph-cut, grab-cut can be explored. Semi-automatic mode
does not mean user clicks pixel by pixel, but user provides some hints or supervision to 
facilitate the background detection. For example, user click a region to indicate where 
background is and where is foreground, then the algorithm is able to automatically segment
out the background. For total automatic mode, face detection may be needed to 
automatically locate the foreground and background. 

4. **Photo Export:**
- Allow users to save the processed ID photo in standard formats (e.g., JPEG, PNG) with high 
resolution.
- Include options for naming and specifying the output folder.

5. **Graphical User Interface (GUI):**
- Develop a user-friendly and intuitive interface using the libs or frameworks you are 
proficient in (e.g. Swing or Spring boot).
- Provide clear buttons and menus for each feature (e.g., Upload, Crop, Remove Background, 
Export, interactions and so on).

## Optional Features (Bonus) include but not limited to:
1. **Clothes Replacement:**
- Automatically replace the subject’s clothes with a predefined template (e.g., formal attire).

2. **Face Detection and Centering:**
- Detect the face in the uploaded image and ensure it is centered and aligned correctly.

3. **Batch Processing:**
- Allow users to upload multiple images and process them simultaneously.

4. **Photo Enhancement:**
- Add features for brightness, contrast adjustment, and skin smoothing.

5. **Compliance Checker:**
- Validate the image against standard ID photo guidelines (e.g., face position, background 
color).

6. **Multiple Layout Options:**
- Provide options to generate a sheet of multiple ID photos in different sizes (e.g., 2x2, 4x6).

7. **Size and Color Options:**
- Provide options to generate ID photo in different sizes based on different scenarios (e.g. 
different countries may have different background color and size requirements).

8. **Cloud Integration:**
Allow users to save or fetch photos from cloud storage platforms (e.g., Google Drive, 
Dropbox).

9. **History and Undo:**
- Provide Maintain a history of user actions and provide undo/redo functionality