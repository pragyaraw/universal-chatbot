package com.universal.chatbot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sessionId;
    private String userId;
    private String industryId;

    @Enumerated(EnumType.STRING)
    private Channel channel;

    @Column(columnDefinition = "TEXT")
    private String userMessage;

    @Column(columnDefinition = "TEXT")
    private String botReply;

    private String sentimentLabel;
    private Integer sentimentScore;
    private Boolean escalated;
    private Integer responseMs;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Channel { web, sms, voice }
}