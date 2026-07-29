export class PanelLsf {

    constructor() {
        this.lsfTextBox = document.getElementById("lsf-sign-box");
    }

    /**
    * Shows what letter we detect
    */
    updateGestureDebugText(currentGestures) {
        if (!currentGestures) {
            console.log("DEBUG : updateGestureDebugText n'a pas le currentState");
            return;
        }
        const gestesValides = currentGestures.filter(g => g && g !== "");

        if (gestesValides.length > 0) {
            this.lsfTextBox.style.backgroundColor = "#E91E63";
            this.lsfTextBox.innerText = `Signe(s) : ${gestesValides.join(" + ")}`;
        } else {
            this.lsfTextBox.style.backgroundColor = "#007f8b";
            this.lsfTextBox.innerText = "Aucun signe clair.";
        }
    }
}