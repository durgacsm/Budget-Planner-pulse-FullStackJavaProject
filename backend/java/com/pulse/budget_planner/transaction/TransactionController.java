package com.pulse.budget_planner.transaction;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.pulse.budget_planner.entity.User;
import com.pulse.budget_planner.repository.UserRepository;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionController(
            TransactionRepository transactionRepository,
            UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    private User getLoggedInUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found"));
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getTransactions(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                transactionRepository.findAllByUser_Id(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @RequestBody Transaction transaction,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        transaction.setId(null);
        transaction.setUser(user);

        Transaction saved =
                transactionRepository.save(transaction);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(
            @PathVariable Long id,
            @RequestBody Transaction request,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        Transaction existing = transactionRepository
                .findByIdAndUser_Id(id, user.getId())
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        existing.setType(request.getType());
        existing.setAmount(request.getAmount());
        existing.setCategory(request.getCategory());
        existing.setDate(request.getDate());
        existing.setDescription(request.getDescription());

        Transaction saved =
                transactionRepository.save(existing);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        Transaction existing = transactionRepository
                .findByIdAndUser_Id(id, user.getId())
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        transactionRepository.delete(existing);

        return ResponseEntity.noContent().build();
    }
}