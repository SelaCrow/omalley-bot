const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('Play the slot machine and test your luck!')
		.addIntegerOption(option =>
			option.setName('bet')
				.setDescription('Amount of gold to bet')
				.setRequired(true),
		),
	async execute(interaction) {
		const userId = interaction.user.id;
		const betAmount = interaction.options.getInteger('bet');

		// Retrieve user from database
		const user = await User.findOne({ where: { user_id: userId } });

		// Check if user exists and has enough gold
		if (!user || user.balance < betAmount) {
			return interaction.reply({ content: 'Whoa there, buckaroo—you ain\'t got enough gold to play! Better rustle up some more first.', ephemeral: true });
		}

		// Slot symbols
		const symbols = ['🍒', '🍋', '🍉', '⭐', '💎'];
		const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
		const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
		const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

		// Display slot result
		const result = `🎰 | ${slot1} | ${slot2} | ${slot3} | 🎰`;

		// Check if the user wins
		if (slot1 === slot2 && slot2 === slot3) {
			 // 5x multiplier for jackpot
			const winnings = betAmount * 5;
			user.balance += winnings;
			await user.save();
			return interaction.reply(`${result}\n🎉 Yeehaw! Jackpot! You struck it rich and walked away with ${winnings} gold!`);
		}
		else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
			 // 2x multiplier for two matching symbols
			const winnings = Math.floor(betAmount * 2);
			user.balance += winnings;
			await user.save();
			return interaction.reply(`${result}\n✨ Well now, look at that! You matched two symbols and won yourself ${winnings} gold!`);
		}
		else {
			// Deduct the bet amount
			user.balance -= betAmount;
			await user.save();
			return interaction.reply(`${result}\n💀 Tough luck, partner! You lost this round—better luck next time!`);
		}
	},
};
