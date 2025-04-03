-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS cracktotal;

-- Usar la base de datos
USE cracktotal;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY, -- UUID
  username VARCHAR(50) NOT NULL,
  ip VARCHAR(50), -- Para asociar con localStorage
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de juegos
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(36) PRIMARY KEY, -- UUID
  type VARCHAR(20) NOT NULL, -- 'pasala-che', 'quien-sabe-mas', etc.
  user_id VARCHAR(36) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  incorrect_answers INT NOT NULL DEFAULT 0,
  skipped_answers INT NOT NULL DEFAULT 0,
  total_answers INT NOT NULL DEFAULT 0,
  time_spent INT NOT NULL DEFAULT 0, -- en segundos
  is_win BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de estadísticas de usuarios (agregadas)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id VARCHAR(36) PRIMARY KEY,
  game_type VARCHAR(20) NOT NULL,
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  high_score INT NOT NULL DEFAULT 0,
  total_correct_answers INT NOT NULL DEFAULT 0,
  total_incorrect_answers INT NOT NULL DEFAULT 0,
  total_answers INT NOT NULL DEFAULT 0,
  total_time_spent INT NOT NULL DEFAULT 0, -- en segundos
  win_rate FLOAT NOT NULL DEFAULT 0, -- porcentaje (0-100)
  accuracy FLOAT NOT NULL DEFAULT 0, -- porcentaje (0-100)
  avg_time FLOAT NOT NULL DEFAULT 0, -- segundos por juego
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, game_type)
);

-- Tabla de logros
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(36) PRIMARY KEY, -- UUID
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category VARCHAR(50) DEFAULT 'general', -- 'general', 'beginner', 'advanced', etc.
  game_type VARCHAR(20), -- NULL para todos los juegos
  requirement_type VARCHAR(50) NOT NULL, -- 'games_played', 'high_score', etc.
  requirement_value INT NOT NULL DEFAULT 1, -- valor requerido
  xp_reward INT NOT NULL DEFAULT 0
);

-- Tabla de logros de usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id VARCHAR(36) NOT NULL,
  achievement_id VARCHAR(36) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Tabla para el ranking global
CREATE TABLE IF NOT EXISTS global_ranking (
  user_id VARCHAR(36) NOT NULL,
  game_type VARCHAR(20) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  rank INT NOT NULL,
  rank_change INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Algunos logros predefinidos
INSERT IGNORE INTO achievements (id, name, description, icon, category, game_type, requirement_type, requirement_value, xp_reward)
VALUES
  ('ach-001', 'Primera Victoria', 'Gana tu primera partida', 'trophy', 'beginner', NULL, 'games_won', 1, 10),
  ('ach-002', 'Principiante', 'Juega 5 partidas', 'gamepad', 'beginner', NULL, 'games_played', 5, 20),
  ('ach-003', 'Entusiasta', 'Juega 25 partidas', 'gamepad', 'intermediate', NULL, 'games_played', 25, 50),
  ('ach-004', 'Maestro', 'Gana 10 partidas', 'crown', 'intermediate', NULL, 'games_won', 10, 100),
  ('ach-005', 'Experto', 'Consigue una precisión del 90%', 'bullseye', 'expert', NULL, 'accuracy', 90, 150),
  ('ach-006', 'Velocista', 'Completa una partida en menos de 60 segundos', 'bolt', 'expert', NULL, 'time_spent', 60, 100),
  ('ach-007', 'Perfeccionista', 'Completa una partida sin errores', 'check-double', 'expert', NULL, 'perfect_game', 1, 200);

-- Índices para optimizar consultas
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_type ON games(type);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_user_stats_game_type ON user_stats(game_type);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_global_ranking_game_type ON global_ranking(game_type);
CREATE INDEX idx_global_ranking_score ON global_ranking(game_type, score DESC); 