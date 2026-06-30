package com.universal.chatbot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatResponse {

    private String reply;
    private String sentimentLabel;
    private Integer sentimentScore;
    private String sentimentEmoji;
    private String responseTone;
    private Boolean escalated;
    private String channel;
    private LocalDateTime timestamp;
    private Long responseMs;
}