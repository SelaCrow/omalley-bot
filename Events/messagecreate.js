const { Events, PermissionsBitField, Collection } = require('discord.js');
const { Users } = require('../dbObjects.js');

const messageCounts = new Collection();

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		console.log(`Received message: "${message.content}" from ${message.author.tag}`);

		// Ignore messages from bots
		if (message.author.bot) return;

		// Convert message content to lowercase
		const content = message.content.toLowerCase();

		// Combined Greeting Responses
		const greetings = ['hi omalley', 'hello omalley', 'hey omalley', 'gm omalley', 'good morning omalley', 'morning omalley'];
		if (greetings.includes(content)) {
			if (content.startsWith('gm') || content.startsWith('good morning') || content.startsWith('morning')) {
				return message.reply('Mornin\', partner!');
			}
			else {
				return message.reply('Howdy!');
			}
		}

		// Jail Command
		if (content.startsWith('omalley jail')) {
			// Check if the sender has the 'MODERATE_MEMBERS' permission
			if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
				return message.reply('Hold your horses, you\'re not cleared to use that.');
			}

			// Get the mentioned user
			const targetUser = message.mentions.members.first();
			if (!targetUser) {
				return message.reply('You gotta point a finger \'fore you slap the cuffs on.');
			}

			// Check if the bot has the timeout permission
			if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
				return message.reply('Not my call to send folks to the quiet corner.');
			}

			// Ensure the bot's role is higher than the user's role
			if (targetUser.roles.highest.position >= message.guild.members.me.roles.highest.position) {
				return message.reply('Can\'t put \'em in timeout—they\'re ridin\' at the same rank or higher than me.');
			}

			try {
				// Timeout the user for 60 seconds
				await targetUser.timeout(60 * 1000, 'Jailed by O\'Malley');

				// Reply confirming the timeout
				await message.reply(`${targetUser} has been roped up for one minute, sit tight.`);
			}
			catch (error) {
				console.error(error);
				message.reply('Can\'t pen \'em up \'less I\'m wearin\' the bigger hat \'round here.');
			}
		}

		// Message Counting and Gold Awarding
		const userId = message.author.id;
		const count = messageCounts.get(userId) || 0;

		if (count + 1 >= 10) {
			const user = await Users.findOne({ where: { user_id: userId } });
			if (user) {
				user.balance += 1;
				await user.save();
			}
			else {
				await Users.create({ user_id: userId, balance: 1 });
			}
			messageCounts.set(userId, 0);
		}
		else {
			messageCounts.set(userId, count + 1);
		}
	},
};