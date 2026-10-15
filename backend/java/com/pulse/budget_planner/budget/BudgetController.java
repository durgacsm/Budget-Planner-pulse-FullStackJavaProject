
package com.pulse.budget_planner.budget;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pulse.budget_planner.entity.User;
import com.pulse.budget_planner.repository.UserRepository;

@RestController
@RequestMapping("/budgets")
public class BudgetController {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    public BudgetController(
            BudgetRepository budgetRepository,
            UserRepository userRepository) {
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
    }

    private User getLoggedInUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException("Authenticated user not found"));
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getBudgets(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        return ResponseEntity.ok(
                budgetRepository.findAllByUser_Id(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Budget> createBudget(
            @RequestBody Budget budget,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        budget.setId(null);
        budget.setUser(user);

        Budget saved = budgetRepository.save(budget);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Long id,
            @RequestBody Budget request,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        Budget existing = budgetRepository
                .findByIdAndUser_Id(id, user.getId())
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        existing.setCategory(request.getCategory());
        existing.setBudgetLimit(request.getBudgetLimit());
        existing.setMonth(request.getMonth());

        Budget saved = budgetRepository.save(existing);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        Budget existing = budgetRepository
                .findByIdAndUser_Id(id, user.getId())
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        budgetRepository.delete(existing);

        return ResponseEntity.noContent().build();
    }
}
