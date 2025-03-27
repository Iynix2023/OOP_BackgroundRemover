package com.oop_project.photo_bg_remover.controller;

// import com.oop_project.photoidgenerator.dto.ConvertImageRequest;
// import com.oop_project.photoidgenerator.dto.ConvertImageResponse;
// import com.oop_project.photoidgenerator.service.GrabCutService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConvertImageController {

    // private final GrabCutService grabCutService;

    // public ConvertImageController(GrabCutService grabCutService) {
    //     this.grabCutService = grabCutService;
    // }

    @GetMapping("/")
    public String sayHello() {
        return "Hello I love OOP";
    }

    // @PostMapping("/convertImage")
    // public ResponseEntity<ConvertImageResponse> convertImage(@RequestBody ConvertImageRequest request) {
    //     // Process the image using the GrabCut service
    //     String processedImageData = grabCutService.processImage(request.getCroppedData(), request.getOutlineData());
    //     // Create the response DTO with the processed image data
    //     ConvertImageResponse response = new ConvertImageResponse(processedImageData);
    //     return new ResponseEntity<>(response, HttpStatus.OK);
    // }
}

