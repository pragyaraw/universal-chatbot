package com.universal.chatbot.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "industry_config")
@Data @NoArgsConstructor @AllArgsConstructor
public class IndustryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String industryId;
    private String name;

    @Column(columnDefinition = "TEXT")
    private String systemPrompt;

    private String welcomeMessage;
    private Boolean isActive;
}