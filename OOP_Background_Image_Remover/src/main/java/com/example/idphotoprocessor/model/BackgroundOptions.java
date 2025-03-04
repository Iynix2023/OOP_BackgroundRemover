package com.example.idphotoprocessor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackgroundOptions {
    private BackgroundType type;
    private String value; // color code or image ID
    
    public enum BackgroundType {
        COLOR,
        IMAGE,
        TRANSPARENT
    }
}