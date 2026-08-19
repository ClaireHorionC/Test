import gameEngineInstance from '../GameLogic/GameEngine.js';
import uiManagerInstance from './UIManager.js';
import { ENIGMA_IDS, HELP_IDS, ENIGMA_STATUS, IRL_REWARDS } from '../Utils/Constant.js';

import { showRewardAlert } from './AlertManager.js';
import audioManagerInstance from '../Audio/AudioManager.js';

/**
 *those codes are found in the irl enigmas of the game
 * 
 * A code can unlock a tab, give a location IRL or both
 */
const TERMINAL_CODES = {
    apprentissage: {
        feedback: "Accès autorisé : Scanner de couleurs déverrouillé.",
        tabToUnlock: ENIGMA_IDS.COLORS,
        reward: IRL_REWARDS.R_AFTER_VF,
    },
    prompt: {
        feedback: "Accès autorisé : Chatbot déverrouillé.",
        tabToUnlock: HELP_IDS.CHATBOT,
        reward: IRL_REWARDS.R_AFTER_MOVIES,
    }
};

export class TerminalManager {
    constructor() {
        this.btnOpen = document.getElementById('btn-open-terminal');
        this.btnClose = document.getElementById('btn-close-terminal');
        this.btnSubmit = document.getElementById('btn-submit-code');
        this.modal = document.getElementById('terminal-modal');
        this.inputField = document.getElementById('terminal-input');
        this.feedbackText = document.getElementById('terminal-feedback');

        this.initEventListeners();
    }

    initEventListeners() {
        if (!this.btnOpen) return; // Sécurité

        this.btnOpen.addEventListener('click', () => this.openTerminal());
        this.btnClose.addEventListener('click', () => this.closeTerminal());

        this.btnSubmit.addEventListener('click', () => this.processCode());

        // Permettre de valider avec la touche Entrée
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processCode();
        });
    }

    openTerminal() {
        this.modal.classList.remove('modal-hidden');
        this.inputField.value = ''; // On vide le champ
        this.feedbackText.innerText = '';
        this.inputField.focus();
    }

    closeTerminal() {
        this.modal.classList.add('modal-hidden');
    }

    processCode() {
        const codeText = this.inputField.value.trim().toLowerCase();
        const code = TERMINAL_CODES[codeText];

        if (!code) {
            this.feedbackText.innerText = "Code invalide. Accès refusé.";
            this.feedbackText.style.color = "red";
            this.inputField.value = '';
            return;
        }

        let tab;
        if (code.tabToUnlock) {
            tab = code.tabToUnlock;
            uiManagerInstance.tabManager.tabs[code.tabToUnlock]
        } else {
            console.log("DEBUG : code tab not found");
        }

        const alreadyUsed = tab ? tab.status !== ENIGMA_STATUS.LOCKED : false;

        if (alreadyUsed) {
            //On réaffiche quand même la récompense : le code est le seul endroit où l'équipe peut
            //retrouver son lieu si elle a fermé l'alerte sans le retenir.
            this.feedbackText.innerText = "Code déjà utilisé, voici un rappel.";
            this.feedbackText.style.color = "orange";
        } else {
            this.feedbackText.innerText = code.feedback;
            this.feedbackText.style.color = "green";

            if (code.tabToUnlock) gameEngineInstance.activateEnigmaWithAnimation(code.tabToUnlock);
        }

        setTimeout(() => this.closeTerminal(), 1500);
        this.announceReward(code);
    }

    /**
     * Annonce l'objet à récupérer et son lieu. Passe par la file des animations pour s'afficher
     * APRÈS l'éventuelle cinématique de déverrouillage, et non par-dessus.
     */
    announceReward(code) {
        if (!code.reward) return;

        const message = `${code.reward}`;

        uiManagerInstance.animations.enqueue(() => showRewardAlert(message));
    }

    /**
         * Fait apparaître le bouton avec son, glitch visuel et décryptage textuel
         */
    showTerminalButton() {
        if (!this.btnOpen) return;

        // 1. Affichage de base et application du glitch CSS
        this.btnOpen.style.display = 'block';

        // On retire puis remet la classe pour relancer l'animation si besoin
        this.btnOpen.classList.remove('mysterious-reveal');
        void this.btnOpen.offsetWidth; // Astuce pour forcer le navigateur à relire le CSS
        this.btnOpen.classList.add('mysterious-reveal');

        // 2. Lancement du son généré
        audioManagerInstance.playMysteriousSwell();

        // 3. Effet de Scramble (Décryptage de caractères)
        const finalString = "💻 TERMINAL";
        const randomChars = "01$!*@#%&ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let iterations = 0;

        // Toutes les 40ms, on change les lettres
        const interval = setInterval(() => {
            this.btnOpen.innerText = finalString.split('').map((letter, index) => {
                // Si l'index est inférieur aux itérations, on affiche la vraie lettre
                if (index < Math.floor(iterations)) return finalString[index];

                // Sinon, on affiche un caractère aléatoire
                return randomChars[Math.floor(Math.random() * randomChars.length)];
            }).join('');

            // Condition d'arrêt
            if (iterations >= finalString.length) {
                clearInterval(interval);
            }

            // Vitesse du décryptage (plus le chiffre est bas, plus c'est long)
            iterations += 1 / 3;
        }, 40);

        console.log("Le terminal est maintenant affiché");
    }

    /**
     * NOUVELLE FONCTION : Recache le bouton si besoin
     */
    hideTerminalButton() {
        if (this.btnOpen) {
            this.btnOpen.style.display = 'none';
        }
    }

}