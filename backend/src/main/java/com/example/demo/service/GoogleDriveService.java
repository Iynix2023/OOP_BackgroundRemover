// package com.example.demo.service;

// import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
// import com.google.api.client.googleapis.auth.oauth2.Credential;
// import com.google.api.client.http.InputStreamContent;
// import com.google.api.client.json.gson.GsonFactory;
// import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
// import com.google.api.services.drive.Drive;
// import com.google.api.services.drive.model.File;
// import com.google.api.services.drive.model.FileList;

// import lombok.extern.slf4j.Slf4j;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// import java.io.ByteArrayInputStream;
// import java.io.ByteArrayOutputStream;
// import java.io.IOException;
// import java.security.GeneralSecurityException;
// import java.util.Collections;
// import java.util.List;

// import com.google.api.client.auth.oauth2.Credential;


// @Service
// @Slf4j
// public class GoogleDriveService {

//     private final GoogleAuthorizationCodeFlow flow;

//     public GoogleDriveService(GoogleAuthorizationCodeFlow flow) {
//         this.flow = flow;
//     }

//     private Drive getDriveForUser(String userId) throws GeneralSecurityException, IOException {
//         Credential credential = flow.loadCredential(userId);
//         if (credential == null) {
//             throw new IllegalStateException("User has not authorized the application.");
//         }

//         return new Drive.Builder(
//                 GoogleNetHttpTransport.newTrustedTransport(),
//                 GsonFactory.getDefaultInstance(),
//                 credential
//         ).setApplicationName("Google Drive API Spring Boot").build();
//     }

//     public List<File> listImages(String userId) throws Exception {
//         Drive drive = getDriveForUser(userId);
//         FileList result = drive.files().list()
//                 .setQ("mimeType contains 'image/' and trashed = false")
//                 .setFields("files(id, name, mimeType, thumbnailLink, webViewLink)")
//                 .execute();

//         return result.getFiles();
//     }

//     public byte[] downloadFile(String userId, String fileId) throws Exception {
//         Drive drive = getDriveForUser(userId);
//         ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
//         drive.files().get(fileId).executeMediaAndDownloadTo(outputStream);
//         return outputStream.toByteArray();
//     }

//     public String uploadFile(String userId, MultipartFile file, String description) throws Exception {
//         Drive drive = getDriveForUser(userId);
//         if (file.isEmpty()) {
//             throw new IOException("File is empty");
//         }

//         File metadata = new File();
//         metadata.setName(file.getOriginalFilename());
//         metadata.setDescription(description);

//         InputStreamContent content = new InputStreamContent(
//                 file.getContentType(),
//                 new ByteArrayInputStream(file.getBytes())
//         );

//         File uploaded = drive.files().create(metadata, content)
//                 .setFields("id")
//                 .execute();

//         return uploaded.getId();
//     }

//     public String uploadFileToFolder(String userId, String folderId, MultipartFile file) throws Exception {
//         Drive drive = getDriveForUser(userId);
//         File metadata = new File();
//         metadata.setName(file.getOriginalFilename());
//         metadata.setParents(Collections.singletonList(folderId));

//         InputStreamContent content = new InputStreamContent(
//                 file.getContentType(),
//                 new ByteArrayInputStream(file.getBytes())
//         );

//         File uploaded = drive.files().create(metadata, content)
//                 .setFields("id")
//                 .execute();

//         return uploaded.getId();
//     }

//     public String updateFile(String userId, String fileId, byte[] content, String mimeType) throws Exception {
//         Drive drive = getDriveForUser(userId);
//         InputStreamContent mediaContent = new InputStreamContent(mimeType, new ByteArrayInputStream(content));
//         File updated = drive.files().update(fileId, null, mediaContent).execute();
//         return updated.getId();
//     }

//     public String createFolder(String userId, String name) throws Exception {
//         Drive drive = getDriveForUser(userId);
//         File metadata = new File();
//         metadata.setName(name);
//         metadata.setMimeType("application/vnd.google-apps.folder");

//         File folder = drive.files().create(metadata)
//                 .setFields("id")
//                 .execute();

