const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../../db");
const getTicketById = require("../../Functions/getTicket");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lukk-sak")
    .setDescription("Lukk den aktive saken")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const closedCategory = client.config.CLOSEDTICKETS;

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "❌ Du har ikke tillatelse til å lukke saker.",
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
    const closedAt = new Date();

    db.get(
      `SELECT user_id FROM tickets WHERE id = ?`,
      [ticketId],
      async (err, row) => {
        if (err || !row) {
          return interaction.reply({
            content: "❌ Klarte ikke å finne informasjon om saken i databasen.",
            ephemeral: true,
          });
        }

        await channel.setParent(closedCategory);

        await channel.permissionOverwrites.set([
          {
            id: interaction.guild.id,
            deny: ["ViewChannel"],
          },
          {
            id: staffRoleId,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
        ]);

        db.run(
          `UPDATE tickets SET status = ?, status_updated_at = ? WHERE id = ?`,
          ["Lukket", closedAt.toISOString(), ticketId]
        );

        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`reopen_${ticketId}`)
            .setLabel("Gjenåpne saken")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`delete_${ticketId}`)
            .setLabel("Slett saken")
            .setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
          .setTitle(`Sak #${ticketId} lukket`)
          .setColor("Red")
          .setDescription("Denne saken har blitt lukket av en ansatt.")
          .addFields({
            name: "Lukket",
            value: `<t:${Math.floor(closedAt.getTime() / 1000)}:F>`,
            inline: false,
          });

        await interaction.reply({
          content: "✅ Saken ble lukket.",
          ephemeral: true,
        });
        await channel.send({ embeds: [embed], components: [buttonRow] });
      }
    );
  },
};
