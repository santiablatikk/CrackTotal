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
  
  // === NUEVOS LOGROS ADICIONALES (50 más) ===
  
  // === PRINCIPIANTE (10 más) ===
  early_morning_player: {
    id: 'early_morning_player',
    title: 'Jugador Madrugador',
    description: 'Juega una partida entre las 5:00 AM y las 8:00 AM.',
    icon: 'fas fa-sun',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 5 && hour < 8;
    }
  },
  late_night_player: {
    id: 'late_night_player',
    title: 'Búho Nocturno',
    description: 'Juega una partida entre las 11:00 PM y las 3:00 AM.',
    icon: 'fas fa-moon',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 23 || hour < 3;
    }
  },
  weekend_player: {
    id: 'weekend_player',
    title: 'Jugador de Fin de Semana',
    description: 'Juega una partida un sábado o domingo.',
    icon: 'fas fa-umbrella-beach',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 0 || day === 6; // Domingo o Sábado
    }
  },
  first_hard_game: {
    id: 'first_hard_game',
    title: 'Nivel Avanzado',
    description: 'Juega tu primera partida en dificultad difícil.',
    icon: 'fas fa-gauge-high',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => stats.difficulty === 'dificil'
  },
  six_letters: {
    id: 'six_letters',
    title: 'Media Docena',
    description: 'Acierta 6 letras en una partida.',
    icon: 'fas fa-6',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => stats.correctAnswers >= 6
  },
  alphabet_start: {
    id: 'alphabet_start',
    title: 'Principio del Alfabeto',
    description: 'Responde correctamente a las letras A, B y C en una misma partida.',
    icon: 'fas fa-a',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      if (!stats.letters) return false;
      return stats.letters['A'] === 'correct' && 
             stats.letters['B'] === 'correct' && 
             stats.letters['C'] === 'correct';
    }
  },
  monday_player: {
    id: 'monday_player',
    title: 'Jugador del Lunes',
    description: 'Gana una partida un lunes.',
    icon: 'fas fa-1',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 1 && stats.result === 'victory'; // Lunes
    }
  },
  first_timer: {
    id: 'first_timer',
    title: 'Primera Vez',
    description: 'Completa tu primera partida, independientemente del resultado.',
    icon: 'fas fa-hourglass-start',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => true // Siempre se desbloquea al terminar la primera partida
  },
  five_consecutive_answers: {
    id: 'five_consecutive_answers',
    title: 'Racha Inicial',
    description: 'Responde correctamente a 5 preguntas consecutivas.',
    icon: 'fas fa-bolt',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => stats.longestStreak >= 5
  },
  saturday_player: {
    id: 'saturday_player',
    title: 'Jugador del Sábado',
    description: 'Gana una partida un sábado.',
    icon: 'fas fa-6',
    category: ACHIEVEMENT_CATEGORIES.PRINCIPIANTE,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 6 && stats.result === 'victory'; // Sábado
    }
  },
  
  // === INTERMEDIO (15 más) ===
  comeback_kid: {
    id: 'comeback_kid',
    title: 'La Remontada',
    description: 'Gana una partida después de fallar las 2 primeras preguntas.',
    icon: 'fas fa-arrow-trend-up',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      if (!stats.startFails || !stats.result) return false;
      return stats.startFails >= 2 && stats.result === 'victory';
    }
  },
  a_to_e: {
    id: 'a_to_e',
    title: 'De la A a la E',
    description: 'Responde correctamente a todas las primeras 5 letras del alfabeto en una partida.',
    icon: 'fas fa-e',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      if (!stats.letters) return false;
      return stats.letters['A'] === 'correct' && 
             stats.letters['B'] === 'correct' && 
             stats.letters['C'] === 'correct' &&
             stats.letters['D'] === 'correct' &&
             stats.letters['E'] === 'correct';
    }
  },
  three_in_row: {
    id: 'three_in_row',
    title: 'Hat-Trick',
    description: 'Gana 3 partidas consecutivas.',
    icon: 'fas fa-crown',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 3);
      return history.length >= 3 && history.every(game => game.victory);
    }
  },
  seventeen_correct: {
    id: 'seventeen_correct',
    title: 'Diecisiete',
    description: 'Consigue 17 respuestas correctas en una partida.',
    icon: 'fas fa-certificate',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.correctAnswers >= 17
  },
  morning_coffee: {
    id: 'morning_coffee',
    title: 'Café Matutino',
    description: 'Gana una partida entre las 8:00 AM y las 10:00 AM.',
    icon: 'fas fa-mug-hot',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 8 && hour < 10 && stats.result === 'victory';
    }
  },
  dinner_time: {
    id: 'dinner_time',
    title: 'Hora de Cenar',
    description: 'Gana una partida entre las 8:00 PM y las 10:00 PM.',
    icon: 'fas fa-utensils',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 20 && hour < 22 && stats.result === 'victory';
    }
  },
  sunday_player: {
    id: 'sunday_player',
    title: 'Jugador del Domingo',
    description: 'Gana una partida un domingo.',
    icon: 'fas fa-church',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const day = new Date().getDay();
      return day === 0 && stats.result === 'victory'; // Domingo
    }
  },
  last_minute_hero: {
    id: 'last_minute_hero',
    title: 'Héroe de Último Minuto',
    description: 'Gana una partida con menos de 15 segundos restantes.',
    icon: 'fas fa-stopwatch',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.result === 'victory' && stats.timeRemaining > 0 && stats.timeRemaining < 15
  },
  i_know_vowels: {
    id: 'i_know_vowels',
    title: 'Maestro de Vocales',
    description: 'Responde correctamente a todas las vocales (A, E, I, O, U) en una misma partida.',
    icon: 'fas fa-font',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      if (!stats.letters) return false;
      return stats.letters['A'] === 'correct' && 
             stats.letters['E'] === 'correct' && 
             stats.letters['I'] === 'correct' &&
             stats.letters['O'] === 'correct' &&
             stats.letters['U'] === 'correct';
    }
  },
  seven_consecutive_answers: {
    id: 'seven_consecutive_answers',
    title: 'Siete de Suerte',
    description: 'Responde correctamente a 7 preguntas consecutivas.',
    icon: 'fas fa-dice-seven',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.longestStreak >= 7
  },
  no_skip_victory: {
    id: 'no_skip_victory',
    title: 'Sin Atajos',
    description: 'Gana una partida sin saltarte ninguna pregunta.',
    icon: 'fas fa-forward-step',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.result === 'victory' && stats.skippedAnswers === 0
  },
  double_digits: {
    id: 'double_digits',
    title: 'Doble Dígito',
    description: 'Consigue 10 o más respuestas correctas en 3 partidas consecutivas.',
    icon: 'fas fa-1',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 3);
      return history.length >= 3 && history.every(game => game.correct >= 10);
    }
  },
  time_bonus: {
    id: 'time_bonus',
    title: 'Tiempo Extra',
    description: 'Gana una partida con al menos 2 minutos restantes.',
    icon: 'fas fa-hourglass-half',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.result === 'victory' && stats.timeRemaining >= 120
  },
  one_mistake_victory: {
    id: 'one_mistake_victory',
    title: 'Casi Perfecto',
    description: 'Gana una partida con exactamente un error.',
    icon: 'fas fa-exclamation',
    category: ACHIEVEMENT_CATEGORIES.INTERMEDIO,
    condition: (stats) => stats.result === 'victory' && stats.incorrectAnswers === 1
  },
  
  // === EXPERTO (10 más) ===
  twenty_correct: {
    id: 'twenty_correct',
    title: 'Veinte Aciertos',
    description: 'Consigue 20 respuestas correctas en una partida.',
    icon: 'fas fa-2',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => stats.correctAnswers >= 20
  },
  ten_consecutive_answers: {
    id: 'ten_consecutive_answers',
    title: 'Racha de Diez',
    description: 'Responde correctamente a 10 preguntas consecutivas.',
    icon: 'fas fa-fire-flame-curved',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => stats.longestStreak >= 10
  },
  four_in_row: {
    id: 'four_in_row',
    title: 'Póker de Victorias',
    description: 'Gana 4 partidas consecutivas.',
    icon: 'fas fa-4',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 4);
      return history.length >= 4 && history.every(game => game.victory);
    }
  },
  hard_challenge_master: {
    id: 'hard_challenge_master',
    title: 'Desafío Extremo',
    description: 'Gana 3 partidas consecutivas en dificultad difícil.',
    icon: 'fas fa-skull',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 3);
      return history.length >= 3 && 
             history.every(game => game.victory && game.difficulty === 'dificil');
    }
  },
  consecutive_days_3: {
    id: 'consecutive_days_3',
    title: 'Hábito de Tres Días',
    description: 'Juega al menos una partida durante 3 días consecutivos.',
    icon: 'fas fa-calendar-check',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory();
      if (history.length < 3) return false;
      
      // Obtener fechas únicas ordenadas
      const uniqueDates = new Set();
      history.forEach(game => {
        if (game.date) {
          const date = new Date(game.date);
          uniqueDates.add(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`);
        }
      });
      
      const dates = Array.from(uniqueDates).sort();
      
      // Verificar si hay al menos 3 días consecutivos
      for (let i = 0; i < dates.length - 2; i++) {
        const date1 = new Date(dates[i]);
        const date2 = new Date(dates[i+1]);
        const date3 = new Date(dates[i+2]);
        
        const diffDays1 = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
        const diffDays2 = Math.floor((date3 - date2) / (1000 * 60 * 60 * 24));
        
        if (diffDays1 === 1 && diffDays2 === 1) {
          return true;
        }
      }
      
      return false;
    }
  },
  z_master: {
    id: 'z_master',
    title: 'Maestro de la Z',
    description: 'Responde correctamente a la letra Z en 3 partidas diferentes.',
    icon: 'fas fa-z',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 10);
      let count = 0;
      
      history.forEach(game => {
        if (game.letters && game.letters['Z'] === 'correct') {
          count++;
        }
      });
      
      return count >= 3;
    }
  },
  half_alphabet: {
    id: 'half_alphabet',
    title: 'Medio Alfabeto',
    description: 'Responde correctamente a 13 letras diferentes en una misma partida.',
    icon: 'fas fa-language',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      if (!stats.letters) return false;
      
      let correctCount = 0;
      for (const letter in stats.letters) {
        if (stats.letters[letter] === 'correct') {
          correctCount++;
        }
      }
      
      return correctCount >= 13;
    }
  },
  speed_expert: {
    id: 'speed_expert',
    title: 'Velocista Extremo',
    description: 'Gana una partida con más de 3 minutos restantes.',
    icon: 'fas fa-gauge-simple-high',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => stats.result === 'victory' && stats.timeRemaining >= 180
  },
  alphabet_end: {
    id: 'alphabet_end',
    title: 'Final del Alfabeto',
    description: 'Responde correctamente a las letras V, W, X, Y y Z en una misma partida.',
    icon: 'fas fa-z',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      if (!stats.letters) return false;
      return stats.letters['V'] === 'correct' && 
             stats.letters['W'] === 'correct' && 
             stats.letters['X'] === 'correct' &&
             stats.letters['Y'] === 'correct' &&
             stats.letters['Z'] === 'correct';
    }
  },
  no_help_needed: {
    id: 'no_help_needed',
    title: 'Sin Ayuda Externa',
    description: 'Gana 5 partidas consecutivas sin usar ninguna pista.',
    icon: 'fas fa-lightbulb',
    category: ACHIEVEMENT_CATEGORIES.EXPERTO,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 5);
      return history.length >= 5 && 
             history.every(game => game.victory && (!game.hintsUsed || game.hintsUsed === 0));
    }
  },
  
  // === MAESTRÍA (10 más) ===
  fifteen_consecutive_answers: {
    id: 'fifteen_consecutive_answers',
    title: 'Racha Imparable',
    description: 'Responde correctamente a 15 preguntas consecutivas.',
    icon: 'fas fa-fire',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => stats.longestStreak >= 15
  },
  five_in_row: {
    id: 'five_in_row',
    title: 'Cinco de Oro',
    description: 'Gana 5 partidas consecutivas.',
    icon: 'fas fa-5',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 5);
      return history.length >= 5 && history.every(game => game.victory);
    }
  },
  true_master: {
    id: 'true_master',
    title: 'Verdadero Maestro',
    description: 'Gana 3 partidas consecutivas en dificultad difícil sin cometer errores.',
    icon: 'fas fa-user-graduate',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory().slice(0, 3);
      return history.length >= 3 && 
             history.every(game => 
               game.victory && 
               game.difficulty === 'dificil' && 
               game.wrong === 0);
    }
  },
  consecutive_days_7: {
    id: 'consecutive_days_7',
    title: 'Hábito Semanal',
    description: 'Juega al menos una partida durante 7 días consecutivos.',
    icon: 'fas fa-calendar-week',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      if (history.length < 7) return false;
      
      // Obtener fechas únicas ordenadas
      const uniqueDates = new Set();
      history.forEach(game => {
        if (game.date) {
          const date = new Date(game.date);
          uniqueDates.add(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`);
        }
      });
      
      const dates = Array.from(uniqueDates).sort();
      
      // Verificar si hay al menos 7 días consecutivos
      for (let i = 0; i < dates.length - 6; i++) {
        let consecutive = true;
        
        for (let j = 0; j < 6; j++) {
          const date1 = new Date(dates[i+j]);
          const date2 = new Date(dates[i+j+1]);
          
          const diffDays = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
          
          if (diffDays !== 1) {
            consecutive = false;
            break;
          }
        }
        
        if (consecutive) {
          return true;
        }
      }
      
      return false;
    }
  },
  twentytwo_correct: {
    id: 'twentytwo_correct',
    title: 'Veintidós',
    description: 'Consigue 22 respuestas correctas en una partida.',
    icon: 'fas fa-trophy',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => stats.correctAnswers >= 22
  },
  perfect_ten: {
    id: 'perfect_ten',
    title: 'Diez Perfectos',
    description: 'Completa 10 partidas perfectas (sin errores ni omisiones).',
    icon: 'fas fa-diamond',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      const perfectGames = history.filter(game => 
        game.victory && game.wrong === 0 && game.skipped === 0
      ).length;
      return perfectGames >= 10;
    }
  },
  twenty_games: {
    id: 'twenty_games',
    title: 'Jugador Dedicado',
    description: 'Juega 20 partidas en total.',
    icon: 'fas fa-gamepad',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      return history.length >= 20;
    }
  },
  full_alphabet: {
    id: 'full_alphabet',
    title: 'Alfabeto Completo',
    description: 'Responde correctamente a todas las letras del alfabeto en una misma partida.',
    icon: 'fas fa-spell-check',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      if (!stats.letters) return false;
      
      // El alfabeto español tiene 27 letras
      const spanishAlphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
      
      for (const letter of spanishAlphabet) {
        if (!stats.letters[letter] || stats.letters[letter] !== 'correct') {
          return false;
        }
      }
      
      return true;
    }
  },
  twenty_consecutive_answers: {
    id: 'twenty_consecutive_answers',
    title: 'Racha de Campeón',
    description: 'Responde correctamente a 20 preguntas consecutivas.',
    icon: 'fas fa-medal',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => stats.longestStreak >= 20
  },
  fifty_wins: {
    id: 'fifty_wins',
    title: 'Medio Centenar',
    description: 'Alcanza 50 victorias en total.',
    icon: 'fas fa-5',
    category: ACHIEVEMENT_CATEGORIES.MAESTRIA,
    condition: (stats) => {
      const history = getGameHistory();
      const wins = history.filter(game => game.victory).length;
      return wins >= 50;
    }
  },
  
  // === COLECCIONISTA (3 más) ===
  category_master_principiante: {
    id: 'category_master_principiante',
    title: 'Coleccionista Principiante',
    description: 'Desbloquea todos los logros de la categoría Principiante.',
    icon: 'fas fa-award',
    category: ACHIEVEMENT_CATEGORIES.COLECCIONISTA,
    condition: (stats) => {
      // Esta lógica debe ser implementada en checkAchievements
      return false; // La lógica real requiere acceso a todos los logros desbloqueados
    }
  },
  category_master_intermedio: {
    id: 'category_master_intermedio',
    title: 'Coleccionista Intermedio',
    description: 'Desbloquea todos los logros de la categoría Intermedio.',
    icon: 'fas fa-medal',
    category: ACHIEVEMENT_CATEGORIES.COLECCIONISTA,
    condition: (stats) => {
      // Esta lógica debe ser implementada en checkAchievements
      return false; // La lógica real requiere acceso a todos los logros desbloqueados
    }
  },
  category_master_experto: {
    id: 'category_master_experto',
    title: 'Coleccionista Experto',
    description: 'Desbloquea todos los logros de la categoría Experto.',
    icon: 'fas fa-trophy',
    category: ACHIEVEMENT_CATEGORIES.COLECCIONISTA,
    condition: (stats) => {
      // Esta lógica debe ser implementada en checkAchievements
      return false; // La lógica real requiere acceso a todos los logros desbloqueados
    }
  },
  
  // === ESPECIAL (2 más) ===
  world_cup_day: {
    id: 'world_cup_day',
    title: 'Día del Mundial',
    description: 'Juega una partida el 18 de diciembre (día de la final del Mundial de Qatar 2022).',
    icon: 'fas fa-earth-americas',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-12
      const day = today.getDate();
      
      return month === 12 && day === 18;
    }
  },
  copa_america_day: {
    id: 'copa_america_day',
    title: 'Día de la Copa América',
    description: 'Juega una partida el 14 de julio (día de la final de la Copa América 2024).',
    icon: 'fas fa-trophy',
    category: ACHIEVEMENT_CATEGORIES.ESPECIAL,
    condition: (stats) => {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-12
      const day = today.getDate();
      
      return month === 7 && day === 14;
    }
  },
  
  // ... existing code ...
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