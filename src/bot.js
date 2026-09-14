const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActivityType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');
const { isModuleEnabled, getGuild } = require('./db/database');
const deny = require('./utils/deny');
const apps = require('./services/applications');
const dn = require('./services/dienstnummern');
const team = require('./services/team');
const statusPanel = require('./services/statusPanel');
const ausweis = require('./services/ausweis');
const dutyPanel = require('./services/dutyPanel');
const ingame = require('./services/ingame');
const roblox = require('./services/roblox');



/** Sticky: "Schreibe deinen Roblox-Namen hier rein" — no pin; replace old sticky */
function dizzyStickyEmbed() {
  return new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle('Dizzy-Kontrolle')
    .setDescription('↳ Schreibe deinen Roblox-Namen hier rein');
}

async function ensureDizzySticky(channel, guildId) {
  if (!global.__stafforaDizzySticky) global.__stafforaDizzySticky = new Map();
  const key = String(guildId) + ':' + String(channel.id);
  if (global.__stafforaDizzySticky.get(key)) return;
  try {
    await refreshDizzySticky(channel, guildId);
  } catch (e) {
    console.warn('[dizzy sticky]', e.message);
  }
}

/** Delete previous sticky and send a fresh one */
async function refreshDizzySticky(channel, guildId) {
  if (!global.__stafforaDizzySticky) global.__stafforaDizzySticky = new Map();
  const key = String(guildId) + ':' + String(channel.id);
  const stickyEmb = dizzyStickyEmbed();
  try {
    const oldId = global.__stafforaDizzySticky.get(key);
    if (oldId) {
      try {
        const old = await channel.messages.fetch(oldId).catch(() => null);
        if (old) await old.delete().catch(() => {});
      } catch (_) {}
    } else {
      // try find last sticky by title
      const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
      if (recent) {
        for (const m of recent.values()) {
          if (
            m.author?.bot &&
            (m.embeds?.[0]?.title === 'Dizzy-Kontrolle' || m.embeds?.[0]?.title === 'Dizzy Control')
          ) {
            await m.delete().catch(() => {});
          }
        }
      }
    }
    const msg = await channel.send({ embeds: [stickyEmb] });
    global.__stafforaDizzySticky.set(key, msg.id);
    return msg;
  } catch (e) {
    console.warn('[dizzy sticky refresh]', e.message);
    return null;
  }
}

function scheduleDizzyStickyRefresh(channel, guildId, delayMs) {
  const wait = delayMs == null ? 3000 : delayMs;
  setTimeout(() => {
    refreshDizzySticky(channel, guildId).catch(() => {});
  }, wait);
}

function isDizzyStaff(member, settings) {
  if (!member) return false;
  if (member.permissions?.has?.(PermissionFlagsBits.Administrator)) return true;
  const roles = []
    .concat(settings.dizzyControllerRoleIds || [])
    .concat(settings.ingameAccessRoleIds || [])
    .concat(settings.staffRoleIds || [])
    .concat(settings.adminRoleIds || [])
    .map(String);
  if (!roles.length) return member.permissions?.has?.(PermissionFlagsBits.ModerateMembers) || false;
  return member.roles.cache.some((r) => roles.includes(r.id));
}


/** Team action embed → Team-Log + optional reply */
async function sendTeamActionEmbed(client, guildId, payload) {
  const { EmbedBuilder } = require('discord.js');
  const { getGuild } = require('./db/database');
  const { settings } = getGuild(guildId);
  const {
    stafforaEmbed,
    STAFFORA_SUCCESS,
    STAFFORA_WARN,
    STAFFORA_DANGER,
    STAFFORA_COLOR
  } = require('./utils/branding');
  const colors = {
    promote: STAFFORA_SUCCESS,
    demote: STAFFORA_WARN,
    invite: STAFFORA_COLOR,
    kick: STAFFORA_DANGER,
    warn: STAFFORA_WARN,
    auto_kick: STAFFORA_DANGER
  };
  const titles = {
    promote: 'Team Uprank',
    demote: 'Team Demote',
    invite: 'Neues Teammitglied',
    kick: 'Team Kick',
    warn: 'Team Warn',
    auto_kick: 'Auto Team Kick'
  };
  const fields = [
    { name: 'Mitglied', value: payload.target || '—', inline: true },
    { name: 'Durchgeführt von', value: payload.actor || '—', inline: true }
  ];
  if (payload.rank) fields.push({ name: 'Rang', value: String(payload.rank), inline: true });
  if (payload.warns != null) fields.push({ name: 'Warns', value: String(payload.warns), inline: true });
  if (payload.reason) fields.push({ name: 'Grund', value: String(payload.reason).slice(0, 1000), inline: false });
  if (payload.extra) fields.push({ name: 'Details', value: String(payload.extra).slice(0, 1000), inline: false });
  const emb = stafforaEmbed(EmbedBuilder, {
    title: titles[payload.action] || 'Team',
    description: payload.description || undefined,
    color: colors[payload.action] != null ? colors[payload.action] : STAFFORA_COLOR,
    fields,
    footerSuffix: 'Team'
  });
  const logId = settings.teamLogChannelId || settings.logChannelId;
  if (logId && client) {
    try {
      const ch = await client.channels.fetch(logId).catch(() => null);
      if (ch) await ch.send({ embeds: [emb] }).catch(() => {});
    } catch (_) {}
  }
  return emb;
}



