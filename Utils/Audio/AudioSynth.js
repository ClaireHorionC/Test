/**
 * Génère une mélodie de victoire synthétique inspirée des ouvertures de coffres de RPG.
 * Utilise l'API Web Audio native sans aucun fichier externe.
 */
export function playTabUnlockingSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const t0 = ctx.currentTime;

    // --- PISTE 1 : Le Glissando de Harpe (Arpège ascendant fluide) ---
    // Un accord magique très large (Do Majeur 9 : Do, Mi, Sol, Si, Ré, Mi, Sol, Do)
    const notesHarpe = [
        261.63, // C4
        329.63, // E4
        392.00, // G4
        493.88, // B4
        587.33, // D5
        659.25, // E5
        783.99, // G5
        1046.50 // C6
    ];

    const dureeGlissando = 2.0; // Le balayage des cordes dure 2 secondes
    const intervalle = dureeGlissando / notesHarpe.length;

    notesHarpe.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // L'onde 'sine' est parfaite pour imiter le son pur et rond d'une corde pincée
        osc.type = 'sine';
        osc.frequency.value = freq;

        const time = t0 + (index * intervalle);

        // L'enveloppe Harpe : Attaque instantanée (le doigt lâche la corde) et résonance très longue
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25, time + 0.02); // Impact rapide
        gain.gain.exponentialRampToValueAtTime(0.001, time + 3.0); // La corde vibre et s'éteint lentement

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 3.0);
    });

    // --- PISTE 2 : La Poussière d'étoiles pendant le tourbillon ---
    for (let i = 0; i < 15; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        // Fréquences très aiguës et cristallines
        osc.frequency.value = 1500 + Math.random() * 1500;

        // Jouées au hasard pendant le vol de l'animation (avant l'impact à 2.5s)
        const time = t0 + Math.random() * 2.4;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.04, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.8);
    }

    // --- PISTE 3 : L'Accord final d'illumination ---
    // Se déclenche pile à 2.5s, quand le texte s'arrête de tourner au milieu de l'écran
    const impactTime = t0 + 2.5;
    const notesAccordFinal = [523.25, 659.25, 783.99]; // Un accord parfait (Do, Mi, Sol)

    notesAccordFinal.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Un mix subtil : le triangle donne un tout petit peu plus de corps à l'accord final
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Une belle nappe qui apparaît en douceur et s'évanouit avec le texte
        gain.gain.setValueAtTime(0, impactTime);
        gain.gain.linearRampToValueAtTime(0.15, impactTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, impactTime + 4.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(impactTime);
        osc.stop(impactTime + 4.0);
    });
}

/**
 * Un accord majeur qui se construit note par note et monte en intensité pendant toute sa durée.
 *
 * Contrairement aux autres sons de ce fichier, celui-ci a un cycle de vie : on le démarre quand le
 * joueur commence à tenir la bonne pose, et on doit pouvoir le couper net s'il la relâche avant la fin.
 * D'où une classe plutôt qu'une simple fonction.
 */
export class RisingHarmony {

    /**
     * @param {number} duration - durée du crescendo en secondes (doit correspondre au temps de maintien demandé)
     */
    constructor(duration = 2) {
        this.duration = duration;
        this.ctx = null;
        this.oscillators = [];
        this.autoStopTimer = null;
    }

    /**
     * Idempotent : appelable à chaque frame sans relancer le son.
     */
    start() {
        if (this.ctx) return; // déjà en train de jouer

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        this.ctx = new AudioContext();
        const ctx = this.ctx;
        const t0 = ctx.currentTime;
        const end = t0 + this.duration;

        // Volume général. La plage est volontairement resserrée : une rampe exponentielle passe le plus
        // clair de son temps en bas de sa plage, donc partir de trop bas rend le son inaudible jusqu'à
        // la toute fin. On démarre déjà audible, le crescendo vient surtout d'ailleurs (voir plus bas).
        this.master = ctx.createGain();
        this.master.gain.setValueAtTime(0.15, t0);
        this.master.gain.exponentialRampToValueAtTime(0.55, end);
        this.master.connect(ctx.destination);

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
            const entry = t0 + (index / notes.length) * this.duration * 0.7;

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
        this.autoStopTimer = setTimeout(() => this.stop(), (this.duration + 0.3) * 1000);
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
        if (!this.ctx) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;
        const fadeOut = 0.08;

        clearTimeout(this.autoStopTimer);
        this.autoStopTimer = null;

        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
        this.master.gain.exponentialRampToValueAtTime(0.0001, now + fadeOut);

        this.oscillators.forEach(osc => osc.stop(now + fadeOut));

        setTimeout(() => ctx.close(), (fadeOut + 0.05) * 1000);

        this.ctx = null;
        this.oscillators = [];
    }
}

export function playMysteriousSwell() {
    // Initialisation du moteur audio natif du navigateur
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Type d'onde : 'sine' = très pur et doux, 'square' = très rétro/8-bit
    oscillator.type = 'sine';

    // Variation de la fréquence (Pitch qui descend)
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Commence aigu
    oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 1.5); // Finit grave

    // Enveloppe du volume (Fade in rapide, Fade out long)
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1); // Volume max
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5); // Extinction

    // Lecture
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 1.5);
}