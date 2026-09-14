/**
 * Staffora Security (Anti-Nuke) + structured Logging
 * Module "security" default OFF.
 *
 * Logging:
 *  - security.mainLogChannelId  → fallback for every security event
 *  - security.actionLogs[actionKey] → optional override channel per action
 *  - If action log missing → main log; if main missing → settings.logChannelId
 */
const {
  AuditLogEvent,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType
} = require('discord.js');
const db = require('../db/database');

const ACTION_DEFS = {
  botAdd: { label: 'Bot hinzufügen', audit: AuditLogEvent.BotAdd, color: 0xef4444 },
  webhookCreate: { label: 'Webhook erstellen', audit: AuditLogEvent.WebhookCreate, color: 0xf59e0b },
  webhookUpdate: { label: 'Webhook bearbeiten', audit: AuditLogEvent.WebhookUpdate, color: 0xf59e0b },
  webhookDelete: { label: 'Webhook löschen', audit: AuditLogEvent.WebhookDelete, color: 0xf59e0b },
  integrationCreate: { label: 'Integration hinzufügen', audit: AuditLogEvent.IntegrationCreate, color: 0xf59e0b },
  integrationUpdate: { label: 'Integration bearbeiten', audit: AuditLogEvent.IntegrationUpdate, color: 0xf59e0b },
  integrationDelete: { label: 'Integration entfernen', audit: AuditLogEvent.IntegrationDelete, color: 0xf59e0b },
  channelCreate: { label: 'Kanal erstellen', audit: AuditLogEvent.ChannelCreate, color: 0x3b82f6 },
  channelDelete: { label: 'Kanal löschen', audit: AuditLogEvent.ChannelDelete, color: 0xef4444 },
  channelUpdate: { label: 'Kanal bearbeiten', audit: AuditLogEvent.ChannelUpdate, color: 0x3b82f6 },
  roleCreate: { label: 'Rolle erstellen', audit: AuditLogEvent.RoleCreate, color: 0x8b5cf6 },
  roleDelete: { label: 'Rolle löschen', audit: AuditLogEvent.RoleDelete, color: 0xef4444 },
  roleUpdate: { label: 'Rolle bearbeiten', audit: AuditLogEvent.RoleUpdate, color: 0x8b5cf6 },
  memberBan: { label: 'Member bannen', audit: AuditLogEvent.MemberBanAdd, color: 0xef4444 },
  memberKick: { label: 'Member kicken', audit: AuditLogEvent.MemberKick, color: 0xf97316 },
  memberRoleUpdate: { label: 'Member-Rollen ändern', audit: AuditLogEvent.MemberRoleUpdate, color: 0x8b5cf6 },
  guildUpdate: { label: 'Server bearbeiten', audit: AuditLogEvent.GuildUpdate, color: 0xef4444 },
  emojiCreate: { label: 'Emoji erstellen', audit: AuditLogEvent.EmojiCreate, color: 0x22c55e },
  emojiDelete: { label: 'Emoji löschen', audit: AuditLogEvent.EmojiDelete, color: 0xef4444 },
  stickerCreate: { label: 'Sticker erstellen', audit: AuditLogEvent.StickerCreate, color: 0x22c55e },
  stickerDelete: { label: 'Sticker löschen', audit: AuditLogEvent.StickerDelete, color: 0xef4444 },
  messageDelete: { label: 'Nachricht löschen', audit: AuditLogEvent.MessageDelete, color: 0x64748b },
  messageBulkDelete: { label: 'Nachrichten bulk löschen', audit: AuditLogEvent.MessageBulkDelete, color: 0xef4444 }
};

/** @type {Map<string, number[]>} */
const buckets = new Map();

function defaultSecuritySettings() {
  const actions = {};
  for (const key of Object.keys(ACTION_DEFS)) {
    const tight = ['channelDelete', 'roleDelete', 'botAdd', 'messageBulkDelete'].includes(key);
    actions[key] = {
      enabled: true,
      limit: tight ? 2 : key === 'messageDelete' ? 8 : 3,
      windowSec: key === 'messageDelete' ? 15 : 20,
      punish: key === 'messageDelete' ? 'timeout' : 'ban'
    };
  }
  return {
    mainLogChannelId: null, // alles hierhin, wenn kein Extra-Log
    actionLogs: {}, // { [actionKey]: channelId }
    whitelistRoleIds: [],
    whitelistUserIds: [],
    whitelistBotIds: [],
    quarantineRoleId: null,
    timeoutSeconds: 600,
    logPunishments: true,
    logWarnings: true,
    logAllActions: true, // auch unter Limit loggen
    actions
  };
}

