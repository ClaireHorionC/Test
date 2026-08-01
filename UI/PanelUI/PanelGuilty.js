export class PanelGuilty {

    constructor({ inputId = "inputMessage-guilty", buttonId = "btnAccuser-guilty", feedbackId = "feedback-guilty" } = {}) {
        this.inputElement = document.getElementById(inputId);
        this.buttonElement = document.getElementById(buttonId);
        this.feedbackElement = document.getElementById(feedbackId);
    }

    /**
     * Attach the function to call when the player sends an accusation (click on the button or Enter key).
     * Same idea as Tab.defineOpeningAction : the panel does not know what the accusation means, only the enigma does.
     */
    defineAccusationAction(fonctionCallback) {
        this.buttonElement.addEventListener("click", () => fonctionCallback());
        this.inputElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter") fonctionCallback();
        });
    }

    readAccusation() {
        return this.inputElement.value;
    }

    clearInput() {
        this.inputElement.value = "";
    }

    showEmptyAccusation() {
        this.showFeedback("Entre le nom de la personne que tu accuses.", "wrong");
    }

    showWrongAccusation(nameTyped) {
        this.showFeedback(`"${nameTyped}" n'est pas le coupable. Reprends les indices et réessaye.`, "wrong");
    }

    showRightAccusation(nameOfCulprit) {
        this.showFeedback(`Accusation confirmée : ${nameOfCulprit} est bien le coupable.`, "right");
    }

    showFeedback(text, classe) {
        this.feedbackElement.textContent = text;
        this.feedbackElement.className = `feedback-guilty ${classe}`;
    }
}
