export class ArucoRecognizer {

    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;

        // Sécurité pour le canvas
        if (this.canvas) {
            this.ctx = this.canvas.getContext("2d");
        }

        // 1. Chargement des paramètres fixes du jeu
        this.initConfiguration();

        // 2. Chargement de l'état (variables qui changent)
        this.initState();

        this.lastProcessTime = 0;
        this.isInitialized = false;

        // Préparation des variables OpenCV pour plus tard
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
     * Regroupe toutes les données statiques (configurations, dictionnaires...)
     */
    initConfiguration() {
        // Constantes locales à la fonction car elles ne servent qu'à construire les tableaux
        const UpLeft1 = 90, UpRight1 = 91, DownRight1 = 93, DownLeft1 = 92;
        const UpLeft2 = 94, UpRight2 = 95, DownRight2 = 97, DownLeft2 = 96;

        this.realWidth = 262;
        this.realHeight = 175;
        this.positionTolerance = 10;
        this.nbIterations = 20;
        this.maxID = 100;
        this.FPS_LIMIT = 15;
        this.delay = 1000 / this.FPS_LIMIT;

        this.dictCards = {
            1: { "ID": 0, "falseID": 11, "pos": [7, 124], "sheet": 1, "name": "Deux IA peuvent créer leur propre langage." },
            2: { "ID": 1, "falseID": 10, "pos": [77, 124], "sheet": 1, "name": "L'IA peut améliorer le diagnostic de certaines maladies, en soutien au médecin." },
            3: { "ID": 2, "falseID": 9, "pos": [147, 124], "sheet": 1, "name": "Une IA a une meilleure puissance de calcul qu'un humain." },
            4: { "ID": 3, "falseID": 8, "pos": [217, 124], "sheet": 1, "name": "Les IA génératives sont très mauvaises en mathématiques." },
            5: { "ID": 4, "falseID": 15, "pos": [7, 124], "sheet": 2, "name": "Les IA peuvent mentir." },
            6: { "ID": 5, "falseID": 14, "pos": [77, 124], "sheet": 2, "name": "L'IA peut apprendre de façon autonome." },
            7: { "ID": 6, "falseID": 13, "pos": [147, 124], "sheet": 2, "name": "Les IA récentes consomment moins d'énergie qu'une recherche Internet classique." },
            8: { "ID": 7, "falseID": 12, "pos": [217, 124], "sheet": 2, "name": "L'IA générative peut créer du contenu original." }
        };

        this.sheets = [
            { ID: 1, corners: [UpLeft1, UpRight1, DownRight1, DownLeft1], cornersVisible: true, counterCornersInvisible: 0 },
            { ID: 2, corners: [UpLeft2, UpRight2, DownRight2, DownLeft2], cornersVisible: true, counterCornersInvisible: 0 }
        ];

        this.sheetCorners = [UpLeft1, UpRight1, DownRight1, DownLeft1, UpLeft2, UpRight2, DownRight2, DownLeft2];
    }

    /**
     * Initialise les variables d'état (compteurs, boolean d'action...)
     */
    initState() {
        this.checkNow = false;
        this.nbIterationsCheck = 0;
        this.counter = 0;
        this.lastAnalysedPicture = null;

        this.dictID = {};
        for (let i = 0; i < this.maxID; i++) {
            this.dictID[i] = 0;
        }
    }


    initAruco() {
        console.log("Initialisation Aruco sans appel prématuré à la caméra...");
        this.isInitialized = true;
        return true;
    }


    updateAruco() {
        const cv = window.cv; // Assure que cv est bien récupéré localement

        if (!this.cap) {
            this.cap = new cv.VideoCapture(this.video);
            this.srcMat = new cv.Mat(this.video.videoHeight, this.video.videoWidth, cv.CV_8UC4);
            this.gray = new cv.Mat();

            this.realPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.realWidth, 0, this.realWidth, this.realHeight, 0, this.realHeight]);
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
            this.counter++;
            if (this.counter >= 20) {
                this.counter = 0;
            }

            this.readFrame(this.srcMat);

            this.detector.detectMarkers(this.gray, corners, ids, rejected);

            let cornersPixels = {};

