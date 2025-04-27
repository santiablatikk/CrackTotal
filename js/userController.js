// Importar funciones de Firebase necesarias
import { db } from './firebase-init.js';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    arrayUnion,
    Timestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Clase UserController para gestionar todas las operaciones relacionadas con usuarios
class UserController {
    constructor() {
        // Propiedades del usuario actual
        this.userId = null;        // ID único para Firebase
        this.displayName = null;   // Nombre para mostrar
        this.totalScore = 0;       // Puntuación total
        this.matchesPlayed = 0;    // Partidas jugadas
        this.wins = 0;             // Victorias
        this.userListeners = [];   // Lista de callbacks para notificar cambios

        // Inicializar: verificar si hay un usuario en localStorage
        this.init();
    }

    // Inicializar controlador
    async init() {
        // Recuperar o generar ID de usuario
        this.userId = localStorage.getItem('cracktotalUserId');
        if (!this.userId) {
            // Generar ID aleatorio si no existe
            this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('cracktotalUserId', this.userId);
        }

        // Recuperar nombre de usuario de localStorage
        const savedName = localStorage.getItem('playerName');
        this.displayName = savedName || 'Jugador';

        // Intentar cargar datos del usuario desde Firebase
        await this.loadUserData();
    }

    // Cargar datos del usuario desde Firebase
    async loadUserData() {
        try {
            const userRef = doc(db, "users", this.userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                // Usuario existe, cargar datos
                const userData = userSnap.data();
                this.displayName = userData.displayName || this.displayName;
                this.totalScore = userData.totalScore || 0;
                this.matchesPlayed = userData.matchesPlayed || 0;
                this.wins = userData.wins || 0;
                
                // Actualizar localStorage con displayName sincronizado
                localStorage.setItem('playerName', this.displayName);
                
                console.log("Usuario cargado desde Firebase:", this.displayName);
            } else {
                // Usuario no existe, crear nuevo documento
                await this.saveUserData();
            }
            
            // Notificar a los listeners que los datos cambiaron
            this.notifyListeners();
            
        } catch (error) {
            console.error("Error al cargar datos de usuario:", error);
        }
    }

    // Guardar datos del usuario en Firebase
    async saveUserData() {
        try {
            const userRef = doc(db, "users", this.userId);
            await setDoc(userRef, {
                displayName: this.displayName,
                totalScore: this.totalScore,
                matchesPlayed: this.matchesPlayed,
                wins: this.wins,
                lastUpdated: Timestamp.now()
            });
            console.log("Usuario guardado en Firebase:", this.displayName);
        } catch (error) {
            console.error("Error al guardar datos de usuario:", error);
        }
    }

    // Actualizar nombre de usuario
    async updateDisplayName(newName) {
        if (!newName || newName.trim() === '') return false;
        
        this.displayName = newName.trim();
        localStorage.setItem('playerName', this.displayName);
        
        try {
            const userRef = doc(db, "users", this.userId);
            await updateDoc(userRef, {
                displayName: this.displayName,
                lastUpdated: Timestamp.now()
            });
            
            // Actualizar elementos UI con el nombre
            document.querySelectorAll('.player-name').forEach(element => {
                element.textContent = this.displayName;
            });
            
            // Notificar a los listeners que los datos cambiaron
            this.notifyListeners();
            
            return true;
        } catch (error) {
            console.error("Error al actualizar nombre:", error);
            return false;
        }
    }

    // Registrar una nueva partida
    async registerMatch(score, isWin = false) {
        // Incrementar estadísticas locales
        this.totalScore += score;
        this.matchesPlayed += 1;
        if (isWin) this.wins += 1;
        
        try {
            // Actualizar documento del usuario
            const userRef = doc(db, "users", this.userId);
            await updateDoc(userRef, {
                totalScore: increment(score),
                matchesPlayed: increment(1),
                wins: isWin ? increment(1) : increment(0),
                lastUpdated: Timestamp.now()
            });
            
            // Crear documento de partida
            const matchData = {
                timestamp: Timestamp.now(),
                players: [{
                    userId: this.userId,
                    displayName: this.displayName,
                    score: score
                }],
                winnerUserId: isWin ? this.userId : null
            };
            
            // Añadir a colección matches
            const matchesRef = collection(db, "matches");
            await setDoc(doc(matchesRef), matchData);
            
            // Notificar a los listeners que los datos cambiaron
            this.notifyListeners();
            
            console.log("Partida registrada correctamente con puntuación:", score);
            return true;
        } catch (error) {
            console.error("Error al registrar partida:", error);
            return false;
        }
    }

    // Registrar listener para cambios en datos de usuario
    addUserListener(callback) {
        if (typeof callback === 'function') {
            this.userListeners.push(callback);
        }
    }

    // Notificar a todos los listeners
    notifyListeners() {
        const userData = {
            userId: this.userId,
            displayName: this.displayName,
            totalScore: this.totalScore,
            matchesPlayed: this.matchesPlayed,
            wins: this.wins
        };
        
        this.userListeners.forEach(callback => {
            try {
                callback(userData);
            } catch (error) {
                console.error("Error en listener de usuario:", error);
            }
        });
    }
}

// Crear una instancia única del controlador
const userController = new UserController();

// Exportar la instancia
export { userController }; 