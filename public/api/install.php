<?php
/**
 * CRACK TOTAL - Instalación de Base de Datos
 * Script para crear las tablas necesarias para el funcionamiento del dashboard
 */

// Configuración de la base de datos
$db_host = 'localhost';
$db_name = 'crack_total';
$db_user = 'root';
$db_pass = '';

// Conectar a la base de datos
try {
    $db = new PDO("mysql:host=$db_host", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Crear la base de datos si no existe
    $db->exec("CREATE DATABASE IF NOT EXISTS `$db_name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // Seleccionar la base de datos
    $db->exec("USE `$db_name`");
    
    // Crear tabla de usuarios
    $db->exec("
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `email` VARCHAR(100) NOT NULL UNIQUE,
            `level` INT NOT NULL DEFAULT 1,
            `xp` INT NOT NULL DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `last_login` TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Crear tabla de niveles
    $db->exec("
        CREATE TABLE IF NOT EXISTS `levels` (
            `level` INT PRIMARY KEY,
            `xp_required` INT NOT NULL,
            `title` VARCHAR(50) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Crear tabla de estadísticas de juego por usuario
    $db->exec("
        CREATE TABLE IF NOT EXISTS `user_game_stats` (
            `user_id` INT NOT NULL,
            `game_type` ENUM('pasala-che', 'quien-sabe-theme') NOT NULL,
            `games_played` INT NOT NULL DEFAULT 0,
            `games_won` INT NOT NULL DEFAULT 0,
            `high_score` INT NOT NULL DEFAULT 0,
            `total_attempts` INT NOT NULL DEFAULT 0,
            `correct_answers` INT NOT NULL DEFAULT 0,
            `last_played` TIMESTAMP NULL,
            PRIMARY KEY (`user_id`, `game_type`),
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Crear tabla de registros de juego PASALA CHE
    $db->exec("
        CREATE TABLE IF NOT EXISTS `game_records` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `game_type` ENUM('pasala-che') NOT NULL,
            `correct_letters` INT NOT NULL DEFAULT 0,
            `incorrect_letters` INT NOT NULL DEFAULT 0,
            `played_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Crear tabla de intentos de letras (para PASALA CHE)
    $db->exec("
        CREATE TABLE IF NOT EXISTS `letter_attempts` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `game_id` INT NOT NULL,
            `letter` CHAR(1) NOT NULL,
            `word` VARCHAR(50) NOT NULL,
            `is_correct` TINYINT(1) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`game_id`) REFERENCES `game_records`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Crear tabla de registros de cuestionarios (QUIÉN SABE MÁS)
    $db->exec("
        CREATE TABLE IF NOT EXISTS `quiz_records` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `score` INT NOT NULL DEFAULT 0,
            `total_questions` INT NOT NULL DEFAULT 0,
            `correct_answers` INT NOT NULL DEFAULT 0,
            `incorrect_answers` INT NOT NULL DEFAULT 0,
            `skipped_questions` INT NOT NULL DEFAULT 0,
            `played_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Crear tabla de intentos de preguntas (para QUIÉN SABE MÁS)
    $db->exec("
        CREATE TABLE IF NOT EXISTS `question_attempts` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `quiz_id` INT NOT NULL,
            `category` VARCHAR(50) NOT NULL,
            `question_text` TEXT NOT NULL,
            `answer` VARCHAR(100) NOT NULL,
            `is_correct` TINYINT(1) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`quiz_id`) REFERENCES `quiz_records`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Insertar datos iniciales de niveles
    $db->exec("
        INSERT IGNORE INTO `levels` (`level`, `xp_required`, `title`) VALUES
        (1, 1000, 'Principiante'),
        (2, 2000, 'Aficionado'),
        (3, 3000, 'Amateur'),
        (4, 4000, 'Semi-Profesional'),
        (5, 5000, 'Profesional'),
        (6, 6000, 'Experto'),
        (7, 7000, 'Maestro'),
        (8, 8000, 'Gran Maestro'),
        (9, 9000, 'Leyenda'),
        (10, 10000, 'Superestrella'),
        (11, 11000, 'Crack'),
        (12, 12000, 'Super Crack'),
        (13, 13000, 'Ultra Crack'),
        (14, 14000, 'Mega Crack'),
        (15, 15000, 'Crack Total')
    ");
    
    // Insertar usuario de prueba si no existe
    $db->exec("
        INSERT IGNORE INTO `users` (`id`, `username`, `password`, `email`, `level`, `xp`) VALUES
        (1, 'Usuario123', '" . password_hash('password123', PASSWORD_DEFAULT) . "', 'usuario@ejemplo.com', 12, 4500)
    ");
    
    // Insertar estadísticas iniciales para el usuario de prueba
    $db->exec("
        INSERT IGNORE INTO `user_game_stats` (`user_id`, `game_type`, `games_played`, `games_won`, `high_score`, `total_attempts`, `correct_answers`) VALUES
        (1, 'pasala-che', 56, 32, 25, 320, 256),
        (1, 'quien-sabe-theme', 42, 28, 8, 420, 344)
    ");
    
    echo "¡Instalación completada! La base de datos está lista para usar.";
    
} catch (PDOException $e) {
    die("Error: " . $e->getMessage());
} 
 