function websiteUrl(env) {
  const raw =
    (env && (env.DASHBOARD_URL || env.PUBLIC_URL)) ||
    process.env.DASHBOARD_URL ||
    process.env.PUBLIC_URL ||
    'https://stafforadashboard.github.io/staffora-web';
  return String(raw).replace(/\/$/, '').replace(/^https?:\/\//i, '');
}

function updatePresence(client, env) {
  try {
    const n = client.guilds.cache.size;
    // Discord shows: Playing Managing X Server(n)
    const name = `Managing ${n} Server${n === 1 ? '' : 'n'}`;
    client.user.setPresence({
      activities: [{ name, type: ActivityType.Playing }],
      status: 'online'
    });
  } catch (e) {
    console.warn('[presence]', e.message);
  }
}

const pendingFactionActions = new Map(); // key: userId -> { action, grund, guildId, at }

function createClient(env) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel]
  });
  client._stafforaEnv = env || process.env;

  
  client.on('guildMemberAdd', async (member) => {
    try {
      const { settings } = getGuild(member.guild.id);
      if (!settings.randomRolesEnabled) return;
      for (const rid of settings.randomRoleRemoveIds || []) {
        await member.roles.remove(rid, 'Staffora random roles').catch(() => {});
      }
      const give = settings.randomRoleGiveIds || [];
      if (give.length) {
        const pick = give[Math.floor(Math.random() * give.length)];
        await member.roles.add(pick, 'Staffora random roles').catch(() => {});
      }
    } catch (e) {
      console.warn('[randomRoles]', e.message);
    }
  });

  client.once('ready', async () => {
    console.log(`[Staffora] Logged in as ${client.user.tag}`);
    updatePresence(client, client._stafforaEnv);
    setInterval(() => updatePresence(client, client._stafforaEnv), 5 * 60 * 1000);

    try {
      const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
      const appId = client.user.id;

      const commands = [
        new SlashCommandBuilder()
          .setName('stats')
          .setDescription('Status- und Duty-Panel aktualisieren')
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
        
        new SlashCommandBuilder()
          .setName('giveaway')
          .setDescription('Giveaway starten oder neu auslosen')
          .addSubcommand((sc) =>
            sc
              .setName('start')
              .setDescription('Giveaway starten')
              .addStringOption((o) => o.setName('preis').setDescription('Preis / Gewinn').setRequired(true))
              .addIntegerOption((o) =>
                o.setName('gewinner').setDescription('Anzahl Gewinner').setRequired(false).setMinValue(1).setMaxValue(20)
              )
              .addStringOption((o) =>
                o.setName('dauer').setDescription('z.B. 30m, 2h, 1d, 2w, 1mo, 1y').setRequired(false)
              )
              .addChannelOption((o) => o.setName('kanal').setDescription('Kanal').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc
              .setName('end')
              .setDescription('Laufendes Giveaway beenden')
              .addStringOption((o) => o.setName('id').setDescription('Giveaway-ID (Footer)').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc
              .setName('reroll')
              .setDescription('Gewinner neu auslosen')
              .addStringOption((o) => o.setName('id').setDescription('Giveaway-ID').setRequired(false))
          ),

        new SlashCommandBuilder()
          .setName('suggest')
          .setDescription('Vorschlag einreichen')
          .addStringOption((o) => o.setName('titel').setDescription('Titel').setRequired(true))
          .addStringOption((o) => o.setName('vorschlag').setDescription('Dein Vorschlag').setRequired(true))
          .addStringOption((o) =>
            o.setName('kategorie').setDescription('Kategorie-ID (ingame, discord, team, …)').setRequired(true)
          ),

        new SlashCommandBuilder()
          .setName('fraktion')
          .setDescription('Fraktionen verwalten')
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
          .addSubcommand((sc) =>
            sc
              .setName('add')
              .setDescription('Fraktion hinzufügen')
              .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
              .addStringOption((o) =>
                o
                  .setName('kategorie')
                  .setDescription('Legal oder Illegal')
                  .setRequired(true)
                  .addChoices({ name: 'Legal', value: 'legal' }, { name: 'Illegal', value: 'illegal' })
              )
              .addChannelOption((o) => o.setName('announcement').setDescription('Announcement-Kanal').setRequired(true))
              .addStringOption((o) => o.setName('dc_link').setDescription('Discord-Invite-Link').setRequired(false))
              .addStringOption((o) => o.setName('beschreibung').setDescription('Beschreibung').setRequired(false))
              .addStringOption((o) => o.setName('owner').setDescription('Owner / Ansprechpartner').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc.setName('list').setDescription('Alle hinzugefügten Fraktionen anzeigen')
          )
          .addSubcommand((sc) =>
            sc
              .setName('remove')
              .setDescription('Fraktion entfernen (Dropdown)')
              .addStringOption((o) => o.setName('grund').setDescription('Grund').setRequired(true))
          )
          .addSubcommand((sc) =>
            sc
              .setName('warn')
              .setDescription('Fraktion verwarnen (Dropdown)')
              .addStringOption((o) => o.setName('grund').setDescription('Grund').setRequired(true))
          )
      ,
        new SlashCommandBuilder()
          .setName('team')
          .setDescription('Teamverwaltung')
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
          .addSubcommand((sc) =>
            sc.setName('invite').setDescription('User einladen')
              .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
              .addStringOption((o) => o.setName('rang').setDescription('Rang').setRequired(false))
              .addStringOption((o) => o.setName('grund').setDescription('Grund').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc.setName('promote').setDescription('Team uprank')
              .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
              .addStringOption((o) => o.setName('grund').setDescription('Grund').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc.setName('demote').setDescription('Team demote')
              .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
              .addStringOption((o) => o.setName('grund').setDescription('Grund').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc.setName('kick').setDescription('User aus dem Team entfernen')
              .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
              .addStringOption((o) => o.setName('grund').setDescription('Grund').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc.setName('warn').setDescription('Team-Warnung (optional temporär)')
              .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
              .addStringOption((o) => o.setName('grund').setDescription('Grund').setRequired(true))
              .addStringOption((o) => o.setName('dauer').setDescription('Temp: 1h 7d 2w 1mo 1y — leer = permanent').setRequired(false))
          )
          .addSubcommand((sc) =>
            sc.setName('lookup').setDescription('Team-Infos anzeigen')
              .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
          ),
        new SlashCommandBuilder()
          .setName('haus')
          .setDescription('Hausliste')
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
          .addSubcommand((sc) =>
            sc.setName('add').setDescription('Haus hinzufügen')
              .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
              .addStringOption((o) => o.setName('preis').setDescription('Preis').setRequired(false))
              .addStringOption((o) => o.setName('owner').setDescription('Owner Roblox').setRequired(false))
          ),
        new SlashCommandBuilder()
          .setName('ausweis')
          .setDescription('Ausweis anzeigen')
          .addSubcommand((sc) =>
            sc
              .setName('zeigen')
              .setDescription('Ausweis eines Roblox-Users im Ausweis-Kanal anzeigen')
              .addStringOption((o) =>
                o.setName('roblox').setDescription('Roblox-Name').setRequired(true)
              )
          ),
        new SlashCommandBuilder()
          .setName('message')
          .setDescription('Nachricht als Bot (Embed) senden')
          .addStringOption((o) =>
            o.setName('titel').setDescription('Embed-Titel').setRequired(true).setMaxLength(256)
          )
          .addStringOption((o) =>
            o.setName('text').setDescription('Embed-Text').setRequired(true).setMaxLength(4000)
          )
          .addChannelOption((o) =>
            o.setName('kanal').setDescription('Zielkanal (optional, sonst hier)').setRequired(false)
          )

      ].map((c) => c.toJSON());

      // 1) Guild-Commands überall leeren
      for (const [gid] of client.guilds.cache) {
        try {
          await rest.put(Routes.applicationGuildCommands(appId, gid), { body: [] });
        } catch (e) {
          console.warn('[Staffora] clear guild cmds', gid, e.message);
        }
      }

      // 2) Global leeren
      try {
        await rest.put(Routes.applicationCommands(appId), { body: [] });
        console.log('[Staffora] Global commands cleared');
      } catch (e) {
        console.error('[Staffora] clear global failed', e.message);
      }

      // 3) Neu global setzen
      try {
        const data = await rest.put(Routes.applicationCommands(appId), { body: commands });
        console.log(
          '[Staffora] Global commands registered (' + data.length + '):',
          data.map((c) => '/' + c.name).join(' ')
        );
      } catch (e) {
        console.error('[Staffora] command register failed', e.code || '', e.message);
        if (e.rawError) console.error(JSON.stringify(e.rawError).slice(0, 500));
      }
    } catch (e) {
      console.error('[Staffora] command register', e.message);
    }
    statusPanel.startPanelLoop(client);
    try { require('./services/giveaways').startTicker(client); } catch (e) { console.warn('[giveaway]', e.message); }
    try { require('./services/team').startWarnTicker(); } catch (e) { console.warn('[team]', e.message); }
    dutyPanel.attachClient(client);
    dutyPanel.startDutyPanelLoop(client);
    try { require('./services/teamlist').startTeamlistLoop(client); } catch (e) { console.warn('[teamlist]', e.message); }
    try { require('./services/security').register(client); } catch (e) { console.warn('[security]', e.message); }
    // VC systems removed
  });

  client.on('guildCreate', () => updatePresence(client, client._stafforaEnv));
  client.on('guildDelete', () => updatePresence(client, client._stafforaEnv));

  // Keywords auto-reply
  client.on('messageCreate', async (message) => {
    try {
      if (!message.guild || message.author.bot) return;
      try {
        const { settings: xpS } = getGuild(message.guild.id);
        require('./services/xp').onMessage(message.guild.id, message.author.id, xpS);
      } catch (_) {}
      if (!isModuleEnabled(message.guild.id, 'keywords')) return;
      const { listKeywords } = require('./db/database');
      const { settings } = getGuild(message.guild.id);
      const allowed = settings.keywordChannelIds || [];
      if (allowed.length && !allowed.includes(message.channel.id)) return;
      const content = (message.content || '').toLowerCase();
      const kws = listKeywords(message.guild.id);
      for (const k of kws) {
        if (k.trigger && content.includes(k.trigger)) {
          await message.reply({ content: k.response }).catch(() => {});
          break;
        }
      }
    } catch (e) {
      console.warn('[keywords]', e.message);
    }
  });

  // Dizzy Controller: user posts Roblox name in configured channel
  client.on('messageCreate', async (message) => {
    try {
      if (!message.guild || message.author.bot) return;
      try {
        const { settings: xpS } = getGuild(message.guild.id);
        require('./services/xp').onMessage(message.guild.id, message.author.id, xpS);
      } catch (_) {}
      const guildId = message.guild.id;
      const { settings } = getGuild(guildId);
      if (!settings.ingameDizzyControl && !settings.ingameDizzyChannelId) return;
      const chId = settings.ingameDizzyChannelId;
      if (!chId || message.channel.id !== chId) return;

      await ensureDizzySticky(message.channel, guildId);

      const raw = (message.content || '').trim();
      if (!raw || raw.length > 32) return;
      // single token username-like
      if (/\s/.test(raw) || raw.startsWith('<') || raw.startsWith('http')) return;
      if (!/^[A-Za-z0-9_]+$/.test(raw)) return;

      let resolved;
      try {
        resolved = await roblox.resolveUsername(raw);
      } catch (e) {
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xef4444)
              .setTitle('Nicht gefunden')
              .setDescription('Kein Roblox-Account für `' + raw + '`.')
          ]
        }).catch(() => {});
        try { await message.react('✅').catch(() => {}); } catch (_) {}
        scheduleDizzyStickyRefresh(message.channel, guildId, 3000);
        return;
      }

      const existingLink = ingame.findLinkByDiscord(guildId, message.author.id);
      const linkedToThis =
        existingLink &&
        (String(existingLink.roblox_user_id) === String(resolved.id) ||
          String(existingLink.roblox_username || '').toLowerCase() === String(resolved.name).toLowerCase());

      // Already linked to this Roblox account → Discord Controlle
      if (linkedToThis) {
        const emb = new EmbedBuilder()
          .setColor(0x8b5cf6)
          .setTitle('Discord Controlle')
          .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${resolved.id}&width=150&height=150&format=png`)
          .addFields(
            { name: 'Discord', value: `${message.author}`, inline: true },
            { name: 'Roblox', value: '**' + (resolved.displayName || resolved.name) + '** (`' + resolved.name + '`)', inline: true },
            { name: 'Roblox-ID', value: `\`${resolved.id}\``, inline: true },
            { name: 'Status', value: 'Verknüpft · wartet auf Staff', inline: false }
          )
          .setFooter({ text: 'Staffora · Dizzy' })
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`dizzy_ctrl_done:${message.author.id}:${resolved.id}:${resolved.name}`)
            .setLabel('Complete')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel('Profil')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://www.roblox.com/users/${resolved.id}/profile`)
        );
        await message.channel.send({ embeds: [emb], components: [row] });
        try { await message.react('✅').catch(() => {}); } catch (_) {}
        scheduleDizzyStickyRefresh(message.channel, guildId, 3000);
        return;
      }

      // Not linked (or linked to other) → Verknüpfung prüfen
      const req = ingame.createLinkRequest(guildId, {
        robloxUsername: resolved.name,
        robloxUserId: resolved.id,
        discordId: message.author.id,
        discordTag: message.author.tag,
        channelId: message.channel.id
      });

      const emb = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('Verknüpfung prüfen')
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${resolved.id}&width=150&height=150&format=png`)
        .addFields(
          { name: 'Discord', value: `${message.author}`, inline: true },
          { name: 'Roblox', value: `**${resolved.displayName || resolved.name}**
\`${resolved.name}\``, inline: true },
          { name: 'Roblox-ID', value: `\`${resolved.id}\``, inline: true },
          { name: 'Status', value: 'Noch nicht verknüpft · Staff muss bestätigen', inline: false }
        )
        .setFooter({ text: 'Staffora · Dizzy' })
        .setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`dizzy_link_cancel:${req.id}`)
          .setLabel('Abbrechen')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`dizzy_link_ok:${req.id}`)
          .setLabel('Bestätigen')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setLabel('Roblox Profil')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/users/${resolved.id}/profile`)
      );
      const sent = await message.channel.send({
        embeds: [emb],
        components: [row]
      });
      try {
        req.message_id = sent.id;
        const { save } = require('./db/database');
        save();
      } catch (_) {}
      try { await message.react('✅').catch(() => {}); } catch (_) {}
      scheduleDizzyStickyRefresh(message.channel, guildId, 3000);
    } catch (e) {
      console.warn('[dizzy]', e.message);
    }
  });



  // Admin Calls + Warteraum music + VC XP
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      await require('./services/warteraumSupport').onVoiceUpdate(client, oldState, newState);
    } catch (e) {
      console.warn('[warteraumSupport]', e.message);
    }
    try {
      await require('./services/offices').onVoiceUpdate(client, oldState, newState);
    } catch (e) {
      console.warn('[offices]', e.message);
    }
  });

  // Ticket message buffer for transcripts
  client.on('messageCreate', async (message) => {
    try {
      if (!message.guild || message.author.bot) return;
      try {
        const { settings: xpS } = getGuild(message.guild.id);
        require('./services/xp').onMessage(message.guild.id, message.author.id, xpS);
      } catch (_) {}
      if (!message.guild || message.author.bot) return;
      const { settings: aiSet } = getGuild(message.guild.id);
      const tickets = require('./services/tickets');
      const isTicket = (() => {
        try {
          const meta = require('./services/tickets').getMeta(message.channel.id);
          if (meta && (meta.openerId || meta.typeId || meta.claimedBy != null)) return true;
        } catch (_) {}
        const n = String(message.channel?.name || '');
        if (n.startsWith('ticket-')) return true;
        try {
          const { settings } = getGuild(message.guild.id);
          const cats = new Set(
            [].concat(settings.ticketCategoryId || [], (settings.ticketTypes || []).map((t) => t.categoryId).filter(Boolean)).map(String)
          );
          if (message.channel.parentId && cats.has(String(message.channel.parentId))) return true;
        } catch (_) {}
        return false;
      })();
      if (isTicket && isModuleEnabled(message.guild.id, 'tickets')) {
        tickets.rememberMessage(message.guild.id, message.channel.id, message);
        try {
          const { settings: aiS } = getGuild(message.guild.id);
          if (aiS.aiAssistEnabled) {
            await require('./services/aiAssistant').handleTicketMessage(message, client._stafforaEnv || process.env);
          }
        } catch (e) { console.warn('[ticket-ai]', e.message); }
      }
      // AI assistant removed
      if (!isTicket) return;
      if (!isModuleEnabled(message.guild.id, 'tickets')) return;
    } catch (_) {}
  });

  // Abmelden auto-restore timer
  setInterval(() => {
    try {
      require('./services/abmelden').tickExpired(client).catch(() => {});
      try {
        const xp = require('./services/xp');
        for (const g of client.guilds.cache.values()) {
          xp.tickPeriod(client, g.id).catch(() => {});
        }
      } catch (_) {}
    } catch (_) {}
  }, 60 * 1000);

  
  client.on('guildMemberUpdate', async (oldM, newM) => {
    try {
      const autoNick = require('./services/autoNick');
      await autoNick.applyAutoNick(newM);
    } catch (e) {
      console.warn('[autoNick]', e.message);
    }
  });

  
  
  async function requireModule(interaction, moduleKey) {
    if (!interaction.guildId) return true;
    if (isModuleEnabled(interaction.guildId, moduleKey)) return true;
    await deny.denyModuleOff(interaction);
    return false;
  }
  async function requirePanelPerm(interaction, ok) {
    if (ok) return true;
    await deny.denyPanel(interaction);
    return false;
  }
  async function requireCommandPerm(interaction, ok) {
    if (ok) return true;
    await deny.denyCommand(interaction);
    return false;
  }

async function ack(interaction, ephemeral = true) {
    if (interaction.deferred || interaction.replied) return;
    try { await interaction.deferReply({ ephemeral }); } catch (_) {}
  }
  async function say(interaction, content, opts = {}) {
    const payload = typeof content === 'string' ? { content, ...opts } : content;
    try {
      if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
      return interaction.reply({ ...payload, ephemeral: payload.ephemeral !== false });
    } catch (e) {
      try { return interaction.followUp({ ...payload, ephemeral: true }); } catch (_) {}
    }
  }

  client.on('interactionCreate', async (interaction) => {
    
      if (interaction.isChatInputCommand()) {
        try {
          const { settings: cmdS } = getGuild(interaction.guildId);
          const dis = cmdS.disabledCommands || [];
          if (dis.includes(interaction.commandName)) {
            return interaction.reply({ content: 'Dieser Command ist deaktiviert.', ephemeral: true }).catch(() => {});
          }
          const need = (cmdS.commandPermissions || {})[interaction.commandName];
          if (need && need.length) {
            const ok =
              interaction.memberPermissions?.has?.(PermissionFlagsBits.Administrator) ||
              need.some((id) => interaction.member.roles.cache.has(id));
            if (!ok) {
              return interaction.reply({ content: 'Keine Berechtigung für diesen Command.', ephemeral: true }).catch(() => {});
            }
          }
        } catch (_) {}
      }
try {
      // —— Select menu: ausweis type ——
      if (interaction.isStringSelectMenu() && (interaction.customId === 'ausweis_select_type' || interaction.customId === 'ausweis_request')) {
        const typeId = interaction.values[0];
        const types = ausweis.listTypes(interaction.guildId);
        const type = types.find((t) => t.id === typeId);
        if (!type) {
          return interaction.reply({ content: 'Typ nicht gefunden.', ephemeral: true });
        }
        const modal = new ModalBuilder().setCustomId(`ausweis_modal:${typeId}`).setTitle(type.name.slice(0, 45));
        const fields = (type.fields || []).slice(0, 5);
        for (const f of fields) {
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId(f.key)
                .setLabel((f.label || f.key).slice(0, 45))
                .setStyle(TextInputStyle.Short)
                .setRequired(!!f.required)
            )
          );
        }
        if (!fields.length) {
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('name').setLabel('Name').setStyle(TextInputStyle.Short).setRequired(true)
            )
          );
        }
        return interaction.showModal(modal);
      }

      // —— Modal submit ——
      if (interaction.isModalSubmit() && interaction.customId.startsWith('ausweis_modal:')) {
        const typeId = interaction.customId.split(':')[1];
        const types = ausweis.listTypes(interaction.guildId);
        const type = types.find((t) => t.id === typeId);
        if (!type) {
          return interaction.reply({ content: 'Typ nicht gefunden.', ephemeral: true });
        }
        const answers = {};
        for (const f of type.fields || []) {
          try {
            answers[f.key] = interaction.fields.getTextInputValue(f.key) || '';
          } catch (_) {}
        }
        // fallback name field
        try {
          if (!answers.name) answers.name = interaction.fields.getTextInputValue('name') || '';
        } catch (_) {}

        const req = ausweis.createRequest(interaction.guildId, {
          discordId: interaction.user.id,
          typeId,
          answers
        });
        const { settings } = getGuild(interaction.guildId);
        const logCh = settings.ausweisLogChannelId || settings.ausweisChannelId;
        if (logCh) {
          try {
            const lch = await interaction.guild.channels.fetch(logCh).catch(() => null);
            if (lch) {
              await lch.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0x8b5cf6)
                    .setTitle('Neue Ausweis-Anfrage')
                    .setDescription(`Von ${interaction.user}\nTyp: **${type.name || typeId}**`)
                    .setTimestamp()
                ]
              }).catch(() => {});
            }
          } catch (_) {}
        }
        if (settings.ausweisChannelId) {
          const ch = await interaction.guild.channels.fetch(settings.ausweisChannelId).catch(() => null);
          if (ch) {
            const rows = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`ausweis_approve:${req.id}`)
                .setLabel('Annehmen')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`ausweis_reject:${req.id}`)
                .setLabel('Ablehnen')
                .setStyle(ButtonStyle.Danger)
            );
            const lines = Object.entries(answers)
              .map(([k, v]) => `**${k}:** ${v}`)
              .join('\n');
            await ch.send({
              content: `🪪 Neue **${type.name}**-Anfrage von <@${interaction.user.id}> (ID \`${req.id}\`)\n${lines}`,
              components: [rows]
            });
          }
        }
        return interaction.reply({
          content: `Antrag **${type.name}** eingereicht. Staff prüft die Anfrage.`,
          ephemeral: true
        });
      }

      // —— Buttons approve/reject ——
      if (interaction.isButton() && interaction.customId.startsWith('ausweis_approve:')) {
        const id = interaction.customId.split(':')[1];
        const { request, card } = ausweis.approveRequest(interaction.guildId, id, interaction.user.id);
        const { settings } = getGuild(interaction.guildId);
        try {
          const u = await client.users.fetch(request.discord_id);
          await u.send({
            content: `Dein Antrag **${request.type_name}** wurde angenommen.`,
            embeds: [ausweis.buildAusweisEmbed(card, settings.ausweisServerName || settings.systemName || 'Staffora', interaction.guildId)]
          }).catch(() => {});
        } catch (_) {}
        return interaction.reply({ content: `Antrag #${id} angenommen.`, ephemeral: true });
      }
      if (interaction.isButton() && interaction.customId.startsWith('ausweis_reject:')) {
        const id = interaction.customId.split(':')[1];
        ausweis.rejectRequest(interaction.guildId, id, interaction.user.id, 'Abgelehnt');
        return interaction.reply({ content: `Antrag #${id} abgelehnt.`, ephemeral: true });
      }

      
      if (interaction.isButton() && interaction.customId === 'clock_in') {
        if (!isModuleEnabled(interaction.guildId, 'dutyPanel') && !isModuleEnabled(interaction.guildId, 'teamverwaltung')) {
          return interaction.reply({ content: 'Dienst-Modul ist deaktiviert.', ephemeral: true });
        }
        const { settings } = getGuild(interaction.guildId);
        const roles = settings.dutyRoleIds || [];
        if (roles.length) {
          const has = interaction.member.roles.cache.some((r) => roles.includes(r.id));
          if (!has) return interaction.reply({ content: 'Keine Berechtigung für Clock-in.', ephemeral: true });
        }
        team.setDuty(interaction.guildId, interaction.user.id, true, interaction.user.id);
        return interaction.reply({ content: '✅ Clock-in – du bist **im Dienst**.', ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'clock_out') {
        if (!isModuleEnabled(interaction.guildId, 'dutyPanel') && !isModuleEnabled(interaction.guildId, 'teamverwaltung')) {
          return interaction.reply({ content: 'Dienst-Modul ist deaktiviert.', ephemeral: true });
        }
        team.setDuty(interaction.guildId, interaction.user.id, false, interaction.user.id);
        return interaction.reply({ content: '⏹ Clock-out – du bist **außer Dienst**.', ephemeral: true });
      }



      // —— Ingame Lookup / Warn panel ——
      if (interaction.isButton() && interaction.customId === 'ingame_lookup') {
        if (!isModuleEnabled(interaction.guildId, 'ingameManagement')) {
          return interaction.reply({ content: 'Ingame-Management ist deaktiviert.', ephemeral: true });
        }
        const modal = new ModalBuilder().setCustomId('ingame_lookup_modal').setTitle('User suchen');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('roblox_username')
              .setLabel('Roblox Username')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(32)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'ingame_lookup_modal') {
        if (!isModuleEnabled(interaction.guildId, 'ingameManagement')) {
          return interaction.reply({ content: 'Ingame-Management ist deaktiviert.', ephemeral: true });
        }
        const username = interaction.fields.getTextInputValue('roblox_username').trim();
        await ack(interaction, true);
        try {
          const ingame = require('./services/ingame');
          const resolved = await ingame.resolveUsername(username);
          const data = ingame.searchUser(interaction.guildId, resolved.name);
          const warnLine = `Warnungen: **${data.warnCount}/${data.warnMax}**`;
          const banLines = (data.activeBans || [])
            .slice(0, 5)
            .map((b) => `• ${b.is_perma ? 'PERMA' : b.duration_label || 'Temp'}: ${b.reason || '—'}`)
            .join('\n');
          const warnLines = (data.activeWarnings || [])
            .slice(0, 5)
            .map((w) => `• ${w.reason || '—'} (${new Date(w.created_at).toLocaleDateString('de-DE')})`)
            .join('\n');
          const logLines = (data.webhookLogs || [])
            .slice(0, 5)
            .map((w) => `• ${w.action}: ${w.reason || '—'}`)
            .join('\n');
          const link = data.link
            ? `Discord: <@${data.link.discord_id}> (\`${data.link.discord_id}\`)`
            : 'Keine Discord-Verknüpfung';

          const emb = new EmbedBuilder()
            .setColor(data.warnCount >= data.warnMax ? 0xef4444 : 0x8b5cf6)
            .setTitle(`🔍 ${resolved.name}`)
            .setDescription(
              `**Roblox ID:** \`${resolved.id}\`\n${link}\n${warnLine}\n` +
                (data.activeBans && data.activeBans.length
                  ? `\n**Aktive Bans**\n${banLines}`
                  : '\n_Keine aktiven Bans_') +
                (data.activeWarnings && data.activeWarnings.length
                  ? `\n\n**Aktive Warnungen**\n${warnLines}`
                  : '') +
                (data.webhookLogs && data.webhookLogs.length ? `\n\n**Webhook-Logs**\n${logLines}` : '')
            ).setFooter({ text: 'Staffora · Lookup' }).setColor(0x8b5cf6)
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`ingame_warn_user:${resolved.name}`)
              .setLabel('Warnung erteilen')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setLabel('Roblox Profil')
              .setStyle(ButtonStyle.Link)
              .setURL(`https://www.roblox.com/users/${resolved.id}/profile`)
          );
          return interaction.editReply({ embeds: [emb], components: [row] });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || 'User nicht gefunden') });
        }
      }

      if (
        interaction.isButton() &&
        (interaction.customId === 'ingame_warn' || interaction.customId.startsWith('ingame_warn_user:'))
      ) {
        if (!isModuleEnabled(interaction.guildId, 'ingameManagement')) {
          return interaction.reply({ content: 'Ingame-Management ist deaktiviert.', ephemeral: true });
        }
        const preset = interaction.customId.startsWith('ingame_warn_user:')
          ? interaction.customId.split(':').slice(1).join(':')
          : '';
        const modal = new ModalBuilder().setCustomId('ingame_warn_modal').setTitle('Warnung erteilen');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('roblox_username')
              .setLabel('Roblox Username')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(32)
              .setValue(preset.slice(0, 32))
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Grund')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(400)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'ingame_warn_modal') {
        if (!isModuleEnabled(interaction.guildId, 'ingameManagement')) {
          return interaction.reply({ content: 'Ingame-Management ist deaktiviert.', ephemeral: true });
        }
        const username = interaction.fields.getTextInputValue('roblox_username').trim();
        const reason = interaction.fields.getTextInputValue('reason').trim();
        await ack(interaction, true);
        try {
          const ingame = require('./services/ingame');
          const resolved = await ingame.resolveUsername(username);
          const result = ingame.addWarning(interaction.guildId, {
            robloxUsername: resolved.name,
            robloxUserId: resolved.id,
            reason,
            actorId: interaction.user.id,
            actorTag: interaction.user.tag
          });
          let msg = `⚠️ **${resolved.name}** (\`${resolved.id}\`)\n**Warn ${result.count}/${result.max}**`;
          if (result.hasAction && result.actionLabel) msg += ` · **${result.actionLabel}**`;
          msg += `\n**Grund:** ${reason}`;
          try {
            const { settings } = getGuild(interaction.guildId);
            const chId = settings.ingameWarnLogChannelId || settings.ingameBanLogChannelId;
            if (chId) {
              const ch = await interaction.guild.channels.fetch(chId).catch(() => null);
              if (ch && ch.isTextBased()) {
                const emb = new EmbedBuilder()
                  .setColor(result.hasAction ? 0xef4444 : 0xf59e0b)
                  .setTitle(
                    result.hasAction
                      ? `Warn ${result.count}/${result.max} · ${result.actionLabel}`
                      : `Warn ${result.count}/${result.max}`
                  )
                  .setDescription(
                    `**Roblox:** \`${resolved.name}\` (\`${resolved.id}\`)\n**Von:** <@${interaction.user.id}>\n**Grund:** ${reason}`
                  )
                  .setTimestamp();
                await ch.send({ embeds: [emb] });
              }
            }
          } catch (_) {}
          return interaction.editReply({ content: msg });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || 'unbekannt') });
        }
      }

      // Unban request review from Discord buttons
      if (interaction.isButton() && interaction.customId.startsWith('unban_approve:')) {
        const id = Number(interaction.customId.split(':')[1]);
        const ingame = require('./services/ingame');
        const row = ingame.reviewUnbanRequest(interaction.guildId, id, {
          approved: true,
          reviewedBy: interaction.user.id,
          note: 'Genehmigt via Discord'
        });
        if (!row) return interaction.reply({ content: 'Antrag nicht gefunden / bereits bearbeitet.', ephemeral: true });
        return interaction.reply({
          content: `✅ Unban-Antrag #${id} für **${row.roblox_username}** genehmigt.`,
          ephemeral: true
        });
      }
      if (interaction.isButton() && interaction.customId.startsWith('unban_reject:')) {
        const id = Number(interaction.customId.split(':')[1]);
        const ingame = require('./services/ingame');
        const row = ingame.reviewUnbanRequest(interaction.guildId, id, {
          approved: false,
          reviewedBy: interaction.user.id,
          note: 'Abgelehnt via Discord'
        });
        if (!row) return interaction.reply({ content: 'Antrag nicht gefunden / bereits bearbeitet.', ephemeral: true });
        return interaction.reply({
          content: `❌ Unban-Antrag #${id} für **${row.roblox_username}** abgelehnt.`,
          ephemeral: true
        });
      }

      
      if (interaction.isButton() && interaction.customId === 'hausliste_refresh') {
        await ack(interaction, false);
        try {
          const hausliste = require('./services/hausliste');
          const emb = hausliste.buildPanelEmbed(interaction.guildId, EmbedBuilder);
          await interaction.message.edit({ embeds: [emb] });
          return interaction.editReply({ content: 'Hausliste aktualisiert.' });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }

      
      
      if (interaction.isButton() && interaction.customId === 'roblox_register') {
        const modal = new ModalBuilder().setCustomId('roblox_register_modal').setTitle('Roblox-Name');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('roblox_username')
              .setLabel('Roblox Username')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(32)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'roblox_register_modal') {
        await ack(interaction, true);
        try {
          let name = '';
          try { name = interaction.fields.getTextInputValue('roblox_username'); } catch (_) {}
          if (!name) {
            try { name = interaction.fields.getTextInputValue('roblox'); } catch (_) {}
          }
          name = String(name || '').trim().replace(/^@/, '');
          if (!name) return interaction.editReply({ content: 'Name fehlt.' });
          const { getGuild, saveGuild, addLog } = require('./db/database');
          const g = getGuild(interaction.guildId);
          const map = Object.assign({}, g.settings.robloxNames || {});
          const prev = map[interaction.user.id] || null;
          map[interaction.user.id] = name;
          saveGuild(interaction.guildId, { settings: { robloxNames: map } });
          addLog({
            guildId: interaction.guildId,
            module: 'teamlist',
            actorId: interaction.user.id,
            targetId: interaction.user.id,
            action: 'roblox_name_set',
            reason: prev ? ('vorher: ' + prev) : null,
            newData: { roblox: name, previous: prev }
          });
          try {
            await require('./services/teamlist').publishTeamlist(interaction.client, interaction.guildId);
          } catch (_) {}
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8b5cf6)
                .setTitle('Roblox gesetzt')
                .addFields(
                  { name: 'Discord', value: `${interaction.user}`, inline: true },
                  { name: 'Roblox', value: '**' + name + '**', inline: true }
                )
                .setFooter({ text: 'Staffora · Teamliste' })
                .setTimestamp()
            ]
          });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }


      
      if (interaction.isButton() && interaction.customId === 'complaint_start') {
        const modal = new ModalBuilder().setCustomId('complaint_modal').setTitle('Team-Beschwerde');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('target').setLabel('Roblox-Name oder Discord-ID').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('what').setLabel('Was ist passiert?').setStyle(TextInputStyle.Paragraph).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('when').setLabel('Wann / Wo?').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('why').setLabel('Warum Beschwerde?').setStyle(TextInputStyle.Paragraph).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('links').setLabel('Beweis-Links (optional)').setStyle(TextInputStyle.Short).setRequired(false)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'complaint_modal') {
        await ack(interaction, true);
        try {
          const target = interaction.fields.getTextInputValue('target').trim();
          const answers = {
            'Was ist passiert': interaction.fields.getTextInputValue('what'),
            'Wann / Wo': interaction.fields.getTextInputValue('when'),
            'Warum': interaction.fields.getTextInputValue('why')
          };
          const links = (interaction.fields.getTextInputValue('links') || '').split(/\s+/).filter((x) => x.startsWith('http'));
          const { settings } = getGuild(interaction.guildId);
          if (settings.complaintEnabled === false) {
            return interaction.editReply({ content: 'Beschwerden sind deaktiviert.' });
          }
          // lookup
          let roblox = null, discordId = null;
          try {
            const r = await require('./services/roblox').resolveUsername(target.replace(/^@/, ''));
            if (r) roblox = r;
          } catch (_) {}
          if (/^\d{16,20}$/.test(target)) discordId = target;
          const complaints = require('./services/complaints');
          const { ChannelType, PermissionFlagsBits } = require('discord.js');
          const guild = interaction.guild;
          const catId = settings.complaintCategoryId || settings.ticketCategoryId;
          const parent = catId ? await guild.channels.fetch(catId).catch(() => null) : null;
          const overwrites = [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
          ];
          for (const rid of settings.complaintSupportRoleIds || []) {
            overwrites.push({ id: rid, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
          }
          const ch = await guild.channels.create({
            name: ('beschwerde-' + (roblox?.name || target)).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
            type: ChannelType.GuildText,
            parent: parent && parent.type === 4 ? parent.id : undefined,
            permissionOverwrites: overwrites
          });
          const emb = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('Team-Beschwerde')
            .addFields(
              { name: 'Melder', value: `${interaction.user}`, inline: true },
              { name: 'Ziel', value: roblox ? `**${roblox.name}** (\`${roblox.id}\`)` : target, inline: true },
              { name: 'Details', value: Object.keys(answers).map((k) => `**${k}:** ${answers[k]}`).join('\n').slice(0, 1000), inline: false }
            )
            .setFooter({ text: 'Staffora · Beschwerde' })
            .setTimestamp();
          if (links.length) emb.addFields({ name: 'Links', value: links.join('\n') });
          const pings = (settings.complaintSupportRoleIds || []).map((id) => `<@&${id}>`).join(' ');
          await ch.send({ content: pings || undefined, embeds: [emb] });
          complaints.create(interaction.guildId, {
            reporterDiscordId: interaction.user.id,
            targetDiscordId: discordId,
            targetRoblox: roblox?.name || null,
            targetRobloxId: roblox?.id || null,
            answers,
            links,
            ticketChannelId: ch.id
          });
          return interaction.editReply({ content: 'Beschwerde erstellt: ' + ch.toString() + '\nDu kannst dort Beweise (Bilder/Videos) nachreichen.' });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }


      if (interaction.isButton() && interaction.customId === 'dn_bewerben_start') {
        const modal = new ModalBuilder()
          .setCustomId('dn_bewerben_modal')
          .setTitle('Dienstnummer bewerben');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('roblox').setLabel('Roblox Username').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('info').setLabel('Motivation / Info').setStyle(TextInputStyle.Paragraph).setRequired(false)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'dn_bewerben_modal') {
        await ack(interaction, true);
        try {
          const robloxName = interaction.fields.getTextInputValue('roblox');
          const info = interaction.fields.getTextInputValue('info') || '';
          // reuse applications flow if exists
          let apps;
          try { apps = require('./services/applications'); } catch (_) { apps = null; }
          if (apps && apps.submit) {
            await apps.submit(interaction.guildId, {
              discordId: interaction.user.id,
              discordTag: interaction.user.tag,
              roblox: robloxName,
              info
            }, interaction.client);
          } else {
            const { settings } = getGuild(interaction.guildId);
            const chId = settings.appChannelId || settings.logChannelId;
            if (chId) {
              const ch = await interaction.guild.channels.fetch(chId).catch(() => null);
              if (ch) {
                await ch.send({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(0x8b5cf6)
                      .setTitle('Dienstnummer-Bewerbung')
                      .addFields(
                        { name: 'Discord', value: `${interaction.user}`, inline: true },
                        { name: 'Roblox', value: robloxName, inline: true },
                        { name: 'Info', value: info.slice(0, 1000) || '—', inline: false }
                      )
                      .setFooter({ text: 'Staffora' })
                      .setTimestamp()
                  ]
                });
              }
            }
          }
          return interaction.editReply({ content: 'Bewerbung eingereicht.' });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }

      if (interaction.isButton() && interaction.customId === 'dn_search_start') {
        const modal = new ModalBuilder()
          .setCustomId('dn_search_modal')
          .setTitle('Dienstnummer suchen');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('q')
              .setLabel('Nummer oder Roblox-Name')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'dn_search_modal') {
        await ack(interaction, true);
        try {
          const q = interaction.fields.getTextInputValue('q').trim();
          const dn = require('./services/dienstnummern');
          let results = [];
          if (dn.search) results = dn.search(interaction.guildId, q) || [];
          else if (dn.list) {
            const all = dn.list(interaction.guildId) || [];
            const ql = q.toLowerCase();
            results = all.filter(
              (r) =>
                String(r.number || r.dienstnummer || '').includes(q) ||
                String(r.roblox || r.roblox_username || '').toLowerCase().includes(ql) ||
                String(r.discord_id || '') === q
            );
          }
          if (!results.length) {
            return interaction.editReply({ content: 'Keine Treffer für `' + q + '`.' });
          }
          const emb = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('Dienstnummer-Suche')
            .setDescription(
              results
                .slice(0, 15)
                .map((r) => {
                  const num = r.number || r.dienstnummer || '—';
                  const rbx = r.roblox || r.roblox_username || '—';
                  const disc = r.discord_id ? '<@' + r.discord_id + '>' : '—';
                  return `**${num}** · ${rbx} · ${disc}`;
                })
                .join('\\n')
            )
            .setFooter({ text: 'Staffora · DN' })
            .setTimestamp();
          return interaction.editReply({ embeds: [emb] });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }


      
      
      
      
      
      if (interaction.isButton() && interaction.customId.startsWith('gw_join:')) {
        return require('./services/giveaways').join(interaction, interaction.customId.slice('gw_join:'.length));
      }
      if (interaction.isButton() && interaction.customId.startsWith('gw_end:')) {
        return require('./services/giveaways').handleEndButton(interaction, interaction.customId.slice('gw_end:'.length));
      }

      if (interaction.isButton() && interaction.customId.startsWith('suggest_up:')) {
        return require('./services/suggestions').handleVote(interaction, interaction.customId.slice('suggest_up:'.length), 1);
      }
      if (interaction.isButton() && interaction.customId.startsWith('suggest_down:')) {
        return require('./services/suggestions').handleVote(interaction, interaction.customId.slice('suggest_down:'.length), -1);
      }
      if (interaction.isButton() && interaction.customId.startsWith('suggest_accept:')) {
        return require('./services/suggestions').handleReview(interaction, interaction.customId.slice('suggest_accept:'.length), true);
      }
      if (interaction.isButton() && interaction.customId.startsWith('suggest_reject:')) {
        return require('./services/suggestions').handleReview(interaction, interaction.customId.slice('suggest_reject:'.length), false);
      }

      if (interaction.isButton() && interaction.customId.startsWith('office_claim:')) {
        const id = interaction.customId.slice('office_claim:'.length);
        
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('office_pick:')) {
        return require('./services/offices').handleOfficePick(interaction);
      }
      if (interaction.isModalSubmit() && interaction.customId.startsWith('office_reason:')) {
        return require('./services/offices').handleOfficeReason(interaction);
      }
      if (interaction.isButton() && (interaction.customId.startsWith('office_accept:') || interaction.customId.startsWith('office_reject:') || interaction.customId.startsWith('office_sched5:'))) {
        const act = interaction.customId.startsWith('office_accept:')
          ? 'accept'
          : interaction.customId.startsWith('office_reject:')
            ? 'reject'
            : 'sched5';
        return require('./services/offices').handleOfficeStaffAction(interaction, act);
      }

        return require('./services/offices').claim(interaction, id);
      }
      if (interaction.isButton() && interaction.customId.startsWith('office_end:')) {
        const id = interaction.customId.slice('office_end:'.length);
        return require('./services/offices').end(interaction, id);
      }

      if (interaction.isButton() && interaction.customId.startsWith('wr_claim:')) {
        const id = interaction.customId.slice('wr_claim:'.length);
        return require('./services/warteraumSupport').claim(interaction, id);
      }
      if (interaction.isButton() && interaction.customId.startsWith('wr_end:')) {
        const id = interaction.customId.slice('wr_end:'.length);
        return require('./services/warteraumSupport').end(interaction, id);
      }

      if (interaction.isButton() && interaction.customId === 'support_ping_btn') {
        const sp = require('./services/supportPing');
        return sp.handlePing(interaction);
      }
      if (interaction.isButton() && interaction.customId === 'interview_request') {
        try {
          const iv = require('./services/interviews');
          const row = iv.create ? iv.create(interaction.guildId, interaction.user.id) : iv.addRequest?.(interaction.guildId, interaction.user.id);
          if (!row && typeof iv.list === 'function') {
            // fallback store
            const { state, save, nextId, getGuild } = require('./db/database');
            if (!state.interviews) state.interviews = [];
            const r = { id: 'iv_' + nextId(), guild_id: interaction.guildId, user_id: interaction.user.id, status: 'pending', created_at: Date.now() };
            state.interviews.push(r);
            save();
          }
          const { settings } = getGuild(interaction.guildId);
          const logId = settings.interviewChannelId;
          if (logId) {
            const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
            if (ch) {
              const emb = new EmbedBuilder().setColor(0x8b5cf6).setTitle('Interview-Anfrage')
                .setDescription(`${interaction.user} möchte ein Interview.`)
                .setTimestamp();
              const ping = (settings.interviewRoleIds || []).map((id) => `<@&${id}>`).join(' ');
              await ch.send({ content: ping || undefined, embeds: [emb], allowedMentions: { roles: settings.interviewRoleIds || [] } }).catch(() => {});
            }
          }
          return interaction.reply({ content: 'Anfrage gesendet. Ein Teammitglied meldet sich.', ephemeral: true });
        } catch (e) {
          return interaction.reply({ content: e.message || 'Fehler', ephemeral: true }).catch(() => {});
        }
      }
      if (interaction.isButton() && interaction.customId === 'app_apply_open') {
        const apps = require('./services/applications');
        const qs = apps.getQuestions(interaction.guildId).slice(0, 5);
        const modal = new ModalBuilder().setCustomId('app_apply_modal').setTitle('Team Bewerbung');
        if (!qs.length) {
          modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q0').setLabel('Warum willst du ins Team?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q1').setLabel('Erfahrung').setStyle(TextInputStyle.Short).setRequired(false))
          );
        } else {
          qs.forEach((q, i) => {
            modal.addComponents(new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('q_' + i).setLabel(String(q.label).slice(0, 45))
                .setStyle(q.type === 'long' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                .setRequired(!!q.required)
            ));
          });
        }
        return interaction.showModal(modal);
      }
      if (interaction.isModalSubmit() && interaction.customId === 'app_apply_modal') {
        const apps = require('./services/applications');
        const answers = {};
        interaction.fields.fields.forEach((f) => { answers[f.customId] = f.value; });
        const row = apps.submit(interaction.guildId, interaction.user.id, answers);
        const { settings } = getGuild(interaction.guildId);
        const logId = settings.applicationLogChannelId;
        if (logId) {
          const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
          if (ch) {
            const emb = new EmbedBuilder().setColor(0x8b5cf6).setTitle('Neue Team-Bewerbung')
              .setDescription(Object.entries(answers).map(([k,v]) => `**${k}:** ${v}`).join('\n').slice(0, 4000))
              .addFields({ name: 'User', value: `${interaction.user}` })
              .setTimestamp();
            await ch.send({ embeds: [emb] }).catch(() => {});
          }
        }
        return interaction.reply({ content: 'Bewerbung eingereicht.', ephemeral: true });
      }
      if (interaction.isButton() && interaction.customId === 'faction_apply_open') {
        const factions = require('./services/factions');
        const qs = factions.getAppQuestions(interaction.guildId).slice(0, 5);
        const modal = new ModalBuilder().setCustomId('faction_apply_modal').setTitle('Fraktions-Bewerbung');
        if (!qs.length) {
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('faction_name').setLabel('Fraktion').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('motivation').setLabel('Warum?').setStyle(TextInputStyle.Paragraph).setRequired(true)
            )
          );
        } else {
          qs.forEach((q, i) => {
            modal.addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId('q_' + i)
                  .setLabel(String(q.label || 'Frage').slice(0, 45))
                  .setStyle(q.type === 'long' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                  .setRequired(!!q.required)
              )
            );
          });
        }
        return interaction.showModal(modal);
      }
      if (interaction.isModalSubmit() && interaction.customId === 'faction_apply_modal') {
        await interaction.reply({ content: 'Bewerbung eingereicht. Staff meldet sich.', ephemeral: true }).catch(() => {});
        const { settings } = getGuild(interaction.guildId);
        const logId = settings.factionAppChannelId;
        if (logId) {
          const fields = interaction.fields.fields.map((f) => ({ name: f.customId, value: f.value.slice(0, 500) }));
          const { EmbedBuilder } = require('discord.js');
          const { stafforaEmbed, DIVIDER } = require('./utils/branding');
          let desc = fields.map((f) => `**${f.name}:** ${f.value}`).join('\n') + '\n\n' + DIVIDER;
          const emb = stafforaEmbed(EmbedBuilder, {
            title: 'Neue Fraktions-Bewerbung',
            description: `Von ${interaction.user}\n\n` + desc
          });
          const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
          if (ch) await ch.send({ embeds: [emb] }).catch(() => {});
        }
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_panel_info') {
        return interaction.reply({
          content: 'Schließe offene Tickets mit dem Button **Ticket schließen** im Ticket-Kanal.',
          ephemeral: true
        }).catch(() => {});
      }
            // ——— Ticket open (select or button) ———
      if (
        (interaction.isStringSelectMenu() &&
          (String(interaction.customId || '') === 'ticket_open_select' ||
            String(interaction.customId || '').startsWith('ticket_open_select:') ||
            String(interaction.customId || '').startsWith('ticket_open'))) ||
        (interaction.isButton() && interaction.customId === 'ticket_open')
      ) {
        try {
          const { isTicketBlacklisted, blacklistMessage } = require('./utils/blacklist');
          const { settings: tbs } = getGuild(interaction.guildId);
          if (isTicketBlacklisted(interaction.member, tbs)) {
            return interaction.reply({ content: blacklistMessage(), ephemeral: true }).catch(() => {});
          }
        } catch (_) {}
        if (!isModuleEnabled(interaction.guildId, 'tickets')) {
          return interaction
            .reply({ content: 'Tickets-Modul ist deaktiviert.', ephemeral: true })
            .catch(() => {});
        }
        await ack(interaction, true);
        try {
          const { settings } = getGuild(interaction.guildId);
          let types = Array.isArray(settings.ticketTypes) ? settings.ticketTypes.filter(Boolean) : [];
          if (!types.length) {
            types = [
              { id: 'support', name: 'Support', emoji: '🎫' },
              { id: 'report', name: 'Melden', emoji: '🚨' },
              { id: 'other', name: 'Sonstiges', emoji: '📋' }
            ];
          }
          let typeId = null;
          if (interaction.isStringSelectMenu()) {
            typeId = (interaction.values && interaction.values[0]) || null;
          }
          const type =
            types.find(
              (t) =>
                String(t.id) === String(typeId) ||
                String(t.name) === String(typeId) ||
                String(t.value) === String(typeId)
            ) ||
            types[0] ||
            { id: 'support', name: 'Support', emoji: '🎫' };

          const catId = type.categoryId || settings.ticketCategoryId || undefined;
          const supportRoles =
            (type.staffRoleIds && type.staffRoleIds.length
              ? type.staffRoleIds
              : settings.ticketSupportRoleIds) || [];

          const safeUser =
            (interaction.user.username || 'user')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .slice(0, 16) || 'user';
          let safeType = String(type.name || type.id || 'support')
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 16) || 'support';
          const channelName = `${safeType}-${safeUser}`.slice(0, 90);

          const overwrites = [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles
              ]
            }
          ];
          for (const rid of supportRoles) {
            overwrites.push({
              id: rid,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages
              ]
            });
          }

          let ch;
          const createOpts = {
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: overwrites,
            topic: `${type.name || 'Ticket'} · ${interaction.user.tag} (${interaction.user.id})`
          };
          if (catId) createOpts.parent = catId;
          try {
            ch = await interaction.guild.channels.create(createOpts);
          } catch (e1) {
            // retry without category if parent invalid
            try {
              delete createOpts.parent;
              ch = await interaction.guild.channels.create(createOpts);
            } catch (e2) {
              return interaction.editReply({
                content: 'Ticket konnte nicht erstellt werden: ' + (e2.message || e1.message)
              });
            }
          }

          const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle(`${type.emoji || '🎫'} ${type.name || 'Support'} Ticket`)
            .addFields(
              { name: 'Ersteller', value: `${interaction.user}`, inline: true },
              { name: 'Art', value: String(type.name || 'Support'), inline: true },
              { name: 'Status', value: 'Offen — wartet auf Übernahme', inline: true },
              {
                name: 'Hinweis',
                value: 'Beschreibe kurz dein Anliegen. Support meldet sich.',
                inline: false
              }
            )
            .setFooter({ text: 'Staffora · Ticket' })
            .setTimestamp();

          const ticketsSvc = require('./services/tickets');
          ticketsSvc.setMeta(ch.id, {
            openerId: interaction.user.id,
            claimedBy: null,
            closed: false,
            typeId: type.id || type.name
          });
          try {
            ticketsSvc.applyTicketImages(embed, settings, 'create');
          } catch (_) {}

          const claimOnly = ticketsSvc.buildTicketButtons({ claimedBy: null });
          const aiOn = !!settings.aiAssistEnabled;
          const pingRoles = supportRoles.map((id) => `<@&${id}>`).join(' ');

          if (aiOn) {
            ticketsSvc.setMeta(ch.id, {
              openerId: interaction.user.id,
              claimedBy: null,
              closed: false,
              typeId: type.id || type.name,
              aiActive: false,
              aiDisabled: false,
              aiPendingChoice: true
            });
            const ticketsAi = require('./services/aiAssistant');
            await ch.send({
              content: `${interaction.user}`,
              embeds: [embed],
              components: claimOnly
            });
            try {
              await ch.send({
                embeds: [ticketsAi.buildChoiceEmbed(EmbedBuilder)],
                components: ticketsAi.buildChoiceButtons(
                  ActionRowBuilder,
                  ButtonBuilder,
                  ButtonStyle
                )
              });
            } catch (_) {}
          } else {
            await ch.send({
              content: `${interaction.user}${pingRoles ? ' · ' + pingRoles : ''}`,
              embeds: [embed],
              components: claimOnly
            });
          }

          try {
            require('./db/database').addLog({
              guildId: interaction.guildId,
              module: 'tickets',
              actorId: interaction.user.id,
              action: 'ticket_open',
              reason: type.name || type.id,
              newData: { channelId: ch.id, typeId: type.id }
            });
          } catch (_) {}

          return interaction.editReply({
            content: `Ticket erstellt: ${ch}`
          });
        } catch (e) {
          console.error('[ticket open]', e);
          return interaction
            .editReply({ content: 'Fehler beim Öffnen: ' + (e.message || 'unbekannt') })
            .catch(() => {});
        }
      }

