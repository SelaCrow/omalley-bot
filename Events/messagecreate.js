const { Events, PermissionsBitField, Collection } = require('discord.js');
const { User } = require('../dbObjects.js');
const { isDrunk, soberUp } = require('../commands/Fun/buy_booze.js');
const { SwearOffense } = require('../dbObjects.js');

const messageCounts = new Collection();

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		console.log(`Received message: "${message.content}" from ${message.author.tag}`);

		// Ignore bot messages
		if (message.author.bot) return;

		const userId = message.author.id;
		const content = message.content.toLowerCase();

		// 🥴 Handle Drunken Speech
		if (isDrunk(userId)) {
			const jumbledText = jumbleText(message.content);

			await message.delete().catch(console.error);
			return message.channel.send(`🤠 **${message.author.username}** tried sayin' somethin', but all I got was:\n*"${jumbledText}"*`);
		}

		// 🕰️ Sober up if time has passed
		if (!isDrunk(userId)) {
			soberUp(userId);
		}

		// 👋 Greeting Responses
		const greetings = ['hi omalley', 'hello omalley', 'hey omalley', 'gm omalley', 'good morning omalley', 'morning omalley'];
		if (greetings.includes(content)) {
			if (content.startsWith('gm') || content.startsWith('good morning') || content.startsWith('morning')) {
				return message.reply('Mornin\', partner!');
			}
			else {
				return message.reply('Howdy!');
			}
		}

		// 🚨 Jail Command
		if (content.startsWith('omalley jail')) {
			if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
				return message.reply('Hold your horses, you\'re not cleared to use that.');
			}

			const targetUser = message.mentions.members.first();
			if (!targetUser) {
				return message.reply('You gotta point a finger \'fore you slap the cuffs on.');
			}

			if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
				return message.reply('Not my call to send folks to the quiet corner.');
			}

			if (targetUser.roles.highest.position >= message.guild.members.me.roles.highest.position) {
				return message.reply('Can\'t put \'em in timeout—they\'re ridin\' at the same rank or higher than me.');
			}

			try {
				await targetUser.timeout(60 * 1000, 'Jailed by O\'Malley');
				await message.reply(`${targetUser} has been roped up for one minute, sit tight.`);
			}
			catch (error) {
				console.error(error);
				message.reply('Can\'t pen \'em up \'less I\'m wearin\' the bigger hat \'round here.');
			}
		}

		// 💰 Message Counting & Gold Rewards
		const count = messageCounts.get(userId) || 0;
		if (count + 1 >= 100) {
			try {
				const user = await User.findOne({ where: { user_id: userId } });
				if (user) {
					user.balance += 1;
					await user.save();
				}
				else {
					await User.create({ user_id: userId, balance: 1 });
				}
				messageCounts.set(userId, 0);
				console.log(`${message.author.tag} has earned 1 gold!`);
			}
			catch (error) {
				console.error('Error updating user balance:', error);
			}
		}
		else {
			messageCounts.set(userId, count + 1);
		}

		// 🚫 Offensive Language Filter
		if (content.includes('fuck you')) {
			try {
				// Find or create the offense record
				let offense = await SwearOffense.findOne({ where: { user_id: userId } });
				if (!offense) {
					offense = await SwearOffense.create({ user_id: userId, count: 1 });
				}
				else {
					offense.count += 1;
					await offense.save();
				}

				// ⏱ Timeout after 3 offenses
				if (offense.count >= 3) {
					if (message.guild && message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
						const member = message.member;
						if (member && member.moderatable) {
							await member.timeout(60 * 1000, 'Used profanity toward O\'Malley');
							await message.channel.send({
								content: `<@${userId}> ran their mouth one too many times and earned a 1-minute timeout. Mind yer manners next time.`,
							});
						}
						else {
							await message.channel.send({
								content: `I tried, <@${userId}> — but I couldn’t wrangle you into timeout.`,
							});
						}
					}
					else {
						await message.channel.send({
							content: `I’d timeout <@${userId}> if I had the badge for it.`,
						});
					}

					// Reset the counter
					offense.count = 0;
					await offense.save();
				}
				else {
					await message.channel.send({
						content: `Careful now, <@${userId}>. That’s strike ${offense.count}/3.`,
					});
				}
			}
			catch (error) {
				console.error('Error handling swear offense:', error);
			}
		}
	},
};

// 🔀 Function to jumble text for drunken messages
function jumbleText(text) {
	return text.split(' ').map(word => {
		if (word.length > 3) {
			const middle = word.slice(1, -1).split('').sort(() => Math.random() - 0.5).join('');
			return word[0] + middle + word[word.length - 1];
		}
		return word;
	}).join(' ');
}
