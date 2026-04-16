const { SlashCommandBuilder } = require('discord.js');
const { soberUp, isDrunk } = require('./buy_booze.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sober_up')
		.setDescription('Shake off the whiskey and clear your head.'),

	async execute(interaction) {
		const userId = interaction.user.id;

		// Check if user is actually drunk
		if (!isDrunk(userId)) {
			return interaction.reply({ content: 'You ain\'t even been drinkin\', partner. You already got a clear head.', ephemeral: true });
		}

		// Sober them up
		soberUp(userId);

		return interaction.reply(`☕ **${interaction.user.username}** shook off the whiskey! They're back in their right mind.`);
	},
};
