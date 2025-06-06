const { ButtonInteraction, EmbedBuilder } = require("discord.js");
const db = require("../../db");
const { createTranscript } = require("discord-html-transcripts");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const [action, ticketId] = interaction.customId.split("_");
    const channel = interaction.channel;
    const guild = interaction.guild;

    const getTicketById = require("../../Functions/getTicket");

    if (action === "reopen") {
      let ticket;
      try {
        ticket = await getTicketById(ticketId);
        if (!ticket) {
          return interaction.reply({
            content: "❌ Kunne ikke åpne saken på nytt. Fant ikke saken.",
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error("DB-feil:", err);
        return interaction.reply({
          content: "❌ Databasefeil ved forsøk på å åpne saken på nytt.",
          ephemeral: true,
        });
      }

      const user = await guild.members.fetch(ticket.user_id).catch(() => null);

      await channel.setParent(client.config.TICKETCAT);

      await channel.permissionOverwrites.set([
        {
          id: guild.id,
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

      db.run(
        `UPDATE tickets SET status = ?, status_updated_at = ? WHERE id = ?`,
        ["Åpen", new Date().toISOString(), ticketId]
      );

      await interaction.update({
        content: `🔓 Sak #${ticketId} er gjenåpnet.`,
        embeds: [],
        components: [],
      });

      await channel.send(
        `${user ? user : "Bruker"} har blitt lagt tilbake i saken.`
      );
    }

    if (action === "delete") {
      const transcriptChannel = guild.channels.cache.get(
        client.config.TRANSCRIPTS
      );
      if (!transcriptChannel) {
        return interaction.reply({
          content: "❌ Klarte ikke å finne loggkanal for utskrift.",
          ephemeral: true,
        });
      }

      await interaction.update({
        content: "🗑️ Sletter saken...",
        embeds: [],
        components: [],
      });

      const transcript = await createTranscript(channel, {
        limit: -1,
        returnBuffer: false,
        fileName: `sak-${ticketId}.html`,
      });

      await transcriptChannel.send({
        content: `📝 Logg for sak #${ticketId}`,
        files: [transcript],
      });

      await channel.delete().catch(console.error);
    }
  },
};
