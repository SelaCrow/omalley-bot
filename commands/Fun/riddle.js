const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

// Sample riddles
const riddles = [
	{
		question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
		answer: 'echo',
	},
	{
		question: 'What has to be broken before you can use it?',
		answer: 'egg',
	},
	{
		question: 'I\'m tall when I\'m young, and I\'m short when I\'m old. What am I?',
		answer: 'candle',
	},
	{
		question: 'What month of the year has 28 days?',
		answer: 'all',
	},
	{
		question: 'What is full of holes but still holds water?',
		answer: 'sponge',
	},
	{
		question: 'What question can you never answer yes to?',
		answer: 'are you asleep',
	},
	{
		question: 'What is always in front of you but can\'t be seen?',
		answer: 'future',
	},
	{
		question: 'There\'s a one-story house in which everything is yellow. Yellow walls, yellow doors, yellow furniture. What color are the stairs?',
		answer: 'no stairs',
	},
	{
		question: 'What can you break, even if you never pick it up or touch it?',
		answer: 'promise',
	},
	{
		question: 'What goes up but never comes down?',
		answer: 'age',
	},
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('riddle')
		.setDescription('Answer a riddle to win gold!'),

	async execute(interaction) {
		const userId = interaction.user.id;
		const riddle = riddles[Math.floor(Math.random() * riddles.length)];

		await interaction.deferReply();

		await interaction.editReply(`${interaction.user}, here's your riddle:

**${riddle.question}**
_You have 60 seconds to answer..._`);

		const filter = m => m.author.id === userId;
		const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });

		collector.on('collect', async message => {
			const answer = message.content.toLowerCase();
			if (answer.includes(riddle.answer)) {
				const user = await User.findOne({ where: { user_id: userId } });

				if (user) {
					user.balance += 10;
					await user.save();
				}
				else {
					await User.create({ user_id: userId, balance: 10 });
				}

				return interaction.followUp(`${message.author}, you nailed it! You earn **10 gold** for being such a clever varmint.`);
			}
			else {
				return interaction.followUp(`Nice try, ${message.author}, but that ain't the right answer.`);
			}
		});

		collector.on('end', collected => {
			if (collected.size === 0) {
				interaction.followUp(`Time's up, partner! The answer was **${riddle.answer}**.`);
			}
		});
	},
};
