<?php
/**
 * CRACK TOTAL - API Endpoints
 * API simple para proporcionar datos reales al dashboard
 */

// Permitir CORS y configuraciones para las solicitudes
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Si la solicitud es OPTIONS, terminar aquí (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener la ruta de la solicitud
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';

// Eliminar la parte del path base para obtener el endpoint
$endpoint = str_replace($base_path, '', $request_uri);
$endpoint = strtok($endpoint, '?'); // Quitar parámetros de query

// Obtener parámetros de query
$params = $_GET;

// Log para depuración
error_log("API Request: $endpoint - " . json_encode($params));

// Database connection details
$db_host = 'localhost';
$db_name = 'crack_total';
$db_user = 'root';
$db_pass = '';
$db_connection = null;

/**
 * Establece la conexión con la base de datos
 */
function connectToDatabase() {
    global $db_host, $db_name, $db_user, $db_pass, $db_connection;
    
    try {
        $db_connection = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
        $db_connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return true;
    } catch (PDOException $e) {
        error_log("Error de conexión a la base de datos: " . $e->getMessage());
        return false;
    }
}

/**
 * Cierra la conexión con la base de datos
 */
function closeDatabaseConnection() {
    global $db_connection;
    $db_connection = null;
}

// Responder según el endpoint
switch($endpoint) {
    case '/user/profile':
        getUserProfile($params);
        break;
        
    case '/games/pasala-che/info':
    case '/games/quien-sabe-theme/info':
        getGameInfo($endpoint, $params);
        break;
        
    case '/games/pasala-che/global-stats':
    case '/games/quien-sabe-theme/global-stats':
        getGlobalStats($endpoint, $params);
        break;
        
    case '/games/pasala-che/top-players':
    case '/games/quien-sabe-theme/top-players':
        getTopPlayers($endpoint, $params);
        break;
        
    case '/user/stats/pasala-che':
    case '/user/stats/quien-sabe-theme':
        getUserStats($endpoint, $params);
        break;
        
    case '/games/pasala-che/complete':
    case '/games/quien-sabe-theme/complete':
        completeGame($endpoint, $_POST);
        break;
        
    default:
        // Endpoint no encontrado
        http_response_code(404);
        echo json_encode([
            'error' => 'Endpoint no encontrado',
            'endpoint' => $endpoint
        ]);
        break;
}

/**
 * Devuelve los datos del perfil del usuario
 */
function getUserProfile($params) {
    global $db_connection;
    $game = isset($params['game']) ? $params['game'] : 'pasala-che';
    
    // Inicializamos datos por defecto en caso de error
    $userData = [
        'username' => 'Usuario',
        'level' => 1,
        'xp' => 0,
        'totalXp' => 1000,
        'rank' => 0,
        'highScore' => 0,
        'gamesPlayed' => 0,
        'gamesWon' => 0,
        'accuracy' => 0,
        'totalAttempts' => 0
    ];
    
    // Intentar conectar a la base de datos
    if (connectToDatabase()) {
        try {
            // Obtener ID de usuario (en una implementación real usaríamos autenticación)
            $userId = getCurrentUserId();
            
            // Consulta para obtener datos básicos del usuario
            $stmt = $db_connection->prepare("
                SELECT u.username, u.level, u.xp, l.xp_required,
                       (SELECT COUNT(*) + 1 FROM users u2 
                        INNER JOIN user_game_stats ugs2 ON u2.id = ugs2.user_id
                        WHERE ugs2.game_type = :game AND ugs2.high_score > ugs.high_score) as rank,
                       ugs.high_score, ugs.games_played, ugs.games_won, 
                       CASE WHEN ugs.total_attempts > 0 
                            THEN ROUND((ugs.correct_answers / ugs.total_attempts) * 100) 
                            ELSE 0 
                       END as accuracy,
                       ugs.total_attempts
                FROM users u
                LEFT JOIN user_game_stats ugs ON u.id = ugs.user_id AND ugs.game_type = :game
                LEFT JOIN levels l ON u.level = l.level
                WHERE u.id = :userId
            ");
            
            $stmt->bindParam(':game', $game);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                // Actualizar datos con los valores reales de la base de datos
                $userData = [
                    'username' => $result['username'],
                    'level' => $result['level'],
                    'xp' => $result['xp'],
                    'totalXp' => $result['xp_required'],
                    'rank' => $result['rank'],
                    'highScore' => $result['high_score'],
                    'gamesPlayed' => $result['games_played'],
                    'gamesWon' => $result['games_won'],
                    'accuracy' => $result['accuracy'],
                    'totalAttempts' => $result['total_attempts']
                ];
            }
        } catch (PDOException $e) {
            error_log("Error al obtener perfil: " . $e->getMessage());
        } finally {
            // Cerrar conexión
            closeDatabaseConnection();
        }
    } else {
        error_log("No se pudo conectar a la base de datos para getUserProfile");
    }
    
    echo json_encode($userData);
}

/**
 * Obtiene el ID del usuario actual
 * En una implementación real, esto vendría de la sesión o un token JWT
 */
function getCurrentUserId() {
    // Por ahora siempre devolvemos el ID 1 (usuario de prueba)
    // En una implementación real, esto se obtendría de la sesión o token
    return 1;
}

/**
 * Devuelve la información de un juego específico
 */
function getGameInfo($endpoint, $params) {
    $game = str_replace('/games/', '', $endpoint);
    $game = str_replace('/info', '', $game);
    
    if ($game === 'pasala-che') {
        $gameData = [
            'title' => 'PASALA CHE',
            'description' => 'El juego de palabras del fútbol',
            'icon' => 'fa-circle-notch',
            'stats' => [
                'gamesPlayed' => 56,
                'gamesWon' => 32,
                'winRate' => 57.1,
                'accuracy' => 78,
                'highScore' => 25,
                'averageTime' => 143
            ],
            'statLabels' => [
                'games' => 'Roscos Completados',
                'winRate' => 'Palabras Acertadas',
                'accuracy' => 'Precisión Palabras',
                'time' => 'Tiempo Promedio'
            ],
            'highScoreLabel' => 'Récord Rosco',
            'rankingLabels' => [
                'score' => 'Aciertos',
                'games' => 'Roscos',
                'timeLabel' => 'Último Rosco'
            ],
            'globalLabels' => [
                'players' => 'Jugadores Totales',
                'games' => 'Roscos Jugados',
                'avgScore' => 'Palabras Promedio',
                'maxScore' => 'Récord Absoluto'
            ]
        ];
    } else {
        $gameData = [
            'title' => '¿QUIÉN SABE MÁS?',
            'description' => 'El juego de preguntas del fútbol',
            'icon' => 'fa-question-circle',
            'stats' => [
                'gamesPlayed' => 42,
                'gamesWon' => 28,
                'winRate' => 66.7,
                'accuracy' => 82,
                'highScore' => 6,
                'averageTime' => 92
            ],
            'statLabels' => [
                'games' => 'Partidas Jugadas',
                'winRate' => 'Tasa de Victoria',
                'accuracy' => 'Preguntas Correctas',
                'time' => 'Minutos por Juego'
            ],
            'highScoreLabel' => 'Mejor Puntaje',
            'rankingLabels' => [
                'score' => 'Puntos',
                'games' => 'Partidas',
                'timeLabel' => 'Última Partida'
            ],
            'globalLabels' => [
                'players' => 'Jugadores Totales',
                'games' => 'Partidas Jugadas',
                'avgScore' => 'Puntuación Media',
                'maxScore' => 'Puntuación Máxima'
            ]
        ];
    }
    
    echo json_encode($gameData);
}

/**
 * Devuelve estadísticas globales para un juego
 */
function getGlobalStats($endpoint, $params) {
    global $db_connection;
    $game = str_replace('/games/', '', $endpoint);
    $game = str_replace('/global-stats', '', $game);
    
    // Valores por defecto
    $stats = [
        'totalPlayers' => 0,
        'totalGames' => 0,
        'avgScore' => 0,
        'maxScore' => 0
    ];
    
    // Intentar conectar a la base de datos
    if (connectToDatabase()) {
        try {
            // Consulta para datos globales
            if ($game === 'pasala-che') {
                $stmt = $db_connection->prepare("
                    SELECT 
                        (SELECT COUNT(DISTINCT user_id) FROM user_game_stats WHERE game_type = 'pasala-che') as total_players,
                        (SELECT COUNT(*) FROM game_records WHERE game_type = 'pasala-che') as total_games,
                        (SELECT AVG(correct_letters) FROM game_records WHERE game_type = 'pasala-che') as avg_score,
                        (SELECT MAX(correct_letters) FROM game_records WHERE game_type = 'pasala-che') as max_score
                ");
            } else {
                $stmt = $db_connection->prepare("
                    SELECT 
                        (SELECT COUNT(DISTINCT user_id) FROM user_game_stats WHERE game_type = 'quien-sabe-theme') as total_players,
                        (SELECT COUNT(*) FROM quiz_records) as total_games,
                        (SELECT AVG(score) FROM quiz_records) as avg_score,
                        (SELECT MAX(score) FROM quiz_records) as max_score
                ");
            }
            
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $stats = [
                    'totalPlayers' => $result['total_players'],
                    'totalGames' => $result['total_games'],
                    'avgScore' => round($result['avg_score'], 1),
                    'maxScore' => $result['max_score']
                ];
            }
        } catch (PDOException $e) {
            error_log("Error al obtener estadísticas globales: " . $e->getMessage());
        } finally {
            // Cerrar conexión
            closeDatabaseConnection();
        }
    } else {
        error_log("No se pudo conectar a la base de datos para getGlobalStats");
    }
    
    echo json_encode($stats);
}

/**
 * Devuelve los 3 mejores jugadores
 */
function getTopPlayers($endpoint, $params) {
    global $db_connection;
    $game = str_replace('/games/', '', $endpoint);
    $game = str_replace('/top-players', '', $game);
    
    // Valores por defecto
    $players = [];
    
    // Intentar conectar a la base de datos
    if (connectToDatabase()) {
        try {
            if ($game === 'pasala-che') {
                $stmt = $db_connection->prepare("
                    SELECT u.username as name, 
                           ugs.high_score as score,
                           SUBSTRING(u.username, 1, 1) as avatar,
                           ROW_NUMBER() OVER (ORDER BY ugs.high_score DESC) as rank
                    FROM user_game_stats ugs
                    JOIN users u ON ugs.user_id = u.id
                    WHERE ugs.game_type = 'pasala-che'
                    ORDER BY ugs.high_score DESC
                    LIMIT 3
                ");
            } else {
                $stmt = $db_connection->prepare("
                    SELECT u.username as name, 
                           ugs.high_score as score,
                           SUBSTRING(u.username, 1, 1) as avatar,
                           ROW_NUMBER() OVER (ORDER BY ugs.high_score DESC) as rank
                    FROM user_game_stats ugs
                    JOIN users u ON ugs.user_id = u.id
                    WHERE ugs.game_type = 'quien-sabe-theme'
                    ORDER BY ugs.high_score DESC
                    LIMIT 3
                ");
            }
            
            $stmt->execute();
            $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Si no hay datos, mostrar placeholder
            if (empty($players)) {
                if ($game === 'pasala-che') {
                    $players = [
                        ['rank' => 1, 'name' => 'Jugador1', 'score' => 0, 'avatar' => 'J'],
                        ['rank' => 2, 'name' => 'Jugador2', 'score' => 0, 'avatar' => 'J'],
                        ['rank' => 3, 'name' => 'Jugador3', 'score' => 0, 'avatar' => 'J']
                    ];
                } else {
                    $players = [
                        ['rank' => 1, 'name' => 'Jugador1', 'score' => 0, 'avatar' => 'J'],
                        ['rank' => 2, 'name' => 'Jugador2', 'score' => 0, 'avatar' => 'J'],
                        ['rank' => 3, 'name' => 'Jugador3', 'score' => 0, 'avatar' => 'J']
                    ];
                }
            }
        } catch (PDOException $e) {
            error_log("Error al obtener top players: " . $e->getMessage());
        } finally {
            // Cerrar conexión
            closeDatabaseConnection();
        }
    } else {
        error_log("No se pudo conectar a la base de datos para getTopPlayers");
    }
    
    echo json_encode($players);
}

/**
 * Devuelve estadísticas detalladas del usuario
 */
function getUserStats($endpoint, $params) {
    global $db_connection;
    $game = str_replace('/user/stats/', '', $endpoint);
    
    // Valores por defecto en caso de error
    if ($game === 'pasala-che') {
        $stats = [
            'totalRoscos' => 0,
            'avgLetters' => 0,
            'bestRosco' => 0,
            'letterStats' => [],
            'lastGames' => []
        ];
    } else {
        $stats = [
            'totalQuestions' => 0,
            'correctAnswers' => 0,
            'accuracy' => 0,
            'categories' => [],
            'lastGames' => []
        ];
    }
    
    // Intentar conectar a la base de datos
    if (connectToDatabase()) {
        try {
            // Obtener ID de usuario
            $userId = getCurrentUserId();
            
            if ($game === 'pasala-che') {
                // Consulta para PASALA CHE
                $stmt = $db_connection->prepare("
                    SELECT COUNT(*) as total_roscos, 
                           AVG(correct_letters) as avg_letters,
                           MAX(correct_letters) as best_rosco
                    FROM game_records
                    WHERE user_id = :userId AND game_type = 'pasala-che'
                ");
                $stmt->bindParam(':userId', $userId);
                $stmt->execute();
                
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result) {
                    $stats['totalRoscos'] = $result['total_roscos'];
                    $stats['avgLetters'] = round($result['avg_letters'], 1);
                    $stats['bestRosco'] = $result['best_rosco'];
                }
                
                // Obtener estadísticas por letras
                $stmt = $db_connection->prepare("
                    SELECT letter, 
                           SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
                           COUNT(*) as total,
                           ROUND((SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100) as accuracy
                    FROM letter_attempts
                    WHERE user_id = :userId
                    GROUP BY letter
                ");
                $stmt->bindParam(':userId', $userId);
                $stmt->execute();
                
                $letterStats = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $letterStats[$row['letter']] = $row['accuracy'];
                }
                
                // Si no hay datos, crear valores predeterminados
                if (empty($letterStats)) {
                    for ($i = 65; $i <= 90; $i++) {
                        $letterStats[chr($i)] = 0;
                    }
                }
                
                $stats['letterStats'] = $letterStats;
                
                // Obtener últimos juegos
                $stmt = $db_connection->prepare("
                    SELECT DATE_FORMAT(played_at, '%Y-%m-%d') as date,
                           correct_letters as correct, 
                           incorrect_letters as incorrect
                    FROM game_records
                    WHERE user_id = :userId AND game_type = 'pasala-che'
                    ORDER BY played_at DESC
                    LIMIT 5
                ");
                $stmt->bindParam(':userId', $userId);
                $stmt->execute();
                
                $lastGames = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $lastGames[] = $row;
                }
                
                $stats['lastGames'] = $lastGames;
                
            } else {
                // Consulta para QUIÉN SABE MÁS
                $stmt = $db_connection->prepare("
                    SELECT COUNT(*) as total_questions,
                           SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
                           ROUND((SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as accuracy
                    FROM question_attempts
                    WHERE user_id = :userId
                ");
                $stmt->bindParam(':userId', $userId);
                $stmt->execute();
                
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result) {
                    $stats['totalQuestions'] = $result['total_questions'];
                    $stats['correctAnswers'] = $result['correct_answers'];
                    $stats['accuracy'] = $result['accuracy'];
                }
                
                // Obtener estadísticas por categoría
                $stmt = $db_connection->prepare("
                    SELECT category, 
                           ROUND((SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100) as accuracy
                    FROM question_attempts
                    WHERE user_id = :userId
                    GROUP BY category
                ");
                $stmt->bindParam(':userId', $userId);
                $stmt->execute();
                
                $categories = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $categories[$row['category']] = $row['accuracy'];
                }
                
                // Si no hay datos, usar categorías predeterminadas
                if (empty($categories)) {
                    $categories = [
                        'Historia' => 0,
                        'Jugadores' => 0,
                        'Clubes' => 0,
                        'Mundiales' => 0,
                        'Equipos' => 0,
                        'Estadísticas' => 0,
                        'Copas' => 0
                    ];
                }
                
                $stats['categories'] = $categories;
                
                // Obtener últimos juegos
                $stmt = $db_connection->prepare("
                    SELECT DATE_FORMAT(played_at, '%Y-%m-%d') as date,
                           total_questions as questions,
                           correct_answers as correct,
                           incorrect_answers as incorrect,
                           skipped_questions as skipped
                    FROM quiz_records
                    WHERE user_id = :userId
                    ORDER BY played_at DESC
                    LIMIT 5
                ");
                $stmt->bindParam(':userId', $userId);
                $stmt->execute();
                
                $lastGames = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $lastGames[] = $row;
                }
                
                $stats['lastGames'] = $lastGames;
            }
        } catch (PDOException $e) {
            error_log("Error al obtener estadísticas: " . $e->getMessage());
        } finally {
            // Cerrar conexión
            closeDatabaseConnection();
        }
    } else {
        error_log("No se pudo conectar a la base de datos para getUserStats");
    }
    
    echo json_encode($stats);
}

/**
 * Completa una partida y guarda las estadísticas
 */
function completeGame($endpoint, $data) {
    global $db_connection;
    $gameType = (strpos($endpoint, 'pasala-che') !== false) ? 'pasala-che' : 'quien-sabe-theme';

    // Validar datos recibidos
    if (!isset($data['score']) || !isset($data['difficulty']) || !isset($data['victory']) || !isset($data['correct']) || !isset($data['wrong'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos para completar la partida']);
        return;
    }

    $score = intval($data['score']);
    $difficulty = $data['difficulty'];
    $victory = filter_var($data['victory'], FILTER_VALIDATE_BOOLEAN);
    $correct = intval($data['correct']);
    $wrong = intval($data['wrong']);
    $time = isset($data['time']) ? intval($data['time']) : null; // Tiempo para PASALA CHE
    $skipped = isset($data['skipped']) ? intval($data['skipped']) : null; // Saltadas para QUIÉN SABE

    // Obtener ID de usuario (o crear uno si no existe - simplificado)
    $userId = getCurrentUserId();

    // Intentar conectar a la base de datos
    if (!connectToDatabase()) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo conectar a la base de datos para guardar la partida']);
        return;
    }

    try {
        $db_connection->beginTransaction();

        // 1. Insertar registro de la partida
        $stmtGame = $db_connection->prepare("
            INSERT INTO game_results (user_id, game_type, score, difficulty, victory, correct_answers, incorrect_answers, time_seconds, skipped_questions, game_date)
            VALUES (:userId, :gameType, :score, :difficulty, :victory, :correct, :wrong, :time, :skipped, NOW())
        ");
        $stmtGame->bindParam(':userId', $userId);
        $stmtGame->bindParam(':gameType', $gameType);
        $stmtGame->bindParam(':score', $score);
        $stmtGame->bindParam(':difficulty', $difficulty);
        $stmtGame->bindParam(':victory', $victory, PDO::PARAM_BOOL);
        $stmtGame->bindParam(':correct', $correct);
        $stmtGame->bindParam(':wrong', $wrong);
        $stmtGame->bindParam(':time', $time);
        $stmtGame->bindParam(':skipped', $skipped);
        $stmtGame->execute();

        // 2. Actualizar estadísticas agregadas del usuario para este juego
        $stmtStats = $db_connection->prepare("
            INSERT INTO user_game_stats (user_id, game_type, games_played, games_won, high_score, total_score, total_correct_answers, total_incorrect_answers, total_attempts, total_time_seconds, last_played)
            VALUES (:userId, :gameType, 1, :victory, :score, :score, :correct, :wrong, :attempts, :time, NOW())
            ON DUPLICATE KEY UPDATE
                games_played = games_played + 1,
                games_won = games_won + VALUES(games_won),
                high_score = GREATEST(high_score, VALUES(high_score)),
                total_score = total_score + VALUES(total_score),
                total_correct_answers = total_correct_answers + VALUES(total_correct_answers),
                total_incorrect_answers = total_incorrect_answers + VALUES(total_incorrect_answers),
                total_attempts = total_attempts + VALUES(total_attempts),
                total_time_seconds = total_time_seconds + VALUES(total_time_seconds),
                last_played = NOW()
        ");
        
        $attempts = $correct + $wrong + ($skipped ?? 0);
        $timeUpdate = $time ?? 0; // Usar 0 si el tiempo no aplica o no se envió

        $stmtStats->bindParam(':userId', $userId);
        $stmtStats->bindParam(':gameType', $gameType);
        $stmtStats->bindParam(':victory', $victory, PDO::PARAM_INT); // Usar INT (0 o 1)
        $stmtStats->bindParam(':score', $score);
        $stmtStats->bindParam(':correct', $correct);
        $stmtStats->bindParam(':wrong', $wrong);
        $stmtStats->bindParam(':attempts', $attempts);
        $stmtStats->bindParam(':time', $timeUpdate);
        $stmtStats->execute();

        // 3. Actualizar XP y Nivel del usuario (ejemplo simple)
        $xpGained = calculateXp($score, $victory, $difficulty);
        $stmtUser = $db_connection->prepare("
            UPDATE users SET xp = xp + :xpGained WHERE id = :userId
        ");
        $stmtUser->bindParam(':xpGained', $xpGained);
        $stmtUser->bindParam(':userId', $userId);
        $stmtUser->execute();

        // Lógica adicional para subir de nivel (simplificada)
        // Habría que verificar si xp supera el xp_required para el nivel actual

        $db_connection->commit();
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Partida guardada correctamente', 'xpGained' => $xpGained]);

    } catch (PDOException $e) {
        $db_connection->rollBack();
        error_log("Error al guardar la partida: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error interno al guardar la partida', 'details' => $e->getMessage()]);
    } finally {
        closeDatabaseConnection();
    }
}

/**
 * Calcula la XP ganada (ejemplo)
 */
function calculateXp($score, $victory, $difficulty) {
    $baseXp = $score / 10; // XP base por puntaje
    $victoryBonus = $victory ? 50 : 0;
    $difficultyMultiplier = ($difficulty === 'hard') ? 1.5 : (($difficulty === 'easy') ? 0.75 : 1);
    return round(($baseXp + $victoryBonus) * $difficultyMultiplier);
} 
 