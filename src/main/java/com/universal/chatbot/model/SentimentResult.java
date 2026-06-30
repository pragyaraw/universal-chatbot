package com.universal.chatbot.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class SentimentResult {

    private String label;
    private int score;
    private String emoji;
    private String tone;
    private boolean escalate;

    public static SentimentResult neutral() {
        return new SentimentResult("Neutral", 3, "😐", "Standard response", false);
    }
}