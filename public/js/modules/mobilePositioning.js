/**
 * mobilePositioning.js - Optimizaciones para el posicionamiento del rosco en móviles
 * 
 * Este módulo se encarga de calcular y posicionar correctamente los elementos
 * del rosco para dispositivos móviles, asegurando una experiencia visual similar
 * a la de escritorio pero adaptada a pantallas pequeñas.
 */

const MobilePositioning = (function() {
  'use strict';
  
  // Configuración por defecto
  const config = {
    letterBases: {
      desktop: {
        containerSize: 650,
        letterSize: 55,
        activeLetterSize: 65,
        fontSizes: {
          normal: '26px',
          active: '28px'
        },
        ringRadius: 0.9,
        questionCardSize: 0.86
      },
      tablet: {
        containerSize: 450,
        letterSize: 45,
        activeLetterSize: 53,
        fontSizes: {
          normal: '20px',
          active: '22px'
        },
        ringRadius: 0.85,
        questionCardSize: 0.75
      },
      mobile: {
        containerSize: 340,
        letterSize: 38,
        activeLetterSize: 44,
        fontSizes: {
          normal: '18px',
          active: '20px'
        },
        ringRadius: 0.85,
        questionCardSize: 0.75
      },
      smallMobile: {
        containerSize: 300,
        letterSize: 30,
        activeLetterSize: 35,
        fontSizes: {
          normal: '15px',
          active: '17px'
        },
        ringRadius: 0.9,
        questionCardSize: 0.8
      },
      landscape: {
        containerSize: 320,
        letterSize: 32,
        activeLetterSize: 38,
        fontSizes: {
          normal: '15px',
          active: '17px'
        },
        ringRadius: 0.85,
        questionCardSize: 0.65
      }
    },
    
    // Para animaciones de transición
    transitionDuration: '0.3s',
    transitionTiming: 'cubic-bezier(0.25, 1, 0.5, 1)',
    
    // Para notch y safe areas
    hasSafeArea: false,
    
    // Tiempo entre reposicionamientos para evitar problemas de rendimiento
    debounceTime: 150,
    
    // Forzar el diseño circular en escritorio
    forceCircularDesktop: true
  };
  
  /**
   * Inicializa el módulo y configura los listeners necesarios
   */
  function init() {
    console.log("🔄 MobilePositioning inicializándose...");
    detectSafeArea();
    
    // Eliminar scrollbars que puedan causar problemas visuales
    hideScrollbars();
    
    // Ejecutar el posicionamiento inicial
    setTimeout(function() {
      console.log("🔄 Posicionando elementos del rosco...");
      positionRoscoElements();
      
      // También asegurar que se aplica a la versión de escritorio
      if (window.innerWidth > 1024) {
        console.log("🖥️ Detectado modo escritorio, aplicando posicionamiento circular...");
        makeQuestionCardCircular();
      }
    }, 200);
    
    // Reintentar varias veces para asegurar que se aplica correctamente
    setTimeout(function() {
      if (window.innerWidth > 1024) {
        makeQuestionCardCircular();
      }
    }, 500);
    
    setTimeout(function() {
      if (window.innerWidth > 1024) {
        makeQuestionCardCircular();
      }
    }, 1500);
    
    // Configurar listeners para cambios de tamaño y orientación
    window.addEventListener('resize', debounce(function() {
      positionRoscoElements();
      hideScrollbars();
      
      // También aplicar en escritorio después de resize
      if (window.innerWidth > 1024) {
        makeQuestionCardCircular();
      }
    }, config.debounceTime));
    
    window.addEventListener('orientationchange', function() {
      setTimeout(function() {
        positionRoscoElements();
        hideScrollbars();
      }, 300); // Retraso para asegurar que la orientación cambió
    });
    
    // Conectar con MobileUtils si está disponible
    if (window.MobileUtils) {
      window.addEventListener('mobileUtilsReady', function() {
        positionRoscoElements();
        hideScrollbars();
      });
      window.addEventListener('mobileOrientationChanged', function() {
        positionRoscoElements();
        hideScrollbars();
      });
    }
    
    // También ajustar cuando el juego esté listo
    window.addEventListener('gameLoaded', function() {
      positionRoscoElements();
      hideScrollbars();
      
      // También aplicar en escritorio cuando el juego esté listo
      if (window.innerWidth > 1024) {
        makeQuestionCardCircular();
      }
    });
    
    document.addEventListener('DOMContentLoaded', function() {
      positionRoscoElements();
      hideScrollbars();
      
      // También aplicar en escritorio cuando el DOM esté listo
      if (window.innerWidth > 1024) {
        setTimeout(makeQuestionCardCircular, 500);
      }
    });
  }
  
  /**
   * Oculta los scrollbars que puedan causar problemas visuales
   */
  function hideScrollbars() {
    // Ocultar scrollbars en el contenedor del rosco
    const roscoContainer = document.getElementById('rosco-container');
    if (roscoContainer) {
      roscoContainer.style.overflow = 'hidden';
    }
    
    // Ocultar scrollbars en otros elementos que puedan causarlos
    const questionCard = document.querySelector('.question-card');
    if (questionCard) {
      questionCard.style.overflow = 'hidden';
      
      const innerContent = questionCard.querySelector('.question-card-inner');
      if (innerContent) {
        // Permitir scroll pero ocultar la barra
        innerContent.style.overflow = 'auto';
        innerContent.style.scrollbarWidth = 'none'; // Firefox
        innerContent.style.msOverflowStyle = 'none'; // IE/Edge
        innerContent.style.webkitOverflowScrolling = 'touch'; // Para mejor scroll en iOS
        innerContent.style.overflowX = 'hidden';
      }
    }
    
    // Ocultar scrollbars globales si es necesario
    document.documentElement.style.overflowX = 'hidden';
    
    // Estilos globales para ocultar scrollbars
    const style = document.createElement('style');
    style.textContent = `
      .question-card-inner::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
      .rosco-container::-webkit-scrollbar {
        display: none !important;
      }
      #rosco-container::-webkit-scrollbar {
        display: none !important;
      }
    `;
    
    // Añadir estilos solo si no existen ya
    if (!document.getElementById('hide-scrollbars-style')) {
      style.id = 'hide-scrollbars-style';
      document.head.appendChild(style);
    }
  }
  
  /**
   * Detecta si el dispositivo tiene safe area (notch)
   */
  function detectSafeArea() {
    const hasSafeArea = CSS.supports('padding: env(safe-area-inset-top)');
    config.hasSafeArea = hasSafeArea;
    
    if (hasSafeArea) {
      document.documentElement.classList.add('has-safe-area');
    }
  }
  
  /**
   * Fuerza el diseño circular para el contenedor de preguntas en escritorio
   */
  function makeQuestionCardCircular() {
    console.log("🔄 Aplicando diseño circular a la tarjeta de preguntas...");
    const questionCard = document.querySelector('.question-card');
    const roscoContainer = document.getElementById('rosco-container');
    
    if (!questionCard || !roscoContainer) {
      console.warn("⚠️ No se encontró la tarjeta de preguntas o el contenedor del rosco");
      return;
    }
    
    const deviceConfig = getDeviceConfig();
    const roscoSize = deviceConfig.containerSize;
    
    // Calcular el radio del anillo donde están las letras
    const letterRingRadius = (roscoSize / 2) * deviceConfig.ringRadius;
    
    // Calcular el tamaño de la letra activa para saber cuánto espacio dejar
    const letterSize = deviceConfig.activeLetterSize; 
    
    // Calcular el radio interno para que llegue justo hasta antes de las letras
    // Reducimos el margen para que llegue más cerca de las letras
    const innerRadius = letterRingRadius - letterSize * 0.55;
    
    // Forzar estilos
    questionCard.style.cssText = `
      position: absolute !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: ${innerRadius * 2}px !important;
      height: ${innerRadius * 2}px !important;
      max-width: ${innerRadius * 2}px !important;
      max-height: ${innerRadius * 2}px !important;
      border-radius: 50% !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      overflow: hidden !important;
      background-color: rgba(9, 14, 31, 0.95) !important;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5) !important;
      border: 2px solid rgba(255, 255, 255, 0.1) !important;
      z-index: 5 !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    `;
    
    // Crear contenedor interior para el contenido si no existe
    let innerContent = questionCard.querySelector('.question-card-inner');
    if (!innerContent) {
      console.log("📦 Creando contenedor interno para la tarjeta de preguntas");
      innerContent = document.createElement('div');
      innerContent.className = 'question-card-inner';
      
      // Mover todo el contenido dentro de este contenedor interno
      while (questionCard.firstChild) {
        innerContent.appendChild(questionCard.firstChild);
      }
      questionCard.appendChild(innerContent);
    }
    
    // Reducir el padding para aprovechar más espacio
    innerContent.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      padding: 12% !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      text-align: center !important;
      overflow: auto !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      overscroll-behavior: contain !important;
      overflow-x: hidden !important;
    `;
    
    // Eliminar la barra de desplazamiento en webkit
    innerContent.style.webkitOverflowScrolling = 'touch';
    
    // Añadir regla para webkit
    innerContent.style.cssText += `
      &::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
    `;
    
    // Ajustar elementos internos con estilos importantes
    const letterDisplay = innerContent.querySelector('.current-letter-display');
    if (letterDisplay) {
      letterDisplay.style.cssText = `
        font-size: 4rem !important;
        margin-bottom: 12px !important;
        text-align: center !important;
        font-weight: bold !important;
      `;
    }
    
    const currentQuestion = innerContent.querySelector('.current-question');
    if (currentQuestion) {
      currentQuestion.style.cssText = `
        margin-bottom: 12px !important;
        font-size: 1.35rem !important;
        line-height: 1.4 !important;
        text-align: center !important;
      `;
    }
    
    const currentDefinition = innerContent.querySelector('.current-definition');
    if (currentDefinition) {
      currentDefinition.style.cssText = `
        margin-bottom: 18px !important;
        font-size: 1.2rem !important;
        line-height: 1.4 !important;
        text-align: center !important;
      `;
    }
    
    // Ajustar formulario para modo circular
    const answerForm = innerContent.querySelector('.answer-form');
    if (answerForm) {
      answerForm.style.cssText = `
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        width: 100% !important;
        align-items: center !important;
      `;
    }
    
    // Ajustar input
    const answerInput = innerContent.querySelector('.answer-input');
    if (answerInput) {
      answerInput.style.cssText = `
        width: 90% !important;
        padding: 10px 15px !important;
        border-radius: 30px !important;
        font-size: 1.1rem !important;
        height: 45px !important;
        box-sizing: border-box !important;
        text-align: center !important;
      `;
    }
    
    // Ajustar botones
    const actionButtons = innerContent.querySelectorAll('button');
    if (actionButtons.length) {
      actionButtons.forEach(button => {
        button.style.cssText = `
          padding: 10px 18px !important;
          font-size: 1.05rem !important;
          border-radius: 30px !important;
          margin: 0 6px !important;
          height: 45px !important;
          min-height: 45px !important;
          box-sizing: border-box !important;
        `;
      });
    }
    
    // Estilos especiales para el contenedor de botones
    const buttonContainer = innerContent.querySelector('.button-container');
    if (buttonContainer) {
      buttonContainer.style.cssText = `
        display: flex !important;
        flex-direction: row !important;
        justify-content: center !important;
        gap: 12px !important;
        flex-wrap: wrap !important;
        width: 100% !important;
      `;
    }
    
    // Posicionar las letras alrededor de la circunferencia
    const roscoLetters = roscoContainer.querySelectorAll('.rosco-letter');
    const letterCount = roscoLetters.length;
    const radius = (roscoSize / 2) * deviceConfig.ringRadius;
    
    roscoLetters.forEach((letter, index) => {
      const angle = (index * (2 * Math.PI / letterCount)) - Math.PI/2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      // Aplicar estilos importantes
      letter.style.cssText = `
        position: absolute !important;
        left: calc(50% + ${x}px) !important;
        top: calc(50% + ${y}px) !important;
        transform: translate(-50%, -50%) !important;
        width: ${letter.classList.contains('current') ? deviceConfig.activeLetterSize : deviceConfig.letterSize}px !important;
        height: ${letter.classList.contains('current') ? deviceConfig.activeLetterSize : deviceConfig.letterSize}px !important;
        font-size: ${letter.classList.contains('current') ? deviceConfig.fontSizes.active : deviceConfig.fontSizes.normal} !important;
        z-index: 10 !important;
        transition: all ${config.transitionDuration} ${config.transitionTiming} !important;
      `;
    });
    
    // Ajustar el tamaño del contenedor del rosco para ocupar más espacio
    roscoContainer.style.width = `${roscoSize}px`;
    roscoContainer.style.height = `${roscoSize}px`;
    roscoContainer.style.margin = '0 auto';
    roscoContainer.style.position = 'relative';
    roscoContainer.style.overflow = 'hidden';
    
    console.log("✅ Diseño circular aplicado correctamente");
  }
  
  /**
   * Obtiene la configuración apropiada según el tamaño de pantalla
   */
  function getDeviceConfig() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    
    // Móvil en modo landscape (apaisado)
    if (isLandscape && height < 500) {
      return config.letterBases.landscape;
    }
    
    // Seleccionar basado en ancho de pantalla
    if (width <= 360) {
      return config.letterBases.smallMobile;
    } else if (width <= 480) {
      return config.letterBases.mobile;
    } else if (width <= 768) {
      return config.letterBases.tablet;
    } else {
      return config.letterBases.desktop;
    }
  }
  
  /**
   * Calcula y posiciona los elementos del rosco
   */
  function positionRoscoElements() {
    const roscoContainer = document.getElementById('rosco-container');
    if (!roscoContainer) {
      console.warn("⚠️ No se encontró el contenedor del rosco");
      return;
    }
    
    const roscoLetters = roscoContainer.querySelectorAll('.rosco-letter');
    if (!roscoLetters.length) {
      console.warn("⚠️ No se encontraron letras del rosco");
      return;
    }
    
    // Obtener configuración según dispositivo
    const deviceConfig = getDeviceConfig();
    
    // Ajustar el tamaño del contenedor del rosco para ocupar más espacio
    roscoContainer.style.width = `${deviceConfig.containerSize}px`;
    roscoContainer.style.height = `${deviceConfig.containerSize}px`;
    roscoContainer.style.margin = '0 auto';
    roscoContainer.style.position = 'relative';
    roscoContainer.style.overflow = 'hidden';
    
    // Calcular el radio para posicionar las letras
    const radius = (deviceConfig.containerSize / 2) * deviceConfig.ringRadius;
    
    // Calcular y aplicar posiciones para cada letra
    roscoLetters.forEach((letter, index) => {
      const angle = (index * (2 * Math.PI / roscoLetters.length)) - Math.PI/2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      // Aplicar posición
      letter.style.left = `calc(50% + ${x}px)`;
      letter.style.top = `calc(50% + ${y}px)`;
      letter.style.transform = 'translate(-50%, -50%)';
      letter.style.position = 'absolute';
      
      // Ajustar tamaño y fuente
      const isActive = letter.classList.contains('current');
      
      // Tamaño
      letter.style.width = `${isActive ? deviceConfig.activeLetterSize : deviceConfig.letterSize}px`;
      letter.style.height = `${isActive ? deviceConfig.activeLetterSize : deviceConfig.letterSize}px`;
      
      // Fuente
      letter.style.fontSize = isActive ? deviceConfig.fontSizes.active : deviceConfig.fontSizes.normal;
      
      // Transición suave
      letter.style.transition = `all ${config.transitionDuration} ${config.transitionTiming}`;
    });
    
    // Posicionamiento de la tarjeta de pregunta
    positionQuestionCard(deviceConfig);
    
    // Si estamos en escritorio y se debe forzar el diseño circular
    if (window.innerWidth > 1024 && config.forceCircularDesktop) {
      makeQuestionCardCircular();
    }
    
    // Ocultar posibles scrollbars
    hideScrollbars();
  }
  
  /**
   * Posiciona la tarjeta de pregunta según el modo (portrait/landscape)
   */
  function positionQuestionCard(deviceConfig) {
    const questionCard = document.querySelector('.question-card');
    if (!questionCard) {
      console.warn("⚠️ No se encontró la tarjeta de preguntas");
      return;
    }
    
    const roscoContainer = document.getElementById('rosco-container');
    if (!roscoContainer) return;
    
    const isLandscape = window.innerWidth > window.innerHeight;
    const isDesktop = window.innerWidth > 1024;
    
    if (isLandscape && window.innerWidth > 600 && !isDesktop) {
      // En landscape en tablets y más grandes, posicionar al lado
      questionCard.style.position = 'static';
      questionCard.style.transform = 'none';
      questionCard.style.width = '40%';
      questionCard.style.maxWidth = 'none';
      questionCard.style.margin = '0 0 0 20px';
      questionCard.style.borderRadius = '12px';
    } else if (isLandscape && window.innerHeight < 500) {
      // En landscape en móviles pequeños
      questionCard.style.position = 'static';
      questionCard.style.transform = 'none';
      questionCard.style.width = 'calc(100% - 280px)';
      questionCard.style.margin = '0 auto';
      questionCard.style.maxHeight = `${window.innerHeight - 100}px`;
      questionCard.style.overflow = 'auto';
      questionCard.style.borderRadius = '12px';
    } else if (isDesktop) {
      // En escritorio, hacer que el contenedor sea circular y las letras formen su contorno
      // Aquí no hacemos nada ya que makeQuestionCardCircular() se encargará de aplicar los estilos
      return;
    } else {
      // En portrait, centrar bajo el rosco
      questionCard.style.position = 'relative';
      questionCard.style.width = '90%';
      questionCard.style.maxWidth = `${deviceConfig.containerSize * 1.1}px`;
      questionCard.style.margin = '15px auto';
      questionCard.style.transform = 'none';
      questionCard.style.borderRadius = '12px';
    }
    
    // Optimizar tarjeta para dispositivos pequeños
    if (window.innerWidth <= 480) {
      const letterDisplay = questionCard.querySelector('.current-letter-display');
      if (letterDisplay) {
        letterDisplay.style.fontSize = '2.5rem';
      }
      
      const buttons = questionCard.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.padding = '10px';
        button.style.fontSize = '0.9rem';
      });
    }
  }
  
  /**
   * Optimiza la interfaz cuando el juego se inicia
   */
  function optimizeGameInterface() {
    // Optimizar la barra de estado
    optimizeStatusBar();
    
    // Optimizar los botones flotantes
    positionFloatingButtons();
    
    // Mejora el formulario de respuesta
    optimizeAnswerForm();
    
    // Forzar el diseño circular en escritorio si está configurado
    if (window.innerWidth > 1024 && config.forceCircularDesktop) {
      makeQuestionCardCircular();
    }
  }
  
  /**
   * Optimiza la barra de estado del juego
   */
  function optimizeStatusBar() {
    const statusBar = document.querySelector('.rosco-status');
    if (!statusBar) return;
    
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallScreen = window.innerWidth <= 480;
    
    if (isLandscape && window.innerHeight < 500) {
      // En landscape pequeño, colocar a la derecha
      statusBar.style.position = 'absolute';
      statusBar.style.right = '10px';
      statusBar.style.top = '10px';
      statusBar.style.width = 'auto';
      statusBar.style.flexDirection = 'column';
      statusBar.style.maxWidth = '120px';
    } else if (isSmallScreen) {
      // En móviles pequeños, usar grid de 2 columnas
      statusBar.style.display = 'grid';
      statusBar.style.gridTemplateColumns = 'repeat(2, 1fr)';
      statusBar.style.width = '100%';
      statusBar.style.maxWidth = '320px';
      statusBar.style.margin = '10px auto';
    } else {
      // En tabletas y escritorio, fila flexible
      statusBar.style.display = 'flex';
      statusBar.style.flexWrap = 'wrap';
      statusBar.style.justifyContent = 'center';
      statusBar.style.width = '100%';
      statusBar.style.maxWidth = '600px';
      statusBar.style.margin = '15px auto';
    }
  }
  
  /**
   * Posiciona los botones flotantes adecuadamente
   */
  function positionFloatingButtons() {
    const soundButton = document.querySelector('.floating-sound-btn');
    const backButton = document.querySelector('.back-button');
    
    if (!soundButton && !backButton) return;
    
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallScreen = window.innerWidth <= 480;
    
    let buttonSize, bottomPosition, rightPosition, rightOffset;
    
    if (isLandscape && window.innerHeight < 500) {
      // En landscape pequeño
      buttonSize = '40px';
      bottomPosition = '10px';
      rightPosition = '10px';
      rightOffset = '60px';
    } else if (isSmallScreen) {
      // En móviles pequeños
      buttonSize = '45px';
      bottomPosition = '20px';
      rightPosition = '20px';
      rightOffset = '75px';
    } else {
      // En tabletas y escritorio
      buttonSize = '55px';
      bottomPosition = '25px';
      rightPosition = '25px';
      rightOffset = '90px';
    }
    
    // Aplicar estilos a los botones
    if (backButton) {
      backButton.style.width = buttonSize;
      backButton.style.height = buttonSize;
      backButton.style.bottom = bottomPosition;
      backButton.style.right = rightPosition;
    }
    
    if (soundButton) {
      soundButton.style.width = buttonSize;
      soundButton.style.height = buttonSize;
      soundButton.style.bottom = bottomPosition;
      soundButton.style.right = rightOffset;
    }
    
    // Ajustar por safe area si es necesario
    if (config.hasSafeArea) {
      const safeBottom = 'max(10px, env(safe-area-inset-bottom))';
      if (backButton) backButton.style.bottom = safeBottom;
      if (soundButton) soundButton.style.bottom = safeBottom;
    }
  }
  
  /**
   * Optimiza el formulario de respuesta
   */
  function optimizeAnswerForm() {
    const answerForm = document.querySelector('.answer-form');
    if (!answerForm) return;
    
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallScreen = window.innerWidth <= 480;
    
    if (isLandscape && window.innerHeight < 500) {
      // Modo landscape pequeño, inputs y botones en fila pero más compactos
      answerForm.style.flexDirection = 'row';
      answerForm.style.flexWrap = 'wrap';
      answerForm.style.gap = '5px';
      
      const answerInput = answerForm.querySelector('.answer-input');
      if (answerInput) {
        answerInput.style.flex = '1 1 100%';
        answerInput.style.marginBottom = '5px';
        answerInput.style.height = '40px';
        answerInput.style.fontSize = '0.9rem';
      }
      
      const submitBtn = answerForm.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.style.width = '40px';
        submitBtn.style.height = '40px';
        submitBtn.style.padding = '0';
      }
      
      const actionButtons = answerForm.querySelectorAll('.skip-btn, .help-btn');
      actionButtons.forEach(btn => {
        btn.style.flex = '1';
        btn.style.height = '40px';
        btn.style.padding = '0 10px';
        btn.style.fontSize = '0.8rem';
      });
    } else if (isSmallScreen) {
      // Modo portrait en móviles pequeños
      answerForm.style.flexDirection = 'column';
      answerForm.style.gap = '10px';
      
      const answerInput = answerForm.querySelector('.answer-input');
      if (answerInput) {
        answerInput.style.width = '100%';
        answerInput.style.height = '44px';
        answerInput.style.fontSize = '16px';
      }
      
      const actionButtons = answerForm.querySelectorAll('.submit-btn, .skip-btn, .help-btn');
      actionButtons.forEach(btn => {
        btn.style.width = '100%';
        btn.style.margin = '0';
        btn.style.height = '44px';
      });
    } else {
      // Modo tablet y escritorio, layout flexible
      answerForm.style.flexDirection = 'column';
      answerForm.style.gap = '12px';
      
      const inputContainer = answerForm.querySelector('.input-container');
      if (inputContainer) {
        inputContainer.style.display = 'flex';
        inputContainer.style.width = '100%';
      }
      
      const actionButtons = answerForm.querySelectorAll('.skip-btn, .help-btn');
      actionButtons.forEach(btn => {
        btn.style.flex = '1';
        btn.style.height = '48px';
      });
    }
  }
  
  /**
   * Función helper para debounce
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // API pública
  return {
    init,
    positionRoscoElements,
    optimizeGameInterface,
    makeQuestionCardCircular
  };
})();

// Auto-inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  console.log("🎮 Inicializando MobilePositioning...");
  MobilePositioning.init();
  
  // Forzar el diseño circular para escritorio después de un breve retraso
  if (window.innerWidth > 1024) {
    console.log("🖥️ Detectado modo escritorio, asegurando aplicación de diseño circular...");
    setTimeout(function() {
      MobilePositioning.makeQuestionCardCircular();
    }, 1000);
    
    // Reforzar la aplicación para asegurar que se mantiene al actualizar
    setTimeout(function() {
      MobilePositioning.makeQuestionCardCircular();
    }, 2000);
  }
});

// También intentar inicializar inmediatamente si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log("📄 Documento ya cargado, inicializando inmediatamente...");
  setTimeout(function() {
    MobilePositioning.init();
    
    // Forzar el diseño circular para escritorio
    if (window.innerWidth > 1024) {
      MobilePositioning.makeQuestionCardCircular();
      
      // Reforzar la aplicación
      setTimeout(function() {
        MobilePositioning.makeQuestionCardCircular();
      }, 1000);
    }
  }, 100);
}

// Asegurar que se aplique al navegar o actualizar
window.addEventListener('pageshow', function(event) {
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    console.log("🔄 Página restaurada desde caché, reoptimizando...");
    setTimeout(function() {
      MobilePositioning.init();
      if (window.innerWidth > 1024) {
        MobilePositioning.makeQuestionCardCircular();
      }
    }, 200);
  }
}); 