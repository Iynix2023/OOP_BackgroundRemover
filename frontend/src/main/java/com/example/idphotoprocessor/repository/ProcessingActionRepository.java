package com.example.idphotoprocessor.repository;

import com.example.idphotoprocessor.model.ProcessingAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessingActionRepository extends JpaRepository<ProcessingAction, Long> {
    List<ProcessingAction> findByProcessedPhotoIdOrderByTimestampAsc(Long photoId);
}