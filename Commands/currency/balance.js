const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { db } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Check your balance or another user\'s balance')
		.addUserOption(option => option.setName('user').setDescription('The user to check the balance of')),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('user') || interaction.user;

		// If a target user is specified and the executor is not a moderator, deny the request
		if (targetUser.id !== interaction.user.id && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
			return interaction.reply({ content: 'That ain\'t your gold to be countin\', friend.', ephemeral: true });
		}

		// Check if the user exists in the database
		let user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(targetUser.id);

		if (!user) {
			// If the user does not exist, create a new entry with a balance of 0
			db.prepare('INSERT INTO users (user_id, balance) VALUES (?, ?)').run(targetUser.id, 0);
			user = { user_id: targetUser.id, balance: 0 };
		}

		return interaction.reply(`${targetUser}'s ridin' with ${user.balance} gold to their name.`);
	},
};