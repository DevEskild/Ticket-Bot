const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketmsg")
    .addChannelOption((options) =>
      options
        .setName("channel")
        .setDescription("Supply the channel you want the message to be sent in")
        .setRequired(true)
    )
    .setDescription("Will respond with a custom message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel");

    if (!channel) return;

    const Embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Opprett en sak")
      .setThumbnail(client.config.LOGO)
      .setDescription(
        "Om du ønsker å henvende deg til tingretten så opprett en sak med å trykke på knappen under."
      );

    const createBtn = new ButtonBuilder()
      .setCustomId("createTicket")
      .setLabel("Opprett Sak")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(createBtn);

    await channel.send({ embeds: [Embed], components: [row] });

    interaction.reply({
      content: "Saken din har blitt opprettet!",
      ephemeral: true,
    });
  },
};
