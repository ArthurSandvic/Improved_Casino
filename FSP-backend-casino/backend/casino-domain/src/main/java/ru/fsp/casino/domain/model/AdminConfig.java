package ru.fsp.casino.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "admin_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminConfig {

    @Id
    private Integer id;

    @Column(nullable = false)
    @Builder.Default
    private Integer defaultMaxSlots = 6;

    @Column(nullable = false)
    @Builder.Default
    private Long defaultEntryFee = 100L;

    @Column(nullable = false)
    @Builder.Default
    private Integer defaultPrizePoolPct = 80;

    @Column(nullable = false)
    @Builder.Default
    private Boolean defaultBoostEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Long defaultBoostCost = 50L;

    @Column(nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal defaultBoostMultiplier = BigDecimal.valueOf(2.0);

    @Column(nullable = false)
    @Builder.Default
    private Integer waitingTimerSeconds = 60;

    /** Дефолт мин. ставки в Mountain (создание комнаты / подсказки). */
    @Column(nullable = false)
    @Builder.Default
    private Integer mountainMinBet = 50;

    @Column(nullable = false)
    @Builder.Default
    private Integer mountainMaxBet = 400;

    @Column(nullable = false)
    @Builder.Default
    private Integer bankFilterEntryFee = 100;

    @Column(nullable = false)
    @Builder.Default
    private Integer bankFilterSeats = 6;

    @Builder.Default
    private Instant updatedAt = Instant.now();
}
