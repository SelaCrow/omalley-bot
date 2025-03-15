const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get a list of available commands or details on a specific command')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('Get detailed help for a specific command')
				.setRequired(false),
		),
	async execute(interaction) {
		const commandName = interaction.options.getString('command');
		const commands = interaction.client.commands;
		const user = interaction.user;
		const member = await interaction.guild.members.fetch(user.id);

		// **Check if the user has Moderator permissions**
		const isMod = member.permissions.has(PermissionFlagsBits.ManageGuild);

		// **If user wants help on a specific command**
		if (commandName) {
			const command = commands.get(commandName);

			if (!command) {
				return interaction.reply({ content: `❌ No command found with the name **${commandName}**.`, ephemeral: true });
			}

			// **Hide mod-only commands from non-mods**
			if (command.data.default_member_permissions && !isMod) {
				return interaction.reply({ content: '❌ You do not have permission to view this command.', ephemeral: true });
			}

			// **Format detailed info about the specific command**
			let response = `📖 **Command:** \`${command.data.name}\`\n`;
			response += `📜 **Description:** ${command.data.description || 'No description available.'}\n`;

			// **Check if the command has options**
			if (command.data.options.length > 0) {
				response += '⚙ **Options:**\n';
				command.data.options.forEach(option => {
					response += `- \`${option.name}\`: ${option.description}\n`;
				});
			}

			return interaction.reply({ content: response, ephemeral: true });
		}

		// **Sort Commands Based on Permissions**
		const visibleCommands = commands.filter(cmd => !cmd.data.default_member_permissions || isMod);

		// **Format Help Message**
		const commandList = visibleCommands
			.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
			.join('\n');

		const helpMessage = `🛠 **Available Commands**:\n${commandList}\n\n💡 Use \`/help [command]\` for more details on a command.`;

		return interaction.reply({ content: helpMessage, ephemeral: true });
	},
};
