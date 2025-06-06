const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Will respond with pong"),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const startTime = Date.now();
    const sentMessage = await interaction.reply({
      content: "Pinging...",
    });

    const latency = Date.now() - startTime;
    await sentMessage.edit({
      content: `Pong! Latency: ${latency}ms`,
    });
  },
};