function getCfg(guildId) {
  const g = db.getGuild(guildId);
  if (!g.modules || g.modules.security !== true) return null;
  const s = g.settings || {};
  const base = defaultSecuritySettings();
  const sec = s.security && typeof s.security === 'object' ? s.security : {};
  const merged = {
    ...base,
    ...sec,
    actions: { ...base.actions },
    actionLogs: { ...(sec.actionLogs || {}) }
  };
  // legacy field
  if (!merged.mainLogChannelId && (sec.logChannelId || s.logChannelId)) {
    merged.mainLogChannelId = sec.logChannelId || s.logChannelId || null;
  }
  if (sec.actions && typeof sec.actions === 'object') {
    for (const [k, v] of Object.entries(sec.actions)) {
      if (!merged.actions[k]) merged.actions[k] = { enabled: true, limit: 3, windowSec: 20, punish: 'ban' };
      merged.actions[k] = { ...merged.actions[k], ...v };
    }
  }
  return merged;
}

/** Resolve log channel: action-specific → main security → guild logChannelId */
function resolveLogChannelId(guildId, cfg, actionKey) {
  if (cfg?.actionLogs && cfg.actionLogs[actionKey]) return cfg.actionLogs[actionKey];
  if (cfg?.mainLogChannelId) return cfg.mainLogChannelId;
  if (cfg?.logChannelId) return cfg.logChannelId;
  try {
    const s = db.getGuild(guildId).settings || {};
    return s.securityLogChannelId || s.modLogChannelId || s.logChannelId || null;
  } catch {
    return null;
  }
}

function isWhitelisted(cfg, member, userId) {
  if (!cfg) return true;
  const uid = String(userId);
  if ((cfg.whitelistUserIds || []).map(String).includes(uid)) return true;
  if ((cfg.whitelistBotIds || []).map(String).includes(uid)) return true;
  if (member?.guild?.ownerId && String(member.guild.ownerId) === uid) return true;
  if (member && Array.isArray(cfg.whitelistRoleIds) && cfg.whitelistRoleIds.length) {
    const ids = new Set(cfg.whitelistRoleIds.map(String));
    if (member.roles?.cache?.some((r) => ids.has(r.id))) return true;
  }
  return false;
}

function pushHit(guildId, userId, action, windowSec) {
  const key = `${guildId}:${userId}:${action}`;
  const now = Date.now();
  const windowMs = Math.max(5, Number(windowSec) || 20) * 1000;
  let arr = buckets.get(key) || [];
  arr = arr.filter((t) => now - t < windowMs);
  arr.push(now);
  buckets.set(key, arr);
  return arr.length;
}

async function findExecutor(guild, auditType, targetId) {
  try {
    if (!guild.members.me?.permissions?.has(PermissionFlagsBits.ViewAuditLog)) return null;
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 8 });
    const entry =
      logs.entries.find((e) => {
        if (Date.now() - e.createdTimestamp > 20000) return false;
        if (targetId && e.target?.id && String(e.target.id) !== String(targetId)) return false;
        return true;
      }) || logs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 20000) return null;
    return { executor: entry.executor || null, entry };
  } catch {
    return null;
  }
}

async function sendLog(guild, cfg, actionKey, { title, lines, color, extra }) {
  const chId = resolveLogChannelId(guild.id, cfg, actionKey);
  if (!chId) return;
  try {
    const ch = await guild.channels.fetch(chId).catch(() => null);
    if (!ch || !ch.isTextBased?.()) return;
    const def = ACTION_DEFS[actionKey] || {};
    const embed = new EmbedBuilder()
      .setColor(color ?? def.color ?? 0x8b5cf6)
      .setTitle(title)
      .setDescription(lines.filter(Boolean).join('\n'))
      .setFooter({ text: 'Staffora Security' })
      .setTimestamp(new Date());
    if (extra?.fields) {
      for (const f of extra.fields) embed.addFields(f);
    }
    await ch.send({ embeds: [embed] });
  } catch (e) {
    console.warn('[security] log failed', e.message);
  }
}

