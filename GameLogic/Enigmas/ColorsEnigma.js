import { Enigma } from './Enigma.js';
import inputManagerInstance from '../../Inputs/InputManager.js';
import { ENIGMA_IDS } from '../../Utils/Constant.js';


export class ColorsEnigma extends Enigma {
    constructor() {
        super('colors', "Scanner de Couleurs");



        // --- Gestion de l'énigme par étapes ---
        this.currentStage = 0;
        this.stageStartTime = null;
        this.lastCountdownSeconds = -1;

        // Configuration des conditions pour chaque étape
        this.stageRequirements = [
            {
                name: "Étape 1 : Détecter toutes les couleurs (Marron, Bleu, Bleu-Vert, Orange, Rose foncé)",
                required: ["Marron", "Bleu", "Bleu-Vert", "Orange", "Rose foncé"],
                forbidden: []
            },
            {
                name: "Étape 2 : Cacher le Rose foncé",
                required: ["Marron", "Bleu", "Bleu-Vert", "Orange"],
                forbidden: ["Rose foncé"]
            },
            {
                name: "Étape 3 : Cacher le Rose foncé ET l'Orange",
                required: ["Marron", "Bleu", "Bleu-Vert"],
                forbidden: ["Rose foncé", "Orange"]
            }
        ];
    }

    /**
     * La boucle appelée en continu par le GameEngine quand l'onglet est actif
     */
    update() {
        if (this.isResolved) return;
        inputManagerInstance.update(this.id); //do updateColors which is in the recognizer
        const playerState = inputManagerInstance.getState(); //get the list of colors detected
        this.checkCondition(playerState);
    }

    /**
     * Vérifie l'image actuelle de la webcam
     */
    checkCondition(playerState) {

        if (this.stageStartTime === null) {
            this.stageStartTime = Date.now(); // Déclenchement du premier chrono, pas idéal de le commencer ici mais bon
        }

        // Gestion du timer de 5 secondes (5000 ms)
        const elapsed = Date.now() - this.stageStartTime;
        const remainingSeconds = Math.ceil((5000 - elapsed) / 1000);

        // Affichage du compte à rebours dans la console
        if (remainingSeconds !== this.lastCountdownSeconds && remainingSeconds >= 0) {
            console.log(`⏱️ Évaluation de l'étape dans : ${remainingSeconds}s...`);
            this.lastCountdownSeconds = remainingSeconds;
        }

        // Fin des 5 secondes -> Évaluation
        if (elapsed >= 5000) {
            this.evaluerEtape(playerState);
        }

    }

    /**
     * Évalue si les conditions de l'étape actuelle sont respectées
     */
    evaluerEtape(playerState) {
        const rules = this.stageRequirements[this.currentStage];
        let stepPassed = true;

        // 1. Vérification des couleurs requises
        for (const reqColor of rules.required) {
            if (!playerState.colors.has(reqColor)) {
                stepPassed = false;
                break;
            }
        }

        // 2. Vérification des couleurs interdites
        if (stepPassed) {
            for (const forbColor of rules.forbidden) {
                if (playerState.colors.has(forbColor)) {
                    stepPassed = false;
                    break;
                }
            }
        }

        if (stepPassed) {
            // Réussite de l'étape
            console.log(`✅ Étape validée avec succès !`);
            this.currentStage++;

            if (this.currentStage >= this.stageRequirements.length) {
                // Victoire totale !
                console.log("🏆 VICTOIRE ! Vous avez résolu l'énigme des couleurs !");
                this.isResolved = true;
                this.onSuccess();
            } else {
                // Passage à l'étape suivante
                console.log(`➡️ Passage à l'étape suivante : ${this.stageRequirements[this.currentStage].name}`);
                this.stageStartTime = Date.now();
                this.lastCountdownSeconds = -1;
            }
        } else {
            // Échec -> Retour au début
            console.log(`❌ ÉCHEC ! Les conditions requises n'ont pas été respectées.`);
            console.log(`Couleurs détectées au moment du check :`, Array.from(playerState.colors));
            console.log(`🔄 Retour au début de l'énigme...`);

            this.currentStage = 0;
            this.stageStartTime = Date.now();
            this.lastCountdownSeconds = -1;
            console.log(`🚀 ${this.stageRequirements[0].name}`);
        }
    }


}