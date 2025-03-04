package com.example.idphotoprocessor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoProcessingRequest {
    private BackgroundOptions backgroundOptions;
    private ClothesOptions clothesOptions;
    private EnhanceOptions enhanceOptions;
    private CropOptions cropOptions;
    private ExportOptions exportOptions;
}