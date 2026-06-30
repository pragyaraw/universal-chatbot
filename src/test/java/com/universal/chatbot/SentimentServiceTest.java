package com.universal.chatbot;

import com.universal.chatbot.model.SentimentResult;
import com.universal.chatbot.service.SentimentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SentimentServiceTest {

    @Autowired private SentimentService sentimentService;

    @Test
    void testNegativeSentiment() {
        SentimentResult result = sentimentService.analyze(
                "I hate this terrible service, it is the worst");
        assertTrue(result.getScore() <= 2);
    }

    @Test
    void testPositiveSentiment() {
        SentimentResult result = sentimentService.analyze(
                "This is fantastic, thank you so much!");
        assertTrue(result.getScore() >= 4);
    }

    @Test
    void testNullInput_doesNotCrash() {
        SentimentResult result = sentimentService.analyze("");
        assertNotNull(result);
    }
}