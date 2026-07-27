


// A Adapter
const UpLeft1 = 90, UpRight1 = 91, DownRight1 = 93, DownLeft1 = 92;
const UpLeft2 = 94, UpRight2 = 95, DownRight2 = 97, DownLeft2 = 96;


let dictCards = {
    1: {
        "ID": 0,
        "falseID": 11,
        "pos": [7, 124],
        "sheet": 1,
        "name": "Deux IA peuvent créer leur propre langage."
    },
    2: {
        "ID": 1,
        "falseID": 10,
        "pos": [77, 124],
        "sheet": 1,
        "name": "L'IA peut améliorer le diagnostic de certaines maladies, en soutien au médecin."
    },
    3: {
        "ID": 2,
        "falseID": 9,
        "pos": [147, 124],
        "sheet": 1,
        "name": "Une IA a une meilleure puissance de calcul qu'un humain."
    },
    4: {
        "ID": 3,
        "falseID": 8,
        "pos": [217, 124],
        "sheet": 1,
        "name": "Les IA génératives sont très mauvaises en mathématiques."
    },
    5: {
        "ID": 4,
        "falseID": 15,
        "pos": [7, 124],
        "sheet": 2,
        "name": "Les IA peuvent mentir."
    },
    6: {
        "ID": 5,
        "falseID": 14,
        "pos": [77, 124],
        "sheet": 2,
        "name": "L'IA peut apprendre de façon autonome."
    },
    7: {
        "ID": 6,
        "falseID": 13,
        "pos": [147, 124],
        "sheet": 2,
        "name": "Les IA récentes consomment moins d'énergie qu'une recherche Internet classique."
    },
    8: {
        "ID": 7,
        "falseID": 12,
        "pos": [217, 124],
        "sheet": 2,
        "name": "L'IA générative peut créer du contenu original."
    }
};

const realWidth = 262;   // distance entre milieux des 2 codes du haut
const realHeight = 175;   // distance entre milieux des 2 codes de gauche
// Jusque ici

const sheets = [
    {
        ID: 1,
        corners: [UpLeft1, UpRight1, DownRight1, DownLeft1],
        cornersVisible: true,
        counterCornersInvisible: 0
    },
    {
        ID: 2,
        corners: [UpLeft2, UpRight2, DownRight2, DownLeft2],
        cornersVisible: true,
        counterCornersInvisible: 0
    }
];

let sheetCorners = [UpLeft1, UpRight1, DownRight1, DownLeft1, UpLeft2, UpRight2, DownRight2, DownLeft2];

const positionTolerance = 10;

let checkNow = false;
let nbIterationsCheck = 0;
const nbIterations = 20;

let counter = 0;
const maxID = 100;
let dictID = {};
for (let i = 0; i < maxID; i++) dictID[i] = 0;

let previousSheetCorners = {};
let lastAnalysedPicture = null;


let lastTime = 0;
const FPS_LIMIT = 15;
const delay = 1000 / FPS_LIMIT;

let cap, src, gray, realPoints, clahe, parameters, corners, ids, detector;

let cv;

export class ArucoRecognizer {

    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;

        // Sécurité pour le canvas
        if (this.canvas) {
            this.ctx = this.canvas.getContext("2d");
        }

        // On ne lance SURTOUT PAS onOpenCvReady() ou startup() ici !
        this.lastProcessTime = 0;
        this.isInitialized = false;

        // Préparation des variables (avec this.) pour plus tard
        this.cap = null;
        this.srcMat = null;
        this.gray = null;
        this.realPoints = null;
        this.clahe = null;
        this.detector = null;

