// ==========================================
// SCRIPT DE CONFIGURACIÓN AUTOMÁTICA DE FIREBASE
// ==========================================
// Este script verifica que Firebase esté correctamente configurado
// y crea los datos iniciales necesarios para el juego

import { db } from './assets/js/firebase-init.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    getDocs,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class FirebaseSetupManager {
    constructor() {
        this.isSetupComplete = false;
        this.setupErrors = [];
    }

    async runFullSetup() {
        console.log("🔥 Iniciando configuración automática de Firebase...");
        
        try {
            // Verificar conectividad
            await this.verifyFirebaseConnection();
            
            // Configurar datos iniciales
            await this.setupInitialGameConfig();
            
            // Verificar estructura de colecciones
            await this.verifyCollectionStructure();
            
            this.isSetupComplete = true;
            console.log("✅ Configuración de Firebase completada exitosamente");
            
            return {
                success: true,
                message: "Firebase configurado correctamente",
                errors: []
            };
            
        } catch (error) {
            console.error("❌ Error en la configuración de Firebase:", error);
            this.setupErrors.push(error.message);
            
            return {
                success: false,
                message: "Error en la configuración de Firebase",
                errors: this.setupErrors
            };
        }
    }

    async verifyFirebaseConnection() {
        console.log("📡 Verificando conexión a Firebase...");
        
        if (!db) {
            throw new Error("Base de datos Firebase no inicializada");
        }

        // Intentar una operación simple para verificar conectividad
        try {
            const testRef = doc(db, "gameConfig", "test");
            await getDoc(testRef);
            console.log("✅ Conexión a Firebase verificada");
        } catch (error) {
            if (error.code === 'permission-denied') {
                throw new Error("Permisos de Firestore denegados - verifica las reglas de seguridad");
            } else if (error.code === 'unavailable') {
                throw new Error("Servicio de Firestore no disponible - verifica tu conexión");
            } else {
                throw new Error(`Error de conectividad: ${error.message}`);
            }
        }
    }

    async setupInitialGameConfig() {
        console.log("⚙️ Configurando datos iniciales del juego...");
        
        // Configuración del juego Quien Sabe Más
        const quienSabeMasConfig = {
            gameType: "quiensabemas",
            maxPlayers: 2,
            maxLevel: 6,
            questionsPerLevel: 6,
            pointsPerCorrectAnswer: {
                1: 100,  // Level 1
                2: 150,  // Level 2
                3: 200,  // Level 3
                4: 250,  // Level 4
                5: 300,  // Level 5
                6: 400   // Level 6
            },
            timeoutPerQuestion: 30000, // 30 segundos
            powerUps: {
                fiftyFifty: true,
                skipQuestion: false,
                extraTime: false
            },
            lastUpdated: serverTimestamp()
        };

        // Configuración del juego Mentiroso
        const mentirosoConfig = {
            gameType: "mentiroso",
            maxPlayers: 4,
            maxQuestions: 20,
            pointsPerCorrectAnswer: 100,
            pointsForGoodLie: 150,
            timeoutPerQuestion: 45000, // 45 segundos
            lastUpdated: serverTimestamp()
        };

        // Configuración del juego Crack Rápido
        const crackRapidoConfig = {
            gameType: "crackrapido",
            maxPlayers: 1,
            timePerQuestion: 15000, // 15 segundos
            pointsPerCorrectAnswer: 10,
            streakBonus: {
                5: 50,   // Bonus a las 5 correctas consecutivas
                10: 100, // Bonus a las 10 correctas consecutivas
                15: 200, // Bonus a las 15 correctas consecutivas
                20: 500  // Bonus a las 20 correctas consecutivas
            },
            lastUpdated: serverTimestamp()
        };

        // Configuración del juego Pasala Che
        const pasalaCheConfig = {
            gameType: "pasalache",
            maxPlayers: 1,
            timePerGame: 120000, // 2 minutos
            pointsPerCorrectAnswer: 10,
            penaltyPerPass: 5,
            penaltyPerIncorrect: 10,
            maxPasses: 5,
            lastUpdated: serverTimestamp()
        };

        // Configuración del juego 100 Futboleros Dicen
        const futbolerosDicenConfig = {
            gameType: "100-futboleros-dicen",
            maxPlayers: 8,
            minPlayers: 2,
            maxRounds: 5,
            timePerTurn: 30000, // 30 segundos
            maxStrikes: 3,
            pointsPerAnswer: {
                1: 100,  // Respuesta más popular
                2: 80,   // Segunda respuesta
                3: 60,   // Tercera respuesta
                4: 40,   // Cuarta respuesta
                5: 20    // Quinta respuesta
            },
            teamAssignment: "alternating", // Asignación alternada de equipos
            lastUpdated: serverTimestamp()
        };

        // Crear documentos de configuración
        const configs = [
            { id: "quiensabemas", data: quienSabeMasConfig },
            { id: "mentiroso", data: mentirosoConfig },
            { id: "crackrapido", data: crackRapidoConfig },
            { id: "pasalache", data: pasalaCheConfig },
            { id: "100-futboleros-dicen", data: futbolerosDicenConfig }
        ];

        for (const config of configs) {
            try {
                const configRef = doc(db, "gameConfig", config.id);
                const configSnap = await getDoc(configRef);
                
                if (!configSnap.exists()) {
                    await setDoc(configRef, config.data);
                    console.log(`✅ Configuración creada para ${config.id}`);
                } else {
                    console.log(`ℹ️ Configuración ya existe para ${config.id}`);
                }
            } catch (error) {
                console.error(`❌ Error creando configuración para ${config.id}:`, error);
                this.setupErrors.push(`Error en configuración ${config.id}: ${error.message}`);
            }
        }
    }

    async verifyCollectionStructure() {
        console.log("🏗️ Verificando estructura de colecciones...");
        
        const requiredCollections = [
            'users',
            'matches', 
            'rankings',
            'gameConfig'
        ];

        for (const collectionName of requiredCollections) {
            try {
                const collectionRef = collection(db, collectionName);
                const snapshot = await getDocs(collectionRef);
                console.log(`✅ Colección '${collectionName}' accesible (${snapshot.size} documentos)`);
            } catch (error) {
                console.error(`❌ Error accediendo a colección '${collectionName}':`, error);
                this.setupErrors.push(`Error en colección ${collectionName}: ${error.message}`);
            }
        }
    }

    // Método para ejecutar configuración solo si es necesario
    async setupIfNeeded() {
        // Verificar si ya se ejecutó la configuración en esta sesión
        if (this.isSetupComplete) {
            return { success: true, message: "Configuración ya completada" };
        }

        // Verificar si hay configuración en localStorage para evitar ejecutar muy frecuentemente
        const lastSetup = localStorage.getItem('firebase_last_setup');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 horas

        if (lastSetup && (now - parseInt(lastSetup)) < oneDay) {
            console.log("ℹ️ Configuración de Firebase ejecutada recientemente, omitiendo...");
            this.isSetupComplete = true;
            return { success: true, message: "Configuración omitida (reciente)" };
        }

        const result = await this.runFullSetup();
        
        if (result.success) {
            localStorage.setItem('firebase_last_setup', now.toString());
        }

        return result;
    }

    // Método para forzar reconfiguración
    async forceSetup() {
        localStorage.removeItem('firebase_last_setup');
        this.isSetupComplete = false;
        this.setupErrors = [];
        return await this.runFullSetup();
    }

    // Método para verificar el estado actual
    getSetupStatus() {
        return {
            isComplete: this.isSetupComplete,
            errors: this.setupErrors,
            hasErrors: this.setupErrors.length > 0
        };
    }
}

