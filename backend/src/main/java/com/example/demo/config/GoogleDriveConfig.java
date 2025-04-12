package com.example.demo.config;

import java.io.IOException;
import java.io.InputStreamReader;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.MemoryDataStoreFactory;
import com.google.api.services.drive.DriveScopes;

@Configuration
public class GoogleDriveConfig {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE_FILE);
    private static final String CREDENTIALS_FILE_PATH = "/client_secret_234456574785-cijseqe5ednoo9eociidjos3neptjduu.apps.googleusercontent.com (3).json";


    /**
     * This bean is used by your GoogleDriveController to start the OAuth flow.
     */
    @Bean
    public GoogleAuthorizationCodeFlow authorizationCodeFlow() throws IOException, GeneralSecurityException {
        final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                JSON_FACTORY,
                new InputStreamReader(new ClassPathResource(CREDENTIALS_FILE_PATH).getInputStream())
        );

        return new GoogleAuthorizationCodeFlow.Builder(
                httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
                .setAccessType("offline")
                .setDataStoreFactory(new MemoryDataStoreFactory()) // In-memory for dev
                .build();
    }

    /**
     * This bean is injected into GoogleDriveService for direct uploads.
     * It uses pre-authorized credentials for non-OAuth (server-side) use cases.
     */
    // @Bean
    // public Drive driveService(GoogleAuthorizationCodeFlow flow) throws IOException, GeneralSecurityException {
    //     final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

    //     // This assumes you’ve already authorized the user once, or you handle that externally
    //     var credential = flow.loadCredential("user"); // "user" is an identifier

    //     if (credential == null) {
    //         throw new IllegalStateException("No stored credentials found. Please authorize first.");
    //     }

    //     return new Drive.Builder(httpTransport, JSON_FACTORY, credential)
    //             .setApplicationName("Google Drive API Spring Boot")
    //             .build();
    // }
}


// package com.example.demo.config;

// import java.io.IOException;
// import java.io.InputStreamReader;
// import java.security.GeneralSecurityException;
// import java.util.Collections;
// import java.util.List;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.core.io.ClassPathResource;

// import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
// import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
// import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
// import com.google.api.client.http.javanet.NetHttpTransport;
// import com.google.api.client.json.JsonFactory;
// import com.google.api.client.json.gson.GsonFactory;
// import com.google.api.client.util.store.MemoryDataStoreFactory;
// import com.google.api.services.drive.DriveScopes;



// @Configuration
// public class GoogleDriveConfig {

//     private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
//     private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE_FILE);
//     private static final String CREDENTIALS_FILE_PATH = "/credentials.json";

//     @Bean
//     public GoogleAuthorizationCodeFlow authorizationCodeFlow() throws IOException, GeneralSecurityException {
//         final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

//         GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
//                 JSON_FACTORY, new InputStreamReader(new ClassPathResource(CREDENTIALS_FILE_PATH).getInputStream()));

//         return new GoogleAuthorizationCodeFlow.Builder(
//                 httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
//                 .setAccessType("offline")
//                 .setDataStoreFactory(new MemoryDataStoreFactory()) // tokens kept in memory for now
//                 .build();
//     }
// }



// package com.example.demo.config;

// import java.io.FileNotFoundException;
// import java.io.IOException;
// import java.io.InputStream;
// import java.io.InputStreamReader;
// import java.security.GeneralSecurityException;
// import java.util.Collections;
// import java.util.List;

// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.core.io.ClassPathResource;
// import org.springframework.core.io.Resource;

// import com.google.api.client.auth.oauth2.Credential;
// import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
// import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
// import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
// import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
// import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
// import com.google.api.client.http.javanet.NetHttpTransport;
// import com.google.api.client.json.JsonFactory;
// import com.google.api.client.json.gson.GsonFactory;
// import com.google.api.client.util.store.MemoryDataStoreFactory;
// import com.google.api.services.drive.Drive;
// import com.google.api.services.drive.DriveScopes;

// @Configuration
// public class GoogleDriveConfig {

//     private static final Logger log = LoggerFactory.getLogger(GoogleDriveConfig.class);
//     private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
//     private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE_FILE);
//     private static final String CREDENTIALS_FILE_PATH = "/credentials.json";
    
//     @Value("${google.application-name:Google Drive API Spring Boot}")
//     private String applicationName;
    
//     @Value("${google.credentials-folder:tokens}")
//     private String tokensDirectoryPath;

//     /**
//      * Creates an authorized Credential object.
//      * 
//      * @param httpTransport The network HTTP Transport.
//      * @return An authorized Credential object.
//      * @throws IOException If the credentials.json file cannot be found.
//      */
//     private Credential getCredentials(final NetHttpTransport httpTransport) throws IOException {
//         // Load client secrets.
//         Resource resource = new ClassPathResource(CREDENTIALS_FILE_PATH);
//         if (!resource.exists()) {
//             log.warn("Credentials file not found: {}. Please create this file with your Google API credentials.", CREDENTIALS_FILE_PATH);
//             throw new FileNotFoundException("Resource not found: " + CREDENTIALS_FILE_PATH + 
//                 ". Please rename credentials-example.json to credentials.json and add your Google API credentials.");
//         }
//         InputStream in = resource.getInputStream();
//         GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

//         // Build flow and trigger user authorization request.
//         // GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
//         //         httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
//         //         .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(tokensDirectoryPath)))
//         //         .setAccessType("offline")
//         //         .build();

//         GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
//                 httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
//                 .setDataStoreFactory(new MemoryDataStoreFactory()) // Prevents saving tokens
//                 .setAccessType("offline")
//                 .setApprovalPrompt("force") // Forces user approval every time
//                 .build();
//         LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
//         return new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
//     }

//     @Bean
//     public Drive driveService() throws GeneralSecurityException, IOException {
//         try {
//             final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
//             return new Drive.Builder(httpTransport, JSON_FACTORY, getCredentials(httpTransport))
//                     .setApplicationName(applicationName)
//                     .build();
//         } catch (IOException e) {
//             log.error("Failed to initialize Google Drive service: {}", e.getMessage());
//             // Rethrow the exception with a more helpful message
//             throw new IOException("Failed to initialize Google Drive service. Please ensure you have placed valid credentials.json in src/main/resources/. " + e.getMessage(), e);
//         }
//     }
// }
