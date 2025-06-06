const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const db = require("../../db");
const getTicketById = require("../../Functions/getTicket");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("av-sak")
    .setDescription("Frigjør denne saken")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const openCategoryId = client.config.TICKETCAT;

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "❌ Du har ikke tillatelse til å frigjøre saker.",
        ephemeral: true,
      });
    }

    const channel = interaction.channel;
    const ticketMatch = channel.name.match(/sak-(?:.+-)?(\d+)$/);
    if (!ticketMatch) {
      return interaction.reply({
        content: "❌ Denne kommandoen må brukes i en sakskanal.",
        ephemeral: true,
      });
    }

    const ticketId = parseInt(ticketMatch[1]);
    const updatedAt = new Date();

    let ticket;
    try {
      ticket = await getTicketById(ticketId);
      if (!ticket) {
        return interaction.reply({
          content: "❌ Fant ikke informasjon om saken i databasen.",
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error("DB-feil:", err);
      return interaction.reply({
        content: "❌ Feil ved tilgang til databasen.",
        ephemeral: true,
      });
    }

    await channel.setParent(openCategoryId).catch(console.error);
    await channel.permissionOverwrites.set([
      {
        id: interaction.guild.id,
        deny: ["ViewChannel"],
      },
      {
        id: staffRoleId,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
      {
        id: ticket.user_id,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
    ]);

    db.run(
      `UPDATE tickets
       SET status = ?, status_updated_at = ?, claimed_by_id = NULL, claimed_by_name = NULL
       WHERE id = ?`,
      ["Åpen", updatedAt.toISOString(), ticketId]
    );

    await interaction.reply({
      content: `✅ Sak #${ticketId} er frigjort og flyttet tilbake til køen.`,
    });

    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessage = messages.find(
      (m) => m.author.id === client.user.id && m.embeds.length > 0
    );
    if (botMessage) {
      const oldEmbed = botMessage.embeds[0];
      const newEmbed = EmbedBuilder.from(oldEmbed)
        .spliceFields(2, 1, {
          name: "Status",
          value: "🟢 Åpen",
          inline: true,
        })
        .setFields(
          EmbedBuilder.from(oldEmbed).data.fields.filter(
            (f) => f.name !== "Claimed By" && f.name !== "Tatt av"
          )
        );

      await botMessage.edit({ embeds: [newEmbed] });
    }
  },
};
