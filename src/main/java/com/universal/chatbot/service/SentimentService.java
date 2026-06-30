package com.universal.chatbot.service;

import com.universal.chatbot.model.SentimentResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SentimentService {

    public SentimentResult analyze(String text) {
        log.info("Sentiment analysis skipped - returning neutral");
        return SentimentResult.neutral();
    }
}