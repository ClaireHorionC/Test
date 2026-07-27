import { Enigma } from './Enigma.js';
import { ENIGMA_IDS } from '../Utils/Constant.js';

import inputManagerInstance from '../Inputs/InputManager.js';
import uiManagerInstance from '../UI/UIManager.js';



export class ArucoEnigma extends Enigma {
    constructor() {
        // On appelle le constructeur de la classe parente (Enigma)
        super(ENIGMA_IDS.ARUCO, "Aruco vrai/faux");
    }

    update() {
        inputManagerInstance.update(this.id); //update the sign detected
        //const playerState = inputManagerInstance.getState(); //get the list of signs detected
        //this.checkCondition(playerState); //check if we have all the letter required
    }

    // Le GameEngine appelle cette fonction 15 fois par seconde
    checkCondition(playerState) {
        if (this.isResolved) return;


        if (toutesPresentes) {
            this.onSuccess();
        }
    }
}

