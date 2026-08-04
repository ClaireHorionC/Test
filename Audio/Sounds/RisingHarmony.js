/**
 * Un accord majeur qui se construit note par note et monte en intensité pendant toute sa durée.
 *
 * Contrairement aux autres sons de ce dossier, celui-ci a un cycle de vie : on le démarre quand le
 * joueur commence à tenir la bonne pose, et on doit pouvoir le couper net s'il la relâche avant la fin.
 * D'où une classe plutôt qu'une simple fonction.
 */
export class RisingHarmony {

    constructor() {
        this.ctx = null;
        this.master = null;
        this.oscillators = [];
        this.autoStopTimer = null;
        this.isPlaying = false;
    }

    /**
     * Idempotent : appelable à chaque frame sans relancer le son.
     *
     * @param {AudioContext} ctx
     * @param {AudioNode} destination - la sortie du AudioManager (volume général)
     * @param {number} duration - durée du crescendo en secondes (doit correspondre au temps de maintien demandé)
     */
    start(ctx, destination, duration = 2) {
        if (this.isPlaying || !ctx) return;

        this.isPlaying = true;
        this.ctx = ctx;

        const t0 = ctx.currentTime;
        const end = t0 + duration;

        // Volume de ce son. La plage est volontairement resserrée : une rampe exponentielle passe le plus
        // clair de son temps en bas de sa plage, donc partir de trop bas rend le son inaudible jusqu'à
        // la toute fin. On démarre déjà audible, le crescendo vient surtout d'ailleurs (voir plus bas).
        this.master = ctx.createGain();
        this.master.gain.setValueAtTime(0.15, t0);
        this.master.gain.exponentialRampToValueAtTime(0.55, end);
        this.master.connect(destination);

        // Le filtre s'ouvre progressivement : le son passe de sourd et lointain à brillant et présent
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, t0);
        filter.frequency.exponentialRampToValueAtTime(7000, end);
        filter.connect(this.master);

        // Accord de Do majeur étalé sur 3 octaves, les notes entrent les unes après les autres
        const notes = [130.81, 196.00, 261.63, 329.63, 392.00, 523.25]; // C3 G3 C4 E4 G4 C5

        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = (index < 2) ? 'triangle' : 'sine'; // un peu de corps dans les graves
            osc.frequency.setValueAtTime(freq, t0);
            osc.frequency.linearRampToValueAtTime(freq * 1.01, end); //très légère montée : sensation de tension qui grimpe

            // Chaque note entre à son tour, sur les 70 premiers % du crescendo
            const entry = t0 + (index / notes.length) * duration * 0.7;

            // Chaque note apparaît franchement puis tient son volume. Le crescendo ne vient donc pas
            // d'une montée note par note, mais du nombre de notes qui s'empilent, du filtre qui s'ouvre
            // et du volume général : trois effets qui se cumulent et restent audibles du début à la fin.
            gain.gain.setValueAtTime(0.0001, entry);
            gain.gain.exponentialRampToValueAtTime(0.16, entry + 0.15);

            osc.connect(gain);
            gain.connect(filter);

            osc.start(entry);
            this.oscillators.push(osc);
        });

        this.addShimmer(ctx, t0, end, filter);

        // Filet de sécurité : si personne n'appelle stop() (onglet quitté en plein maintien),
        // le son s'éteint quand même au lieu de tourner en boucle.
        this.autoStopTimer = setTimeout(() => this.stop(), (duration + 0.3) * 1000);
    }

    /**
     * Une note aiguë qui scintille grâce à un LFO sur son volume.
     */
    addShimmer(ctx, t0, end, destination) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, t0); // C6
        osc.frequency.linearRampToValueAtTime(1567.98, end); // monte vers un G6

        gain.gain.setValueAtTime(0.008, t0);
        gain.gain.exponentialRampToValueAtTime(0.06, end);

        // Le LFO fait vibrer le volume de cette note pour donner l'effet scintillant
        const lfo = ctx.createOscillator();
        const lfoDepth = ctx.createGain();
        lfo.frequency.setValueAtTime(5, t0);
        lfo.frequency.linearRampToValueAtTime(11, end); // le scintillement s'accélère avec la tension
        lfoDepth.gain.value = 0.03;

        lfo.connect(lfoDepth);
        lfoDepth.connect(gain.gain);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(t0);
        lfo.start(t0);

        this.oscillators.push(osc, lfo);
    }

    /**
     * Idempotent aussi. Coupe avec un tout petit fondu pour éviter le "clic" d'une coupure brutale.
     */
    stop() {
        if (!this.isPlaying) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;
        const fadeOut = 0.08;

        clearTimeout(this.autoStopTimer);
        this.autoStopTimer = null;

        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
        this.master.gain.exponentialRampToValueAtTime(0.0001, now + fadeOut);

        this.oscillators.forEach(osc => osc.stop(now + fadeOut));

        // Le contexte appartient au AudioManager et reste ouvert : c'est à nous de débrancher nos noeuds
        const masterToRelease = this.master;
        setTimeout(() => masterToRelease.disconnect(), (fadeOut + 0.05) * 1000);

        this.isPlaying = false;
        this.oscillators = [];
        this.master = null;
        this.ctx = null;
    }
}
