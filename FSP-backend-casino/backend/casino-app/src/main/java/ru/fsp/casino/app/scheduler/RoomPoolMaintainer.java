package ru.fsp.casino.app.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.fsp.casino.domain.enums.RoomStatus;
import ru.fsp.casino.domain.enums.VipTier;
import ru.fsp.casino.domain.model.AdminConfig;
import ru.fsp.casino.domain.model.Room;
import ru.fsp.casino.domain.repository.AdminConfigRepository;
import ru.fsp.casino.domain.repository.RoomRepository;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomPoolMaintainer {

    private static final int TARGET_ROOMS_COUNT = 10;
    private static final List<VipTier> TIER_ROTATION = List.of(
        VipTier.STANDARD, VipTier.SILVER, VipTier.GOLD, VipTier.STANDARD, VipTier.SILVER
    );

    private final RoomRepository roomRepository;
    private final AdminConfigRepository adminConfigRepository;

    @Scheduled(fixedDelayString = "${app.game.roomPoolCheckMs:30000}")
    @Transactional
    public void ensureRoomPoolSize() {
        long waitingCount = roomRepository.findByStatus(RoomStatus.WAITING).size();
        long runningCount = roomRepository.findByStatus(RoomStatus.RUNNING).size();
        long activeCount = waitingCount + runningCount;
        if (activeCount >= TARGET_ROOMS_COUNT) return;

        AdminConfig config = adminConfigRepository.findById(1).orElse(null);
        int maxSlots = config != null ? config.getDefaultMaxSlots() : 6;
        long entryFee = config != null ? config.getDefaultEntryFee() : 100L;
        int prizePoolPct = config != null ? config.getDefaultPrizePoolPct() : 80;
        boolean boostEnabled = config != null && Boolean.TRUE.equals(config.getDefaultBoostEnabled());
        long boostCost = config != null && config.getDefaultBoostCost() != null ? config.getDefaultBoostCost() : 50L;
        var boostMultiplier = config != null && config.getDefaultBoostMultiplier() != null
            ? config.getDefaultBoostMultiplier()
            : java.math.BigDecimal.valueOf(2.0);

        for (long i = activeCount; i < TARGET_ROOMS_COUNT; i++) {
            VipTier tier = TIER_ROTATION.get((int) (i % TIER_ROTATION.size()));
            Room room = Room.builder()
                .status(RoomStatus.WAITING)
                .tier(tier)
                .maxSlots(maxSlots)
                .entryFee(entryFee)
                .prizePoolPct(prizePoolPct)
                .boostEnabled(boostEnabled)
                .boostCost(boostEnabled ? boostCost : null)
                .boostMultiplier(boostMultiplier)
                .createdAt(Instant.now())
                .build();
            roomRepository.save(room);
            log.info("Room pool maintainer created room {} ({})", room.getId(), room.getTier());
        }
    }
}
