const fs = require('fs').promises;

class Grower {
    constructor(id, nomServeur, nom, money, lang) {
        this.id = id;
        this.nomServeur = nomServeur;
        this.nom = nom;
        this.xp = 0;
        this.lang = lang;
        this.inventaire = {
            "money": money,
            "graine": {},
            "plante": {},
            "outils": {}
        };
        this.plantations = {
            "slot1": {},
            "slot2": {},
            "slot3": {},
            "slot4": {}
        };
    }

    async save() {
        fs.writeFile(`./database/${this.id}.json`, JSON.stringify(this, null, 2), (err) => {
        if (err) {
            console.log("Erreur lors de l'enregistrement d'un nouvel utilisateur dans la base de données.");
        }
        console.log(`Nouveau joueur sauvegardé avec succès`);
        });
    }
    
    money(amount) {
        if (this.inventaire.money + amount < 0) {
            console.log("Fonds insuffisants pour effectuer cette opération.");
        } else {
            this.inventaire.money += amount;
        }
    }

    setLang(lang) {
        this.lang = lang;
    }
}
module.exports = Grower;