//         return folder.getId();
//     }
// }

package com.example.demo.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GoogleDriveService {

    private final GoogleAuthorizationCodeFlow flow;

    public GoogleDriveService(GoogleAuthorizationCodeFlow flow) {
        this.flow = flow;
    }

    public Drive getDriveForUser(String userId) throws Exception {
        var credential = flow.loadCredential(userId);
        if (credential == null) {
            throw new IllegalStateException("User has not authorized the application.");
        }

        return new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                credential
        ).setApplicationName("Google Drive API Spring Boot").build();
    }

    public List<File> listImages() throws IOException {
        try {
            Drive driveService = getDriveForUser("user");
            FileList result = driveService.files().list()
                    .setQ("mimeType contains 'image/' and trashed = false")
                    .setSpaces("drive")
                    .setFields("files(id, name, mimeType, thumbnailLink, webViewLink)")
                    .execute();
            return result.getFiles();
        } catch (Exception e) {
            throw new IOException("Failed to list images: " + e.getMessage(), e);
        }
    }

    public byte[] downloadFile(String fileId) throws IOException {
        try {
            Drive driveService = getDriveForUser("user");
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            driveService.files().get(fileId).executeMediaAndDownloadTo(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IOException("Failed to download file: " + e.getMessage(), e);
        }
    }

    public String uploadFile(MultipartFile file, String description) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }
        try {
            Drive driveService = getDriveForUser("user");
            File fileMetadata = new File();
            fileMetadata.setName(file.getOriginalFilename());
            fileMetadata.setDescription(description);

            InputStreamContent mediaContent = new InputStreamContent(
                    file.getContentType(),
                    new ByteArrayInputStream(file.getBytes()));

            File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                    .setFields("id")
                    .execute();

            return uploadedFile.getId();
        } catch (Exception e) {
            throw new IOException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    public String updateFile(String fileId, byte[] newContent, String mimeType) throws IOException {
        try {
            Drive driveService = getDriveForUser("user");
            InputStreamContent mediaContent = new InputStreamContent(
                    mimeType,
                    new ByteArrayInputStream(newContent));

            File updatedFile = driveService.files().update(fileId, null, mediaContent)
                    .execute();

            return updatedFile.getId();
        } catch (Exception e) {
            throw new IOException("Failed to update file: " + e.getMessage(), e);
        }
    }

    public String createFolder(String folderName) throws IOException {
        try {
            Drive driveService = getDriveForUser("user");
            File fileMetadata = new File();
            fileMetadata.setName(folderName);
            fileMetadata.setMimeType("application/vnd.google-apps.folder");

            File folder = driveService.files().create(fileMetadata)
                    .setFields("id")
                    .execute();

            return folder.getId();
        } catch (Exception e) {
            throw new IOException("Failed to create folder: " + e.getMessage(), e);
        }
    }

    public String uploadFileToFolder(String folderId, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }
        try {
            Drive driveService = getDriveForUser("user");
            File fileMetadata = new File();
            fileMetadata.setName(file.getOriginalFilename());
            fileMetadata.setParents(Collections.singletonList(folderId));

            InputStreamContent mediaContent = new InputStreamContent(
                    file.getContentType(),
                    new ByteArrayInputStream(file.getBytes()));

            File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                    .setFields("id")
                    .execute();

            return uploadedFile.getId();
        } catch (Exception e) {
            throw new IOException("Failed to upload file to folder: " + e.getMessage(), e);
        }
    }

    // public Drive getDriveForUser(String userId) throws Exception {
    //     return getDriveForUser(userId);
    // }
}



// package com.example.demo.service;

// import java.io.ByteArrayInputStream;
// import java.io.ByteArrayOutputStream;
// import java.io.IOException;
// import java.util.Collections;
// import java.util.List;

// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// import com.google.api.client.http.InputStreamContent;
// import com.google.api.services.drive.Drive;
// import com.google.api.services.drive.model.File;
// import com.google.api.services.drive.model.FileList;

// import lombok.extern.slf4j.Slf4j;

