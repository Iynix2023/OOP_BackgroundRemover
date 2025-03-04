package com.example.idphotoprocessor.repository;

import com.example.idphotoprocessor.model.ProcessedPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessedPhotoRepository extends JpaRepository<ProcessedPhoto, Long> {
    List<ProcessedPhoto> findAllByOrderByProcessedAtDesc();
}