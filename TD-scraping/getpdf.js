const rp = require('request-promise');
const TikaServer = require("tika-server");

// Télécharger un pdf
const getPdf = (url) => {
    if(url) {
        return rp({
            url: url,
            encoding: null
        }).then(function (pdf) {
            // console.log("PDF download");
            return pdf;
        }).catch(function (err) {
            console.error("getPdf :: RP ERROR:", err);
        });
    } else {
        console.error("getPdf :: url undefined");
        return Promise.resolve(undefined);
    }
}

const ts = new TikaServer();

// Lance le serveur tika
ts.start().then(() => {
    // liste de mes urls de pdf
    const listeUrlPdfs = [
        'https://cours.reimert.fr/TC-4-I-ASY.pdf'
    ]
    // Pour chaque url ...
    return Promise.all(listeUrlPdfs.map((url) => {
        // Extraction du texte.
        return getPdf(url).then((pdf) => {
            // console.log("pdf", pdf);
            if(pdf) {
                return ts.queryText(pdf).then((data) => {
                    // console.log(data)
                    let code = /CODE : ([^\n]*)/.exec(data)[1];
                    let ects = /ECTS : ([^\n]*)/.exec(data)[1];
                    let cours = /Cours : ([^\n]*)/.exec(data)[1];
                    let TD = /TD : ([^\n]*)/.exec(data)[1];
                    let TP = /TP : ([^\n]*)/.exec(data)[1];
                    let Projet = /Projet : ([^\n]*)/.exec(data)[1];
                    let travailPerso = /Travail personnel : ([^\n]*)/.exec(data)[1];

                    pdfData = {
                        "Code" :  code,
                        "ects" :  ects,
                        "cours" :  cours,
                        "td" :  TD,
                        "tp" :  TP,
                        "projet" :  Projet,
                        "travil perso" :  travailPerso
                    }

                    console.log(JSON.stringify(pdfData, null, 2))
                });
            }
        })
    }))
}).then(() => {
    return ts.stop()
}).catch((err) => {
    console.log(`TIKA ERROR: ${err}`)
})
