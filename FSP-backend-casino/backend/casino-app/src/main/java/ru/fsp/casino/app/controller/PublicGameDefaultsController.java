package ru.fsp.casino.app.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.fsp.casino.domain.model.AdminConfig;
import ru.fsp.casino.domain.repository.AdminConfigRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicGameDefaultsController {

    private final AdminConfigRepository adminConfigRepository;

    @GetMapping("/game-defaults")
    public ResponseEntity<Map<String, Object>> gameDefaults() {
        AdminConfig cfg = adminConfigRepository.findById(1).orElseThrow();
        return ResponseEntity.ok(Map.of(
            "mountainMinBet", cfg.getMountainMinBet(),
            "mountainMaxBet", cfg.getMountainMaxBet(),
            "bankFilterEntryFee", cfg.getBankFilterEntryFee(),
            "bankFilterSeats", cfg.getBankFilterSeats()
        ));
    }
}
