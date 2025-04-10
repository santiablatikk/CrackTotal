// Define the ACHIEVEMENT_CATEGORIES if not already defined
const ACHIEVEMENT_CATEGORIES = {
  PRINCIPIANTE: 'principiante',
  INTERMEDIO: 'intermedio',
  EXPERTO: 'experto',
  MAESTRIA: 'maestria',
  COLECCIONISTA: 'coleccionista',
  ESPECIAL: 'especial'
};

// Define the achievements object with all the new achievements
window.FULL_GAME_ACHIEVEMENTS = {
  // === NUEVOS LOGROS (50 más) ===
  
  // === NUEVOS PRINCIPIANTE (10 más) ===
  first_question: {
    id: 'first_question',
    title: 'Primera Respuesta',
    description: 'Responde correctamente tu primera pregunta.',
    icon: 'fas fa-check',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => stats.correctAnswers >= 1
  },
  football_beginner: {
    id: 'football_beginner',
    title: 'Aprendiz de Fútbol',
    description: 'Completa una partida respondiendo al menos 5 preguntas correctamente.',
    icon: 'fas fa-futbol',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => stats.correctAnswers >= 5
  },
  afternoon_player: {
    id: 'afternoon_player',
    title: 'Jugador de Sobremesa',
    description: 'Juega una partida entre las 2:00 PM y las 4:00 PM.',
    icon: 'fas fa-mug-hot',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 14 && hour < 16;
    }
  },
  first_challenge: {
    id: 'first_challenge',
    title: 'Primer Desafío',
    description: 'Juega una partida en dificultad normal por primera vez.',
    icon: 'fas fa-chess-pawn',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => stats.difficulty === 'normal'
  },
  two_in_row: {
    id: 'two_in_row',
    title: 'Dúo Dinámico',
    description: 'Gana 2 partidas consecutivas.',
    icon: 'fas fa-grip',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 2);
      return history.length >= 2 && history.every(game => game.victory);
    }
  },
  midweek_player: {
    id: 'midweek_player',
    title: 'Jugador de Mitad de Semana',
    description: 'Juega una partida un miércoles.',
    icon: 'fas fa-calendar-week',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 3; // Miércoles
    }
  },
  persistent: {
    id: 'persistent',
    title: 'Persistente',
    description: 'Vuelve a jugar después de perder una partida.',
    icon: 'fas fa-person-walking-arrow-loop-left',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 2);
      return history.length >= 2 && !history[1].victory && history[0].date > history[1].date;
    }
  },
  quick_starter: {
    id: 'quick_starter',
    title: 'Inicio Rápido',
    description: 'Responde correctamente las primeras 3 preguntas de una partida.',
    icon: 'fas fa-forward-step',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      // Requiere seguimiento específico del juego
      return stats.startStreak && stats.startStreak >= 3;
    }
  },
  eight_letters: {
    id: 'eight_letters',
    title: 'Ocho Letras',
    description: 'Acierta 8 letras en una partida.',
    icon: 'fas fa-8',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => stats.correctAnswers >= 8
  },
  soccer_fan: {
    id: 'soccer_fan',
    title: 'Fanático del Fútbol',
    description: 'Juega 3 partidas en el mismo día.',
    icon: 'fas fa-jersey',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const history = getGameHistory();
      const today = new Date();
      const todayString = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
      
      let todayGames = 0;
      history.forEach(game => {
        if (game.date) {
          const gameDate = new Date(game.date);
          const gameDateString = `${gameDate.getFullYear()}-${gameDate.getMonth()+1}-${gameDate.getDate()}`;
          
          if (gameDateString === todayString) {
            todayGames++;
          }
        }
      });
      
      return todayGames >= 3;
    }
  },
  
  // === NUEVOS INTERMEDIO (15 más) ===
  skip_master: {
    id: 'skip_master',
    title: 'Maestro del Pasapalabra',
    description: 'Gana una partida después de haber pasado al menos 5 preguntas.',
    icon: 'fas fa-share',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.result === 'victory' && stats.skippedAnswers >= 5
  },
  fifteen_correct: {
    id: 'fifteen_correct',
    title: 'Mente Ágil',
    description: 'Consigue 15 respuestas correctas en una partida.',
    icon: 'fas fa-brain',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.correctAnswers >= 15
  },
  b_expert: {
    id: 'b_expert',
    title: 'Experto en B',
    description: 'Acierta la letra B en tres partidas consecutivas.',
    icon: 'fas fa-b',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 3);
      return history.length >= 3 && 
             history.every(game => game.letters && game.letters['B'] === 'correct');
    }
  },
  tiebreaker: {
    id: 'tiebreaker',
    title: 'Desempate',
    description: 'Gana una partida con exactamente 13 respuestas correctas y 13 incorrectas.',
    icon: 'fas fa-scale-balanced',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      return stats.result === 'victory' && 
             stats.correctAnswers === 13 && 
             stats.incorrectAnswers === 13;
    }
  },
  tuesday_player: {
    id: 'tuesday_player',
    title: 'Jugador del Martes',
    description: 'Gana una partida un martes.',
    icon: 'fas fa-2',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 2 && stats.result === 'victory'; // Martes
    }
  },
  thursday_player: {
    id: 'thursday_player',
    title: 'Jugador del Jueves',
    description: 'Gana una partida un jueves.',
    icon: 'fas fa-4',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 4 && stats.result === 'victory'; // Jueves
    }
  },
  friday_player: {
    id: 'friday_player',
    title: 'Jugador del Viernes',
    description: 'Gana una partida un viernes.',
    icon: 'fas fa-champagne-glasses',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 5 && stats.result === 'victory'; // Viernes
    }
  },
  perfect_half: {
    id: 'perfect_half',
    title: 'Media Perfección',
    description: 'Acierta las primeras 13 letras del rosco sin errores ni saltos.',
    icon: 'fas fa-star-half',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      // Requiere implementación específica
      return stats.perfectFirstHalf;
    }
  },
  q_whisperer: {
    id: 'q_whisperer',
    title: 'Dominador de la Q',
    description: 'Acierta la letra Q en tres partidas diferentes.',
    icon: 'fas fa-q',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const history = getGameHistory();
      let qCount = 0;
      
      history.forEach(game => {
        if (game.letters && game.letters['Q'] === 'correct') {
          qCount++;
        }
      });
      
      return qCount >= 3;
    }
  },
  k_whisperer: {
    id: 'k_whisperer',
    title: 'Dominador de la K',
    description: 'Acierta la letra K en tres partidas diferentes.',
    icon: 'fas fa-k',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const history = getGameHistory();
      let kCount = 0;
      
      history.forEach(game => {
        if (game.letters && game.letters['K'] === 'correct') {
          kCount++;
        }
      });
      
      return kCount >= 3;
    }
  },
  pressure_master: {
    id: 'pressure_master',
    title: 'Maestro de la Presión',
    description: 'Acierta 5 preguntas consecutivas cuando queda menos de 1 minuto.',
    icon: 'fas fa-timer',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      // Requiere implementación específica
      return stats.pressureStreak && stats.pressureStreak >= 5;
    }
  },
  balanced_player: {
    id: 'balanced_player',
    title: 'Jugador Equilibrado',
    description: 'Gana un juego con exactamente el mismo número de vocales y consonantes acertadas.',
    icon: 'fas fa-equals',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      // Requiere seguimiento específico
      if (!stats.letters || stats.result !== 'victory') return false;
      
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      let vowelCount = 0;
      let consonantCount = 0;
      
      for (const letter in stats.letters) {
        if (stats.letters[letter] === 'correct') {
          if (vowels.includes(letter)) {
            vowelCount++;
          } else {
            consonantCount++;
          }
        }
      }
      
      return vowelCount > 0 && vowelCount === consonantCount;
    }
  },
  two_minute_warning: {
    id: 'two_minute_warning',
    title: 'Aviso de Dos Minutos',
    description: 'Gana una partida utilizando entre 110 y 130 segundos totales.',
    icon: 'fas fa-stopwatch-20',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      return stats.result === 'victory' && 
             stats.totalTimePlayed >= 110 && 
             stats.totalTimePlayed <= 130;
    }
  },
  third_time_charm: {
    id: 'third_time_charm',
    title: 'A la Tercera va la Vencida',
    description: 'Gana una partida después de perder dos consecutivas.',
    icon: 'fas fa-clover',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 3);
      return history.length >= 3 && 
             history[0].victory && 
             !history[1].victory && 
             !history[2].victory;
    }
  },
  lucky_seven: {
    id: 'lucky_seven',
    title: 'Siete de la Suerte',
    description: 'Gana una partida el día 7 de cualquier mes.',
    icon: 'fas fa-dice',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      return stats.result === 'victory' && new Date().getDate() === 7;
    }
  },
  
  // === NUEVOS EXPERTO (15 más) ===
  consonant_ninja: {
    id: 'consonant_ninja',
    title: 'Ninja de Consonantes',
    description: 'Acierta todas las consonantes en una partida de dificultad difícil.',
    icon: 'fas fa-user-ninja',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      if (stats.difficulty !== 'dificil') return false;
      
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      
      if (!stats.letters) return false;
      
      for (const letter in stats.letters) {
        if (!vowels.includes(letter) && stats.letters[letter] !== 'correct') {
          return false;
        }
      }
      
      return true;
    }
  },
  hard_mode_warrior: {
    id: 'hard_mode_warrior',
    title: 'Guerrero Extremo',
    description: 'Juega 10 partidas consecutivas en dificultad difícil.',
    icon: 'fas fa-khanda',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 10);
      return history.length >= 10 && 
             history.every(game => game.difficulty === 'dificil');
    }
  },
  comeback_king: {
    id: 'comeback_king',
    title: 'Rey de la Remontada',
    description: 'Gana una partida después de fallar 5 respuestas consecutivas.',
    icon: 'fas fa-crown',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      // Requiere seguimiento específico
      return stats.result === 'victory' && stats.maxConsecutiveErrors >= 5;
    }
  },
  clock_beater: {
    id: 'clock_beater',
    title: 'Vencedor del Reloj',
    description: 'Gana una partida respondiendo la última pregunta con menos de 3 segundos restantes.',
    icon: 'fas fa-hourglass-end',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      // Requiere seguimiento específico
      return stats.result === 'victory' && stats.finalSeconds < 3;
    }
  },
  letter_jumper: {
    id: 'letter_jumper',
    title: 'Saltador de Letras',
    description: 'Gana una partida después de saltar y volver a cada letra al menos una vez.',
    icon: 'fas fa-person-skiing-jumping',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      // Requiere seguimiento específico
      return stats.result === 'victory' && stats.allLettersSkippedOnce;
    }
  },
  x_marks_spot: {
    id: 'x_marks_spot',
    title: 'X Marca el Punto',
    description: 'Acierta la letra X en cinco partidas diferentes.',
    icon: 'fas fa-x',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      let xCount = 0;
      
      history.forEach(game => {
        if (game.letters && game.letters['X'] === 'correct') {
          xCount++;
        }
      });
      
      return xCount >= 5;
    }
  },
  y_not: {
    id: 'y_not',
    title: '¿Y Por Qué No?',
    description: 'Acierta la letra Y en cinco partidas diferentes.',
    icon: 'fas fa-y',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      let yCount = 0;
      
      history.forEach(game => {
        if (game.letters && game.letters['Y'] === 'correct') {
          yCount++;
        }
      });
      
      return yCount >= 5;
    }
  },
  world_cup_champion: {
    id: 'world_cup_champion',
    title: 'Campeón del Mundial',
    description: 'Gana 7 partidas en dificultad difícil.',
    icon: 'fas fa-trophy',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      const hardWins = history.filter(game => 
        game.victory && game.difficulty === 'dificil'
      ).length;
      return hardWins >= 7;
    }
  },
  maradona: {
    id: 'maradona',
    title: 'Maradona',
    description: 'Gana 10 partidas en dificultad difícil.',
    icon: 'fas fa-hand',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      const hardWins = history.filter(game => 
        game.victory && game.difficulty === 'dificil'
      ).length;
      return hardWins >= 10;
    }
  },
  marathon_winner: {
    id: 'marathon_winner',
    title: 'Ganador de Maratón',
    description: 'Gana 5 partidas en un solo día.',
    icon: 'fas fa-medal',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      
      // Obtener fecha actual YYYY-MM-DD
      const today = new Date();
      const dateString = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
      
      // Contar victorias de hoy
      let todayWins = 0;
      history.forEach(game => {
        if (game.date && game.victory) {
          const gameDate = new Date(game.date);
          const gameDateString = `${gameDate.getFullYear()}-${gameDate.getMonth()+1}-${gameDate.getDate()}`;
          
          if (gameDateString === dateString) {
            todayWins++;
          }
        }
      });
      
      return todayWins >= 5;
    }
  },
  weekend_champion: {
    id: 'weekend_champion',
    title: 'Campeón de Fin de Semana',
    description: 'Gana 3 partidas en un solo día de fin de semana.',
    icon: 'fas fa-couch',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      const today = new Date();
      
      // Verificar si es fin de semana (0 = domingo, 6 = sábado)
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;
      if (!isWeekend) return false;
      
      const dateString = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
      
      // Contar victorias de hoy
      let todayWins = 0;
      history.forEach(game => {
        if (game.date && game.victory) {
          const gameDate = new Date(game.date);
          const gameDateString = `${gameDate.getFullYear()}-${gameDate.getMonth()+1}-${gameDate.getDate()}`;
          
          if (gameDateString === dateString) {
            todayWins++;
          }
        }
      });
      
      return todayWins >= 3;
    }
  },
  twenty_consecutive: {
    id: 'twenty_consecutive',
    title: 'Veinte Seguidas',
    description: 'Acierta 20 respuestas consecutivas en una partida.',
    icon: 'fas fa-fire-flame-simple',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      return stats.longestStreak && stats.longestStreak >= 20;
    }
  },
  mind_reader: {
    id: 'mind_reader',
    title: 'Lector de Mentes',
    description: 'Gana una partida sin usar pistas y con al menos 20 aciertos.',
    icon: 'fas fa-hat-wizard',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      return stats.result === 'victory' && 
             stats.noHelp && 
             stats.correctAnswers >= 20;
    }
  },
  speed_run: {
    id: 'speed_run',
    title: 'Carrera Contra Reloj',
    description: 'Completa una partida en menos de 60 segundos.',
    icon: 'fas fa-rabbit-running',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      return stats.result === 'victory' && stats.totalTimePlayed < 60;
    }
  },
  perfect_vowels_hard: {
    id: 'perfect_vowels_hard',
    title: 'Maestro Vocal',
    description: 'Acierta todas las vocales en una partida de dificultad difícil.',
    icon: 'fas fa-whiskey-glass',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      if (stats.difficulty !== 'dificil') return false;
      
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      
      if (!stats.letters) return false;
      
      return vowels.every(letter => stats.letters[letter] === 'correct');
    }
  },
  
  // === NUEVOS MAESTRÍA (5 más) ===
  ninety_nine_problems: {
    id: 'ninety_nine_problems',
    title: '99 Problemas',
    description: 'Acumula 99 respuestas incorrectas en total.',
    icon: 'fas fa-circle-xmark',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      const totalIncorrect = history.reduce((sum, game) => sum + (game.wrong || 0), 0);
      return totalIncorrect >= 99;
    }
  },
  champion_league: {
    id: 'champion_league',
    title: 'Liga de Campeones',
    description: 'Gana 5 partidas en difícil consecutivas.',
    icon: 'fas fa-trophy-star',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 5);
      return history.length >= 5 && 
             history.every(game => game.victory && game.difficulty === 'dificil');
    }
  },
  hundred_wins: {
    id: 'hundred_wins',
    title: 'Centenario de Victorias',
    description: 'Acumula 100 victorias en total.',
    icon: 'fas fa-award',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      const wins = history.filter(game => game.victory).length;
      return wins >= 100;
    }
  },
  five_perfect_games: {
    id: 'five_perfect_games',
    title: 'Perfeccionista',
    description: 'Completa 5 roscos perfectos en total (sin errores ni saltos).',
    icon: 'fas fa-diamond',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      const perfectGames = history.filter(game => 
        game.victory && game.wrong === 0 && game.skipped === 0
      ).length;
      return perfectGames >= 5;
    }
  },
  monthly_player: {
    id: 'monthly_player',
    title: 'Jugador Mensual',
    description: 'Juega al menos una partida en 30 días diferentes.',
    icon: 'fas fa-calendar-days',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      
      // Crear un conjunto para días únicos
      const uniqueDays = new Set();
      
      history.forEach(game => {
        if (game.date) {
          const date = new Date(game.date);
          const dateKey = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
          uniqueDays.add(dateKey);
        }
      });
      
      return uniqueDays.size >= 30;
    }
  },
  
  // === NUEVOS ESPECIAL (5 más) ===
  palindrome_day: {
    id: 'palindrome_day',
    title: 'Día Palíndromo',
    description: 'Juega en una fecha palíndroma (ej. 22/02/2022).',
    icon: 'fas fa-rotate-left',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = String(today.getFullYear());
      
      // Verificar formato DD/MM/AAAA
      const dateStr = day + month + year;
      const reversed = dateStr.split('').reverse().join('');
      
      return dateStr === reversed;
    }
  },
  first_of_month: {
    id: 'first_of_month',
    title: 'Primer Día',
    description: 'Gana una partida el primer día del mes.',
    icon: 'fas fa-1',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      return stats.result === 'victory' && new Date().getDate() === 1;
    }
  },
  friday_13: {
    id: 'friday_13',
    title: 'Viernes 13',
    description: 'Juega una partida en un viernes 13.',
    icon: 'fas fa-ghost',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const today = new Date();
      return today.getDay() === 5 && today.getDate() === 13;
    }
  },
  world_cup_day: {
    id: 'world_cup_day',
    title: 'Día del Mundial',
    description: 'Juega una partida el 18 de diciembre, fecha de la final de Qatar 2022.',
    icon: 'fas fa-earth-americas',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const today = new Date();
      return today.getDate() === 18 && today.getMonth() === 11; // Diciembre es 11 (0-indexado)
    }
  },
  maradona_day: {
    id: 'maradona_day',
    title: 'Día de Maradona',
    description: 'Juega una partida el 30 de octubre (cumpleaños de Maradona) o el 25 de noviembre.',
    icon: 'fas fa-10',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-12
      const day = today.getDate();
      
      return (month === 10 && day === 30) || (month === 11 && day === 25);
    }
  },
  
  // === 25 NUEVOS LOGROS ADICIONALES ===
  
  // === NUEVOS PRINCIPIANTE (4 más) ===
  early_bird: {
    id: 'early_bird',
    title: 'Madrugador',
    description: 'Juega una partida antes de las 8:00 AM.',
    icon: 'fas fa-sunrise',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour < 8;
    }
  },
  night_owl: {
    id: 'night_owl',
    title: 'Noctámbulo',
    description: 'Juega una partida después de las 11:00 PM.',
    icon: 'fas fa-moon',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 23;
    }
  },
  lunch_break: {
    id: 'lunch_break',
    title: 'Pausa para Almorzar',
    description: 'Juega una partida entre las 12:00 PM y las 2:00 PM.',
    icon: 'fas fa-utensils',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 12 && hour < 14;
    }
  },
  close_one: {
    id: 'close_one',
    title: 'Por los Pelos',
    description: 'Gana una partida con menos de 10 segundos restantes.',
    icon: 'fas fa-stopwatch',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      return stats.result === 'victory' && stats.timeLeft < 10;
    }
  },
  
  // === NUEVOS INTERMEDIO (6 más) ===
  comeback_kid: {
    id: 'comeback_kid',
    title: 'Remontada',
    description: 'Gana una partida después de tener 5 o más respuestas incorrectas.',
    icon: 'fas fa-arrow-trend-up',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      return stats.result === 'victory' && stats.incorrectAnswers >= 5;
    }
  },
  alphabet_explorer: {
    id: 'alphabet_explorer',
    title: 'Explorador del Alfabeto',
    description: 'Responde correctamente a preguntas de al menos 15 letras diferentes en una partida.',
    icon: 'fas fa-magnifying-glass',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      if (!stats.letters) return false;
      
      let correctLetters = 0;
      for (const letter in stats.letters) {
        if (stats.letters[letter] === 'correct') {
          correctLetters++;
        }
      }
      
      return correctLetters >= 15;
    }
  },
  time_master: {
    id: 'time_master',
    title: 'Maestro del Tiempo',
    description: 'Gana una partida dejando más de 2 minutos en el reloj.',
    icon: 'fas fa-hourglass-half',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      return stats.result === 'victory' && stats.timeLeft >= 120;
    }
  },
  streak_5: {
    id: 'streak_5',
    title: 'Racha Breve',
    description: 'Consigue una racha de 5 respuestas correctas consecutivas.',
    icon: 'fas fa-fire',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      return stats.longestStreak >= 5;
    }
  },
  three_day_streak: {
    id: 'three_day_streak',
    title: 'Constancia',
    description: 'Juega al menos una partida durante 3 días consecutivos.',
    icon: 'fas fa-calendar-check',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const history = getGameHistory();
      const uniqueDays = new Set();
      
      // Ordenar partidas por fecha
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Buscar días consecutivos
      const dateMap = {};
      
      history.forEach(game => {
        if (game.date) {
          const date = new Date(game.date);
          const dateKey = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
          dateMap[dateKey] = true;
        }
      });
      
      const dates = Object.keys(dateMap).sort().reverse();
      let streak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < dates.length; i++) {
        const currDate = new Date(dates[i].split('-'));
        const prevDate = new Date(dates[i-1].split('-'));
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      
      return maxStreak >= 3;
    }
  },
  
  // === NUEVOS EXPERTO (7 más) ===
  streak_10: {
    id: 'streak_10',
    title: 'En Racha',
    description: 'Consigue una racha de 10 respuestas correctas consecutivas.',
    icon: 'fas fa-bolt',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      return stats.longestStreak >= 10;
    }
  },
  streak_15: {
    id: 'streak_15',
    title: 'Racha Imparable',
    description: 'Consigue una racha de 15 respuestas correctas consecutivas.',
    icon: 'fas fa-bolt-lightning',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      return stats.longestStreak >= 15;
    }
  },
  hard_mode_master: {
    id: 'hard_mode_master',
    title: 'Maestro del Modo Difícil',
    description: 'Gana 5 partidas en dificultad difícil.',
    icon: 'fas fa-trophy',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      const hardWins = history.filter(game => 
        game.victory && game.difficulty === 'hard'
      ).length;
      
      return hardWins >= 5;
    }
  },
  speed_demon: {
    id: 'speed_demon',
    title: 'Velocista',
    description: 'Completa una partida en menos de 3 minutos.',
    icon: 'fas fa-gauge-high',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      // Asumiendo que totalTime está en segundos
      return stats.result === 'victory' && stats.totalTime && stats.totalTime < 180;
    }
  },
  vowel_expert: {
    id: 'vowel_expert',
    title: 'Maestro de las Vocales',
    description: 'Acierta todas las vocales (A, E, I, O, U) en una misma partida.',
    icon: 'fas fa-comment',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      if (!stats.letters) return false;
      
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      return vowels.every(vowel => stats.letters[vowel] === 'correct');
    }
  },
  consonant_expert: {
    id: 'consonant_expert',
    title: 'Maestro de las Consonantes Difíciles',
    description: 'Acierta las letras K, Q, W, X y Z en una misma partida.',
    icon: 'fas fa-language',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      if (!stats.letters) return false;
      
      const hardConsonants = ['K', 'Q', 'W', 'X', 'Z'];
      return hardConsonants.every(consonant => stats.letters[consonant] === 'correct');
    }
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    title: 'Guerrero de Fin de Semana',
    description: 'Gana 3 partidas en un mismo fin de semana (sábado y domingo).',
    icon: 'fas fa-couch',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      const today = new Date();
      
      // Calcular el inicio del fin de semana actual (sábado)
      const currentWeekendStart = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToSaturday = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;
      currentWeekendStart.setDate(today.getDate() + daysToSaturday);
      currentWeekendStart.setHours(0, 0, 0, 0);
      
      // Calcular el fin del fin de semana actual (domingo)
      const currentWeekendEnd = new Date(currentWeekendStart);
      currentWeekendEnd.setDate(currentWeekendStart.getDate() + 1);
      currentWeekendEnd.setHours(23, 59, 59, 999);
      
      // Contar victorias en el fin de semana actual
      let weekendWins = 0;
      
      history.forEach(game => {
        if (game.date && game.victory) {
          const gameDate = new Date(game.date);
          if (gameDate >= currentWeekendStart && gameDate <= currentWeekendEnd) {
            weekendWins++;
          }
        }
      });
      
      return weekendWins >= 3;
    }
  },
  
  // === NUEVOS MAESTRÍA (4 más) ===
  streak_20: {
    id: 'streak_20',
    title: 'Racha Legendaria',
    description: 'Consigue una racha de 20 respuestas correctas consecutivas.',
    icon: 'fas fa-meteor',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      return stats.longestStreak >= 20;
    }
  },
  tenacity: {
    id: 'tenacity',
    title: 'Tenacidad',
    description: 'Juega 50 partidas en total.',
    icon: 'fas fa-dumbbell',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      return history.length >= 50;
    }
  },
  grandmaster: {
    id: 'grandmaster',
    title: 'Gran Maestro',
    description: 'Gana 10 partidas consecutivas en cualquier dificultad.',
    icon: 'fas fa-crown',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 10);
      return history.length >= 10 && history.every(game => game.victory);
    }
  },
  all_difficulties: {
    id: 'all_difficulties',
    title: 'Omnipotente',
    description: 'Gana al menos una partida en cada nivel de dificultad (fácil, normal, difícil).',
    icon: 'fas fa-layer-group',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      const easyWin = history.some(game => game.victory && game.difficulty === 'easy');
      const normalWin = history.some(game => game.victory && game.difficulty === 'normal');
      const hardWin = history.some(game => game.victory && game.difficulty === 'hard');
      
      return easyWin && normalWin && hardWin;
    }
  },
  
  // === NUEVOS ESPECIAL (4 más) ===
  pressure_master: {
    id: 'pressure_master',
    title: 'Maestro de la Presión',
    description: 'Acierta 3 respuestas seguidas cuando queden menos de 15 segundos de tiempo.',
    icon: 'fas fa-clock',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      // Este logro requiere un seguimiento específico durante el juego
      return stats.pressureStreak && stats.pressureStreak >= 3;
    }
  },
  midnight_player: {
    id: 'midnight_player',
    title: 'Jugador de Medianoche',
    description: 'Gana una partida entre las 12:00 AM y las 1:00 AM.',
    icon: 'fas fa-cloud-moon',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour === 0 && stats.result === 'victory';
    }
  },
  argentina_day: {
    id: 'argentina_day',
    title: 'Día de la Patria',
    description: 'Gana una partida el 25 de mayo o el 9 de julio.',
    icon: 'fas fa-flag',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-12
      const day = today.getDate();
      
      return stats.result === 'victory' && 
             ((month === 5 && day === 25) || (month === 7 && day === 9));
    }
  },
  palindrome_score: {
    id: 'palindrome_score',
    title: 'Puntuación Palíndroma',
    description: 'Termina una partida con una puntuación que sea un palíndromo (como 121, 333, 2442).',
    icon: 'fas fa-repeat',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const score = stats.score || 0;
      const scoreStr = score.toString();
      const reversed = scoreStr.split('').reverse().join('');
      
      return scoreStr === reversed && score > 10;
    }
  }
};

// Make achievements accessible globally if needed (for legacy code)
if (!window.GAME_ACHIEVEMENTS) {
  window.GAME_ACHIEVEMENTS = window.FULL_GAME_ACHIEVEMENTS;
}

// Crear un array de logros para mostrar en el perfil
window.achievementsData = Object.keys(window.FULL_GAME_ACHIEVEMENTS).map(id => {
  const achievement = window.FULL_GAME_ACHIEVEMENTS[id];
  return {
    id: id,
    name: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category || achievement.type || 'general'
  };
});