// Exportar la clase y crear instancia global
const firebaseSetup = new FirebaseSetupManager();

// Auto-ejecutar configuración cuando se carga el script
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Ejecutando configuración automática de Firebase...");
    const result = await firebaseSetup.setupIfNeeded();
    
    if (!result.success) {
        console.warn("⚠️ Configuración de Firebase incompleta:", result.errors);
        
        // Mostrar advertencia en la UI si hay errores críticos
        const hasFirestoreErrors = result.errors.some(error => 
            error.includes('permission-denied') || 
            error.includes('unavailable')
        );
        
        if (hasFirestoreErrors) {
            // Crear y mostrar mensaje de advertencia
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #ff4444;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            warningDiv.innerHTML = `
                <strong>⚠️ Error de Firebase</strong><br>
                <small>Algunos datos del juego podrían no guardarse correctamente.</small>
            `;
            document.body.appendChild(warningDiv);
            
            // Auto-ocultar después de 8 segundos
            setTimeout(() => {
                if (warningDiv.parentNode) {
                    warningDiv.parentNode.removeChild(warningDiv);
                }
            }, 8000);
        }
    }
});

// Hacer disponible globalmente para debugging
window.firebaseSetup = firebaseSetup;

export { firebaseSetup, FirebaseSetupManager }; 