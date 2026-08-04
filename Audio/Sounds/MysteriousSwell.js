/**
 * Un souffle mystérieux dont la hauteur descend : sert à faire apparaître un élément d'interface.
 *
 * @param {AudioContext} ctx
 * @param {AudioNode} destination - la sortie du AudioManager (volume général)
 */
export function playMysteriousSwell(ctx, destination) {
    const t0 = ctx.currentTime;
    const duration = 1.5;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    // Type d'onde : 'sine' = très pur et doux, 'square' = très rétro/8-bit
    oscillator.type = 'sine';

    // Variation de la fréquence (Pitch qui descend)
    oscillator.frequency.setValueAtTime(880, t0); // Commence aigu
    oscillator.frequency.exponentialRampToValueAtTime(110, t0 + duration); // Finit grave

    // Enveloppe du volume (Fade in rapide, Fade out long)
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(0.3, t0 + 0.1); // Volume max
    gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + duration); // Extinction

    oscillator.start(t0);
    oscillator.stop(t0 + duration);
    oscillator.onended = () => gainNode.disconnect();
}
