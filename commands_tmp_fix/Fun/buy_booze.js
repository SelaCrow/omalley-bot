const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

// Map to store drunk users and their expiration time
const drunkUsers = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('buy_booze')
		.setDescription('Buy yourself a strong drink and get a little tipsy!'),

	async execute(interaction) {
		const userId = interaction.user.id;
		const user = await User.findOne({ where: { user_id: userId } });

		if (!user) {
			return interaction.reply({ content: 'You ain\'t even got a single gold nugget to your name, partner.', ephemeral: true });
		}

		// Cost of booze
		const boozePrice = 10;
		if (user.balance < boozePrice) {
			return interaction.reply({ content: 'You ain\'t got enough gold for that, partner. Better earn some first.', ephemeral: true });
		}

		// Check if the user is already drunk
		if (isDrunk(userId)) {
			return interaction.reply({ content: 'You\'re already drunk, cowboy! Try again when you sober up.', ephemeral: true });
		}

		// Deduct gold and make them drunk
		user.balance -= boozePrice;
		await user.save();

		const drunkDuration = 3 * 60 * 1000;
		drunkUsers.set(userId, Date.now() + drunkDuration);

		setTimeout(() => {
			soberUp(userId);
		}, drunkDuration);

		return interaction.reply(`🍻 **${interaction.user.username}** just downed some strong whiskey! For the next **3 minutes**, their words might come out a lil' messy!`);
	},
};

// 🥴 Check if user is drunk
function isDrunk(userId) {
	const expiration = drunkUsers.get(userId);
	return expiration && Date.now() < expiration;
}

// 🛑 Sober up a user
function soberUp(userId) {
	if (drunkUsers.has(userId)) {
		drunkUsers.delete(userId);
		console.log(`User ${userId} has sobered up.`);
	}
}

// Export these functions for messageCreate.js
module.exports.isDrunk = isDrunk;
module.exports.soberUp = soberUp;
