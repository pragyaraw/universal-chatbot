package com.universal.chatbot.service;

import com.universal.chatbot.model.*;
import com.universal.chatbot.repository.ChatLogRepository;
import com.universal.chatbot.repository.IndustryConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@Transactional
public class ChatService {

    @Autowired private GroqApiService groqApiService;
    @Autowired private SentimentService sentimentService;
    @Autowired private ChatLogRepository chatLogRepository;
    @Autowired private IndustryConfigRepository industryConfigRepository;

    public ChatResponse processMessage(ChatRequest request) {
        long startTime = System.currentTimeMillis();

        IndustryConfig industry = industryConfigRepository
                .findByIndustryId(request.getIndustryId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown industry: " + request.getIndustryId()));

        SentimentResult sentiment = sentimentService.analyze(request.getMessage());
        log.info("Sentiment: {} | Score: {}", sentiment.getLabel(), sentiment.getScore());

        String systemPrompt = buildSystemPrompt(industry, sentiment, request.getChannel());

        List<Map<String, String>> messages = buildMessageHistory(
                request.getSessionId(), request.getMessage());

        String reply = groqApiService.getResponse(messages, systemPrompt);

        long responseMs = System.currentTimeMillis() - startTime;
        ChatLog chatLog = ChatLog.builder()
                .sessionId(request.getSessionId())
                .userId(request.getUserId())
                .industryId(request.getIndustryId())
                .channel(ChatLog.Channel.valueOf(request.getChannel()))
                .userMessage(request.getMessage())
                .botReply(reply)
                .sentimentLabel(sentiment.getLabel())
                .sentimentScore(sentiment.getScore())
                .escalated(sentiment.isEscalate())
                .responseMs((int) responseMs)
                .build();
        chatLogRepository.save(chatLog);

        return ChatResponse.builder()
                .reply(reply)
                .sentimentLabel(sentiment.getLabel())
                .sentimentScore(sentiment.getScore())
                .sentimentEmoji(sentiment.getEmoji())
                .responseTone(sentiment.getTone())
                .escalated(sentiment.isEscalate())
                .channel(request.getChannel())
                .timestamp(LocalDateTime.now())
                .responseMs(responseMs)
                .build();
    }

    private String buildSystemPrompt(IndustryConfig industry,
                                     SentimentResult sentiment, String channel) {
        StringBuilder sb = new StringBuilder(industry.getSystemPrompt());

        if (sentiment.isEscalate()) {
            sb.append("\n\nIMPORTANT: User is very frustrated. ");
            sb.append("Start with empathy, then solve. Offer to escalate to a human agent.");
        } else if (sentiment.getScore() == 2) {
            sb.append("\n\nNote: User seems unhappy. Acknowledge their concern first.");
        }

        if ("voice".equals(channel))
            sb.append("\n\nThis is a voice call. Keep response conversational and brief.");
        if ("sms".equals(channel))
            sb.append("\n\nThis is an SMS. Keep reply under 160 characters.");

        return sb.toString();
    }

    private List<Map<String, String>> buildMessageHistory(String sessionId, String newMsg) {
        List<Map<String, String>> messages = new ArrayList<>();

        List<ChatLog> history = chatLogRepository
                .findBySessionIdOrderByCreatedAtAsc(sessionId);

        int start = Math.max(0, history.size() - 10);
        for (int i = start; i < history.size(); i++) {
            ChatLog h = history.get(i);
            messages.add(Map.of("role", "user", "content", h.getUserMessage()));
            messages.add(Map.of("role", "assistant", "content", h.getBotReply()));
        }

        messages.add(Map.of("role", "user", "content", newMsg));
        return messages;
    }
}
