const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hjelp")
    .setDescription("Vis hjelp for alle tilgjengelige kommandoer")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle("🎟️ Ticket-system kommandoer")
      .setColor("Blue")
      .setDescription(
        "Her er en oversikt over alle tilgjengelige kommandoer i ticket-systemet."
      )
      .addFields(
        {
          name: "/ta-sak",
          value: "Tar ansvar for saken og flytter den til din kategori.",
        },
        {
          name: "/frigi-sak",
          value:
            "Frasier deg ansvaret for saken og flytter den tilbake til åpen kø.",
        },
        {
          name: "/lukk-sak",
          value:
            "Lukker saken. Kun ansatte får tilgang, og man kan åpne eller slette den.",
        },
        {
          name: "/sak-tilgang legg-til/fjern",
          value:
            "Gir eller fjerner tilgang for en bruker i en bestemt sakskanal.",
        },
        {
          name: "/hejp",
          value: "Viser denne hjelpeoversikten.",
        }
      )
      .setFooter({ text: "Tingretten Hjelpemeny" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
