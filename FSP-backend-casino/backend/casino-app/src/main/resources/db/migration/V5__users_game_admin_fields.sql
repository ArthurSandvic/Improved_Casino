-- Дефолты для Mountain (диапазон ставок) и Bank (подбор комнаты); правятся из единой админки
ALTER TABLE admin_config
    ADD COLUMN IF NOT EXISTS mountainMinBet INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS mountainMaxBet INT NOT NULL DEFAULT 400,
    ADD COLUMN IF NOT EXISTS bankFilterEntryFee INT NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS bankFilterSeats INT NOT NULL DEFAULT 6;

-- Убрать старых сид-пользователей, если на них нет ссылок
DELETE FROM room_participants
WHERE userId IN (SELECT id FROM users WHERE username IN ('lucky77', 'new_player', 'pro_gamer'));

UPDATE round_history
SET winnerUserId = NULL
WHERE winnerUserId IN (SELECT id FROM users WHERE username IN ('lucky77', 'new_player', 'pro_gamer'));

DELETE FROM users WHERE username IN ('lucky77', 'new_player', 'pro_gamer');

-- 17 аккаунтов USER + vip_player ADMIN (пароли заданы заказчиком)
INSERT INTO users (username, passwordHash, vipTier, role, balance) VALUES
    ('chelentano', '$2b$12$UQlTHYVRH67/wiUCr7V3tO2wkX3NTH/fLnq0cTdBNBcIe7ZsgJARy', 'STANDARD', 'USER', 25000),
    ('exe', '$2b$12$eqjCSnwG/QK3zkHN76OApuiRnuzQeLZRZhdtJolIrZ3CeJEuE9Ggu', 'STANDARD', 'USER', 25000),
    ('brotato', '$2b$12$OaXYf2ldBpkvlr7UdmtvlO.UZhUsbCnsqe5C6t0UmjKb4z0T5aeUy', 'STANDARD', 'USER', 25000),
    ('zhestkiy', '$2b$12$Vpxd2GQZuXwOxulEVktzw.kgJvQ2DkKdW8vv/7j.FeRsvN6IX9xsC', 'STANDARD', 'USER', 25000),
    ('dron', '$2b$12$/wYfJNKBYgLchO3E6U3.mes0KT7hE6oEOkmjFh3QghQd9mY2LvuTy', 'STANDARD', 'USER', 25000),
    ('kogan', '$2b$12$lJ/tQJEf6ffy7bXasuSzI.AtFOzdbVXbQT6QlagiOGKj/J2.cugU.', 'STANDARD', 'USER', 25000),
    ('penka', '$2b$12$GiOD7KLrCPkyf2IjA1m.6.2znCiPeimatAeobP52iWA6o3lqZbrIK', 'STANDARD', 'USER', 25000),
    ('husband', '$2b$12$8OWtK53FXZqD2y2TLuTkNuvmESMBzPWMJGnK.6TiveZ2sgpHu6axS', 'STANDARD', 'USER', 25000),
    ('rama', '$2b$12$hGmN9KhFBN0iE8gBNZEfYuouZSpGMcgsyyWAOU5LRHI5HkEWWDRjG', 'STANDARD', 'USER', 25000),
    ('yakut', '$2b$12$zWg9oIjL7RHU1KWplhdBRu3.vqENF2emb8Sz4YWzEk1K918eJ4gS6', 'STANDARD', 'USER', 25000),
    ('senator', '$2b$12$UgK5ksbfuWwg3gwN8ZmXr.PcONRMwwqfbY.Y.0cEKKOZu7pp71dJi', 'STANDARD', 'USER', 25000),
    ('beekeeper', '$2b$12$uUEyxgT2tXHFI4VvqQQG9.lTrRO6O4CFwCz1BG1g5xXav35QFpsPO', 'STANDARD', 'USER', 25000),
    ('habib', '$2b$12$drqZOQTxkaNs.ENgbQo.v.4Q2Dt.wJwRUmSGms3bwbZiiZK4tb9z.', 'STANDARD', 'USER', 25000),
    ('elk', '$2b$12$vWf2/ShnUwvX.XoBNmzDX.xxjDLbrNEANTumvLv6y.s3sSRkVP6AC', 'STANDARD', 'USER', 25000),
    ('frol', '$2b$12$nbeB9siSIC0ymLAiPZuNi.bwYiBLJIQdSAmYqR3dq.JsDX0OMsZKC', 'STANDARD', 'USER', 25000),
    ('nigger', '$2b$12$RsvEO7CZje5JAMnBivmYlOgRV9TirB4HVKLQxdlySSMt7toQOr07K', 'STANDARD', 'USER', 25000),
    ('aleksey_m', '$2b$12$QCGbNxhpxuuNc/3uzIcZOebUAKghKQUsCqmdohBi74TGohLKJRloe', 'GOLD', 'USER', 50000),
    ('vip_player', '$2b$12$iuu9rfx69XWqPnzO34Zma.QPGaHmsy1GGsgYqR6gEC7EL5ipJIMTa', 'PLATINUM', 'ADMIN', 200000)
ON CONFLICT (username) DO UPDATE SET
    passwordHash = EXCLUDED.passwordHash,
    vipTier      = EXCLUDED.vipTier,
    role         = EXCLUDED.role,
    balance      = EXCLUDED.balance;
