const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { db } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('losegold')
		.setDescription('Remove gold from a user')
		.addUserOption(option => option.setName('user').setDescription('The user to remove gold from').setRequired(true))
		.addIntegerOption(option => option.setName('amount').setDescription('The amount of gold to remove').setRequired(true)),
	async execute(interaction) {
		// Check if the user has the MANAGE_GUILD permission
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
		}

		const targetUser = interaction.options.getUser('user');
		const amount = interaction.options.getInteger('amount');

		// Check if the user exists in the database
		const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(targetUser.id);

		if (!user) {
			return interaction.reply({ content: 'User not found.', ephemeral: true });
		}
		else {
			// If the user exists, update their balance
			user.balance -= amount;
			if (user.balance < 0) user.balance = 0;
			db.prepare('UPDATE users SET balance = ? WHERE user_id = ?').run(user.balance, targetUser.id);
		}

		return interaction.reply(`${targetUser} now has ${user.balance} gold.`);
	},
};