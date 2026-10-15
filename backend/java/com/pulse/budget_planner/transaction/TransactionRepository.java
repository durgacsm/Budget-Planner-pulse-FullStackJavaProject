package com.pulse.budget_planner.transaction;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    List<Transaction> findAllByUser_Id(Long userId);

    Optional<Transaction> findByIdAndUser_Id(
            Long id, Long userId);
}