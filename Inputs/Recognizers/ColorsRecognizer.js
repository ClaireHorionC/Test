
let cv;
export class ColorsRecognizer {

    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext("2d");

        this.lastVideoTime = -1;

        // Pré-allocation des matrices de traitement
        this.gray = null;
        this.blurred = null;
        this.hsv = null;
        this.circles = null;

        // Variables pour la lecture de la webcam (initialisées plus tard)
        this.cap = null;
        this.srcMat = null;

        this.detectedColorsThisFrame = new Set();


    }





    updateColors(currentResults, webcamRunning) {

        if (webcamRunning && this.video.currentTime !== this.lastVideoTime && this.video.videoWidth > 0) {
            this.lastVideoTime = this.video.currentTime;
            let nowInMs = Math.round(this.video.currentTime * 1000);
            // Dessin de la vidéo en fond
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        }

        if (!this.gray) {

            // On charge la bibliothèque depuis la variable globale
            cv = window.cv;

            // Pré-allocation des matrices de traitement
            this.gray = new cv.Mat();
            this.blurred = new cv.Mat();
            this.hsv = new cv.Mat();
            this.circles = new cv.Mat();
        }

        // Sécurité : on attend que la webcam soit vraiment allumée
        if (!this.video || this.video.videoWidth === 0 || this.video.videoHeight === 0) return;

        // Initialisation du capteur OpenCV à la première image valide
        if (!this.cap) {
            this.cap = new cv.VideoCapture(this.video);
            this.srcMat = new cv.Mat(this.video.videoHeight, this.video.videoWidth, cv.CV_8UC4);
            console.log("📸 ColorsEnigma : Capteur vidéo OpenCV initialisé.");
            console.log(`🚀 Début de l'énigme !`);
        }

        try {
            // Lecture de l'image
            this.cap.read(this.srcMat);

            // Analyse et récupération des couleurs détectées sur cette frame
            this.detectedColorsThisFrame = this.detecterCerclesColores(this.srcMat);

            // Affichage sur le canvas
            cv.imshow(this.canvas, this.srcMat);

            currentResults.colors = this.detectedColorsThisFrame; //pushing the result to the VisionController
        } catch (err) {
            console.error("Erreur de traitement OpenCV :", err);
        }


    }

    /**
 * Analyse une image pour trouver des cercles et retourne un Set des couleurs détectées.
 * @param {cv.Mat} srcMat - L'image source provenant du canvas.
 * @returns {Set<string>} - Set contenant les noms des couleurs identifiées.
 */
    detecterCerclesColores(srcMat) {
        const colorsDetected = new Set();

        cv.cvtColor(srcMat, this.gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(this.gray, this.blurred, new cv.Size(9, 9), 2, 2);

        // Paramètres de détection de cercles
        cv.HoughCircles(this.blurred, this.circles, cv.HOUGH_GRADIENT, 1, 50, 100, 38, 10, 50);

        if (this.circles.cols === 0) return colorsDetected;

        cv.cvtColor(srcMat, this.hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(this.hsv, this.hsv, cv.COLOR_RGB2HSV);

        for (let i = 0; i < this.circles.cols; ++i) {
            const x = Math.round(this.circles.data32F[i * 3]);
            const y = Math.round(this.circles.data32F[i * 3 + 1]);
            const rayon = Math.round(this.circles.data32F[i * 3 + 2]);

            const pixel = this.hsv.ucharPtr(y, x);
            const teinte = pixel[0];
            const saturation = pixel[1];
            const luminosite = pixel[2];

            const couleurDetectee = this.analyserCouleurHSV(teinte, saturation, luminosite);

            if (couleurDetectee !== "Inconnue") {
                colorsDetected.add(couleurDetectee);

                // Dessin visuel sur l'image
                cv.circle(srcMat, new cv.Point(x, y), rayon, new cv.Scalar(255, 0, 0, 255), 3);
                cv.circle(srcMat, new cv.Point(x, y), 3, new cv.Scalar(0, 255, 0, 255), -1);
            }
        }

        return colorsDetected;
    }

    analyserCouleurHSV(h, s, v) {
        if (s < 40 || v < 40) return "Inconnue";

        if (h <= 35) {
            if (v < 160) return "Marron";
            else return "Orange";
        }
        else if (h > 35 && h <= 80) {
            return "Vert";
        }
        else if (h > 80 && h <= 100) {
            return "Bleu-Vert";
        }
        else if (h > 100 && h <= 135) {
            return "Bleu";
        }
        else if (h > 140 && h <= 175) {
            if (s > 100) return "Rose foncé";
        }
        return "Inconnue";
    }

    cleanOfMemory() {
        this.gray.delete();
        this.blurred.delete();
        this.hsv.delete();
        this.circles.delete();

        if (this.srcMat) {
            this.srcMat.delete();
        }
    }

}
