const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { User } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addgold')
		.setDescription('Add gold to a user')
		.addUserOption(option => option.setName('user').setDescription('The user to add gold to').setRequired(true))
		.addIntegerOption(option => option.setName('amount').setDescription('The amount of gold to add').setRequired(true)),
	async execute(interaction) {
		// Check if the user has the MANAGE_GUILD permission
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
		}

		const targetUser = interaction.options.getUser('user');
		const amount = interaction.options.getInteger('amount');

		// Check if the user exists in the database
		let user = await User.findOne({ where: { user_id: targetUser.id } });

		if (!user) {
			// If the user does not exist, create a new entry with the specified balance
			user = await User.create({ user_id: targetUser.id, balance: amount });
		}
		else {
			// If the user exists, update their balance
			user.balance += amount;
			await user.save();
		}

		return interaction.reply(`${targetUser} now has ${user.balance} gold.`);
	},
};