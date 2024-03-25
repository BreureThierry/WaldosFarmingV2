const { REST, Routes } = require('discord.js');
require('dotenv/config');
const fs = require('node:fs');
const path = require('node:path');
const token = process.env.token
const clientId = process.env.clientId
const guildId = process.env.guildId

const commands = [];
// Récupérez tous les dossiers de commandes dans le répertoire de commandes
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Récupérez tous les fichiers de commandes dans le répertoire "commands"
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Récupérer la sortie SlashCommandBuilder#toJSON() des données de chaque commande pour le déploiement
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`⚠️ Il manque à la commande ${filePath} une propriété "data" ou "execute" requise.`);
		}
	}
}

// Construire et préparer une instance du module REST
const rest = new REST().setToken(token);

// Déploiement des commandes
(async () => {
	try {
		console.log(`🔄 Actualisation de ${commands.length} commandes (/) d'application...`);

		// La méthode "put" est utilisée pour actualiser toutes les commandes de la guilde avec le paramétrage actuel.
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`🆗 Rechargement réussi de ${data.length} commandes (/) d'application.`);
	} catch (error) {
		// Affichage des erreurs
		console.log(`🛑 Rechargement échoué de ${data.length} commandes (/) d'application.`);
		console.error(error);
	}
})();