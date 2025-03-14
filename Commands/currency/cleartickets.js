const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let lotteryPool = {};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear_tickets')
		.setDescription('Clears lottery tickets for users (Mods Only)')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName('all')
				.setDescription('Clears all tickets for everyone'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('user')
				.setDescription('Clears tickets for a specific user')
				.addUserOption(option =>
					option.setName('target')
						.setDescription('The user whose tickets you want to clear')
						.setRequired(true),
				),
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		// 🧹 `/clear_tickets all` - Clears ALL tickets
		if (subcommand === 'all') {
			lotteryPool = {};
			return interaction.reply('🗑️ All lottery tickets have been **cleared**!');
		}

		// 🧍 `/clear_tickets user @User` - Clears tickets for one user
		if (subcommand === 'user') {
			const targetUser = interaction.options.getUser('target');

			if (!lotteryPool[targetUser.id]) {
				return interaction.reply({ content: `⚠️ **${targetUser.username}** has no lottery tickets to clear!`, ephemeral: true });
			}

			delete lotteryPool[targetUser.id];
			return interaction.reply(`🗑️ Cleared **${targetUser.username}**'s lottery tickets!`);
		}
	},
};