// @Service
// @Slf4j
// public class GoogleDriveService {

//     public final Drive driveService;

//     public GoogleDriveService(Drive driveService) {
//         this.driveService = driveService;
//     }

//     /**
//      * Lists files from Google Drive (only images).
//      * 
//      * @return List of File objects
//      * @throws IOException If the API request fails
//      */
//     public List<File> listImages() throws IOException {
//         String mimeTypes = "image/jpeg OR image/png OR image/jpg OR image/gif";
        
//         FileList result = driveService.files().list()
//                 .setQ("mimeType contains 'image/' and trashed = false")
//                 .setSpaces("drive")
//                 .setFields("files(id, name, mimeType, thumbnailLink, webViewLink)")
//                 .execute();
        
//         return result.getFiles();
//     }

//     /**
//      * Downloads a file from Google Drive by its ID.
//      * 
//      * @param fileId The ID of the file to download
//      * @return The file as a byte array
//      * @throws IOException If the API request fails
//      */
//     public byte[] downloadFile(String fileId) throws IOException {
//         ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
//         driveService.files().get(fileId)
//                 .executeMediaAndDownloadTo(outputStream);
        
//         return outputStream.toByteArray();
//     }

//     /**
//      * Uploads a file to Google Drive.
//      * 
//      * @param file The file to upload
//      * @param description A description of the file
//      * @return The ID of the uploaded file
//      * @throws IOException If the API request fails
//      */
//     public String uploadFile(MultipartFile file, String description) throws IOException {
//         if (file.isEmpty()) {
//             throw new IOException("File is empty");
//         }
        
//         File fileMetadata = new File();
//         fileMetadata.setName(file.getOriginalFilename());
//         fileMetadata.setDescription(description);
        
//         InputStreamContent mediaContent = new InputStreamContent(
//                 file.getContentType(),
//                 new ByteArrayInputStream(file.getBytes())
//         );
        
//         File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
//                 .setFields("id")
//                 .execute();
        
//         return uploadedFile.getId();
//     }

//     /**
//      * Updates an existing file in Google Drive.
//      * 
//      * @param fileId The ID of the file to update
//      * @param newContent The new content of the file
//      * @param mimeType The MIME type of the new content
//      * @return The ID of the updated file
//      * @throws IOException If the API request fails
//      */
//     public String updateFile(String fileId, byte[] newContent, String mimeType) throws IOException {
//         InputStreamContent mediaContent = new InputStreamContent(
//                 mimeType,
//                 new ByteArrayInputStream(newContent)
//         );
        
//         File updatedFile = driveService.files().update(fileId, null, mediaContent)
//                 .execute();
        
//         return updatedFile.getId();
//     }

//     /**
//      * Creates a new folder in Google Drive.
//      * 
//      * @param folderName The name of the folder to create
//      * @return The ID of the created folder
//      * @throws IOException If the API request fails
//      */
//     public String createFolder(String folderName) throws IOException {
//         File fileMetadata = new File();
//         fileMetadata.setName(folderName);
//         fileMetadata.setMimeType("application/vnd.google-apps.folder");
        
//         File folder = driveService.files().create(fileMetadata)
//                 .setFields("id")
//                 .execute();
        
//         return folder.getId();
//     }

//     /**
//      * Uploads a file to a specific folder in Google Drive.
//      * 
//      * @param folderId The ID of the folder
//      * @param file The file to upload
//      * @return The ID of the uploaded file
//      * @throws IOException If the API request fails
//      */
//     public String uploadFileToFolder(String folderId, MultipartFile file) throws IOException {
//         if (file.isEmpty()) {
//             throw new IOException("File is empty");
//         }
        
//         File fileMetadata = new File();
//         fileMetadata.setName(file.getOriginalFilename());
//         fileMetadata.setParents(Collections.singletonList(folderId));
        
//         InputStreamContent mediaContent = new InputStreamContent(
//                 file.getContentType(),
//                 new ByteArrayInputStream(file.getBytes())
//         );
        
//         File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
//                 .setFields("id")
//                 .execute();
        
//         return uploadedFile.getId();
//     }
// }