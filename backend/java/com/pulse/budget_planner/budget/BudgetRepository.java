package com.pulse.budget_planner.budget;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository
        extends JpaRepository<Budget, Long> {

    List<Budget> findAllByUser_Id(Long userId);

    Optional<Budget> findByIdAndUser_Id(
            Long id, Long userId);
}