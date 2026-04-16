const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function drawCard() {
	const suit = suits[Math.floor(Math.random() * suits.length)];
	const value = values[Math.floor(Math.random() * values.length)];
	return { suit, value };
}

function calculateHand(hand) {
	let total = 0;
	let aces = 0;

	for (const card of hand) {
		if (card.value === 'A') {
			aces += 1;
			total += 11;
		}
		else if (['J', 'Q', 'K'].includes(card.value)) {
			total += 10;
		}
		else {
			total += parseInt(card.value);
		}
	}

	// Convert Aces from 11 to 1 if needed
	while (total > 21 && aces > 0) {
		total -= 10;
		aces -= 1;
	}

	return total;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription('Play a game of Blackjack and test your luck!')
		.addIntegerOption(option =>
			option.setName('bet')
				.setDescription('Amount of gold to bet')
				.setRequired(true),
		),

	async execute(interaction) {
		const userId = interaction.user.id;
		const betAmount = interaction.options.getInteger('bet');

		// Retrieve user from the database
		const user = await User.findOne({ where: { user_id: userId } });

		// Check if user exists and has enough gold
		if (!user || user.balance < betAmount) {
			return interaction.reply({ content: 'Whoa there, buckaroo—you ain\'t got enough gold to play! Better rustle up some more first.', ephemeral: true });
		}

		// Deduct the initial bet
		user.balance -= betAmount;
		await user.save();

		// Initial hands
		const playerHand = [drawCard(), drawCard()];
		const dealerHand = [drawCard(), drawCard()];

		let playerTotal = calculateHand(playerHand);
		let dealerTotal = calculateHand(dealerHand);

		// Display initial hands
		await interaction.reply(`🃏 **Blackjack!** You bet **${betAmount}** gold.\n\n`
			+ `**Your Hand:** ${playerHand.map(c => `${c.value}${c.suit}`).join(' ')} (**${playerTotal}**)`
			+ `\n**Dealer's Hand:** ${dealerHand[0].value}${dealerHand[0].suit} ❓`);

		// If player gets Blackjack (21) instantly, auto-win unless dealer has one too
		if (playerTotal === 21) {
			if (dealerTotal === 21) {
				await interaction.followUp(`It's a **draw!** You get your **${betAmount}** gold back.`);
				user.balance += betAmount;
				await user.save();
				return;
			}
			await interaction.followUp(`🎉 Blackjack! You win **${betAmount * 2}** gold!`);
			user.balance += betAmount * 2;
			await user.save();
			return;
		}

		// Player's turn
		let playerTurn = true;
		while (playerTurn && playerTotal < 21) {
			await interaction.followUp('Type **hit** to draw a card, or **stand** to hold your ground.');

			const filter = response =>
				(response.content.toLowerCase() === 'hit' || response.content.toLowerCase() === 'stand') &&
				response.author.id === userId;

			const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

			if (!collected.size) {
				await interaction.followUp('You took too long! The dealer wins by default.');
				return;
			}

			const response = collected.first().content.toLowerCase();

			if (response === 'hit') {
				const newCard = drawCard();
				playerHand.push(newCard);
				playerTotal = calculateHand(playerHand);
				await interaction.followUp(`🃏 You drew: **${newCard.value}${newCard.suit}**\n**Your Hand:** ${playerHand.map(c => `${c.value}${c.suit}`).join(' ')} (**${playerTotal}**)`);

				if (playerTotal > 21) {
					await interaction.followUp(`**BUST!** You went over 21. You lost **${betAmount}** gold.`);
					return;
				}
			}
			else if (response === 'stand') {
				playerTurn = false;
			}
		}

		// Dealer's turn (Hits until 17 or more)
		await interaction.followUp(`Dealer reveals: **${dealerHand.map(c => `${c.value}${c.suit}`).join(' ')}** (**${dealerTotal}**)`);

		while (dealerTotal < 17) {
			const newCard = drawCard();
			dealerHand.push(newCard);
			dealerTotal = calculateHand(dealerHand);
			await interaction.followUp(`🃏 Dealer drew: **${newCard.value}${newCard.suit}** (Now at **${dealerTotal}**)`);
		}

		// Determine winner
		if (dealerTotal > 21 || playerTotal > dealerTotal) {
			await interaction.followUp(`🎉 **You win!** You walk away with **${betAmount * 2}** gold!`);
			user.balance += betAmount * 2;
		}
		else if (playerTotal < dealerTotal) {
			await interaction.followUp(`**Dealer wins!** You lost **${betAmount}** gold.`);
		}
		else {
			await interaction.followUp(`**It's a draw!** You get your **${betAmount}** gold back.`);
			user.balance += betAmount;
		}

		await user.save();
	},
};