        const btnVerifier = document.getElementById("btnVerifier");
        if (btnVerifier) {
            btnVerifier.addEventListener("click", () => {
                console.log("🖱️ Bouton Vérifier cliqué !");
                this.startCheck();
            });
        }
    }

    /**
     * Cette fonction sera appelée plus tard, UNIQUEMENT quand la vidéo tournera 
     * et qu'OpenCV sera garanti d'être chargé.
     */
    initAruco() {
        console.log("siueeeeee");

        /*if (!window.cv || typeof window.cv.VideoCapture === "undefined") {
            return false; // On annule et on retentera à la prochaine frame
        }*/
        console.log("eafeafea");


        console.log("eafeaeaeeeeeeeeeeeeeeeeeeeeeeeafea");

        //if (!this.video || this.video.videoWidth === 0) return false;

        console.log("siu");

        // On utilise bien "this." pour assigner les propriétés à la classe
        //this.cap = new cv.VideoCapture(this.video);
        console.log("siaaaaaaaaaaaaaaau");

        //this.srcMat = new cv.Mat(this.video.videoHeight, this.video.videoWidth, cv.CV_8UC4);
        //this.gray = new cv.Mat();

        console.log("siaaaau");



        this.isInitialized = true;
        console.log("📸 ArucoRecognizer : Matrices prêtes !");
        return true;
    }


    updateAruco() {


        if (!this.cap) {
            cv = window.cv;

            this.cap = new cv.VideoCapture(this.video);
            this.srcMat = new cv.Mat(this.video.videoHeight, this.video.videoWidth, cv.CV_8UC4);
            this.gray = new cv.Mat();

            this.realPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, 262, 0, 262, 175, 0, 175]);
            this.clahe = new cv.CLAHE(1.5, new cv.Size(4, 4));

            let dictionary = cv.getPredefinedDictionary(cv.DICT_4X4_100);
            let parameters = new cv.aruco_DetectorParameters();
            let refineParameters = new cv.aruco_RefineParameters(10.0, 3.0, true);
            this.detector = new cv.aruco_ArucoDetector(dictionary, parameters, refineParameters);

        }


        let corners = new cv.MatVector();
        let ids = new cv.Mat();
        let rejected = new cv.MatVector();

        try {

            counter++;
            if (counter >= 20) {
                counter = 0;
            }

            this.readFrame(this.srcMat);

            this.detector.detectMarkers(this.gray, corners, ids, rejected);

            let cornersPixels = {};

            if (ids.rows > 0) {
                cv.drawDetectedMarkers(this.gray, corners, ids);

                // Récupération des coordonnées des marqueurs
                for (let i = 0; i < ids.rows; ++i) {
                    let IDDetected = ids.data32S[i];
                    let markerCorners = corners.get(i).data32F;

                    let cx = ((markerCorners[0] + markerCorners[2] + markerCorners[4] + markerCorners[6]) / 4);
                    let cy = ((markerCorners[1] + markerCorners[3] + markerCorners[5] + markerCorners[7]) / 4);

                    cornersPixels[IDDetected] = [cx, cy];

                }
            }


            let pPixel = new cv.Mat(1, 1, cv.CV_32FC2);
            let pReal = new cv.Mat();

            for (let s of sheets) {
                let [ul, ur, dr, dl] = s.corners;

                if (ul in cornersPixels && ur in cornersPixels && dr in cornersPixels && dl in cornersPixels) {
                    s.cornersVisible = true;

                    let pointsPixels = cv.matFromArray(4, 1, cv.CV_32FC2, [...cornersPixels[ul], ...cornersPixels[ur], ...cornersPixels[dr], ...cornersPixels[dl]]);

                    let H = cv.findHomography(pointsPixels, this.realPoints);

                    if (!H.empty()) {
                        for (const card of Object.values(dictCards)) {

                            this.analyseMarker(card.ID, card, s, H, cornersPixels, pPixel, pReal);
                            this.analyseMarker(card.falseID, card, s, H, cornersPixels, pPixel, pReal);

                        }
                        H.delete();
                    }
                    pointsPixels.delete();

                } else {
                    s.cornersVisible = false;
                    if (checkNow) {
                        s.counterCornersInvisible++;
                    }
                }
            }

            pPixel.delete();
            pReal.delete();


            // Affichage du résultat
            cv.imshow(this.canvas, this.srcMat);
            //cv.imshow('canvasOutput', this.gray);

        } catch (err) {
            console.error("Erreur dans la boucle de traitement :", err);
        }

        // Nettoyage impératif de la mémoire à chaque frame
        corners.delete();
        ids.delete();
        rejected.delete();

        if (checkNow) {
            nbIterationsCheck++;
            if (nbIterationsCheck >= nbIterations) {
                checkNow = false;
                this.checkCards();
            }
        }
    }



    readFrame(src) {

        this.cap.read(src);

        // Conversion en niveaux de gris et redimensionnement
        let rgbaPlanes = new cv.MatVector();
        cv.split(src, rgbaPlanes);
        let firstPlane = rgbaPlanes.get(0);
        firstPlane.copyTo(this.gray);
        firstPlane.delete();
        rgbaPlanes.delete();

        //cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        let size = new cv.Size(0, 0);
        //cv.resize(this.gray, this.gray, size, 2, 2, cv.INTER_NEAREST);
        this.clahe.apply(this.gray, this.gray);

        if (lastAnalysedPicture) {
            lastAnalysedPicture.delete();
        }
        lastAnalysedPicture = this.gray.clone();

    }



    analyseMarker(markerID, card, sheet, H, cornersPixels, pPixel, pReal) {

        if (!(markerID in cornersPixels)) {
            return;
        }

        pPixel.data32F[0] = cornersPixels[markerID][0]
        pPixel.data32F[1] = cornersPixels[markerID][1]

        cv.perspectiveTransform(pPixel, pReal, H);

        let xReal = pReal.data32F[0];
        let yReal = pReal.data32F[1];

        let text = `${Math.round(xReal)}; ${Math.round(yReal)}`;
        let position = new cv.Point(cornersPixels[markerID][0], cornersPixels[markerID][1] - 10);
        //cv.putText(gray, text, position, cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(0, 255, 0, 255), 2);


        if (
            checkNow &&
            card.sheet == sheet.ID &&
            Math.abs(xReal - card.pos[0]) <= positionTolerance &&
            Math.abs(yReal - card.pos[1]) <= positionTolerance
        ) {
            dictID[markerID]++;
        }

    }


    startCheck() {
        for (let i = 0; i < maxID; i++) {
            dictID[i] = 0;
        }

        for (let s of sheets) {
            s.counterCornersInvisible = 0;
            s.cornersVisible = true;
        }

        checkNow = true;
        nbIterationsCheck = 0;

        document.getElementById("result").textContent = "Analyse en cours ...";
        document.getElementById("message").textContent = "";
        document.getElementById("message2").textContent = "";

    }



    checkCards() {

        let nbCardsOK = 0;
        let nbCardsToPlace = Object.keys(dictCards).length;
        let allSheetsVisible = true;

        let text;
        let mess = "";
        let mess2 = "";

        for (let carteID in dictID) {
            for (let i of Object.keys(dictCards)) {
                if (carteID == dictCards[i]["ID"]) {
                    if (dictID[carteID] >= 1) {
                        nbCardsOK++;
                    }
                }
            }
        }

        for (let i of Object.keys(dictCards)) {
            if ((dictID[dictCards[i]["ID"]] == 0) && (dictID[dictCards[i]["falseID"]] == 0)) {

                mess += `La carte "${dictCards[i]["name"]}" n'a pas été détectée à son emplacement. `;
                mess2 = "Si une carte n'a pas été détectée, passez brièvement la main devant la caméra pendant la vérification.";
            }
        }

        for (let s of sheets) {
            if (s.counterCornersInvisible > (nbIterations - 2)) {
                allSheetsVisible = false;
                break;
            }
        }

        if (allSheetsVisible) {
            if (nbCardsOK === nbCardsToPlace) {
                text = "Bravo !";

            } else {
                text = "Nombre de cartes correctes et bien placées: " + nbCardsOK + " sur " + nbCardsToPlace + " cartes";
            }
        } else {
            text = "Tous les coins des feuilles ne sont pas visibles !";
            mess = "";
        }

        document.getElementById("result").textContent = text;
        document.getElementById("message").textContent = mess;
        document.getElementById("message2").textContent = mess2;
    }

}