            if (ids.rows > 0) {
                cv.drawDetectedMarkers(this.gray, corners, ids);

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

            for (let s of this.sheets) {
                let [ul, ur, dr, dl] = s.corners;

                if (ul in cornersPixels && ur in cornersPixels && dr in cornersPixels && dl in cornersPixels) {
                    s.cornersVisible = true;

                    let pointsPixels = cv.matFromArray(4, 1, cv.CV_32FC2, [...cornersPixels[ul], ...cornersPixels[ur], ...cornersPixels[dr], ...cornersPixels[dl]]);
                    let H = cv.findHomography(pointsPixels, this.realPoints);

                    if (!H.empty()) {
                        for (const card of Object.values(this.dictCards)) {
                            this.analyseMarker(card.ID, card, s, H, cornersPixels, pPixel, pReal);
                            this.analyseMarker(card.falseID, card, s, H, cornersPixels, pPixel, pReal);
                        }
                        H.delete();
                    }
                    pointsPixels.delete();

                } else {
                    s.cornersVisible = false;
                    if (this.checkNow) {
                        s.counterCornersInvisible++;
                    }
                }
            }

            pPixel.delete();
            pReal.delete();

            cv.imshow(this.canvas, this.srcMat);

        } catch (err) {
            console.error("Erreur dans la boucle de traitement :", err);
        } finally {
            // Le "finally" garantit que la mémoire est libérée même si une erreur survient
            corners.delete();
            ids.delete();
            rejected.delete();
        }

        if (this.checkNow) {
            this.nbIterationsCheck++;
            if (this.nbIterationsCheck >= this.nbIterations) {
                this.checkNow = false;
                this.checkCards();
            }
        }
    }


    readFrame(src) {
        const cv = window.cv;
        this.cap.read(src);
        // Conversion en niveaux de gris et redimensionnement
        let rgbaPlanes = new cv.MatVector();
        cv.split(src, rgbaPlanes);
        let firstPlane = rgbaPlanes.get(0);
        firstPlane.copyTo(this.gray);
        firstPlane.delete();
        rgbaPlanes.delete();


        this.clahe.apply(this.gray, this.gray);

        if (this.lastAnalysedPicture) {
            this.lastAnalysedPicture.delete();
        }
        this.lastAnalysedPicture = this.gray.clone();
    }


    analyseMarker(markerID, card, sheet, H, cornersPixels, pPixel, pReal) {
        const cv = window.cv;

        if (!(markerID in cornersPixels)) {
            return;
        }

        pPixel.data32F[0] = cornersPixels[markerID][0];
        pPixel.data32F[1] = cornersPixels[markerID][1];

        cv.perspectiveTransform(pPixel, pReal, H);

        let xReal = pReal.data32F[0];
        let yReal = pReal.data32F[1];

        if (
            this.checkNow &&
            card.sheet == sheet.ID &&
            Math.abs(xReal - card.pos[0]) <= this.positionTolerance &&
            Math.abs(yReal - card.pos[1]) <= this.positionTolerance
        ) {
            this.dictID[markerID]++;
        }
    }


    startCheck() {
        for (let i = 0; i < this.maxID; i++) {
            this.dictID[i] = 0;
        }

        for (let s of this.sheets) {
            s.counterCornersInvisible = 0;
            s.cornersVisible = true;
        }

        this.checkNow = true;
        this.nbIterationsCheck = 0;

        document.getElementById("result").textContent = "Analyse en cours ...";
        document.getElementById("message").textContent = "";
        document.getElementById("message2").textContent = "";
    }


    checkCards() {
        let nbCardsOK = 0;
        let nbCardsToPlace = Object.keys(this.dictCards).length;
        let allSheetsVisible = true;

        let text;
        let mess = "";
        let mess2 = "";

        for (let carteID in this.dictID) {
            for (let i of Object.keys(this.dictCards)) {
                if (carteID == this.dictCards[i]["ID"]) {
                    if (this.dictID[carteID] >= 1) {
                        nbCardsOK++;
                    }
                }
            }
        }

        for (let i of Object.keys(this.dictCards)) {
            if ((this.dictID[this.dictCards[i]["ID"]] == 0) && (this.dictID[this.dictCards[i]["falseID"]] == 0)) {
                mess += `La carte "${this.dictCards[i]["name"]}" n'a pas été détectée à son emplacement. `;
                mess2 = "Si une carte n'a pas été détectée, passez brièvement la main devant la caméra pendant la vérification.";
            }
        }

        for (let s of this.sheets) {
            if (s.counterCornersInvisible > (this.nbIterations - 2)) {
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