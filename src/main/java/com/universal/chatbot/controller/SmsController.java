package com.universal.chatbot.controller;

import com.universal.chatbot.model.ChatRequest;
import com.universal.chatbot.model.ChatResponse;
import com.universal.chatbot.service.ChatService;
import com.universal.chatbot.service.TwilioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sms")
public class SmsController {

    @Autowired private ChatService chatService;
    @Autowired private TwilioService twilioService;

    // Twilio webhook — receives incoming SMS
    @PostMapping("/incoming")
    public ResponseEntity<String> incomingSms(
            @RequestParam String From,
            @RequestParam String Body,
            @RequestParam(defaultValue = "general") String industryId) {

        ChatRequest req = new ChatRequest(
                Body, "sms-" + From, From, industryId, "sms");

        ChatResponse response = chatService.processMessage(req);

        // Send reply SMS back to the user
        twilioService.sendSms(From, response.getReply());

        return ResponseEntity.ok("OK");
    }
}