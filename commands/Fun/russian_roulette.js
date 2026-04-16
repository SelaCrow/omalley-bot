const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('russian_roulette')
		.setDescription('Take your chances... One in six you get timed out!')
		.setDMPermission(false),

	async execute(interaction) {
		const member = interaction.member;
		const chamber = Math.floor(Math.random() * 6) + 1;

		await interaction.reply('Spinnin\' the cylinder... Pullin\' the trigger...');

		if (chamber === 1) {
			if (!member.moderatable) {
				return interaction.editReply('Click. Lucky you... and I can\'t time you out anyway.');
			}

			try {
				await member.timeout(60 * 1000, 'Russian Roulette (bot-triggered)');
				await interaction.editReply(`BANG! 💥 Looks like ${interaction.user} caught the bullet. One-minute timeout, partner.`);
			}
			catch (error) {
				console.error('Failed to timeout user:', error);
				await interaction.editReply('Tried to shoot, but my gun jammed. You live this time.');
			}
		}
		else {
			await interaction.editReply('Click. You\'re safe... this time.');
		}
	},
};
