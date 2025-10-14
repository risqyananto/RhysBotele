const { Telegraf } = require("telegraf");
const fs = require("fs");
const os = require("os");
const si = require("systeminformation");
const ping = require("ping");
const func = require('./function')
const msgHandler = require('./message')
const bot = new Telegraf("7783365165:AAH3ASxL-stQ_0I33JaRX6mR9KlGSGxlIIM");
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const members = JSON.parse(fs.readFileSync('./members.json', 'utf-8'));
const admins = JSON.parse(fs.readFileSync('./admins.json', 'utf-8'));
const cooldownTop = new Map();
const cooldownMy = new Map();
const coolDownDaily = new Map();
const { generateLeaderboard, isAdmin, getTodayDate, loadQuests, saveQuests, getUserQuest, resetDailyIfNeeded, completeDailyQuest, getDailyQuestStatus, addReferral, getReferralStats, getServerStatus, isMember,getLeader,  addRhystal, useRhystal, cekMember, addAdmin, addMember, hasBalance, getAdminList, getMember, updateRhystal } = require('./function')
// Fungsi ambil data member
function loadMembers() {
  if (!fs.existsSync("members.json")) {
    fs.writeFileSync("members.json", JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync("members.json"));
}

// Fungsi simpan data member
function saveMembers(members) {
  fs.writeFileSync("members.json", JSON.stringify(members, null, 2));
}

// Fungsi cek member
function isRegistered(userId) {
  const members = loadMembers();
  return members.some(m => m.id === userId);
}
bot.use((ctx, next) => {
      // Log Utama
    if (ctx.message?.text) {
        console.log(`User ${ctx.from.id || ctx.from.id} mengirim: ${ctx.message.text}`);
    }
      return next();
})
// Command /start
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(" "); // bisa: ['/start', '123456789']

  let referrerId = null;
  if (args.length > 1 && !isNaN(args[1])) {
    referrerId = parseInt(args[1]); // ID orang yang ngundang
  }

  const isAdmin = await func.isAdmin(userId);
  const isMember = await func.isMember(userId);

  // === Referral Handler ===
  if (referrerId && referrerId !== userId) {
    try {
      const success = addReferral(referrerId, userId);
      if (success) {
        ctx.telegram.sendMessage(
          referrerId,
          `🎉 <b>Bonus Referral!</b>\nSeseorang baru bergabung lewat link kamu!\n\nKamu dapat 💎 200 Rhystal.`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (err) {
      console.error('Gagal menambahkan referral:', err);
    }
  }

  // === Cek registrasi ===
  if (!isMember && !isAdmin) {
    return ctx.reply('⚠️ Anda belum terdaftar. Silakan daftar dengan mengetik perintah /register');
  }

  // === Menu ===
  if (isAdmin) {
    await msgHandler.menuAdmin(ctx);
  } else {
    await msgHandler.menuMember(ctx);
  }
});

bot.command('help', async (ctx) => {
  const userId = ctx.from.id;
  const isAdmin = await func.isAdmin(userId);
  const isMember = await func.isMember(userId);
  if (isAdmin) {
        await msgHandler.menuAdmin(ctx);
    } else {
        await msgHandler.menuMember(ctx);
    }
})
// Command /register
bot.command("register", async (ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.first_name;
  const username = ctx.from.username || "noname";

  // Cek apakah sudah jadi member
  const memberCheck = await isMember(userId);
  if (memberCheck) {
    return ctx.reply("❌ Kamu sudah terdaftar sebagai member!");
  }

  // Panggil fungsi addMember dari function.js
  const success = await addMember(ctx, userId, name, username, "member");
  if (success) {
    console.log(`🟢 Member baru terdaftar: ${username} (${userId})`);
  }
});

// Command handler pake switch-case
bot.on('text', async (ctx) => {
    const msg = ctx.message.text;
    const args = msg.split(" ").slice(1); // ["teks1", "teks2"]
    const userId = ctx.from.id;
    const isAdmin = await func.isAdmin(userId);
    const isMember = await func.isMember(userId);
  
    if(!isMember && !isAdmin){return ctx.reply('⚠️ Anda belum terdaftar. Silakan daftar dengan mengetik perintah /register');}
    // pastikan command diawali dengan /
    if (!msg.startsWith('/')) return;

    const command = msg.split(' ')[0].toLowerCase(); // ambil command aja

    switch (command) {
        case '/ping':
        case '/status':
        case '/server': {
          try {
            const status = await getServerStatus();
            await ctx.reply(status, { parse_mode: "HTML" });
          } catch (err) {
            console.error("Gagal ambil status:", err);
            ctx.reply("❌ Gagal mengambil status server.");
          }
          break;
        }
        
        case '/my': {
          const now = Date.now();

            if (cooldownMy.has(userId)) {
                const lastUsed = cooldownMy.get(userId);
                const diff = (now - lastUsed) / 1000; // detik
                if (diff < 30) {
                    const remaining = (30 - diff).toFixed(1);
                    return ctx.reply(`⏳ Tunggu ${remaining} detik sebelum pakai /top lagi.`);
                }
            }

            // Update cooldown
            cooldownMy.set(userId, now);

            // Kirim leaderboard
            const leaderboardMsg = func.getLeader(ctx);
            ctx.reply(leaderboardMsg, { parse_mode: "HTML" });
            break;
        }
        case '/top': {
            const now = Date.now();

            if (cooldownTop.has(userId)) {
                const lastUsed = cooldownTop.get(userId);
                const diff = (now - lastUsed) / 1000; // detik
                if (diff < 30) {
                    const remaining = (30 - diff).toFixed(1);
                    return ctx.reply(`⏳ Tunggu ${remaining} detik sebelum pakai /top lagi.`);
                }
            }

            // Update cooldown
            cooldownTop.set(userId, now);

            // Kirim leaderboard
            const leaderboardMsg = func.generateLeaderboard(ctx);
            ctx.reply(leaderboardMsg, { parse_mode: "HTML" });
        break;
          }
        case '/daily':
        case '/bonus': {
            const now = Date.now();
            if (coolDownDaily.has(userId)) {
              const lastUsed = coolDownDaily.get(userId);
              const diff = (now - lastUsed) / 1000;
              if(diff < 43200) {
                const remaining = (43200 - diff).toFixed(1);
                const hitJam = (remaining / 3600).toFixed(1); // 1 angka di belakang koma
                return ctx.reply(`⏳ Tunggu ${remaining} detik / ${hitJam} Jam sebelum pakai /top lagi.`)
              }
            }
            coolDownDaily.set(userId, now);
            const success = updateRhystal(userId, 50);
             if (success) {
              ctx.reply("🎁 Kamu sukses claim daily 50 💎 Rhystal!");
              } else {
              ctx.reply("❌ Kamu belum terdaftar, ketik /register dulu!");
              }
        break;
          }
        case '/give':
        case '/tf':   {
          const to = args[0];
          const amount = args[1];
          
          var tos = parseInt(to)
          const isMem = await func.isMember(tos)
          const isBal = hasBalance(userId, amount)
          
          if (!to || !amount) {
            return ctx.reply("Format salah!\nContoh: /give {id target} {amount rhystal}");
          }
          if (!isMem){
            return ctx.reply(`❌ ID: <b>${to}</b> tidak terdaftar didatabase kami!`, { parse_mode: "HTML" })
          }
          if (isBal === false) {
            return ctx.reply("❌ Saldo kamu tidak cukup untuk memberi Rhystal sebanyak itu!");
            }
          
          const getMem = getMember(tos);
          console.log(getMem)
          const getMe = getMember(userId);
          const getRhystal = parseInt(getMe.rhystal);
          const getRtal = parseInt(getMem.rhystal); // cukup ini
          await addRhystal(tos, parseInt(amount));
          const dataBaru = getMember(tos)
          ctx.telegram.sendMessage(tos, `📥 Kamu menerima <b>${amount.toLocaleString()}</b> 💎 Rhystal dari <b>${getMe.name}</b>.\n💎 Rhsyal kamu sekarang: <b>${dataBaru.rhystal.toLocaleString()}</b>`, { parse_mode: 'HTML'})
          const kurangSaldo = getRhystal - parseInt(amount);
          await useRhystal(userId, parseInt(amount));
          const meData = getMember(userId);
          const captionSender = `
          ✅ <b>Transfer Berhasil!</b>\n📤 Kamu telah mengirim <b>💎 ${amount.toLocaleString()} Rhystal</b> ke <b>${getMem.name}</b>.\n💰 Sisa saldo kamu sekarang: <b>${meData.rhystal.toLocaleString()}</b>💎\nTerima kasih sudah menggunakan sistem Rhystal Transfer ✨
          `;
          ctx.reply(captionSender, { parse_mode: "HTML" });
          break;
        }
        case '/quest': {
          const member = getMember(userId);
          if (!member) return ctx.reply('⚠️ Kamu belum terdaftar. Ketik /register dulu.');

          const status = getDailyQuestStatus(userId);
          const referStats = getReferralStats(userId);

          const msg = `
🎯 <b>Quest Center</b>\n
📅 <b>Daily Quest</b>\n
1️⃣ /quest_quiz - Jawab kuis harian
2️⃣ /quest_share - Share link\n
🏆 <b>Permanent Quest</b>
🔗 /referral - Cek kode referral kamu
${status}\n
${referStats}
        `;

          ctx.reply(msg, { parse_mode: 'HTML' });
          break;
        }
case '/quest_quiz': {
  const result = completeDailyQuest(userId, 'quiz');
  ctx.reply(result.msg, { parse_mode: 'HTML' });
  break;
}
case '/share': {
  const result = completeDailyQuest(userId, 'share');
  ctx.reply(result.msg, { parse_mode: 'HTML' });
  break;
}
case '/referral': {
  const member = getMember(userId);
  if (!member) return ctx.reply('❌ Kamu belum terdaftar, ketik /register dulu!');

  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${userId}`;
  const stats = getReferralStats(userId);

  const msg = `
👥 <b>Referral Quest</b>

🔗 Kode Referral kamu: <code>${userId}</code>
📩 Bagikan link ini: ${referralLink}

${stats}

💰 Bonus 200 💎 Rhystal tiap teman baru yang daftar via linkmu.
`;

  ctx.reply(msg, { parse_mode: 'HTML' });
  break;
}
case '/reffcheck': {
  const status = getDailyQuestStatus(userId);
  const referStats = getReferralStats(userId);

  ctx.reply(`
📋 <b>Status Quest</b>

${status}
${referStats}
`, { parse_mode: 'HTML' });
  break;
}

        case '/rhystal': 
        const member = getMember(ctx.from.id);
        if (!member) return ctx.reply('❌ Kamu belum terdaftar, ketik /register dulu ya!');

        const msg = `<b>💎| ${member.name}</b>, you currently have <b>${member.rhystal.toLocaleString()} Rhystal!</b>`;

        ctx.reply(msg, { parse_mode: 'HTML' });
        break;


        default:
            ctx.reply('❓ Command tidak dikenali.');
            break;
    }
});

bot.launch();
async function consoleServer() {
  const cpu = await si.currentLoad();
  const mem = await si.mem();
  const uptime = os.uptime();
  const pingRes = await ping.promise.probe("8.8.8.8", { timeout: 2 });

  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const pingMs = pingRes.time ? `${pingRes.time} ms` : "Offline";

  console.log(`
======================================
🤖 BOT STATUS
======================================
📛 Nama Bot   : ${pkg.name}
🆚 Versi      : ${pkg.version}
👨‍💻 Developer : ${pkg.author}

📊 Statistik:
   🔹 Total Commands : 7
   🔹 Total Members  : ${members.length}
   🔹 Total Admins   : 1

🖥️ Server Info:
   💠 CPU Usage  : ${cpu.currentLoad.toFixed(1)}%
   📈 Memory Used: ${((mem.active / mem.total) * 100).toFixed(1)}%
   🕒 Uptime     : ${hours}h ${minutes}m ${seconds}s
   🌐 Ping       : ${pingMs}
   ⚙️ CPU Cores  : ${os.cpus().length}
   💾 Total RAM  : ${(mem.total / 1024 / 1024 / 1024).toFixed(2)} GB
======================================
`);
}

// Jalankan pas bot nyala
(async () => {
  await consoleServer();
})();