async function punish(guild, executor, cfg, actionKey, count) {
  const act = cfg.actions[actionKey] || {};
  const punish = act.punish || 'ban';
  const reason = `Staffora Security: ${ACTION_DEFS[actionKey]?.label || actionKey} (${count}x)`;
  let member = null;
  try {
    member = await guild.members.fetch(executor.id).catch(() => null);
  } catch (_) {}

  if (isWhitelisted(cfg, member, executor.id)) return { skipped: true, reason: 'whitelist' };

  try {
    if (punish === 'none') {
      // log only
    } else if (punish === 'timeout' && member?.moderatable) {
      await member.timeout(Math.max(60, Number(cfg.timeoutSeconds) || 600) * 1000, reason);
    } else if (punish === 'kick' && member?.kickable) {
      await member.kick(reason);
    } else if (punish === 'strip' && member?.manageable) {
      if (cfg.quarantineRoleId) {
        await member.roles.set([cfg.quarantineRoleId].filter(Boolean), reason).catch(() => {});
      } else {
        const removable = member.roles.cache.filter((r) => r.id !== guild.id && r.editable);
        await member.roles.remove(removable, reason).catch(() => {});
      }
    } else if (punish === 'ban') {
      if (member?.bannable) await member.ban({ reason, deleteMessageSeconds: 0 });
      else await guild.members.ban(executor.id, { reason, deleteMessageSeconds: 0 }).catch(() => {});
    }
  } catch (e) {
    console.warn('[security] punish failed', e.message);
  }

  if (cfg.logPunishments !== false) {
    await sendLog(guild, cfg, actionKey, {
      title: '⛔ Security – Strafe',
      color: 0xef4444,
      lines: [
        `**Aktion:** ${ACTION_DEFS[actionKey]?.label || actionKey}`,
        `**Executor:** ${executor.tag || executor.username} (\`${executor.id}\`)`,
        `**Treffer:** ${count}/${act.limit || '?'} in ${act.windowSec || 20}s`,
        `**Strafe:** \`${punish}\``
      ]
    });
  }
  return { ok: true, punish };
}

async function handleAction(guild, actionKey, targetId, meta = {}) {
  if (!guild) return;
  const cfg = getCfg(guild.id);
  if (!cfg) return;
  const act = cfg.actions[actionKey];
  if (!act || act.enabled === false) return;

  const def = ACTION_DEFS[actionKey];
  if (!def) return;

  const found = await findExecutor(guild, def.audit, targetId);
  const executor = found?.executor;
  if (!executor) {
    // still log message deletes without audit if content known
    if (actionKey === 'messageDelete' && cfg.logAllActions !== false && meta.content != null) {
      await sendLog(guild, cfg, actionKey, {
        title: '🗑️ Nachricht gelöscht',
        lines: [
          `**Kanal:** ${meta.channelName || meta.channelId || '—'}`,
          meta.authorTag ? `**Autor:** ${meta.authorTag} (\`${meta.authorId}\`)` : null,
          meta.content ? `**Inhalt:** ${String(meta.content).slice(0, 800)}` : '*(kein Cache)*'
        ]
      });
    }
    return;
  }
  if (executor.id === guild.client.user.id) return;

  let member = null;
  try {
    member = await guild.members.fetch(executor.id).catch(() => null);
  } catch (_) {}
  if (isWhitelisted(cfg, member, executor.id)) return;

  const count = pushHit(guild.id, executor.id, actionKey, act.windowSec);
  const limit = Math.max(1, Number(act.limit) || 3);

  if (cfg.logAllActions !== false || count >= limit) {
    const lines = [
      `**Aktion:** ${def.label}`,
      `**Executor:** ${executor.tag || executor.username} (\`${executor.id}\`)`,
      `**Stand:** ${count}/${limit} in ${act.windowSec || 20}s`
    ];
    if (meta.channelName) lines.push(`**Kanal:** ${meta.channelName}`);
    if (meta.targetName) lines.push(`**Ziel:** ${meta.targetName}`);
    if (meta.content) lines.push(`**Inhalt:** ${String(meta.content).slice(0, 600)}`);
    if (meta.authorTag) lines.push(`**Msg-Autor:** ${meta.authorTag}`);
    await sendLog(guild, cfg, actionKey, {
      title: count >= limit ? '⚠️ Security – Limit erreicht' : `📝 ${def.label}`,
      color: count >= limit ? 0xf59e0b : def.color,
      lines
    });
  }

  if (count < limit) return;
  await punish(guild, executor, cfg, actionKey, count);
  buckets.set(`${guild.id}:${executor.id}:${actionKey}`, []);
}

