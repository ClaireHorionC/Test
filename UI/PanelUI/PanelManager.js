import { PanelLsf } from "./PanelLsf.js";
import { PanelWelcome } from "./PanelWelcome.js";
import { PanelChatbot } from "./PanelChatbot.js";

export class PanelManager {
    constructor() {
        this.panelLsf = new PanelLsf();
        this.panelWelcome = new PanelWelcome();
        this.panelChatbot = new PanelChatbot();
    }
}