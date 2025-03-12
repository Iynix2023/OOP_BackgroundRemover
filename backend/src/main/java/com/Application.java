package com;

import com.idphoto.processor.BatchProcessingApplication;

import org.apache.catalina.core.ApplicationSessionCookieConfig;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
    @Bean  
    CommandLineRunner run(BatchProcessingApplication batchProcessor) {
        return args -> {
            
        };
    }
}