function register(client) {
  client.on('guildMemberAdd', async (member) => {
    if (!member.user?.bot) return;
    try {
      await handleAction(member.guild, 'botAdd', member.id, {
        targetName: `${member.user.tag} (\`${member.id}\`)`
      });
    } catch (e) {
      console.warn('[security] botAdd', e.message);
    }
  });

  client.on('channelCreate', (ch) => {
    if (!ch.guild) return;
    handleAction(ch.guild, 'channelCreate', ch.id, { targetName: `#${ch.name}` }).catch(() => {});
  });
  client.on('channelDelete', (ch) => {
    if (!ch.guild) return;
    handleAction(ch.guild, 'channelDelete', ch.id, { targetName: `#${ch.name || ch.id}` }).catch(() => {});
  });
  client.on('channelUpdate', (oldCh, newCh) => {
    if (!newCh.guild) return;
    handleAction(newCh.guild, 'channelUpdate', newCh.id, {
      targetName: `#${newCh.name}`,
      content: oldCh.name !== newCh.name ? `Name: ${oldCh.name} → ${newCh.name}` : null
    }).catch(() => {});
  });

  client.on('roleCreate', (role) =>
    handleAction(role.guild, 'roleCreate', role.id, { targetName: role.name }).catch(() => {})
  );
  client.on('roleDelete', (role) =>
    handleAction(role.guild, 'roleDelete', role.id, { targetName: role.name }).catch(() => {})
  );
  client.on('roleUpdate', (o, n) =>
    handleAction(n.guild, 'roleUpdate', n.id, {
      targetName: n.name,
      content: o.name !== n.name ? `Name: ${o.name} → ${n.name}` : null
    }).catch(() => {})
  );

  client.on('guildBanAdd', (ban) =>
    handleAction(ban.guild, 'memberBan', ban.user?.id, {
      targetName: ban.user ? `${ban.user.tag} (\`${ban.user.id}\`)` : null
    }).catch(() => {})
  );
  client.on('guildMemberRemove', async (member) => {
    try {
      await handleAction(member.guild, 'memberKick', member.id, {
        targetName: `${member.user?.tag || member.id}`
      });
    } catch (_) {}
  });

  client.on('guildUpdate', (o, n) =>
    handleAction(n, 'guildUpdate', n.id, {
      content: o.name !== n.name ? `Name: ${o.name} → ${n.name}` : 'Server-Einstellungen geändert'
    }).catch(() => {})
  );

  client.on('webhooksUpdate', (channel) => {
    if (!channel.guild) return;
    handleAction(channel.guild, 'webhookCreate', channel.id, {
      channelName: `#${channel.name}`,
      targetName: channel.name
    }).catch(() => {});
  });

  client.on('guildIntegrationsUpdate', (guild) => {
    handleAction(guild, 'integrationCreate', guild.id).catch(() => {});
  });

  client.on('emojiCreate', (e) => e.guild && handleAction(e.guild, 'emojiCreate', e.id, { targetName: e.name }).catch(() => {}));
  client.on('emojiDelete', (e) => e.guild && handleAction(e.guild, 'emojiDelete', e.id, { targetName: e.name }).catch(() => {}));
  client.on('stickerCreate', (s) => s.guild && handleAction(s.guild, 'stickerCreate', s.id, { targetName: s.name }).catch(() => {}));
  client.on('stickerDelete', (s) => s.guild && handleAction(s.guild, 'stickerDelete', s.id, { targetName: s.name }).catch(() => {}));

  // Messages
  client.on('messageDelete', async (message) => {
    try {
      if (!message.guild) return;
      const meta = {
        channelId: message.channel?.id,
        channelName: message.channel?.name ? `#${message.channel.name}` : message.channelId,
        content: message.content || (message.attachments?.size ? `[Anhänge: ${message.attachments.size}]` : null),
        authorTag: message.author ? `${message.author.tag}` : null,
        authorId: message.author?.id
      };
      await handleAction(message.guild, 'messageDelete', message.id, meta);
    } catch (e) {
      console.warn('[security] messageDelete', e.message);
    }
  });

  client.on('messageDeleteBulk', async (messages, channel) => {
    try {
      const guild = channel?.guild || messages.first()?.guild;
      if (!guild) return;
      await handleAction(guild, 'messageBulkDelete', channel?.id, {
        channelName: channel?.name ? `#${channel.name}` : channel?.id,
        content: `${messages.size} Nachrichten gelöscht`
      });
    } catch (e) {
      console.warn('[security] messageBulkDelete', e.message);
    }
  });

  console.log('[security] listeners + logging registered (module default OFF)');
}

module.exports = {
  register,
  getCfg,
  defaultSecuritySettings,
  ACTION_DEFS,
  resolveLogChannelId
};
