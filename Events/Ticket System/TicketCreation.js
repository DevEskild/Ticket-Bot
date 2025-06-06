const {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const db = require("../../db");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton() || interaction.customId !== "createTicket")
      return;

    const staffRole = client.config.STAFF;
    const ticketCategory = client.config.TICKETCAT;
    const user = interaction.user;
    const createdAt = new Date();

    db.run(
      `INSERT INTO tickets (user_id, user_name, created_at, status, status_updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        user.tag,
        createdAt.toISOString(),
        "Åpen",
        createdAt.toISOString(),
      ],
      async function (err) {
        if (err) {
          console.error("DB-feil:", err);
          return interaction.reply({
            content: "❌ Noe gikk galt under opprettelsen av saken din.",
            ephemeral: true,
          });
        }

        const ticketId = this.lastID;
        const member = await interaction.guild.members.fetch(user.id);
        const nickname = member.nickname || user.username;
        const cleanName = nickname
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .substring(0, 20);
        const channelName = `sak-${cleanName}-${ticketId}`;

        interaction.guild.channels
          .create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategory,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
              {
                id: staffRole,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
            ],
          })
          .then(async (channel) => {
            await interaction.reply({
              content: `✅ Sak #${ticketId} er opprettet: <#${channel.id}>`,
              ephemeral: true,
            });

            const embed = new EmbedBuilder()
              .setTitle(`Sak #${ticketId}`)
              .setColor("Green")
              .addFields(
                {
                  name: "Opprettet av",
                  value: `${user} (${user.id})`,
                  inline: true,
                },
                {
                  name: "Tidspunkt",
                  value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`,
                  inline: true,
                },
                { name: "Status", value: "🟢 Åpen", inline: true }
              )
              .setFooter({ text: `Sak opprettet av ${user.tag}` });

            await channel.send({
              content: `${user} | <@&${staffRole}>`,
              embeds: [embed],
            });
          })
          .catch((err) => {
            console.error("Feil ved kanalopprettelse:", err);
            interaction.followUp({
              content: "❌ Klarte ikke å opprette kanalen for saken.",
              ephemeral: true,
            });
          });
      }
    );
  },
};
