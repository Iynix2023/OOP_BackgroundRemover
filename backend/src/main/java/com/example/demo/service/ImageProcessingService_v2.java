package com.example.demo.service;

// Packages for deep learning model
import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.modality.cv.output.CategoryMask;
import ai.djl.modality.cv.translator.SemanticSegmentationTranslatorFactory;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import ai.djl.translate.TranslateException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

// Conversion of image and input output
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;

// BG Image Generation
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

@Service
public class ImageProcessingService_v2 {

    /**
     * Removes the background from the input image by performing semantic
     * segmentation
     * using DeepLabV3. It extracts the foreground for the target category (15),
     * resizes it to the original image dimensions, and composites it onto a new
     * light blue background.
     *
     * @param file the uploaded image file
     * @return a byte array containing the composited JPEG image
     * @throws IOException if processing fails
     */
    public byte[] removeBackground(MultipartFile file) throws IOException {
        // Convert the uploaded file to a DJL Image
        Image img = ImageFactory.getInstance().fromInputStream(file.getInputStream());

        // URL of the pre-trained DeepLabV3 model packaged as a zip file
        String url = "djl://ai.djl.pytorch/deeplabv3/0.0.1/deeplabv3";

        // Build the criteria to load the model with the semantic segmentation
        // translator
        Criteria<Image, CategoryMask> criteria = Criteria.builder()
                .setTypes(Image.class, CategoryMask.class)
                .optModelUrls(url)
                .optTranslatorFactory(new SemanticSegmentationTranslatorFactory())
                .optEngine("PyTorch")
                .optProgress(new ProgressBar())
                .build();

        try (ZooModel<Image, CategoryMask> model = criteria.loadModel();
                Predictor<Image, CategoryMask> predictor = model.newPredictor()) {

            // Predict the segmentation mask
            CategoryMask mask = predictor.predict(img);
            // System.out.println("Mask prediction complete. Categories found: " + mask.toJson());

            Image personMaskImage = mask.getMaskImage(img, 15);

            // Resize the extracted person image to match the original dimensions
            personMaskImage = personMaskImage.resize(img.getWidth(), img.getHeight(), true);

            // Create a background Image with static color
            // Create a new background image with the same dimensions as the original image
            BufferedImage bgBufferedImage = new BufferedImage(
                img.getWidth(), 
                img.getHeight(), 
                BufferedImage.TYPE_INT_ARGB
            );
            Graphics2D g2d = bgBufferedImage.createGraphics();
            // Set the color to light blue (RGB: 173, 216, 230) and fill the background
            g2d.setColor(new Color(173, 216, 230));
            g2d.fillRect(0, 0, img.getWidth(), img.getHeight());
            g2d.dispose();

            // Convert the BufferedImage to a DJL Image
            Image background = ImageFactory.getInstance().fromImage(bgBufferedImage);

            // Get the background
            // Image background = ImageFactory.getInstance().fromFile(Paths.get(
            //         "C:\\Users\\limke_msg9rxa\\Downloads\\Coding_Projects\\Java_Projects\\demo\\src\\main\\resources\\image\\lightblue.png"));

            // Now draw the extracted person with transparency onto the background
            background.drawImage(personMaskImage, true);

            // Save the final composited image
            // try (FileOutputStream fos = new FileOutputStream("debug_final_result.png")) {
            //     background.save(fos, "png");
            //     System.out.println("Saved final composited image to debug_final_result.png");
            // }

            // Convert the final composited image to a byte array in JPEG format.
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            background.save(baos, "png");
            return baos.toByteArray();

        } catch (ModelException | TranslateException e) {
            throw new IOException("Error processing image", e);
        }
    }
}
