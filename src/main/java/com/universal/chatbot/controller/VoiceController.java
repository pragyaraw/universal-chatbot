package com.universal.chatbot.controller;

import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Say;
import com.universal.chatbot.model.ChatRequest;
import com.universal.chatbot.model.ChatResponse;
import com.universal.chatbot.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/voice")
public class VoiceController {

    @Autowired private ChatService chatService;


    @PostMapping("/incoming")
    public ResponseEntity<String> incomingCall() {
        VoiceResponse response = new VoiceResponse.Builder()
                .gather(new Gather.Builder()
                        .inputs(Gather.Input.SPEECH)
                        .language(Gather.Language.EN_IN)
                        .action("/api/voice/process")
                        .timeout(5)
                        .say(new Say.Builder(
                                "Welcome to the AI assistant. Please speak your query.")
                                .voice(Say.Voice.ALICE)
                                .language(Say.Language.EN_IN)
                                .build())
                        .build())
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(response.toXml());
    }

    // Step 2: Twilio sends transcribed speech here
    @PostMapping("/process")
    public ResponseEntity<String> processVoice(
            @RequestParam String SpeechResult,
            @RequestParam(defaultValue = "general") String industryId) {

        ChatRequest req = new ChatRequest(
                SpeechResult, "voice-" + System.currentTimeMillis(),
                "voice-user", industryId, "voice");

        ChatResponse chatResp = chatService.processMessage(req);


        VoiceResponse response = new VoiceResponse.Builder()
                .say(new Say.Builder(chatResp.getReply())
                        .voice(Say.Voice.ALICE)
                        .language(Say.Language.EN_IN)
                        .build())
                .say(new Say.Builder("Thank you for calling. Goodbye!")
                        .voice(Say.Voice.ALICE)
                        .language(Say.Language.EN_IN)
                        .build())
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(response.toXml());
    }
}