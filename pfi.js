const http = require('http');
const path = require('path');
const fs = require('fs');
const url= require('url');
const users = require('./liste_usagers');
const PORT = 8000;

http.createServer((requete, reponse)=>{
    if (requete.url.substring(0, 11) === '/acces.html') {
        console.log('C\'est la page Acces.html');
        traiterFormulaire(requete, reponse);
    } else {
        if (requete.url === '/' || requete.url === '/login.html') {
            let nomFichier = path.join(__dirname, 'pagesWeb', "login.html");
            fournirPagesWeb(nomFichier, reponse);
        } else {
            let nomFichier = path.join(__dirname, '/', requete.url);
            fournirPagesWeb(nomFichier, reponse);
        }
        console.log(requete.url);
    }
}).listen(PORT, ()=>console.log('Le service Web pour est démarré dans la Port: 8000', PORT));

function traiterFormulaire(requete, reponse) {
    let params;
    if (requete.method === 'GET' ) {
        params = new url.URLSearchParams(url.parse(requete.url).query);
        traiteRequete(requete, reponse, params);
    } else {
        let postDATA = "";
        requete.on('data', (donnee)=>{ postDATA += donnee});
        requete.on('end', ()=>{
            params = new url.URLSearchParams(postDATA);
            traiteRequete(requete, reponse, params);
        });
    }
}

function fournirPagesWeb(fileName, reponse) {
    console.log('La page Web a afficher est:', fileName);
    let typeFichier = path.extname(fileName);
    let typeContenu = 'text/html';
    switch(typeFichier) {
        case '.js':
            typeContenu = 'text/javascript';
            break;
        case '.css':
            typeContenu = 'text/css';
            break;
        case '.png':
            typeContenu = 'image/png';
            break;
        case '.jpg':
            typeContenu = 'image/jpg';
            break;
        case '.gif':
            typeContenu = 'image/gif';
            break;
        case '.json':
            typeContenu = 'application/json';
            break;
    }

    fs.readFile(fileName, (err, contenu)=>{
        if (err) {
            if (err.code === 'ENOENT') { // fichier inexistant
                reponse.writeHead(404, { 'Content-Type': 'text/html'});
                reponse.write('<h1>Page demand&eacute;e introuvable</h1>\n');
                reponse.write(`<h2>${fileName}</h2>`);
                reponse.end();
            } else {
                reponse.writeHead(500, { 'Content-Type': 'text/html'});
                reponse.write('<h1>Erreur interne du serveur</h1>\n');
                reponse.write(`<h2>Code: ${err.code}</h2>`);
                reponse.end();
            }
        } else {
            reponse.writeHead(200, {'Content-Type': typeContenu});
            reponse.write(contenu);
            reponse.end();
        }
    });
}

function traiteRequete(requete, reponse, params) {
    const login = params.get('login');
    const pwd = params.get('pwd');
    const usagerTrouve = users.find((value) => value.login === login && value.pwd === pwd);

    if (usagerTrouve) {
        console.log('Login Valide');

        if (usagerTrouve.acces === 'normal') {
            let pageUsager = path.join(__dirname, 'pagesWeb', 'pageUsager.html');
            fournirPagesWeb(pageUsager, reponse);
        } else if (usagerTrouve.acces === 'admin') {
            let pageAdmin = path.join(__dirname, 'pagesWeb', 'pageAdmin.html');
            fournirPagesWeb(pageAdmin, reponse);
        } else if (usagerTrouve.acces === 'restreint') {
            let pageRestreint = path.join(__dirname, 'pagesWeb', 'pageRestreinte.html');
            fournirPagesWeb(pageRestreint, reponse);
        }
    } else {
        reponse.writeHead(401, { 'Content-Type': 'text/html' });
        reponse.write('<h1>Erreur d\'authentification</h1>\n');
        reponse.write('<p>Nom d\'utilisateur ou mot de passe invalide</p>');
        reponse.end();
    }
}

