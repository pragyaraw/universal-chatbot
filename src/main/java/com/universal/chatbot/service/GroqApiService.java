package com.universal.chatbot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GroqApiService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.api.model}")
    private String model;

    @Value("${groq.api.max-tokens}")
    private int maxTokens;

    private final WebClient webClient = WebClient.builder()
            .codecs(c -> c.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
            .build();

    public String getResponse(List<Map<String, String>> messages, String systemPrompt) {
        try {

            List<Map<String, String>> groqMessages = new ArrayList<>();
            groqMessages.add(Map.of("role", "system", "content", systemPrompt));
            groqMessages.addAll(messages);

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("max_tokens", maxTokens);
            body.put("messages", groqMessages);
            body.put("temperature", 0.7);

            Map response = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)  // Bearer token (not x-api-key)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, res -> res.bodyToMono(String.class)
                            .flatMap(err -> Mono.error(
                                    new RuntimeException("Groq API error: " + err))))
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();


            List<Map> choices = (List<Map>) response.get("choices");
            Map message = (Map) choices.get(0).get("message");
            return (String) message.get("content");

        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                log.warn("Groq rate limit hit — free tier: 1000 req/day, 30/min");
                throw new RuntimeException("AI rate limit reached. Please wait a moment.");
            }
            log.error("Groq API call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable. Please try again.");
        }
    }
}