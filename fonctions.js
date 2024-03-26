const fsp = require('fs').promises;

async function saveDb(userId, data) {
  const date = new Date().toLocaleString();
  if (!data || !data.id) {
    console.error(`${date} [saveDb]\x1b[31m Aucune donnée n'a été collectée ! Sauvegarde annulée... \x1b[37m`);
    console.error('DATA : ', data);
    return; 
  }
  try {
    await fsp.writeFile(`./database/${userId}.json`, JSON.stringify(data, null, 2));
    console.log(`${date} [saveDb]\x1b[34m ${data.nomServeur} sauvegardé. \x1b[37m`);
  } catch (error) {
    console.error(`${date} [saveDb]\x1b[31m Erreur lors de l'enregistrement de l'utilisateur dans la base de données.\x1b[37m`, error);
  }
}
async function loadUser(userId) {
  const filePath = `./database/${userId}.json`;
  const date = new Date().toLocaleString();

  try {
    const fileContent = await fsp.readFile(filePath, 'utf8');

    if (!fileContent) {
      console.error(`${date} [loadUser]\x1b[31m Fichier JSON vide pour l'utilisateur (ID : ${userId}).\x1b[37m`);
      return {};
    }

    const user = JSON.parse(fileContent);
    console.log(`${date} [loadUser]\x1b[35m ${user.nomServeur} chargé.\x1b[37m`);
    return user;
  } catch (error) {
    console.error(`${date} [loadUser]\x1b[31m Erreur de chargement d'un utilisateur (ID : ${userId}).\x1b[37m\n${error}`);
    return null;
  }
}
function capitalize(mot) {
  // console.log('capitalized(mot) : ' + mot);
  if (mot === undefined) {
    throw new TypeError("Le paramètre ne doit pas être vide");
  }
  return mot.charAt(0).toUpperCase() + mot.slice(1);
}
function hoursToMs(hours) {
  // Vérifier si le paramètre est un nombre
  if (isNaN(hours)) {
    throw new TypeError("Le paramètre doit être un nombre");
  }
  // Convertir les heures en millisecondes
  const milliseconds = hours * 60 * 60 * 1000;
  // Retourner les millisecondes
  return milliseconds;
}
function minutesToMs(minutes) {
    // Vérifier si le paramètre est un nombre
    if (isNaN(minutes)) {
      throw new TypeError("Le paramètre doit être un nombre");
    }
    // Convertir les minutes en millisecondes
    const milliseconds = minutes * 60 * 1000;
    // Retourner les millisecondes
    return milliseconds;
}
function secondsToMs(seconds) {
    // Vérifier si le paramètre est un nombre
    if (isNaN(seconds)) {
      throw new TypeError("Le paramètre doit être un nombre");
    }
    // Convertir les secondes en millisecondes
    const milliseconds = seconds * 1000;
    // Retourner les millisecondes
    return milliseconds;
}
function msToHours(milliseconds) {
    // Vérifier si le paramètre est un nombre
    if (isNaN(milliseconds)) {
      throw new TypeError("Le paramètre doit être un nombre");
    }
    // Convertir les millisecondes en secondes
    const seconds = milliseconds / 1000;
    // Convertir les secondes en heures
    const hours = seconds / 3600;
    // Retourner les heures
    return hours;
}
function msToMinutes(milliseconds) {
    // Vérifier si le paramètre est un nombre
    if (isNaN(milliseconds)) {
      throw new TypeError("Le paramètre doit être un nombre");
    }
    // Convertir les millisecondes en secondes
    const seconds = milliseconds / 1000;
    // Convertir les secondes en minutes
    const minutes = seconds / 60;
    // Retourner les minutes
    return minutes;
}
function msToSeconds(milliseconds) {
    // Vérifier si le paramètre est un nombre
    if (isNaN(milliseconds)) {
      throw new TypeError("Le paramètre doit être un nombre");
    }
  
    // Convertir les millisecondes en secondes
    const seconds = milliseconds / 1000;
  
    // Retourner les secondes
    return seconds;
}
function formatMs(milliseconds) {
    // Calcul des heures, minutes et secondes
    var hours = Math.floor(milliseconds / 3600000); // 1 heure = 3600000 millisecondes
    var minutes = Math.floor((milliseconds % 3600000) / 60000); // 1 minute = 60000 millisecondes
    var seconds = Math.floor(((milliseconds % 3600000) % 60000) / 1000); // 1 seconde = 1000 millisecondes

    // Retourner le résultat sous forme d'objet ou de chaîne de caractères
    return {
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}
function calculateHarvestAmount(typeGraine,exigenceGraine,niveauArrosage) {
  let harvestLevel = 0;
  // Pour la Kush
  if (typeGraine === 'kush') {
    // Si le niveau d'arrosage est inférieur ou égal à 0, la plante est morte
    if (niveauArrosage <= 0) {
      harvestLevel = 0;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est supérieur ou égal à 1 et inférieur ou égal à 3, la plante est de niveau 1
    if (niveauArrosage >= 1 && niveauArrosage <= 3) {
      harvestLevel += 1;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est de 4, 5 ou 6, la plante est de niveau 2
    if (niveauArrosage >= 4 && niveauArrosage <= 6) {
      harvestLevel += 2;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est de 7, la plante est de niveau 3
    if (niveauArrosage === 7) {
      harvestLevel += 3;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est supérieur à 7 et inférieur ou égal à 9, la plante est de niveau 1
    if (niveauArrosage >= 8 && niveauArrosage <= 9 ) {
      harvestLevel += 1;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est supérieur à 9, la plante est morte
    if (niveauArrosage > 9 ) {
      harvestLevel = 0;
      return harvestLevel;
    }
  }
  // Pour la Amnezia
  if (typeGraine === 'amnezia') {
    // Si le niveau d'arrosage est inférieur ou égal à 1, la plante est morte
    if (niveauArrosage <= 1) {
      harvestLevel = 0;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est supérieur ou égal à 2 et inférieur ou égal à 4, la plante est de niveau 1
    if (niveauArrosage >= 2 && niveauArrosage <= 4) {
      harvestLevel += 1;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est de 5 ou 6, la plante est de niveau 2
    if (niveauArrosage === 5 || niveauArrosage === 6) {
      harvestLevel += 2;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est de 7, la plante est de niveau 3
    if (niveauArrosage === 7) {
      harvestLevel += 3;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est de 8, la plante est de niveau 1
    if (niveauArrosage === 8 ) {
      harvestLevel += 2;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est supérieur 8, la plante est morte
    if (niveauArrosage > 8 ) {
      harvestLevel = 0;
      return harvestLevel;
    }
  }
  // Pour la Purple
  if (typeGraine === 'purple') {
    // Si le niveau d'arrosage est inférieur ou égal à 2, la plante est morte
    if (niveauArrosage <= 2) {
      harvestLevel = 0;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est supérieur ou égal à 3 et inférieur ou égal à 5, la plante est de niveau 1
    if (niveauArrosage >= 3 && niveauArrosage <= 5) {
      harvestLevel += 1;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est de 6, la plante est de niveau 2
    if (niveauArrosage === 6) {
      harvestLevel += 2;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est de 7, la plante est de niveau 3
    if (niveauArrosage === 7) {
      harvestLevel += 3;
      return harvestLevel;
    }
    // Si le niveau d'arrosage est supérieur à 7, la plante est morte
    if (niveauArrosage > 7 ) {
      harvestLevel = 0;
      return harvestLevel;
    }
  }
}
function updateUserInventory(userInventory, itemCategory, itemName, amount) {
  if (!userInventory[itemCategory].hasOwnProperty(itemName)) {
      userInventory[itemCategory][itemName] = amount;
  } else {
      userInventory[itemCategory][itemName] += amount;
  }
  return userInventory;
}
function randomSelection(array) {
  var index = Math.floor(Math.random() * array.length);
  return array[index];
}
function randomAward(proba) {
  var seuil = proba;
  var nombreAleatoire = Math.random();

  if (nombreAleatoire > seuil) {
      return true
  } else {
      return false;
  }
}
function fileUrl(chemin) {
  var segments = chemin.split('/');
  return segments[segments.length - 1];
}

module.exports = { saveDb,loadUser,capitalize,hoursToMs,minutesToMs,secondsToMs,msToHours,msToMinutes,msToSeconds,formatMs,calculateHarvestAmount,updateUserInventory,randomSelection,randomAward,fileUrl };