package com.universal.chatbot.controller;

import com.universal.chatbot.model.ChatRequest;
import com.universal.chatbot.model.ChatResponse;
import com.universal.chatbot.model.ChatLog;
import com.universal.chatbot.model.IndustryConfig;
import com.universal.chatbot.repository.ChatLogRepository;
import com.universal.chatbot.repository.IndustryConfigRepository;
import com.universal.chatbot.service.ChatService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@Slf4j
public class ChatController {

    @Autowired private ChatService chatService;
    @Autowired private ChatLogRepository chatLogRepository;
    @Autowired private IndustryConfigRepository industryConfigRepository;


    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request) {
        log.info("Chat [{}] [{}]: {}",
                request.getIndustryId(), request.getChannel(), request.getMessage());
        ChatResponse response = chatService.processMessage(request);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<ChatLog>> history(@PathVariable String sessionId) {
        return ResponseEntity.ok(
                chatLogRepository.findBySessionIdOrderByCreatedAtAsc(sessionId));
    }


    @GetMapping("/industries")
    public ResponseEntity<List<IndustryConfig>> industries() {
        return ResponseEntity.ok(
                industryConfigRepository.findByIsActiveTrue());
    }


    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "chatbot"));
    }
}