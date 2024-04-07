const { Events } = require('discord.js');
// CONFIG
const config = require('../config.json');
const devMode = config.bot.devMode;
const devID = config.bot.devID;

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		
		if (!interaction.isChatInputCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {console.error(`⚠️ Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`); return;}

		if (devMode) {
			if (interaction.user.id != devID) {
				console.log(`\x1b[33m🆕 /${interaction.commandName} executée par ${interaction.user.globalName} || BLOCK BY DEVMODE \x1b[37m`);
				await interaction.reply({ content: '```🛠️ Bot is in maintenance...\n \r🛠️ Le bot est en maintenance...```', ephemeral: true });
				
			} else {
				try {
					console.log(`\x1b[32m🆕 /${interaction.commandName} executée par ${interaction.user.globalName} DEVMODE ON\x1b[37m`);
					await command.execute(interaction);
				} catch (error) {
					console.error(error);
					await interaction.followUp({ content: '⚠️ Une erreur s\'est produite lors de l\'exécution de cette commande !', ephemeral: true });
					if (!interaction.replied && !interaction.deferred) {
						console.log(`⚠️ Erreur lors de l'exécution de la commande ${interaction.commandName} par ${interaction.user.globalName}`);
						await interaction.followUp({ content: '⚠️ Une erreur s\'est produite lors de l\'exécution de cette commande !', ephemeral: true });
					} else {
						console.log(`🚨 no replied-  Erreur lors de l'exécution de la commande ${interaction.commandName} par ${interaction.user.globalName}`);
						await interaction.reply({ content: '⚠️ Une erreur s\'est produite lors de l\'exécution de cette commande !', ephemeral: true });
					}
				}
			}
		} else {
			try {
				console.log(`\x1b[32m🆕 /${interaction.commandName} executée par ${interaction.user.globalName}\x1b[37m`);
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: '⚠️ Une erreur s\'est produite lors de l\'exécution de cette commande !', ephemeral: true });
				} else {
					await interaction.reply({ content: '⚠️ Une erreur s\'est produite lors de l\'exécution de cette commande !', ephemeral: true });
				}
			}
		}
	},
};