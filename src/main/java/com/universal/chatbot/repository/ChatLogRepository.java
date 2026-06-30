package com.universal.chatbot.repository;

import com.universal.chatbot.model.ChatLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatLogRepository extends JpaRepository<ChatLog, Long> {

    List<ChatLog> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    List<ChatLog> findByIndustryIdAndCreatedAtBetween(
            String industryId, LocalDateTime start, LocalDateTime end);

    long countByEscalatedTrue();

    List<ChatLog> findTop50ByOrderByCreatedAtDesc();
}