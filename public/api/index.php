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

// Directorio para datos (ranking)
$dataDir = __DIR__ . '/data';
$rankingFile = $dataDir . '/ranking.json';

// Crear directorio si no existe
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}
// Crear archivo ranking.json si no existe
if (!file_exists($rankingFile)) {
    file_put_contents($rankingFile, json_encode([], JSON_PRETTY_PRINT));
}

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

/**
 * Guarda un puntaje en el archivo ranking.json global
 */
function guardarPuntajeGlobal($datosJugador) {
    global $rankingFile;
    
    $ranking = [];
    if (file_exists($rankingFile)) {
        $data = file_get_contents($rankingFile);
        if ($data) {
            $decoded = json_decode($data, true);
            if (is_array($decoded)) {
                $ranking = $decoded;
            }
        }
    }
    
    // Añadir nuevo puntaje
    $ranking[] = $datosJugador;
    
    // Ordenar por puntaje (descendente)
    usort($ranking, function($a, $b) {
        return $b['score'] <=> $a['score'];
    });
    
    // Opcional: Limitar ranking (ej. top 100)
    // $ranking = array_slice($ranking, 0, 100);
    
    // Guardar archivo
    try {
        file_put_contents($rankingFile, json_encode($ranking, JSON_PRETTY_PRINT));
        error_log("Ranking global guardado: " . json_encode($datosJugador));
    } catch (Exception $e) {
        error_log("Error guardando ranking global: " . $e->getMessage());
    }
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
        
    case '/games/pasala-che/ranking':
    case '/games/quien-sabe-theme/ranking':
        getRanking($endpoint, $params);
        break;
        
    // NUEVO ENDPOINT PARA RANKING GLOBAL
    case '/global-ranking':
        getGlobalRanking();
        break;
        
    case '/games/pasala-che/top-players':
    case '/games/quien-sabe-theme/top-players':
        getTopPlayers($endpoint, $params);
        break;
        
    case '/user/stats/pasala-che':
    case '/user/stats/quien-sabe-theme':
        getUserStats($endpoint, $params);
        break;
        
    case '/games/pasala-che/ranking/search':
    case '/games/quien-sabe-theme/ranking/search':
        searchRanking($endpoint, $params);
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
 * Devuelve el ranking para un juego
 */
function getRanking($endpoint, $params) {
    global $db_connection;
    $game = str_replace('/games/', '', $endpoint);
    $game = str_replace('/ranking', '', $game);
    
    $filter = isset($params['filter']) ? $params['filter'] : 'global';
    $page = isset($params['page']) ? (int)$params['page'] : 1;
    $perPage = 10;
    
    // Valores por defecto
    $players = [];
    $totalPlayers = 0;
    $totalPages = 1;
    
    // Calcular offset para paginación
    $offset = ($page - 1) * $perPage;
    
    // Intentar conectar a la base de datos
    if (connectToDatabase()) {
        try {
            // Determinar la condición de tiempo según el filtro
            $timeCondition = "";
            if ($filter === 'monthly') {
                $timeCondition = "AND gr.played_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            } elseif ($filter === 'weekly') {
                $timeCondition = "AND gr.played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            }
            
            // Obtener ID del usuario actual
            $currentUserId = getCurrentUserId();
            
            // Consulta para obtener datos de ranking con paginación
            if ($game === 'pasala-che') {
                // Contar total de jugadores para paginación
                $countStmt = $db_connection->prepare("
                    SELECT COUNT(DISTINCT u.id) as total
                    FROM users u
                    JOIN game_records gr ON u.id = gr.user_id
                    WHERE gr.game_type = 'pasala-che' $timeCondition
                ");
                $countStmt->execute();
                $totalPlayers = $countStmt->fetchColumn();
                
                // Consulta principal
                $stmt = $db_connection->prepare("
                    SELECT 
                        u.username as name,
                        ugs.high_score as score,
                        COUNT(gr.id) as gamesPlayed,
                        DATEDIFF(NOW(), MAX(gr.played_at)) as lastActive,
                        SUBSTRING(u.username, 1, 1) as avatar,
                        CASE WHEN u.id = :currentUserId THEN 1 ELSE 0 END as isCurrentUser,
                        (SELECT rank FROM (
                            SELECT user_id, RANK() OVER (ORDER BY high_score DESC) as rank
                            FROM user_game_stats
                            WHERE game_type = 'pasala-che'
                        ) as r WHERE user_id = u.id) as rank,
                        (SELECT COALESCE(
                            (prev_rank - current_rank), 0)
                        FROM (
                            SELECT user_id, 
                                rank() OVER (ORDER BY high_score DESC) as current_rank,
                                COALESCE(LAG(rank() OVER (ORDER BY high_score DESC)) OVER (ORDER BY user_id), 0) as prev_rank
                            FROM user_game_stats
                            WHERE game_type = 'pasala-che'
                        ) as rank_changes
                        WHERE user_id = u.id) as rankChange
                    FROM users u
                    JOIN user_game_stats ugs ON u.id = ugs.user_id AND ugs.game_type = 'pasala-che'
                    JOIN game_records gr ON u.id = gr.user_id AND gr.game_type = 'pasala-che' $timeCondition
                    GROUP BY u.id, u.username, ugs.high_score
                    ORDER BY ugs.high_score DESC, u.username ASC
                    LIMIT :offset, :perPage
                ");
            } else {
                // Contar total de jugadores para paginación
                $countStmt = $db_connection->prepare("
                    SELECT COUNT(DISTINCT u.id) as total
                    FROM users u
                    JOIN quiz_records qr ON u.id = qr.user_id
                    WHERE 1=1 $timeCondition
                ");
                $countStmt->execute();
                $totalPlayers = $countStmt->fetchColumn();
                
                // Consulta principal
                $stmt = $db_connection->prepare("
                    SELECT 
                        u.username as name,
                        ugs.high_score as score,
                        COUNT(qr.id) as gamesPlayed,
                        DATEDIFF(NOW(), MAX(qr.played_at)) as lastActive,
                        SUBSTRING(u.username, 1, 1) as avatar,
                        CASE WHEN u.id = :currentUserId THEN 1 ELSE 0 END as isCurrentUser,
                        (SELECT rank FROM (
                            SELECT user_id, RANK() OVER (ORDER BY high_score DESC) as rank
                            FROM user_game_stats
                            WHERE game_type = 'quien-sabe-theme'
                        ) as r WHERE user_id = u.id) as rank,
                        (SELECT COALESCE(
                            (prev_rank - current_rank), 0)
                        FROM (
                            SELECT user_id, 
                                rank() OVER (ORDER BY high_score DESC) as current_rank,
                                COALESCE(LAG(rank() OVER (ORDER BY high_score DESC)) OVER (ORDER BY user_id), 0) as prev_rank
                            FROM user_game_stats
                            WHERE game_type = 'quien-sabe-theme'
                        ) as rank_changes
                        WHERE user_id = u.id) as rankChange
                    FROM users u
                    JOIN user_game_stats ugs ON u.id = ugs.user_id AND ugs.game_type = 'quien-sabe-theme'
                    JOIN quiz_records qr ON u.id = qr.user_id $timeCondition
                    GROUP BY u.id, u.username, ugs.high_score
                    ORDER BY ugs.high_score DESC, u.username ASC
                    LIMIT :offset, :perPage
                ");
            }
            
            $stmt->bindParam(':currentUserId', $currentUserId, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->bindParam(':perPage', $perPage, PDO::PARAM_INT);
            $stmt->execute();
            
            // Obtener resultados
            $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Asignar colores a avatares
            $avatarColors = [
                'rgba(225, 29, 72, 0.8)',  // Rojo
                'rgba(6, 182, 212, 0.8)',   // Cyan
                'rgba(249, 115, 22, 0.8)',  // Naranja
                'rgba(5, 150, 105, 0.8)',   // Esmeralda
                'rgba(124, 58, 237, 0.8)',  // Violeta
                'rgba(234, 179, 8, 0.8)'    // Amarillo
            ];
            
            // Procesar los resultados
            foreach ($players as &$player) {
                // Asignar un color consistente basado en el nombre del jugador
                $colorIndex = crc32($player['name']) % count($avatarColors);
                $player['avatarColor'] = $avatarColors[$colorIndex];
                
                // Asegurar que rankChange es un número
                $player['rankChange'] = (int)$player['rankChange'];
            }
            
            // Calcular total de páginas
            $totalPages = ceil($totalPlayers / $perPage);
            
        } catch (PDOException $e) {
            error_log("Error al obtener ranking: " . $e->getMessage());
        } finally {
            // Cerrar conexión
            closeDatabaseConnection();
        }
    } else {
        error_log("No se pudo conectar a la base de datos para getRanking");
    }
    
    echo json_encode([
        'players' => $players,
        'currentPage' => $page,
        'totalPages' => $totalPages,
        'totalPlayers' => $totalPlayers,
        'filter' => $filter
    ]);
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
 * Busca jugadores en el ranking
 */
function searchRanking($endpoint, $params) {
    global $db_connection;
    $game = str_replace('/games/', '', $endpoint);
    $game = str_replace('/ranking/search', '', $game);
    
    $term = isset($params['term']) ? $params['term'] : '';
    
    // Verificar que exista un término de búsqueda
    if (empty($term)) {
        http_response_code(400);
        echo json_encode(['error' => 'Término de búsqueda requerido']);
        return;
    }
    
    // Valores por defecto
    $players = [];
    $total = 0;
    
    // Intentar conectar a la base de datos
    if (connectToDatabase()) {
        try {
            // Obtener ID del usuario actual
            $currentUserId = getCurrentUserId();
            
            // Consulta para buscar jugadores por nombre
            if ($game === 'pasala-che') {
                $stmt = $db_connection->prepare("
                    SELECT 
                        u.username as name,
                        ugs.high_score as score,
                        (SELECT COUNT(*) FROM game_records WHERE user_id = u.id AND game_type = 'pasala-che') as gamesPlayed,
                        DATEDIFF(NOW(), (SELECT MAX(played_at) FROM game_records WHERE user_id = u.id AND game_type = 'pasala-che')) as lastActive,
                        SUBSTRING(u.username, 1, 1) as avatar,
                        CASE WHEN u.id = :currentUserId THEN 1 ELSE 0 END as isCurrentUser,
                        (SELECT rank FROM (
                            SELECT user_id, RANK() OVER (ORDER BY high_score DESC) as rank
                            FROM user_game_stats
                            WHERE game_type = 'pasala-che'
                        ) as r WHERE user_id = u.id) as rank,
                        0 as rankChange
                    FROM users u
                    JOIN user_game_stats ugs ON u.id = ugs.user_id AND ugs.game_type = 'pasala-che'
                    WHERE u.username LIKE :term
                    ORDER BY ugs.high_score DESC, u.username ASC
                    LIMIT 10
                ");
            } else {
                $stmt = $db_connection->prepare("
                    SELECT 
                        u.username as name,
                        ugs.high_score as score,
                        (SELECT COUNT(*) FROM quiz_records WHERE user_id = u.id) as gamesPlayed,
                        DATEDIFF(NOW(), (SELECT MAX(played_at) FROM quiz_records WHERE user_id = u.id)) as lastActive,
                        SUBSTRING(u.username, 1, 1) as avatar,
                        CASE WHEN u.id = :currentUserId THEN 1 ELSE 0 END as isCurrentUser,
                        (SELECT rank FROM (
                            SELECT user_id, RANK() OVER (ORDER BY high_score DESC) as rank
                            FROM user_game_stats
                            WHERE game_type = 'quien-sabe-theme'
                        ) as r WHERE user_id = u.id) as rank,
                        0 as rankChange
                    FROM users u
                    JOIN user_game_stats ugs ON u.id = ugs.user_id AND ugs.game_type = 'quien-sabe-theme'
                    WHERE u.username LIKE :term
                    ORDER BY ugs.high_score DESC, u.username ASC
                    LIMIT 10
                ");
            }
            
            $searchTerm = "%$term%"; // Búsqueda parcial
            $stmt->bindParam(':term', $searchTerm);
            $stmt->bindParam(':currentUserId', $currentUserId, PDO::PARAM_INT);
            $stmt->execute();
            
            // Obtener resultados
            $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $total = count($players);
            
            // Asignar colores a avatares
            $avatarColors = [
                'rgba(225, 29, 72, 0.8)',  // Rojo
                'rgba(6, 182, 212, 0.8)',   // Cyan
                'rgba(249, 115, 22, 0.8)',  // Naranja
                'rgba(5, 150, 105, 0.8)',   // Esmeralda
                'rgba(124, 58, 237, 0.8)',  // Violeta
                'rgba(234, 179, 8, 0.8)'    // Amarillo
            ];
            
            // Procesar los resultados
            foreach ($players as &$player) {
                // Asignar un color consistente basado en el nombre del jugador
                $colorIndex = crc32($player['name']) % count($avatarColors);
                $player['avatarColor'] = $avatarColors[$colorIndex];
                
                // Manejar casos donde lastActive es NULL (nuevo jugador)
                if ($player['lastActive'] === null) {
                    $player['lastActive'] = 0;
                }
            }
            
        } catch (PDOException $e) {
            error_log("Error al buscar jugadores: " . $e->getMessage());
        } finally {
            // Cerrar conexión
            closeDatabaseConnection();
        }
    } else {
        error_log("No se pudo conectar a la base de datos para searchRanking");
    }
    
    echo json_encode([
        'players' => $players,
        'total' => $total
    ]);
}

/**
 * Devuelve el ranking global desde ranking.json
 */
function getGlobalRanking() {
    global $rankingFile;
    
    $ranking = [];
    if (file_exists($rankingFile)) {
        $data = file_get_contents($rankingFile);
        if ($data) {
            $decoded = json_decode($data, true);
            if (is_array($decoded)) {
                $ranking = $decoded;
            }
        }
    }
    
    echo json_encode(['players' => $ranking]);
}

/**
 * Procesa la finalización de un juego y guarda estadísticas
 */
function completeGame($endpoint, $data) {
    global $db_connection; // Mantenemos DB por si acaso para XP/Niveles
    $game = str_replace('/games/', '', $endpoint);
    $game = str_replace('/complete', '', $game);
    
    // Verificar si se recibieron los datos necesarios
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos']);
        return;
    }
    
    // Obtener ID del usuario actual (asumimos función existente)
    $userId = getCurrentUserId();
    $username = 'Jugador'; // Placeholder, idealmente obtener de DB/sesión
    if (connectToDatabase()) {
        $stmt = $db_connection->prepare("SELECT username FROM users WHERE id = :userId");
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) $username = $user['username'];
        closeDatabaseConnection();
    }
    
    $score = 0;
    $xpAmount = 0;
    
    // Validar y extraer datos específicos del juego
    if ($game === 'pasala-che') {
        if (!isset($data['correctLetters']) || !isset($data['incorrectLetters'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos para PASALA CHE']);
            return;
        }
        $score = intval($data['correctLetters']);
        $xpAmount = $score * 10; // Ejemplo de cálculo de XP
    } else { // Asumimos 'quien-sabe-theme'
        if (!isset($data['score']) || !isset($data['correctAnswers']) || !isset($data['totalQuestions'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos para QUIÉN SABE MÁS']);
            return;
        }
        $score = intval($data['score']);
        $xpAmount = $score * 20; // Ejemplo de cálculo de XP
    }
    
    // GUARDAR EN RANKING GLOBAL
    $playerData = [
        'name' => $username,
        'score' => $score,
        'gameType' => $game,
        'date' => date('c') // Fecha ISO 8601
    ];
    guardarPuntajeGlobal($playerData);
    
    // Lógica existente para guardar en DB (si la hay) o actualizar XP/Nivel
    // Esta parte es simplificada, asume que la conexión y lógica de DB ya existe
    $updateSuccess = false;
    if (connectToDatabase()) {
        try {
            $db_connection->beginTransaction();
            
            // Actualizar XP (ejemplo)
            $xpStmt = $db_connection->prepare("
                UPDATE users SET xp = xp + :xpAmount WHERE id = :userId
            ");
            $xpStmt->bindParam(':xpAmount', $xpAmount);
            $xpStmt->bindParam(':userId', $userId);
            $xpStmt->execute();
            
            // Podría haber más lógica aquí (actualizar user_game_stats, verificar niveles, etc.)
            // ...
            
            $db_connection->commit();
            $updateSuccess = true;
        } catch (PDOException $e) {
            $db_connection->rollBack();
            error_log("Error al actualizar datos post-juego en DB: " . $e->getMessage());
        } finally {
            closeDatabaseConnection();
        }
    }
    
    // Devolver respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Juego completado y ranking global actualizado' . ($updateSuccess ? ' (y DB)' : ''),
        'xpEarned' => $xpAmount
    ]);
} 
 