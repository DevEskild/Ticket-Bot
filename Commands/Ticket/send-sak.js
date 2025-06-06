const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} = require("discord.js");
const db = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send-sak")
    .setDescription("Send saken til en annen dommer")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) =>
      option
        .setName("dommer")
        .setDescription("Dommeren du vil sende saken til")
        .setRequired(true)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const targetUser = interaction.options.getUser("dommer");
    const channel = interaction.channel;
    const ticketMatch = channel.name.match(/sak-(?:.+-)?(\d+)$/);

    if (!ticketMatch) {
      return interaction.reply({
        content: "❌ Denne kommandoen må brukes i en sakskanal.",
        ephemeral: true,
      });
    }

    const ticketId = parseInt(ticketMatch[1]);

    db.get(
      `SELECT kategori_id FROM dommere WHERE user_id = ?`,
      [targetUser.id],
      async (err, row) => {
        if (err) {
          console.error("DB-feil:", err);
          return interaction.reply({
            content: "❌ Databasefeil ved henting av dommer.",
            ephemeral: true,
          });
        }

        if (!row) {
          return interaction.reply({
            content: `❌ ${targetUser.tag} er ikke registrert som dommer i systemet.`,
            ephemeral: true,
          });
        }

        const categoryId = row.category_id;

        try {
          await channel.setParent(categoryId);
          return interaction.reply({
            content: `✅ Sak #${ticketId} er nå sendt til ${targetUser.tag}.`,
            ephemeral: true,
          });
        } catch (error) {
          console.error("Feil ved flytting av kanal:", error);
          return interaction.reply({
            content: "❌ Klarte ikke å flytte saken til ny dommer.",
            ephemeral: true,
          });
        }
      }
    );
  },
};