if (interaction.isButton() && interaction.customId === 'ticket_ai_help') {
        await interaction.deferUpdate().catch(() => {});
        const tickets = require('./services/tickets');
        const ai = require('./services/aiAssistant');
        tickets.setMeta(interaction.channel.id, { aiActive: true, aiPendingChoice: false, aiDisabled: false });
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        await interaction.channel.send({
          embeds: [
            ai.buildAiReplyEmbed(
              EmbedBuilder,
              'Alles klar — ich helfe dir hier im Ticket.\n**Schreib einfach dein Anliegen.**\nWenn du lieber mit dem Team sprechen willst, drücke **KI aus & Team pingen**.'
            )
          ],
          components: [ai.buildDisableRow(ActionRowBuilder, ButtonBuilder, ButtonStyle)]
        }).catch(() => {});
        try {
          await interaction.message.edit({ components: [] }).catch(() => {});
        } catch (_) {}
        return;
      }
      if (interaction.isButton() && interaction.customId === 'ticket_ai_staff') {
        await interaction.deferUpdate().catch(() => {});
        const tickets = require('./services/tickets');
        const ai = require('./services/aiAssistant');
        const { settings } = getGuild(interaction.guildId);
        tickets.setMeta(interaction.channel.id, { aiActive: false, aiDisabled: true, aiPendingChoice: false });
        await ai.pingTicketStaff(interaction.channel, interaction.guild, settings);
        try { await interaction.message.edit({ components: [] }).catch(() => {}); } catch (_) {}
        return;
      }
      if (interaction.isButton() && interaction.customId === 'ticket_ai_off') {
        await interaction.deferUpdate().catch(() => {});
        const tickets = require('./services/tickets');
        const ai = require('./services/aiAssistant');
        const { settings } = getGuild(interaction.guildId);
        tickets.setMeta(interaction.channel.id, { aiActive: false, aiDisabled: true });
        await ai.pingTicketStaff(interaction.channel, interaction.guild, settings);
        try { await interaction.message.edit({ components: [] }).catch(() => {}); } catch (_) {}
        return;
      }

      
      if (interaction.isButton() && interaction.customId === 'fly_nametag_request') {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('fly_nametag_modal').setTitle('Fly & Nametag');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('roblox').setLabel('Roblox Name').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(32)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('display').setLabel('Wie willst du genannt werden?').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(32)
          )
        );
        return interaction.showModal(modal);
      }
      if (interaction.isModalSubmit() && interaction.customId === 'fly_nametag_modal') {
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        try {
          const fn = require('./services/flyNametag');
          const { settings } = getGuild(interaction.guildId);
          if (settings.flyNametagEnabled === false) {
            return interaction.editReply({ content: 'Fly & Nametag ist deaktiviert.' });
          }
          const row = fn.create(interaction.guildId, {
            userId: interaction.user.id,
            roblox: interaction.fields.getTextInputValue('roblox'),
            displayName: interaction.fields.getTextInputValue('display')
          });
          const chId = settings.flyNametagChannelId;
          if (chId) {
            const ch = await interaction.guild.channels.fetch(chId).catch(() => null);
            if (ch) {
              const msg = await ch.send({ embeds: [fn.buildEmbed(row)], components: fn.buildButtons(row) });
              row.message_id = msg.id;
              row.channel_id = ch.id;
              require('./db/database').save();
            }
          }
          return interaction.editReply({ content: 'Anfrage gesendet.' });
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' });
        }
      }
      if (interaction.isButton() && (interaction.customId.startsWith('fn_accept:') || interaction.customId.startsWith('fn_reject:'))) {
        await interaction.deferUpdate().catch(() => {});
        try {
          const fn = require('./services/flyNametag');
          const id = interaction.customId.split(':')[1];
          const accept = interaction.customId.startsWith('fn_accept:');
          // staff: ingame access or manage guild
          const member = interaction.member;
          const ok = member.permissions?.has?.(require('discord.js').PermissionFlagsBits.ManageGuild) ||
            member.permissions?.has?.(require('discord.js').PermissionFlagsBits.Administrator);
          // also check roles via settings
          const { settings } = getGuild(interaction.guildId);
          let roleOk = false;
          const access = Array.isArray(settings.ingameAccessRoles) ? settings.ingameAccessRoles : [];
          for (const r of access) {
            if (r && r.enabled !== false && member.roles.cache.has(String(r.roleId))) roleOk = true;
          }
          for (const rid of settings.ingameAccessRoleIds || []) {
            if (member.roles.cache.has(String(rid))) roleOk = true;
          }
          if (!ok && !roleOk) {
            return interaction.followUp({ content: 'Keine Berechtigung.', ephemeral: true }).catch(() => {});
          }
          const row = fn.setStatus(id, accept ? 'accepted' : 'rejected', interaction.user.id);
          await interaction.editReply({ embeds: [fn.buildEmbed(row)], components: [] }).catch(() => {});
          try {
            const u = await interaction.client.users.fetch(row.user_id);
            await u.send({ embeds: [fn.buildEmbed(row)] }).catch(() => {});
          } catch (_) {}
        } catch (e) {
          return interaction.followUp({ content: e.message || 'Fehler', ephemeral: true }).catch(() => {});
        }
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_claim') {
        await interaction.deferUpdate().catch(() => {});
        const tickets = require('./services/tickets');
        const result = tickets.tryClaim(interaction.channel.id, interaction.user.id);
        if (!result.ok) {
          if (result.reason === 'already') {
            return interaction.followUp({
              content: `Bereits übernommen von <@${result.claimedBy}>.`,
              ephemeral: true
            }).catch(() => {});
          }
          return interaction.followUp({ content: 'Claim nicht möglich.', ephemeral: true }).catch(() => {});
        }
        if (result.already) {
          return interaction.followUp({ content: 'Du hast dieses Ticket bereits.', ephemeral: true }).catch(() => {});
        }
        const { settings } = getGuild(interaction.guildId);
        try {
          require('./services/xp').awardAction(interaction.guildId, interaction.user.id, 'ticket_claim', settings);
        } catch (_) {}
        if (settings.ticketAutoUnclaimMinutes) {
          tickets.scheduleAutoUnclaim(client, interaction.guildId, interaction.channel.id, settings.ticketAutoUnclaimMinutes);
        }
        const emb = EmbedBuilder.from(interaction.message.embeds[0] || new EmbedBuilder())
          .setColor(0x22c55e)
          .spliceFields(0, 25);
        try {
          emb.setDescription(
            (interaction.message.embeds[0]?.description || '') +
              `\n\n**Übernommen von:** ${interaction.user}`
          );
        } catch (_) {}
        const claimedEmb = new EmbedBuilder()
          .setColor(0x22c55e)
          .setTitle(interaction.message.embeds[0]?.title || 'Ticket')
          .setDescription(
            (interaction.message.embeds[0]?.description || 'Ticket') +
              `\n\n✅ **Übernommen von:** ${interaction.user}`
          )
          .setTimestamp();
        tickets.applyTicketImages(claimedEmb, settings, 'create');
        await interaction.message
          .edit({ embeds: [claimedEmb], components: tickets.buildTicketButtons({ claimedBy: interaction.user.id }) })
          .catch(() => {});
        // embed-only: claim message handled via embed update
        return;
      }

      
      if (interaction.isButton() && (interaction.customId === 'admin_call_open' || interaction.customId === 'admincall_open' || interaction.customId === 'admin_call')) {
        try {
          const { isAdminCallBlacklisted, blacklistMessage } = require('./utils/blacklist');
          if (isAdminCallBlacklisted(interaction.member, getGuild(interaction.guildId).settings)) {
            return interaction.reply({ content: blacklistMessage(), ephemeral: true }).catch(() => {});
          }
        } catch (_) {}
        const modal = new ModalBuilder().setCustomId('admin_call_modal').setTitle('Admin Call');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('roblox').setLabel('Roblox Name').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('grund').setLabel('Grund').setStyle(TextInputStyle.Paragraph).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('wo').setLabel('Wo bist du?').setStyle(TextInputStyle.Short).setRequired(true)
          )
        );
        return interaction.showModal(modal);
      }
      if (interaction.isModalSubmit() && interaction.customId === 'admin_call_modal') {
        try {
          const { isAdminCallBlacklisted, blacklistMessage } = require('./utils/blacklist');
          if (isAdminCallBlacklisted(interaction.member, getGuild(interaction.guildId).settings)) {
            return interaction.reply({ content: blacklistMessage(), ephemeral: true }).catch(() => {});
          }
        } catch (_) {}
        const roblox = interaction.fields.getTextInputValue('roblox');
        const grund = interaction.fields.getTextInputValue('grund');
        const wo = interaction.fields.getTextInputValue('wo');
        const { settings } = getGuild(interaction.guildId);
        const logId = settings.adminCallLogChannelId;
        if (!logId) {
          return interaction.reply({ content: 'Kein Admin-Call-Kanal konfiguriert.', ephemeral: true }).catch(() => {});
        }
        const { state, save, nextId } = require('./db/database');
        if (!state.admin_calls) state.admin_calls = [];
        const id = 'ac_' + nextId();
        state.admin_calls.push({
          id,
          guild_id: interaction.guildId,
          user_id: interaction.user.id,
          roblox,
          grund,
          wo,
          status: 'open',
          claimedBy: null,
          created_at: Date.now()
        });
        save();
        const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
        if (!ch) {
          return interaction.reply({ content: 'Kanal nicht gefunden.', ephemeral: true }).catch(() => {});
        }
        const pings = (settings.adminCallPingRoleIds || []).map((id) => `<@&${id}>`).join(' ');
        const emb = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('🚨 Admin Call')
          .addFields(
            { name: 'Discord', value: `${interaction.user}`, inline: true },
            { name: 'Roblox', value: roblox.slice(0, 100), inline: true },
            { name: 'Wo', value: wo.slice(0, 100), inline: true },
            { name: 'Grund', value: grund.slice(0, 1000) },
            { name: 'Status', value: 'Offen', inline: true }
          )
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`admincall_claim:${id}`).setLabel('Übernehmen').setStyle(ButtonStyle.Primary)
        );
        await ch.send({
          content: pings || undefined,
          embeds: [emb],
          components: [row],
          allowedMentions: { roles: settings.adminCallPingRoleIds || [] }
        }).catch(() => {});
        return interaction.reply({ content: 'Admin Call gesendet.', ephemeral: true }).catch(() => {});
      }

      if (interaction.isButton() && interaction.customId.startsWith('admincall_claim:')) {
        const callId = interaction.customId.slice('admincall_claim:'.length);
        const { state, save, getGuild } = require('./db/database');
        if (!state.admin_calls) state.admin_calls = [];
        let row = state.admin_calls.find((c) => String(c.id) === String(callId) && c.guild_id === interaction.guildId);
        // legacy: callId was user id
        if (!row) {
          row = state.admin_calls.find((c) => c.status === 'open' && String(c.user_id) === String(callId));
        }
        if (row && row.claimedBy && String(row.claimedBy) !== String(interaction.user.id)) {
          return interaction.reply({ content: `Bereits übernommen von <@${row.claimedBy}>.`, ephemeral: true }).catch(() => {});
        }
        if (row && row.claimedBy) {
          return interaction.reply({ content: 'Du hast diesen Call bereits.', ephemeral: true }).catch(() => {});
        }
        if (row) {
          row.claimedBy = interaction.user.id;
          row.status = 'claimed';
          row.claimedAt = Date.now();
          save();
        } else {
          // voice-join legacy without stored row
          if (!state.admin_calls) state.admin_calls = [];
          state.admin_calls.push({
            id: callId,
            guild_id: interaction.guildId,
            user_id: callId,
            status: 'claimed',
            claimedBy: interaction.user.id,
            created_at: Date.now()
          });
          save();
        }
        await interaction.deferUpdate().catch(() => {});
        const { settings } = getGuild(interaction.guildId);
        try {
          require('./services/xp').awardAction(interaction.guildId, interaction.user.id, 'admin_call_claim', settings);
        } catch (_) {}
        const emb = EmbedBuilder.from(interaction.message.embeds[0] || new EmbedBuilder())
          .setColor(0x22c55e)
          .setTitle('Admin Call übernommen')
          .spliceFields(0, 0);
        const fields = (interaction.message.embeds[0]?.fields || []).filter((f) => f.name !== 'Status');
        const newEmb = new EmbedBuilder()
          .setColor(0x22c55e)
          .setTitle('✅ Admin Call übernommen')
          .setDescription(interaction.message.embeds[0]?.description || null)
          .addFields(
            ...fields,
            { name: 'Status', value: `Übernommen von ${interaction.user}` }
          )
          .setTimestamp();
        await interaction.message.edit({ embeds: [newEmb], components: [] }).catch(() => {});
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_reopen') {
        const tickets = require('./services/tickets');
        const meta = tickets.getMeta(interaction.channel.id);
        const opener = meta.openerId;
        if (opener) await tickets.reopenTicket(interaction.channel, opener);
        else await interaction.channel.send('🔓 Ticket reopened.').catch(() => {});
        return interaction.reply({ content: 'Reopened.', ephemeral: true }).catch(() => {});
      }
      if (interaction.isButton() && interaction.customId === 'ticket_removeuser') {
        return interaction.reply({
          content: 'User entfernen: schreibe `!remove @User` im Ticket oder nutze Kanalrechte.',
          ephemeral: true
        }).catch(() => {});
      }
      
      if (interaction.isButton() && interaction.customId === 'ticket_release') {
        const tickets = require('./services/tickets');
        const isAdmin = interaction.memberPermissions?.has?.(PermissionFlagsBits.Administrator);
        const result = tickets.tryUnclaim(interaction.channel.id, interaction.user.id, isAdmin);
        if (!result.ok) {
          if (result.reason === 'not_owner') {
            return interaction.reply({ content: 'Nur der übernehmende Staff kann freigeben.', ephemeral: true }).catch(() => {});
          }
          return interaction.reply({ content: 'Nicht freigebbar.', ephemeral: true }).catch(() => {});
        }
        await interaction.deferUpdate().catch(() => {});
        const freeEmb = new EmbedBuilder()
          .setColor(0x8b5cf6)
          .setTitle(interaction.message.embeds[0]?.title || 'Ticket')
          .setDescription((interaction.message.embeds[0]?.description || '').replace(/\n\n✅ \*\*Übernommen von:\*\*.*/s, '') + '\n\n🔓 **Frei — bitte übernehmen**')
          .setTimestamp();
        await interaction.message
          .edit({ embeds: [freeEmb], components: tickets.buildTicketButtons({ claimedBy: null }) })
          .catch(() => {});
        await interaction.channel.send(`🔓 Freigegeben von ${interaction.user}`).catch(() => {});
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_transcript') {
        const tickets = require('./services/tickets');
        const tr = tickets.buildTranscript(interaction.guildId, interaction.channel.id);
        const buf = Buffer.from(tr, 'utf8');
        return interaction.reply({
          content: 'Transcript:',
          files: [{ attachment: buf, name: `transcript-${interaction.channel.name}.txt` }],
          ephemeral: true
        }).catch(() => {});
      }
      if (interaction.isButton() && interaction.customId === 'ticket_adduser') {
        return interaction.reply({
          content: 'Nutze: Rechtsklick auf den Kanal → Personen hinzufügen, oder schreibe die User-ID hier. (Schnell-Add folgt)',
          ephemeral: true
        }).catch(() => {});
      }

      
      if (interaction.isButton() && interaction.customId === 'ticket_close') {
        const tickets = require('./services/tickets');
        const { settings } = getGuild(interaction.guildId);
        const meta = tickets.getMeta(interaction.channel.id);
        if (meta.closed) {
          return interaction.reply({ content: 'Bereits geschlossen.', ephemeral: true }).catch(() => {});
        }
        if (!tickets.canClose(interaction.member, settings, meta)) {
          return interaction.reply({ content: 'Keine Berechtigung zum Schließen.', ephemeral: true }).catch(() => {});
        }
        await interaction.deferUpdate().catch(() => {});
        tickets.setMeta(interaction.channel.id, { closed: true });
        try {
          require('./services/xp').awardAction(interaction.guildId, interaction.user.id, 'ticket_close', settings);
        } catch (_) {}
        await interaction.channel.send(`🔒 Ticket wird geschlossen von ${interaction.user}…`).catch(() => {});
        await tickets.closeTicket(interaction.channel, {
          closedBy: interaction.user.id,
          logChannelId: settings.ticketLogChannelId,
          settings
        });
        return;
      }
      if (interaction.isButton() && interaction.customId === 'ticket_close_request') {
        const tickets = require('./services/tickets');
        const { settings } = getGuild(interaction.guildId);
        const meta = tickets.getMeta(interaction.channel.id);
        const opener = meta.openerId;
        if (!opener) {
          return interaction.reply({ content: 'Kein Ticket-Ersteller hinterlegt.', ephemeral: true }).catch(() => {});
        }
        if (meta.closeRequested) {
          return interaction.reply({ content: 'Close Request bereits gesendet.', ephemeral: true }).catch(() => {});
        }
        tickets.setMeta(interaction.channel.id, { closeRequested: true, closeRequestedBy: interaction.user.id });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Ja, schließen').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_close_deny').setLabel('Nein').setStyle(ButtonStyle.Secondary)
        );
        await interaction.reply({
          content: `<@${opener}> — Staff möchte das Ticket schließen. Bitte bestätigen.`,
          components: [row]
        }).catch(() => {});
        return;
      }
      if (interaction.isButton() && interaction.customId === 'ticket_close_confirm') {
        const tickets = require('./services/tickets');
        const { settings } = getGuild(interaction.guildId);
        const meta = tickets.getMeta(interaction.channel.id);
        if (String(interaction.user.id) !== String(meta.openerId) && !interaction.memberPermissions?.has?.(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: 'Nur der Ticket-Ersteller kann bestätigen.', ephemeral: true }).catch(() => {});
        }
        if (settings.ticketAutoCloseOnRequest === false) {
          return interaction.reply({ content: 'Bestätigt. Staff kann manuell schließen.', ephemeral: true }).catch(() => {});
        }
        await interaction.deferUpdate().catch(() => {});
        tickets.setMeta(interaction.channel.id, { closed: true });
        await tickets.closeTicket(interaction.channel, {
          closedBy: interaction.user.id,
          logChannelId: settings.ticketLogChannelId,
          settings
        });
        return;
      }
      if (interaction.isButton() && interaction.customId === 'ticket_close_deny') {
        require('./services/tickets').setMeta(interaction.channel.id, { closeRequested: false });
        return interaction.update({ content: 'Close Request abgelehnt.', components: [] }).catch(() => {});
      }

      if (interaction.isButton() && interaction.customId === 'abmelden_start') {
        if (!isModuleEnabled(interaction.guildId, 'abmelden') && !isModuleEnabled(interaction.guildId, 'teamverwaltung')) {
          return interaction.reply({ content: 'Abmelden ist deaktiviert.', ephemeral: true });
        }
        const modal = new ModalBuilder().setCustomId('abmelden_modal').setTitle('Abmelden');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('duration')
              .setLabel('Dauer in Minuten (z.B. 60)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setValue('60')
              .setMaxLength(5)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'abmelden_modal') {
        const mins = Number(interaction.fields.getTextInputValue('duration')) || 60;
        await ack(interaction, true);
        try {
          const abmelden = require('./services/abmelden');
          const session = await abmelden.start(interaction.guild, interaction.member, {
            durationMin: mins,
            actorId: interaction.user.id
          });
          const until = new Date(session.until_ts).toLocaleString('de-DE');
          // DM with early return
          try {
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`abmelden_back:${interaction.guildId}`)
                .setLabel('Zurückmelden (Rollen zurück)')
                .setStyle(ButtonStyle.Success)
            );
            await interaction.user.send({
              content:
                `Du bist **abgemeldet** bis **${until}**.\n` +
                `Rollen wurden angepasst. Wenn du früher zurück bist, klicke den Button:`,
              components: [row]
            });
          } catch (_) {}
          return interaction.editReply({
            content: `✅ Abgemeldet bis **${until}**. Check deine DMs für die Rückmeldung.`
          });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + e.message });
        }
      }

      if (interaction.isButton() && interaction.customId.startsWith('abmelden_back:')) {
        const gid = interaction.customId.split(':')[1];
        const guild = client.guilds.cache.get(gid) || (await client.guilds.fetch(gid).catch(() => null));
        if (!guild) return interaction.reply({ content: 'Server nicht gefunden.', ephemeral: true });
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Mitglied nicht gefunden.', ephemeral: true });
        try {
          const abmelden = require('./services/abmelden');
          await abmelden.end(guild, member, { actorId: interaction.user.id, reason: 'early_dm' });
          return interaction.reply({ content: '✅ Du bist zurück. Rollen wiederhergestellt.', ephemeral: true });
        } catch (e) {
          return interaction.reply({ content: e.message, ephemeral: true });
        }
      }

      // Schicht from Discord (also available on Ingame dashboard)
      if (interaction.isButton() && interaction.customId === 'schicht_in') {
        try {
          const schicht = require('./services/schicht');
          schicht.clockIn(interaction.guildId, interaction.user.id, interaction.user.id);
          return interaction.reply({ content: '🟢 Schicht gestartet.', ephemeral: true });
        } catch (e) {
          return interaction.reply({ content: e.message, ephemeral: true });
        }
      }
      if (interaction.isButton() && interaction.customId === 'schicht_out') {
        try {
          const schicht = require('./services/schicht');
          const row = schicht.clockOut(interaction.guildId, interaction.user.id, interaction.user.id);
          return interaction.reply({
            content: `🔴 Schicht beendet · ${schicht.formatDuration(row.duration_ms)}`,
            ephemeral: true
          });
        } catch (e) {
          return interaction.reply({ content: e.message, ephemeral: true });
        }
      }

      if (interaction.isButton() && interaction.customId === 'bewerbung_start') {
        if (!isModuleEnabled(interaction.guildId, 'bewerbungen') && !isModuleEnabled(interaction.guildId, 'dienstnummern')) {
          return interaction.reply({ content: 'Bewerbungs-Modul ist deaktiviert.', ephemeral: true });
        }
        const modal = new ModalBuilder().setCustomId('bewerbung_modal').setTitle('Bewerbung');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('roblox')
              .setLabel('Roblox Username')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(32)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('info')
              .setLabel('Motivation / Info (optional)')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setMaxLength(500)
          )
        );
        return interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'bewerbung_modal') {
        if (!isModuleEnabled(interaction.guildId, 'bewerbungen') && !isModuleEnabled(interaction.guildId, 'dienstnummern')) {
          return interaction.reply({ content: 'Bewerbungs-Modul ist deaktiviert.', ephemeral: true });
        }
        const roblox = interaction.fields.getTextInputValue('roblox').trim();
        let info = '';
        try { info = interaction.fields.getTextInputValue('info') || ''; } catch (_) {}
        try {
          const app = apps.createApplication(interaction.guildId, {
            discordId: interaction.user.id,
            robloxUsername: roblox,
            answers: { info }
          });
          const { settings } = getGuild(interaction.guildId);
          const logId = settings.appLogChannelId || settings.appChannelId || settings.logChannelId;
          if (logId) {
            const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
            if (ch) {
              await ch.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0x8b5cf6)
                    .setTitle('Neue Bewerbung')
                    .setDescription(`**User:** ${interaction.user}\n**Roblox:** ${roblox}\n**Info:** ${info || '—'}`)
                    .setFooter({ text: 'STAFFORA BOT · ID ' + app.id })
                    .setTimestamp()
                ]
              }).catch(() => {});
            }
          }
          return interaction.reply({ content: '✅ Bewerbung eingereicht. Staff prüft sie.', ephemeral: true });
        } catch (e) {
          return interaction.reply({ content: 'Fehler: ' + (e.message || 'unbekannt'), ephemeral: true });
        }
      }

      // —— Dizzy: link confirm / cancel ——
      if (interaction.isButton() && interaction.customId.startsWith('dizzy_link_ok:')) {
        const { settings } = getGuild(interaction.guildId);
        if (!isDizzyStaff(interaction.member, settings)) {
          return interaction.reply({ content: 'Nur Staff kann Verknüpfungen bestätigen.', ephemeral: true });
        }
        const rid = Number(interaction.customId.split(':')[1]);
        const row = ingame.resolveLinkRequest(interaction.guildId, rid, {
          approved: true,
          verifiedBy: interaction.user.id
        });
        if (!row) return interaction.reply({ content: 'Anfrage nicht gefunden oder bereits bearbeitet.', ephemeral: true });
        const emb = new EmbedBuilder()
          .setColor(0x34d399)
          .setTitle('Verknüpfung bestätigt')
          .addFields(
            { name: 'Discord', value: `<@${row.discord_id}>`, inline: true },
            { name: 'Roblox', value: '**' + (row.roblox_username || '—') + '**', inline: true },
            { name: 'Bestätigt von', value: `${interaction.user}`, inline: false }
          )
          .setFooter({ text: 'Staffora · Dizzy' })
          .setTimestamp();
        await interaction.update({ embeds: [emb], components: [] });
        scheduleDizzyStickyRefresh(interaction.channel, interaction.guildId, 3000);
        try {
          const logId = settings.dizzyLogChannelId || settings.logChannelId;
          if (logId) {
            const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
            if (ch) {
              await ch.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0x8b5cf6)
                    .setTitle('Verknüpfung')
                    .addFields(
                      { name: 'Discord', value: `<@${row.discord_id}>`, inline: true },
                      { name: 'Roblox', value: '**' + (row.roblox_username || '—') + '**', inline: true },
                      { name: 'Von', value: `${interaction.user}`, inline: true }
                    )
                    .setFooter({ text: 'Staffora · Dizzy' })
                    .setTimestamp()
                ]
              }).catch(() => {});
            }
          }
        } catch (_) {}
        setTimeout(() => {
          interaction.message.delete().catch(() => {});
        }, 3000);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('dizzy_link_cancel:')) {
        const { settings } = getGuild(interaction.guildId);
        const rid = Number(interaction.customId.split(':')[1]);
        const isStaff = isDizzyStaff(interaction.member, settings);
        const row = (ingame.listLinkRequests
          ? (ingame.listLinkRequests(interaction.guildId) || []).find((r) => r.id === rid)
          : null);
        // allow staff OR the requester
        const reqRow = row || (() => {
          try {
            const { state } = require('./db/database');
            return (state.roblox_link_requests || []).find((r) => r.id === rid && r.guild_id === interaction.guildId);
          } catch (_) { return null; }
        })();
        if (reqRow && String(reqRow.discord_id) !== String(interaction.user.id) && !isStaff) {
          return interaction.reply({ content: 'Nur der Anfragende oder Staff kann abbrechen.', ephemeral: true });
        }
        ingame.resolveLinkRequest(interaction.guildId, rid, {
          approved: false,
          verifiedBy: interaction.user.id
        });
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(0xf87171)
              .setTitle('Verknüpfung abgebrochen')
              .addFields({ name: 'Status', value: 'Anfrage verworfen', inline: false })
              .setFooter({ text: 'Staffora · Dizzy' })
          ],
          components: []
        });
        setTimeout(() => interaction.message.delete().catch(() => {}), 3000);
        return;
      }

      // —— Dizzy: Discord Controlle complete ——
      if (interaction.isButton() && interaction.customId.startsWith('dizzy_ctrl_done:')) {
        const { settings } = getGuild(interaction.guildId);
        if (!isDizzyStaff(interaction.member, settings)) {
          return interaction.reply({ content: 'Nur Staff kann die Discord Controlle abschließen.', ephemeral: true });
        }
        const parts = interaction.customId.split(':');
        const targetDiscordId = parts[1];
        const robloxId = parts[2];
        const robloxName = parts.slice(3).join(':') || 'User';
        const emb = new EmbedBuilder()
          .setColor(0x34d399)
          .setTitle('Controlle abgeschlossen')
          .addFields(
            { name: 'Staff', value: `${interaction.user}`, inline: true },
            { name: 'User', value: `<@${targetDiscordId}>`, inline: true },
            { name: 'Roblox', value: robloxName + ' (`' + robloxId + '`)', inline: false }
          )
          .setFooter({ text: 'Staffora · Dizzy' })
          .setTimestamp();
        await interaction.update({ embeds: [emb], components: [] });
        scheduleDizzyStickyRefresh(interaction.channel, interaction.guildId, 3000);
        try {
          const { addLog } = require('./db/database');
          addLog({
            guildId: interaction.guildId,
            module: 'dizzy',
            action: 'discord_controlle',
            actorId: interaction.user.id,
            targetId: targetDiscordId,
            robloxUsername: robloxName,
            newData: { robloxUserId: robloxId }
          });
        } catch (_) {}
        try {
          const logId = settings.dizzyLogChannelId || settings.logChannelId;
          if (logId) {
            const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
            if (ch) {
              await ch.send({
                content: `🎮 **Discord Controlle:** ${interaction.user} mit <@${targetDiscordId}> (**${robloxName}**)`
              }).catch(() => {});
            }
          }
        } catch (_) {}
        setTimeout(() => interaction.message.delete().catch(() => {}), 3000);
        return;
      }


      // Partner accept / reject / info
      if (interaction.isButton() && interaction.customId.startsWith('partner_accept:')) {
        const id = interaction.customId.split(':')[1];
        const partner = require('./services/partner');
        const { settings } = getGuild(interaction.guildId);
        if (!partner.isPartnerManager(interaction.member, settings)) {
          return interaction.reply({ content: 'Keine Partner-Manager Berechtigung.', ephemeral: true });
        }
        await ack(interaction, true);
        try {
          await partner.decide(client, interaction.guildId, id, {
            approved: true,
            reviewerId: interaction.user.id,
            member: interaction.member
          });
          return interaction.editReply({ content: 'Antrag #' + id + ' angenommen.' });
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' });
        }
      }
      if (interaction.isButton() && interaction.customId.startsWith('partner_reject:')) {
        const id = interaction.customId.split(':')[1];
        const partner = require('./services/partner');
        const { settings } = getGuild(interaction.guildId);
        if (!partner.isPartnerManager(interaction.member, settings)) {
          return interaction.reply({ content: 'Keine Partner-Manager Berechtigung.', ephemeral: true });
        }
        await ack(interaction, true);
        try {
          await partner.decide(client, interaction.guildId, id, {
            approved: false,
            reviewerId: interaction.user.id,
            member: interaction.member,
            note: 'Abgelehnt'
          });
          return interaction.editReply({ content: 'Antrag #' + id + ' abgelehnt.' });
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' });
        }
      }
      if (interaction.isButton() && interaction.customId.startsWith('partner_info:')) {
        const id = interaction.customId.split(':')[1];
        const partner = require('./services/partner');
        const { settings } = getGuild(interaction.guildId);
        if (!partner.isPartnerManager(interaction.member, settings)) {
          return interaction.reply({ content: 'Keine Partner-Manager Berechtigung.', ephemeral: true });
        }
        const modal = new ModalBuilder().setCustomId('partner_info_modal:' + id).setTitle('Info anfragen');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('message')
              .setLabel('Nachricht an Bewerber')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1000)
          )
        );
        return interaction.showModal(modal);
      }
      if (interaction.isModalSubmit() && interaction.customId.startsWith('partner_info_modal:')) {
        const id = interaction.customId.split(':')[1];
        const partner = require('./services/partner');
        await ack(interaction, true);
        try {
          await partner.requestInfo(client, interaction.guildId, id, {
            reviewerId: interaction.user.id,
            message: interaction.fields.getTextInputValue('message'),
            member: interaction.member
          });
          return interaction.editReply({ content: 'Rückfrage gesendet.' });
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' });
        }
      }


      if (!interaction.isChatInputCommand()) return;

      const gid = interaction.guildId;
      if (!gid && interaction.commandName !== 'ping' && interaction.commandName !== 'staffora') {
        return interaction.reply({ content: 'Nur auf Servern nutzbar.', ephemeral: true });
      }

      // Slow commands: acknowledge immediately to avoid Discord timeout
      const SLOW = new Set(['teamkick','teaminvite','partner','dienstnummer','nummer-anfragen','ausweis','bewerben','dienst','ausserdienst','staffora','promote','demote','fraktion']);
      if (SLOW.has(interaction.commandName)) {
        await ack(interaction, true);
      }

      if (interaction.commandName === 'dienst') {
        if (!isModuleEnabled(gid, 'dutyPanel') && !isModuleEnabled(gid, 'teamverwaltung')) {
          return say(interaction, { content: 'Dienst-Modul ist deaktiviert.', ephemeral: true });
        }
        const { settings } = getGuild(gid);
        const roles = settings.dutyRoleIds || [];
        if (roles.length) {
          const has = interaction.member.roles.cache.some((r) => roles.includes(r.id));
          if (!has) return say(interaction, { content: 'Keine Berechtigung für Clock-in.', ephemeral: true });
        }
        team.setDuty(gid, interaction.user.id, true, interaction.user.id);
        return say(interaction, { content: '✅ Du bist jetzt **im Dienst**.', ephemeral: true });
      }

      if (interaction.commandName === 'ausserdienst') {
        if (!isModuleEnabled(gid, 'dutyPanel') && !isModuleEnabled(gid, 'teamverwaltung')) {
          return say(interaction, { content: 'Dienst-Modul ist deaktiviert.', ephemeral: true });
        }
        team.setDuty(gid, interaction.user.id, false, interaction.user.id);
        return say(interaction, { content: '⏹ Du bist **außer Dienst**.', ephemeral: true });
      }

      if (interaction.commandName === 'ping') {
        return interaction.reply({ content: `Pong · ${client.ws.ping}ms`, ephemeral: true });
      }

      if (interaction.commandName === 'staffora') {
        const dash = (env.DASHBOARD_URL || 'https://stafforadashboard.github.io/staffora-web').replace(/\/$/, '');
        return say(interaction, {
          content: `**STAFFORA BOT**\nDashboard: ${dash}\nServer: ${client.guilds.cache.size}\nPing: ${client.ws.ping}ms`,
          ephemeral: true
        });
      }

      if (interaction.commandName === 'bewerben') {
        if (!isModuleEnabled(gid, 'bewerbungen') && !isModuleEnabled(gid, 'dienstnummern')) {
          return say(interaction, { content: 'Bewerbungs-Modul ist deaktiviert.', ephemeral: true });
        }
        const existing = dn.getByDiscord(gid, interaction.user.id);
        if (existing) {
          return say(interaction, {
            content: `Du hast bereits eine Dienstnummer: **${existing.number}**`,
            ephemeral: true
          });
        }
        const roblox = interaction.options.getString('roblox', true);
        const info = interaction.options.getString('info') || '';
        const app = apps.createApplication(gid, {
          discordId: interaction.user.id,
          robloxUsername: roblox,
          answers: { info }
        });
        const { settings } = getGuild(gid);
        if (settings.appChannelId) {
          const ch = await interaction.guild.channels.fetch(settings.appChannelId).catch(() => null);
          if (ch) {
            await ch.send({
              content: `📋 Neue Bewerbung von <@${interaction.user.id}> (Roblox: **${roblox}**) – ID \`${app.id}\`\nPrüfen im Dashboard.`
            });
          }
        }
        return say(interaction, {
          content: 'Bewerbung eingereicht. Bei Annahme erhältst du automatisch eine Dienstnummer.',
          ephemeral: true
        });
      }

      if (interaction.commandName === 'dienstnummer') {
        if (!isModuleEnabled(gid, 'dienstnummern')) {
          return say(interaction, { content: 'Dienstnummern-Modul deaktiviert.', ephemeral: true });
        }
        const row = dn.getByDiscord(gid, interaction.user.id);
        if (!row) {
          return say(interaction, {
            content: 'Keine Dienstnummer. Nutze `/bewerben`.',
            ephemeral: true
          });
        }
        const { settings } = getGuild(gid);
        const label = dn.formatDisplay(settings, row.number, row.display_name || interaction.user.username);
        return say(interaction, {
          content: `**${settings.numberLabel || 'Dienstnummer'}:** ${label}`,
          ephemeral: true
        });
      }

      if (interaction.commandName === 'nummer-anfragen') {
        if (!isModuleEnabled(gid, 'dienstnummern')) {
          return say(interaction, { content: 'Dienstnummern-Modul deaktiviert.', ephemeral: true });
        }
        const grund = interaction.options.getString('grund') || '';
        dn.requestChange(gid, interaction.user.id, grund);
        return say(interaction, {
          content: 'Antrag auf neue Dienstnummer gestellt. Warte auf Genehmigung im Dashboard.',
          ephemeral: true
        });
      }

      if (interaction.commandName === 'ausweis') {
        if (!isModuleEnabled(gid, 'ausweis')) {
          return say(interaction, { content: 'Ausweis-Modul ist deaktiviert (Dashboard → Module).', ephemeral: true });
        }
        const sub = interaction.options.getSubcommand();
        const { settings } = getGuild(gid);

        if (sub === 'zeigen') {
          const card = ausweis.getCard(gid, interaction.user.id);
          if (!card || !card.name) {
            return say(interaction, {
              content: 'Du hast noch keinen Ausweis. Nutze das Antrags-Panel.',
              ephemeral: true
            });
          }
          return say(interaction, {
            embeds: [ausweis.buildAusweisEmbed(card, settings.ausweisServerName || settings.systemName || 'Staffora', interaction.guildId)],
            ephemeral: false
          });
        }

        if (sub === 'zeigen-user') {
          const user = interaction.options.getUser('user', true);
          const card = ausweis.getCard(gid, user.id);
          if (!card || !card.name) {
            return say(interaction, { content: 'Kein Ausweis für diesen User.', ephemeral: true });
          }
          return say(interaction, {
            embeds: [ausweis.buildAusweisEmbed(card, settings.ausweisServerName || settings.systemName || 'Staffora', interaction.guildId)]
          });
        }

        if (sub === 'panel') {
          const types = ausweis.listTypes(gid);
          if (!types.length) {
            return say(interaction, {
              content: 'Keine Ausweis-Typen konfiguriert. Dashboard → Ausweise.',
              ephemeral: true
            });
          }
          const menu = new StringSelectMenuBuilder()
            .setCustomId('ausweis_select_type')
            .setPlaceholder('Dokument beantragen…')
            .addOptions(
              types.slice(0, 25).map((t) => ({
                label: t.name.slice(0, 100),
                value: t.id,
                description: `Antrag: ${t.name}`.slice(0, 100)
              }))
            );
          const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('🪪 Ausweis-Anträge')
            .setDescription(
              'Wähle im Menü den gewünschten Ausweis / Schein.\nNach dem Ausfüllen prüft das Team deinen Antrag.\n\n' +
                types.map((t) => `• **${t.name}**`).join('\n')
            )
            .setFooter({ text: settings.systemName || 'Staffora' });
          await interaction.channel.send({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu)]
          });
          return say(interaction, { content: 'Panel gesendet.', ephemeral: true });
        }
      }






      if (interaction.commandName === 'teamkick') {
        await ack(interaction, true);
        try {
          const { settings } = getGuild(gid);
          const adminRoles = (settings.adminRoleIds || []).map(String);
          const isAdmin =
            interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
            interaction.member.roles.cache.some((r) => adminRoles.includes(r.id));
          if (!isAdmin) {
            return interaction.editReply({ content: 'Keine Berechtigung (Admin-Rolle).' });
          }
          const target = interaction.options.getMember('user');
          if (!target) return interaction.editReply({ content: 'Member nicht gefunden.' });
          const teamRoles = []
            .concat(settings.staffRoleIds || [])
            .concat(settings.dutyRoleIds || [])
            .concat((settings.rankCareer || []).map((r) => r.roleId).filter(Boolean));
          const unique = [...new Set(teamRoles.map(String))];
          const toRemove = target.roles.cache.filter((r) => unique.includes(r.id));
          if (!toRemove.size) {
            return interaction.editReply({ content: 'Keine Team-Rollen zum Entfernen gefunden.' });
          }
          await target.roles.remove(toRemove, 'TeamKick: ' + (interaction.options.getString('grund') || '—'));
          try {
            const { addLog } = require('./db/database');
            addLog({
              guildId: gid,
              module: 'team',
              action: 'teamkick',
              actorId: interaction.user.id,
              targetId: target.id,
              reason: interaction.options.getString('grund') || null,
              newData: { removed: toRemove.map((r) => r.id) }
            });
          } catch (_) {}
          try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
          const emb = await sendTeamActionEmbed(client, gid, {
            action: 'kick',
            target: `${target}`,
            actor: `${interaction.user}`,
            reason: interaction.options.getString('grund') || '—',
            extra: toRemove.size + ' Rolle(n) entfernt'
          });
          return interaction.editReply({ content: `TeamKick: ${toRemove.size} Rolle(n) entfernt.`, embeds: [emb] });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) });
        }
      }

      if (interaction.commandName === 'teaminvite') {
        await ack(interaction, true);
        try {
          const { settings } = getGuild(gid);
          const adminRoles = (settings.adminRoleIds || []).map(String);
          const isAdmin =
            interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
            interaction.member.roles.cache.some((r) => adminRoles.includes(r.id));
          if (!isAdmin) {
            const embInv = await sendTeamActionEmbed(client, gid, {
            action: 'invite',
            target: `${target}`,
            actor: `${interaction.user}`,
            rank: (rank && (rank.name || rank.key)) || interaction.options.getString('rang') || '—'
          });
          try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
          return interaction.editReply({ content: 'Team Invite gesetzt.', embeds: [embInv] });
          }
          const target = interaction.options.getMember('user');
          if (!target) return interaction.editReply({ content: 'Member nicht gefunden.' });
          const key = interaction.options.getString('rang', true).trim().toLowerCase();
          const career = settings.rankCareer || [];
          let roleId = null;
          const hit = career.find(
            (r) =>
              String(r.key || '').toLowerCase() === key ||
              String(r.name || '').toLowerCase() === key
          );
          if (hit) roleId = hit.roleId;
          if (!roleId && (settings.staffRoleIds || []).length) {
            // fallback: first staff role if key matches "staff"
            roleId = settings.staffRoleIds[0];
          }
          if (!roleId) {
            return interaction.editReply({
              content: 'Rang nicht gefunden. Konfiguriere rankCareer im Dashboard (key/name + roleId).'
            });
          }
          await target.roles.add(roleId, 'TeamInvite: ' + (interaction.options.getString('grund') || '—'));
          try { await require('./services/autoNick').applyNickname(target, settings); } catch (_) {}
          try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
          return interaction.editReply({
            content: `${target} hat die Rolle <@&${roleId}> erhalten.`
          });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) });
        }
      }

      if (interaction.commandName === 'partner') {
        const sub = interaction.options.getSubcommand();
        if (sub === 'bewerben') {
          await ack(interaction, true);
          try {
            const partner = require('./services/partner');
            const payload = {
              serverName: interaction.options.getString('servername', true),
              invite: interaction.options.getString('invite', true),
              members: interaction.options.getInteger('members', true),
              description: interaction.options.getString('beschreibung', true),
              category: interaction.options.getString('kategorie', true),
              why: interaction.options.getString('warum', true),
              offer: interaction.options.getString('angebot', true),
              adText: interaction.options.getString('werbung', true),
              extra: interaction.options.getString('extra') || '',
              applicantId: interaction.user.id,
              applicantTag: interaction.user.tag
            };
            const result = await partner.submitApplication(client, gid, payload);
            return interaction.editReply({
              content: result.message || 'Partner-Antrag eingereicht.'
            });
          } catch (e) {
            return interaction.editReply({ content: 'Fehler: ' + (e.message || e) });
          }
        }
      }


      
      if (interaction.isChatInputCommand() && (interaction.commandName === 'rp-start' || interaction.commandName === 'rp-stop')) {
        await ack(interaction, false);
        try {
          const { settings } = getGuild(interaction.guildId);
          const isStart = interaction.commandName === 'rp-start';
          const conf = isStart ? (settings.rpStartEmbed || {}) : (settings.rpStopEmbed || {});
          const emb = new EmbedBuilder()
            .setColor(conf.color ? parseInt(String(conf.color).replace('#', ''), 16) || 0x8b5cf6 : 0x8b5cf6)
            .setTitle(conf.title || (isStart ? 'RP gestartet' : 'RP beendet'))
            .setDescription(
              conf.description ||
                (isStart
                  ? 'Das Roleplay ist **gestartet**. Viel Spaß!'
                  : 'Das Roleplay ist **beendet**. Danke fürs Spielen!')
            )
            .setFooter({ text: conf.footer || 'Staffora · RP' })
            .setTimestamp();
          if (Array.isArray(conf.fields) && conf.fields.length) {
            emb.addFields(
              conf.fields
                .filter((f) => f && f.name)
                .map((f) => ({ name: String(f.name).slice(0, 256), value: String(f.value || '—').slice(0, 1024), inline: !!f.inline }))
            );
          }
          await interaction.channel.send({ embeds: [emb] });
          return interaction.editReply({ content: isStart ? 'RP-Start gesendet.' : 'RP-Stop gesendet.' });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }


      
      if (interaction.isChatInputCommand() && interaction.commandName === 'ausweis') {
        await ack(interaction, true);
        try {
          const robloxName = interaction.options.getString('roblox');
          const card = ausweis.getCardByRoblox(interaction.guildId, robloxName);
          if (!card) {
            return interaction.editReply({ content: 'Kein Ausweis für Roblox-User `' + robloxName + '` gefunden.' });
          }
          const { settings } = getGuild(interaction.guildId);
          return interaction.editReply({
            embeds: [ausweis.buildAusweisEmbed(card, settings.ausweisServerName || settings.systemName || 'Staffora', interaction.guildId)]
          });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }

      if (interaction.isChatInputCommand() && interaction.commandName === 'note') {
        await ack(interaction, true);
        try {
          const user = interaction.options.getUser('user');
          const text = interaction.options.getString('text');
          const { addLog } = require('./db/database');
          addLog({
            guildId: interaction.guildId,
            module: 'note',
            actorId: interaction.user.id,
            targetId: user.id,
            action: 'note',
            reason: text
          });
          const emb = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('Notiz')
            .addFields(
              { name: 'User', value: `${user}`, inline: true },
              { name: 'Von', value: `${interaction.user}`, inline: true },
              { name: 'Text', value: text.slice(0, 1000), inline: false }
            )
            .setFooter({ text: 'Staffora' })
            .setTimestamp();
          const { settings } = getGuild(interaction.guildId);
          const logId = settings.logChannelId;
          if (logId) {
            const ch = await interaction.guild.channels.fetch(logId).catch(() => null);
            if (ch) await ch.send({ embeds: [emb] }).catch(() => {});
          }
          return interaction.editReply({ embeds: [emb] });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }



      if (interaction.commandName === 'promote' || interaction.commandName === 'demote') {
        await ack(interaction, true);
        try {
          const { settings } = getGuild(gid);
          const adminRoles = (settings.adminRoleIds || []).map(String);
          const isAdmin =
            interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
            interaction.member.roles.cache.some((r) => adminRoles.includes(r.id));
          if (!isAdmin) return interaction.editReply({ content: 'Keine Berechtigung (Admin-Rolle).' });
          const target = interaction.options.getMember('user');
          if (!target) return interaction.editReply({ content: 'Member nicht gefunden.' });
          const career = (settings.rankCareer || []).slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          if (!career.length) return interaction.editReply({ content: 'Keine Rang-Laufbahn konfiguriert (Dashboard → rankCareer).' });
          let idx = -1;
          for (let i = career.length - 1; i >= 0; i--) {
            if (career[i].roleId && target.roles.cache.has(String(career[i].roleId))) { idx = i; break; }
          }
          if (interaction.commandName === 'promote') {
            if (idx >= career.length - 1) return interaction.editReply({ content: 'Bereits höchster Rang.' });
            const next = career[idx + 1] || career[0];
            if (idx >= 0 && career[idx].roleId) await target.roles.remove(career[idx].roleId, 'Promote').catch(() => {});
            if (next.roleId) await target.roles.add(next.roleId, 'Promote').catch(() => {});
            try { await require('./services/autoNick').applyNickname(target, settings); } catch (_) {}
            try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
            const { addLog } = require('./db/database');
            addLog({ guildId: gid, module: 'team', action: 'promote', actorId: interaction.user.id, targetId: target.id, newData: { rank: next.name || next.key } });
            const embUp = await sendTeamActionEmbed(client, gid, {
              action: 'promote',
              target: `${target}`,
              actor: `${interaction.user}`,
              rank: next.name || next.key
            });
            try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
            return interaction.editReply({ content: 'Uprank: ' + (next.name || next.key), embeds: [embUp] });
            return interaction.editReply({ content: `Befördert: ${target} → **${next.name || next.key}**` });
          } else {
            if (idx <= 0) return interaction.editReply({ content: 'Bereits niedrigster Rang oder kein Team-Rang.' });
            const prev = career[idx - 1];
            if (career[idx].roleId) await target.roles.remove(career[idx].roleId, 'Demote').catch(() => {});
            if (prev.roleId) await target.roles.add(prev.roleId, 'Demote').catch(() => {});
            try { await require('./services/autoNick').applyNickname(target, settings); } catch (_) {}
            try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
            const { addLog } = require('./db/database');
            addLog({ guildId: gid, module: 'team', action: 'demote', actorId: interaction.user.id, targetId: target.id, newData: { rank: prev.name || prev.key } });
            const embDown = await sendTeamActionEmbed(client, gid, {
              action: 'demote',
              target: `${target}`,
              actor: `${interaction.user}`,
              rank: prev.name || prev.key
            });
            try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
            return interaction.editReply({ content: 'Demote: ' + (prev.name || prev.key), embeds: [embDown] });
            return interaction.editReply({ content: `Degradiert: ${target} → **${prev.name || prev.key}**` });
          }
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) });
        }
      }

      
      
      // ——— Discord Moderation commands ———
      if (
        interaction.isChatInputCommand() &&
        ['kick', 'ban', 'softban', 'warn', 'timeout'].includes(interaction.commandName)
      ) {
        await ack(interaction, true);
        try {
          const mod = require('./services/moderation');
          const { settings } = getGuild(interaction.guildId);
          const cmd = interaction.commandName;
          if (!mod.canUse(interaction.member, settings, cmd)) {
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xef4444)
                  .setTitle('Keine Berechtigung')
                  .setDescription(`Du darfst \`/${cmd}\` nicht nutzen.`)
              ]
            });
          }
          const target = interaction.options.getUser('user', true);
          const grund = interaction.options.getString('grund') || 'Kein Grund angegeben';
          const member = await interaction.guild.members.fetch(target.id).catch(() => null);
          if (cmd !== 'ban' && cmd !== 'softban' && !member) {
            return interaction.editReply({ content: 'User nicht auf dem Server.' });
          }
          if (member && !mod.canModerate(interaction.member, member, interaction.guild.members.me)) {
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xef4444)
                  .setTitle('Hierarchie')
                  .setDescription('Du oder der Bot kann diesen User nicht moderieren (Rollen-Hierarchie).')
              ]
            });
          }
          let resultEmbed;
          if (cmd === 'kick') {
            await member.kick(grund);
            resultEmbed = mod.actionEmbed('kick', target, interaction.user, grund);
          } else if (cmd === 'ban') {
            const days = interaction.options.getInteger('tage') || 0;
            await interaction.guild.members.ban(target.id, { reason: grund, deleteMessageSeconds: Math.min(7, days) * 86400 });
            resultEmbed = mod.actionEmbed('ban', target, interaction.user, grund);
          } else if (cmd === 'softban') {
            await interaction.guild.members.ban(target.id, { reason: grund, deleteMessageSeconds: 86400 });
            await interaction.guild.members.unban(target.id, 'Softban');
            resultEmbed = mod.actionEmbed('softban', target, interaction.user, grund);
          } else if (cmd === 'warn') {
            const row = mod.warnDiscord(interaction.guildId, target.id, grund, interaction.user.id);
            resultEmbed = mod.actionEmbed('warn', target, interaction.user, grund, { count: row.count });
            try {
              await target.send({ embeds: [resultEmbed] }).catch(() => {});
            } catch (_) {}
          } else if (cmd === 'timeout') {
            const dur = interaction.options.getString('dauer', true);
            const ms = mod.parseTimeout(dur);
            await member.timeout(ms, grund);
            resultEmbed = mod.actionEmbed('timeout', target, interaction.user, grund, { duration: dur });
          }
          const logId = settings.modLogChannelId || settings.logChannelId;
          if (logId) {
            const log = await interaction.guild.channels.fetch(logId).catch(() => null);
            if (log) await log.send({ embeds: [resultEmbed] }).catch(() => {});
          }
          return interaction.editReply({ embeds: [resultEmbed] });
        } catch (e) {
          console.warn('[mod]', e);
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xef4444)
                .setTitle('Aktion fehlgeschlagen')
                .setDescription(e.message || 'Unbekannter Fehler')
            ]
          }).catch(() => {});
        }
      }

      
      if (interaction.isChatInputCommand() && interaction.commandName === 'message') {
        await ack(interaction, true);
        try {
          const { settings } = getGuild(interaction.guildId);
          // permission: ManageMessages or configured mod roles or admin
          const member = interaction.member;
          let ok = false;
          try {
            if (member.permissions?.has?.(PermissionFlagsBits.Administrator)) ok = true;
            if (member.permissions?.has?.(PermissionFlagsBits.ManageMessages)) ok = true;
            if (member.permissions?.has?.(PermissionFlagsBits.ManageGuild)) ok = true;
          } catch (_) {}
          const allow = [].concat(
            settings.messageCommandRoleIds || [],
            settings.staffRoleIds || [],
            (settings.modPermissions && settings.modPermissions.warn || []).filter((r) => r && r.enabled !== false).map((r) => r.roleId)
          ).map(String);
          if (!ok && allow.some((id) => member.roles.cache.has(id))) ok = true;
          if (!ok) {
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xef4444)
                  .setTitle('Keine Berechtigung')
                  .setDescription('Du darfst `/message` nicht nutzen.')
              ]
            });
          }
          const title = interaction.options.getString('titel', true);
          const text = interaction.options.getString('text', true);
          const color = 0x8b5cf6;
          const chOpt = interaction.options.getChannel('kanal');
          let channel = interaction.channel;
          if (chOpt) {
            channel = await interaction.guild.channels.fetch(chOpt.id).catch(() => null);
          }
          if (!channel || !channel.isTextBased?.()) {
            return interaction.editReply({ content: 'Ungültiger Kanal.' });
          }
          const emb = new EmbedBuilder()
            .setColor(color)
            .setTitle(title.slice(0, 256))
            .setDescription(text.slice(0, 4096))
            .setFooter({ text: 'Staffora' })
            .setTimestamp();
          await channel.send({ embeds: [emb] });
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x22c55e)
                .setTitle('Gesendet')
                .setDescription(`Embed in ${channel} veröffentlicht.`)
            ]
          });
        } catch (e) {
          console.warn('[message]', e);
          return interaction.editReply({ content: e.message || 'Fehler' }).catch(() => {});
        }
      }

      if (interaction.isChatInputCommand() && interaction.commandName === 'stats') {
        await ack(interaction, true);
        try {
          const statusPanel = require('./services/statusPanel');
          const dutyPanel = require('./services/dutyPanel');
          const parts = [];
          try {
            const msg = await statusPanel.updatePanel(interaction.client, interaction.guildId);
            parts.push(msg ? 'Online-Stats OK' : 'Online-Stats: kein Kanal');
          } catch (e) {
            parts.push('Online-Stats: ' + (e.message || e));
          }
          try {
            const dmsg = await dutyPanel.updateDutyPanel(interaction.client, interaction.guildId);
            parts.push(dmsg ? 'Duty/Ingame-Panel OK' : 'Duty-Panel: kein Kanal');
          } catch (e) {
            parts.push('Duty-Panel: ' + (e.message || e));
          }
          return interaction.editReply({ content: parts.join(' · ') });
        } catch (e) {
          return interaction.editReply({ content: 'Fehler: ' + (e.message || e) }).catch(() => {});
        }
      }



      
      
      if (interaction.isChatInputCommand() && interaction.commandName === 'giveaway') {
        await ack(interaction, true);
        try {
          const gw = require('./services/giveaways');
          const sub = interaction.options.getSubcommand();
          if (sub === 'start') {
            await gw.start(interaction, {
              prize: interaction.options.getString('preis', true),
              winners: interaction.options.getInteger('gewinner'),
              duration: interaction.options.getString('dauer') || '1h',
              channel: interaction.options.getChannel('kanal')
            });
          } else if (sub === 'end') {
            const id = interaction.options.getString('id');
            const g = id ? gw.getGiveaway(id) : (gw.listActive(interaction.guildId)[0] || null);
            if (!g) return interaction.editReply({ content: 'Kein aktives Giveaway.' });
            await gw.endGiveaway(interaction.client, g, interaction.user.id);
            return interaction.editReply({ content: 'Giveaway beendet.' });
          } else if (sub === 'reroll') {
            await gw.reroll(interaction, interaction.options.getString('id'));
          }
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' }).catch(() => {});
        }
        return;
      }

      if (interaction.isChatInputCommand() && interaction.commandName === 'suggest') {
        await ack(interaction, true);
        try {
          const sug = require('./services/suggestions');
          await sug.createSuggestion(interaction.client, interaction, {
            title: interaction.options.getString('titel', true),
            body: interaction.options.getString('vorschlag', true),
            categoryId: interaction.options.getString('kategorie', true)
          });
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' }).catch(() => {});
        }
        return;
      }

      if (interaction.isChatInputCommand() && interaction.commandName === 'fraktion') {
        await ack(interaction, true);
        try {
          const factions = require('./services/factions');
          const { stafforaEmbed, DIVIDER, STAFFORA_COLOR } = require('./utils/branding');
          const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
          const sub = interaction.options.getSubcommand();

          function factionSelectRow(customId, list) {
            return new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(customId)
                .setPlaceholder('Fraktion wählen…')
                .addOptions(
                  list.slice(0, 25).map((f) => ({
                    label: String(f.name).slice(0, 100),
                    value: String(f.id).slice(0, 100),
                    description: String(
                      (f.category === 'illegal' ? 'Illegal' : 'Legal') +
                        (f.owner ? ' · ' + f.owner : '') +
                        (f.status && f.status !== 'active' ? ' · ' + f.status : '')
                    ).slice(0, 100)
                  }))
                )
            );
          }

          if (sub === 'add') {
            const name = interaction.options.getString('name', true);
            const kategorie = interaction.options.getString('kategorie', true);
            const announcement = interaction.options.getChannel('announcement', true);
            const row = factions.addFaction(
              interaction.guildId,
              {
                name,
                category: kategorie,
                announcementChannelId: announcement.id,
                discordLink: interaction.options.getString('dc_link'),
                description: interaction.options.getString('beschreibung'),
                owner: interaction.options.getString('owner')
              },
              interaction.user.id
            );
            const emb = stafforaEmbed(EmbedBuilder, {
              title: 'Neue Fraktion',
              description:
                `**${row.name}** (${row.category})
${row.description || ''}
` +
                (row.discordLink ? `Discord: ${row.discordLink}
` : '') +
                (row.owner ? `Owner: ${row.owner}` : ''),
              footerSuffix: 'Fraktion'
            });
            await factions.announce(interaction.client, interaction.guildId, announcement.id, { embeds: [emb] });
            return interaction.editReply({ content: `Fraktion **${row.name}** hinzugefügt.` });
          }

          if (sub === 'list') {
            const list = factions.listFactions(interaction.guildId).filter((f) => f.status !== 'removed');
            if (!list.length) {
              return interaction.editReply({ content: 'Keine Fraktionen eingetragen. Nutze `/fraktion add`.' });
            }
            const fields = list.slice(0, 25).map((f, i) => {
              const warns = typeof factions.orgWarnCount === 'function' ? factions.orgWarnCount(interaction.guildId, f.id) : 0;
              const max = typeof factions.maxOrgWarns === 'function' ? factions.maxOrgWarns(interaction.guildId) : 3;
              return {
                name: `${i + 1}. ${f.name}`,
                value:
                  `Kategorie: **${f.category === 'illegal' ? 'Illegal' : 'Legal'}**
` +
                  (f.owner ? `Owner: ${f.owner}
` : '') +
                  (f.discordLink ? `Link: ${f.discordLink}
` : '') +
                  `Warns: **${warns}/${max}**
` +
                  (f.announcementChannelId ? `Announce: <#${f.announcementChannelId}>` : 'Announce: —'),
                inline: true
              };
            });
            const emb = stafforaEmbed(EmbedBuilder, {
              title: `Fraktionen (${list.length})`,
              description: 'Alle per `/fraktion add` hinzugefügten Fraktionen.',
              fields,
              footerSuffix: 'Fraktion'
            });
            return interaction.editReply({ embeds: [emb] });
          }

          if (sub === 'warn' || sub === 'remove') {
            const grund = interaction.options.getString('grund', true);
            const list = factions.listFactions(interaction.guildId).filter((f) => !f.status || f.status === 'active');
            if (!list.length) {
              return interaction.editReply({ content: 'Keine Fraktionen vorhanden. Zuerst `/fraktion add`.' });
            }
            pendingFactionActions.set(interaction.user.id, {
              action: sub,
              grund,
              guildId: interaction.guildId,
              at: Date.now()
            });
            const emb = stafforaEmbed(EmbedBuilder, {
              title: sub === 'warn' ? 'Fraktion verwarnen' : 'Fraktion entfernen',
              description:
                `Grund: **${grund}**

Wähle die Fraktion im Dropdown.
` +
                (sub === 'remove' ? 'Beim Entfernen wird sie aus der Liste gelöscht.' : 'Warnung zählt bis zum konfigurierten Maximum.'),
              footerSuffix: 'Fraktion'
            });
            return interaction.editReply({
              embeds: [emb],
              components: [factionSelectRow(sub === 'warn' ? 'fraktion_select_warn' : 'fraktion_select_remove', list)]
            });
          }

          return interaction.editReply({ content: 'Unbekannte Unterfunktion.' });
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' }).catch(() => {});
        }
      }


      
      if (interaction.isChatInputCommand() && interaction.commandName === 'team') {
        await ack(interaction, true);
        try {
          const team = require('./services/team');
          const sub = interaction.options.getSubcommand();
          const user = interaction.options.getUser('user');
          const grund = interaction.options.getString('grund') || '—';
          const { settings } = getGuild(interaction.guildId);
          const client = interaction.client;
          const gid = interaction.guildId;

          if (sub === 'lookup') {
            const warns = (typeof team.listWarns === 'function') ? team.listWarns(gid, user.id) : [];
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const roles = member
              ? member.roles.cache.filter((r) => r.id !== interaction.guild.id).map((r) => r.toString()).slice(0, 20).join(' ')
              : '—';
            let roblox = '—';
            try {
              const robloxSvc = require('./services/roblox');
              const L =
                (robloxSvc.getLink && robloxSvc.getLink(gid, user.id)) ||
                (robloxSvc.findLinkByDiscord && robloxSvc.findLinkByDiscord(gid, user.id));
              if (L) roblox = L.roblox_username || L.roblox_name || L.username || '—';
            } catch (_) {}
            const emb = new EmbedBuilder()
              .setColor(0x8b5cf6)
              .setTitle('🔍 Team Lookup')
              .addFields(
                { name: 'User', value: `${user}`, inline: true },
                { name: 'Roblox', value: String(roblox), inline: true },
                { name: 'Aktive Warns', value: String(warns.length) + (warns.some(w=>w.temp)?' (inkl. Temp)':''), inline: true },
                { name: 'Warn-Details', value: warns.length ? warns.slice(0,5).map(w => (w.temp?'⏳ ':'• ') + (w.reason||'—').slice(0,40) + (w.expires_at?` <t:${Math.floor(w.expires_at/1000)}:R>`:'')).join('\n') : 'Keine', inline: false },
                { name: 'Rollen', value: roles || '—', inline: false }
              )
              .setFooter({ text: 'Staffora · Team' })
              .setTimestamp();
            return interaction.editReply({ embeds: [emb] });
          }

          if (sub === 'kick') {
            if (typeof team.kick === 'function') {
              await team.kick(gid, user.id, grund, interaction.user.id, interaction.guild);
            } else {
              const member = await interaction.guild.members.fetch(user.id).catch(() => null);
              const staffRoles = [].concat(settings.staffRoleIds || [], settings.teamRoleIds || []);
              if (member) {
                for (const rid of staffRoles) await member.roles.remove(rid, 'Team kick: ' + grund).catch(() => {});
              }
            }
            try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
            const emb = await sendTeamActionEmbed(client, gid, {
              action: 'kick',
              target: `${user}`,
              actor: `${interaction.user}`,
              reason: grund,
              description: 'Mitglied wurde aus dem Team entfernt.'
            });
            return interaction.editReply({ content: null, embeds: [emb] });
          }

          if (sub === 'warn') {
            const dauer = interaction.options.getString('dauer');
            let result = { count: 1, max: settings.teamMaxWarns || settings.teamWarnKickAt || 3, kicked: false, temp: false, durationLabel: 'Permanent' };
            if (typeof team.warn === 'function') {
              result = team.warn(gid, user.id, grund, interaction.user.id, dauer);
            } else {
              const { addLog } = require('./db/database');
              addLog({ guildId: gid, module: 'team', action: 'warn', actorId: interaction.user.id, targetId: user.id, reason: grund });
            }
            const maxW = result.max || settings.teamWarnKickAt || settings.teamMaxWarns || 3;
            const durLine = result.temp
              ? `Temp-Warn · ${result.durationLabel}` + (result.expires_at ? ` · endet <t:${Math.floor(result.expires_at/1000)}:R>` : '')
              : 'Permanent';
            const emb = await sendTeamActionEmbed(client, gid, {
              action: 'warn',
              target: `${user}`,
              actor: `${interaction.user}`,
              reason: grund,
              warns: `${result.count}/${maxW}`,
              extra: durLine,
              description: result.temp ? 'Temporäre Team-Verwarnung.' : 'Team-Verwarnung ausgesprochen.'
            });
            if (result.kicked || result.count >= maxW) {
              if (typeof team.kick === 'function') {
                await team.kick(gid, user.id, 'Auto-Kick: max. Team-Warns', interaction.user.id, interaction.guild);
              }
              const emb2 = await sendTeamActionEmbed(client, gid, {
                action: 'auto_kick',
                target: `${user}`,
                actor: `${interaction.user}`,
                reason: `Auto-Kick nach ${result.count}/${maxW} Warns`,
                description: 'Maximale Team-Warns erreicht — Kick ausgeführt.'
              });
              try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
              return interaction.editReply({ embeds: [emb, emb2] });
            }
            return interaction.editReply({ embeds: [emb] });
          }

          if (sub === 'invite') {
            const rang = interaction.options.getString('rang');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) return interaction.editReply({ content: 'Member nicht gefunden.' });
            const career = settings.rankCareer || [];
            let hit = career.find(
              (r) =>
                String(r.key || '').toLowerCase() === String(rang || '').toLowerCase() ||
                String(r.name || '').toLowerCase() === String(rang || '').toLowerCase()
            );
            let roleId = hit && hit.roleId;
            if (!roleId && (settings.staffRoleIds || [])[0]) roleId = settings.staffRoleIds[0];
            if (roleId) await member.roles.add(roleId, 'Team invite: ' + grund).catch(() => {});
            try { await require('./services/autoNick').applyNickname(member, settings); } catch (_) {}
            try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
            const emb = await sendTeamActionEmbed(client, gid, {
              action: 'invite',
              target: `${user}`,
              actor: `${interaction.user}`,
              rank: (hit && (hit.name || hit.key)) || rang || 'Staff',
              reason: grund,
              description: 'Willkommen im Team!'
            });
            return interaction.editReply({ embeds: [emb] });
          }

          if (sub === 'promote' || sub === 'demote') {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) return interaction.editReply({ content: 'Member nicht gefunden.' });
            const career = (settings.rankCareer || []).slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
            if (!career.length) return interaction.editReply({ content: 'Keine Ranglaufbahn konfiguriert.' });
            const idx = career.findIndex((r) => r.roleId && member.roles.cache.has(String(r.roleId)));
            let next;
            if (sub === 'promote') {
              next = career[Math.min(career.length - 1, (idx < 0 ? 0 : idx + 1))];
            } else {
              next = career[Math.max(0, (idx < 0 ? 0 : idx - 1))];
            }
            if (idx >= 0 && career[idx].roleId) await member.roles.remove(career[idx].roleId, sub).catch(() => {});
            if (next && next.roleId) await member.roles.add(next.roleId, sub).catch(() => {});
            try { await require('./services/autoNick').applyNickname(member, settings); } catch (_) {}
            try { await require('./services/teamlist').publishTeamlist(client, gid); } catch (_) {}
            const emb = await sendTeamActionEmbed(client, gid, {
              action: sub === 'promote' ? 'promote' : 'demote',
              target: `${user}`,
              actor: `${interaction.user}`,
              rank: (next && (next.name || next.key)) || '—',
              reason: grund,
              description: sub === 'promote' ? 'Beförderung im Team.' : 'Herabstufung im Team.'
            });
            return interaction.editReply({ embeds: [emb] });
          }

          return interaction.editReply({ content: 'Unbekannte Unterfunktion.' });
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' }).catch(() => {});
        }
        return;
      }
