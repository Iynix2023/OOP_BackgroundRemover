# OOP_BackgroundRemover

A Java-based image processing system using OpenCV for background removal, batch processing, and automatic clothes replacement. Supports automated bulk processing and manual editing via GUI, ensuring high-quality ID photos with AI-powered segmentation and multi-threading for efficiency.

## Checklist of features
- [X] Photo upload and display  
- [X] Image Cropping and Resizing  
- [ ] Background Removal and Replacement (In progress) - (HY & KJ)
- [ ] Photo Export
- [X] GUI  
- [ ] Clothes Replacement
- [ ] Face Detection and Centering (In progress)
- [ ] Batch Processing (In progress) - (nisha)  
- [ ] Photo Enhancement (In progress) - (wenkang)
- [ ] Compliance Checker - (hong hai)
- [ ] Multiple Layout Options - (nisha)
- [ ] Size and Color Options - (complete rest first)
- [ ] Cloud Integration -  (hy)
- [X] History and Undo (done?)

Frontend:

1. Run react frontend server (port 5173)
```
cd frontend
npm install
npm run dev
```

Backend: 
1. Run springboot backend server (port 8080)
```
cd backend
mvnw package
mvnw spring-boot:run
```

To do:
Add GrabCut function to the backend and link frontend interaction with backend
