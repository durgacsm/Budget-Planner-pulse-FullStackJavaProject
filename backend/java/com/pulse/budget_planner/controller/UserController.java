package com.pulse.budget_planner.controller;


import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.pulse.budget_planner.entity.User;
import com.pulse.budget_planner.repository.UserRepository;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication) {

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail()));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            @RequestBody UpdateUserRequest request,
            Authentication authentication) {

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        if (request.name() == null || request.name().isBlank()
                || request.email() == null
                || request.email().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Name and email are required"));
        }

        String newEmail = request.email().trim().toLowerCase();

        boolean emailChanged =
                !user.getEmail().equalsIgnoreCase(newEmail);

        if (emailChanged
                && userRepository.existsByEmail(newEmail)) {

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "Email already registered"));
        }

        user.setName(request.name().trim());
        user.setEmail(newEmail);

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail()));
    }

    public record UpdateUserRequest(
            String name,
            String email) {
    }
}