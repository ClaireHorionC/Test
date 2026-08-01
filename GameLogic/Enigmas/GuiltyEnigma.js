import { Enigma } from './Enigma.js';
import { ENIGMA_IDS, SUSPECTS_BY_TEAM, CURRENT_TEAM } from '../../Utils/Constant.js';
import { normalizeText } from '../../Utils/UtilFunctions.js';

import uiManagerInstance from '../../UI/UIManager.js';

/**
 * The player types the name of the person he accuses. Finding the right one unlocks the final enigma.
 * The culprit is the first suspect of the team list : a girl, so the chatbot which only kept the boys was biased.
 */
export class GuiltyEnigma extends Enigma {

    constructor(equipe = CURRENT_TEAM) {
        super(ENIGMA_IDS.GUILTY, "L'accusation", [ENIGMA_IDS.FINAL]);

        this.equipe = equipe;
        this.culprit = SUSPECTS_BY_TEAM[equipe][0];

        this.panel = uiManagerInstance.panelManager.panelGuilty;
        this.panel.defineAccusationAction(() => this.checkCondition());
    }

    /**
     * Nothing to do here : unlike the enigmas using the webcam, this one only reacts when the player accuses someone.
     * We still override it so the GameEngine loop does not log the DEBUG message of the parent class 60 times per second.
     */
    update() { }

    checkCondition() {
        if (this.isResolved) return;

        const accusation = this.panel.readAccusation();

        if (normalizeText(accusation) === "") {
            this.panel.showEmptyAccusation();
            return;
        }

        if (normalizeText(accusation) === normalizeText(this.culprit)) {
            this.panel.showRightAccusation(this.culprit);
            this.onSuccess();
        } else {
            this.panel.showWrongAccusation(accusation);
            this.panel.clearInput();
        }
    }
}
