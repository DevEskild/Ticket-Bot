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
    .setName("ta-sak")
    .setDescription("Ta eierskap til saken")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "❌ Du har ikke tillatelse til å ta saker.",
        ephemeral: true,
      });
    }

    const channel = interaction.channel;
    const ticketMatch = channel.name.match(/sak-(?:.+-)?(\d+)$/);
    if (!ticketMatch) {
      return interaction.reply({
        content: "❌ Denne kommandoen kan kun brukes i en ticket-kanal.",
        ephemeral: true,
      });
    }

    const ticketId = parseInt(ticketMatch[1]);
    const claimedAt = new Date();

    // 🔍 Hent ticket-data
    let ticket;
    try {
      ticket = await getTicketById(ticketId);
      if (!ticket) {
        return interaction.reply({
          content: "❌ Fant ikke saken i databasen.",
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error("Databasefeil:", err);
      return interaction.reply({
        content: "❌ Klarte ikke å hente data fra databasen.",
        ephemeral: true,
      });
    }

    // 🔍 Sjekk om dommer er registrert
    db.get(
      `SELECT kategori_id FROM dommere WHERE user_id = ?`,
      [interaction.user.id],
      async (err, row) => {
        if (err) {
          console.error("DB-feil:", err);
          return interaction.reply({
            content: "❌ En databasefeil oppstod.",
            ephemeral: true,
          });
        }

        if (!row) {
          return interaction.reply({
            content:
              "⚠️ Du er ikke registrert som dommer. Bruk /ny-dommer for å registrere deg.",
            ephemeral: true,
          });
        }

        const kategoriId = row.kategori_id;

        // 🗂️ Flytt ticket til dommerens kategori
        await channel.setParent(kategoriId).catch((err) => {
          console.error("Feil ved flytting:", err);
          return interaction.reply({
            content: "❌ Klarte ikke å flytte saken til kategorien din.",
            ephemeral: true,
          });
        });

        // 👮 Oppdater tillatelser
        await channel.permissionOverwrites.set([
          {
            id: interaction.guild.id,
            deny: ["ViewChannel"],
          },
          {
            id: client.config.STAFF,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
          {
            id: ticket.user_id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
        ]);

        // 💾 Oppdater ticket-status
        db.run(
          `UPDATE tickets
         SET status = ?, status_updated_at = ?, claimed_by_id = ?, claimed_by_name = ?
         WHERE id = ?`,
          [
            "Claimed",
            claimedAt.toISOString(),
            interaction.user.id,
            interaction.user.tag,
            ticketId,
          ]
        );

        await interaction.reply({
          content: `✅ Du har tatt eierskap til sak #${ticketId}, og den er flyttet til din kategori.`,
          ephemeral: true,
        });

        // 🖼️ Oppdater embed
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(
          (m) => m.author.id === client.user.id && m.embeds.length > 0
        );

        if (botMessage) {
          const oldEmbed = botMessage.embeds[0];
          const newEmbed = EmbedBuilder.from(oldEmbed)
            .spliceFields(2, 1, {
              name: "Status",
              value: "🟡 Tatt av",
              inline: true,
            })
            .addFields({
              name: "Tatt av",
              value: `${interaction.user}`,
              inline: true,
            });

          await botMessage.edit({ embeds: [newEmbed] });
        }
      }
    );
  },
};
