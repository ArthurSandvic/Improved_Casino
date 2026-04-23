package ru.fsp.casino.app.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ru.fsp.casino.domain.model.User;
import ru.fsp.casino.domain.repository.UserRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();
        return ResponseEntity.ok(Map.of(
            "userId", user.getId(),
            "balance", user.getBalance(),
            "reservedBalance", user.getReservedBalance()
        ));
    }

    @PostMapping("/spend")
    public ResponseEntity<Map<String, Object>> spend(@RequestBody Map<String, Long> body, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        long amount = body.getOrDefault("amount", 0L);
        if (amount <= 0) throw new IllegalStateException("Amount must be > 0");

        User user = userRepository.findById(userId).orElseThrow();
        if (user.getBalance() < amount) {
            throw new IllegalStateException("Insufficient balance");
        }
        user.setBalance(user.getBalance() - amount);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "userId", user.getId(),
            "balance", user.getBalance()
        ));
    }

    @PostMapping("/credit")
    public ResponseEntity<Map<String, Object>> credit(@RequestBody Map<String, Long> body, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        long amount = body.getOrDefault("amount", 0L);
        if (amount <= 0) throw new IllegalStateException("Amount must be > 0");

        User user = userRepository.findById(userId).orElseThrow();
        user.setBalance(user.getBalance() + amount);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "userId", user.getId(),
            "balance", user.getBalance()
        ));
    }
}
