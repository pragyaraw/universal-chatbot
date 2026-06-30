package com.universal.chatbot;

import com.universal.chatbot.model.ChatLog;
import com.universal.chatbot.model.ChatRequest;
import com.universal.chatbot.model.ChatResponse;
import com.universal.chatbot.repository.ChatLogRepository;
import com.universal.chatbot.service.ChatService;
import com.universal.chatbot.service.GroqApiService;
import com.universal.chatbot.service.TwilioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
class ChatServiceTest {

    @MockBean private GroqApiService groqApiService;
    @MockBean private TwilioService twilioService;
    @Autowired private ChatService chatService;
    @Autowired private ChatLogRepository chatLogRepository;

    private ChatRequest buildRequest(String msg, String session,
                                     String user, String industry) {
        ChatRequest req = new ChatRequest();
        req.setMessage(msg);
        req.setSessionId(session);
        req.setUserId(user);
        req.setIndustryId(industry);
        req.setChannel("web");
        return req;
    }

    @Test
    void testProcessMessage_returnsReply() {
        when(groqApiService.getResponse(any(), any()))
                .thenReturn("Your balance is Rs 245.");

        ChatResponse res = chatService.processMessage(
                buildRequest("check my balance", "session1", "user1", "telecom"));

        assertNotNull(res.getReply());
        assertEquals("Your balance is Rs 245.", res.getReply());
        assertNotNull(res.getSentimentLabel());
    }

    @Test
    void testProcessMessage_escalatesAngryUser() {
        when(groqApiService.getResponse(any(), anyString()))
                .thenReturn("I understand your frustration.");

        ChatResponse res = chatService.processMessage(
                buildRequest("this is terrible service I hate this",
                        "session2", "user2", "telecom"));

        assertTrue(Boolean.TRUE.equals(res.getEscalated()));
    }

    @Test
    void testProcessMessage_savedToDb() {
        when(groqApiService.getResponse(any(), any()))
                .thenReturn("Test reply");

        chatService.processMessage(
                buildRequest("test message", "session3", "user3", "banking"));

        List<ChatLog> logs = chatLogRepository
                .findBySessionIdOrderByCreatedAtAsc("session3");

        assertFalse(logs.isEmpty());
        assertEquals("test message", logs.get(0).getUserMessage());
    }
}