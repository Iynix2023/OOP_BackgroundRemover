package com.example.idphotoprocessor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClothesOptions {
    private ClothesType type;
    private String color;
    
    public enum ClothesType {
        SUIT,
        SHIRT,
        BLOUSE,
        DRESS,
        NONE
    }
}