if (interaction.isChatInputCommand() && interaction.commandName === 'haus') {
        await ack(interaction, true);
        try {
          const hausliste = require('./services/hausliste');
          const sub = interaction.options.getSubcommand();
          if (sub === 'add') {
            const name = interaction.options.getString('name', true);
            const price = interaction.options.getString('preis') || '';
            const owner = interaction.options.getString('owner') || '';
            if (typeof hausliste.add === 'function') {
              hausliste.add(interaction.guildId, { name, price, owner });
            } else if (typeof hausliste.create === 'function') {
              hausliste.create(interaction.guildId, { name, price, owner });
            } else {
              const { getGuild, saveGuild } = require('./db/database');
              const g = getGuild(interaction.guildId);
              const list = Array.isArray(g.settings.hausliste) ? g.settings.hausliste.slice() : [];
              list.push({ id: 'h_' + Date.now(), name, price, owner, status: 'frei' });
              saveGuild(interaction.guildId, { settings: { hausliste: list } });
            }
            return interaction.editReply({ content: `Haus **${name}** hinzugefügt.` });
          }
        } catch (e) {
          return interaction.editReply({ content: e.message || 'Fehler' }).catch(() => {});
        }
        return;
      }
      // Unhandled slash command — always acknowledge
      return say(interaction, {
        content: 'Befehl nicht implementiert oder Modul deaktiviert.',
        ephemeral: true
      }).catch(() => {});

    
      
      
      
    } catch (e) {
      console.error('[interaction]', e);
      const msg = 'Fehler: ' + (e.message || e);
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: msg }).catch(() => {});
        } else if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
        }
      } catch (_) {}
    }
  });

  return client;
}

module.exports = { createClient };
