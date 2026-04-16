const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const token = process.env.DISCORD_TOKEN;
const { sequelize, User } = require('./dbObjects.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

client.cooldowns = new Collection();
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			console.log(`Loaded command: ${command.data.name}`);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, async () => {
	console.log(`Ready! Logged in as ${client.user.tag}`);

	// Test the database connection
	try {
		await sequelize.authenticate();
		await sequelize.sync();
		console.log('Connection to the database has been established & tables synced!');
	}
	catch (error) {
		console.error('Unable to connect to the database:', error);
	}

	// Example of using the User model
	const userCount = await User.count();
	console.log(`There are ${userCount} users in the database.`);
});

// Load the messageCreate event handler
const messageCreateHandler = require('./Events/messagecreate.js');
client.on(Events.MessageCreate, messageCreateHandler.execute);

client.on('guildMemberAdd', async (member) => {
	// The ID of the welcome channel
	const welcomeChannelId = '1322094546988961925';

	// Get the welcome channel
	const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
	if (!welcomeChannel) {
		console.log('Welcome channel not found.');
		return;
	}

	// Send the welcome message
	welcomeChannel.send(`Welcome to the Crow's Nest, ${member}!\n\n` +
        'Before you can access the server, make sure to:\n' +
        '- Read the rules\n' +
        '- Verify yourself\n' +
        '- Introduce yourself\n\n' +
        'After doing your introduction, a mod will accept it and give you full access to the rest of the server :3',
	);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	const { cooldowns } = interaction.client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 7;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1000);
			return interaction.reply({ content: `Slow down, partner! You can use \`${command.data.name}\` again in <t:${expiredTimestamp}:R>.`, ephemeral: true });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		}
		else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token);