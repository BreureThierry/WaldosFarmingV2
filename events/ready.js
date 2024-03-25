const { Events, ActivityType } = require('discord.js');
const config = require('../config.json');
const devMode = config.bot.devMode;

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`✅ ${client.user.username} est connecté.`);
		if (devMode) {
			client.user.setPresence(
				{ activities: [{ 
					name: 'debug', 
					type: ActivityType.Playing, 
					state: 'Bot en maintenance...'}],
				}
				);
			return;
		} else {
			client.user.setPresence(
				{ activities: [{ 
					name: 'debug', 
					name: 'les cultures', 
					type: ActivityType.Watching, 
					state: 'Réveille le grower qui sommeille en toi !'}],
				}
			);
		}
	},
};