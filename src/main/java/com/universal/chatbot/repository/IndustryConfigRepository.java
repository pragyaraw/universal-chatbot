package com.universal.chatbot.repository;

import com.universal.chatbot.model.IndustryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface IndustryConfigRepository extends JpaRepository<IndustryConfig, Long> {

    Optional<IndustryConfig> findByIndustryId(String industryId);

    List<IndustryConfig> findByIsActiveTrue();
}