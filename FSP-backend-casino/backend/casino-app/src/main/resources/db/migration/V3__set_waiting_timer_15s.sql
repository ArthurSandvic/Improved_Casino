ALTER TABLE admin_config
    ALTER COLUMN waitingTimerSeconds SET DEFAULT 15;

UPDATE admin_config
SET waitingTimerSeconds = 15
WHERE waitingTimerSeconds IS NULL OR waitingTimerSeconds <> 15;
