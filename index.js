const { Telegraf } = require("telegraf");
const fs = require("fs");
const os = require("os");
const path = require('path');
const axios = require('axios');
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
const { loadData, saveData, generateLeaderboard, isAdmin, getTodayDate, loadQuests, saveQuests, getUserQuest, resetDailyIfNeeded, completeDailyQuest, getDailyQuestStatus, addReferral, getReferralStats, getServerStatus, isMember,getLeader,  addRhystal, useRhystal, cekMember, addAdmin, addMember, hasBalance, getAdminList, getMember, updateRhystal } = require('./function')
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
   // === Cek registrasi ===
  if (!isMember && !isAdmin) {
    return ctx.reply('⚠️ Anda belum terdaftar. Silakan daftar dengan mengetik perintah /register');
  }

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
      case '/inventory': {
  try {
    const userId = ctx.from.id;
    const inventory = loadData('inventory.json');
    const userInv = inventory.find(u => u.userId === userId);

    // kalau belum pernah gacha
    if (!userInv || userInv.items.length === 0) {
      ctx.reply('📦 Kamu belum punya senjata apapun di inventory.\nCoba gacha dulu pakai /gacha 💎', { parse_mode: 'HTML' });
      break;
    }

    // urutkan item berdasarkan rarity
    const order = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon'];
    const sorted = [...userInv.items].sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));

    // format list item
    const listText = sorted
      .map((item, i) => {
        const rarityIcon = {
          Uncommon: '⚪',
          Rare: '🟦',
          Epic: '🟪',
          Legendary: '🟨',
          Mythic: '🔴'
        }[item.rarity] || '⚔️';
        return `${i + 1}. ${rarityIcon} <b>${item.name}</b> <i>(${item.rarity})</i>`;
      })
      .join('\n');

    // tampilkan ke user
    ctx.reply(
      `
<b>🎒 INVENTORY</b>
──────────────────
👤 <b>${ctx.from.first_name}</b>
📦 Total Item: <b>${userInv.items.length}</b>

${listText}
──────────────────
Gunakan /gacha untuk mendapatkan lebih banyak senjata!
`,
      { parse_mode: 'HTML' }
    );

  } catch (err) {
    console.error('❌ Gagal menampilkan inventory:', err);
    ctx.reply('❌ Terjadi kesalahan saat mengambil data inventory.');
  }
  break;
}
/*
      case '/gacha': {
  try {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    const gachaCost = 200;

    // Cek apakah user punya cukup Rhystal
    if (!hasBalance(userId, gachaCost)) {
      ctx.reply('💎 Rhystal kamu tidak cukup untuk melakukan gacha!');
      break;
    }

    // Load data
    const weapons = loadData('weapon.json');
    const members = loadData('members.json');
    const inventory = loadData('inventory.json');

    // Ambil data member
    const member = members.find(m => m.id.toString() === userId.toString());

    // Kurangi Rhystal
    member.rhystal -= gachaCost;
    saveData('members.json', members);

    // Fungsi ambil rarity (probabilitas)
    function getRarity() {
      const rand = Math.random() * 100;
      if (rand < 50) return 'Uncommon';
      if (rand < 90) return 'Rare';
      if (rand < 98) return 'Epic';
      if (rand < 99) return 'Legendary';
      return 'Mythic';
    }

    // Tentukan hasil gacha
    const rarity = getRarity();
    const pool = weapons[rarity];
    const weapon = pool[Math.floor(Math.random() * pool.length)];

    // Simpan ke inventory
    let userInv = inventory.find(u => u.userId === userId);
    if (!userInv) {
      userInv = { userId, items: [] };
      inventory.push(userInv);
    }

    userInv.items.push({
      name: weapon,
      rarity,
      timestamp: new Date().toISOString()
    });

    saveData('inventory.json', inventory);

    // Kirim hasil ke user
    ctx.reply(
      `
🎰 <b>GACHA RESULT</b>
──────────────────
👤 Player: <b>${userName}</b>
💰 Cost: 200 Rhystal
💎 Rarity: <b>${rarity}</b>
⚔️ Weapon: <b>${weapon}</b>
──────────────────
📦 Item berhasil disimpan ke inventory!
💎 Sisa saldo kamu: <b>${member.rhystal.toLocaleString()}</b> Rhystal
`,
      { parse_mode: 'HTML' }
    );

  } catch (err) {
    console.error('❌ Gagal melakukan gacha:', err);
    ctx.reply('❌ Terjadi kesalahan saat melakukan gacha.');
  }

  break;
}
  */
 case '/gacha': {
  try {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    const gachaCost = 200;

    // 🔹 Cek apakah user punya cukup Rhystal
    if (!hasBalance(userId, gachaCost)) {
      ctx.reply('💎 Rhystal kamu tidak cukup untuk melakukan gacha!');
      break;
    }

    // 🔹 Load data
    const weapons = loadData('weapon.json');
    const members = loadData('members.json');
    const inventory = loadData('inventory.json');

    // 🔹 Ambil data member
    const member = members.find(m => m.id.toString() === userId.toString());

    // 🔹 Kurangi Rhystal
    member.rhystal -= gachaCost;
    saveData('members.json', members);

    // 🎲 Sistem probabilitas gacha (lebih susah dapat Epic+)
    const rarityChances = {
      Uncommon: 65,   // sering keluar
      Rare: 25,       // lumayan sering
      Epic: 8,        // mulai langka
      Legendary: 1.5, // susah banget
      Mythic: 0.5     // super langka
    };

    function getRarity() {
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (const [rarity, chance] of Object.entries(rarityChances)) {
        cumulative += chance;
        if (rand < cumulative) return rarity;
      }
      return 'Uncommon'; // fallback (harusnya gak kepakai)
    }

    // 🔹 Tentukan hasil gacha
    const rarity = getRarity();
    const pool = weapons[rarity];
    const weapon = pool[Math.floor(Math.random() * pool.length)];

    // 🔹 Simpan ke inventory
    let userInv = inventory.find(u => u.userId === userId);
    if (!userInv) {
      userInv = { userId, items: [] };
      inventory.push(userInv);
    }

    userInv.items.push({
      name: weapon,
      rarity,
      timestamp: new Date().toISOString()
    });

    saveData('inventory.json', inventory);

    // 🔹 Kirim hasil ke user
    ctx.reply(
      `
🎰 <b>GACHA RESULT</b>
──────────────────
👤 Player: <b>${userName}</b>
💰 Cost: 200 Rhystal
💎 Rarity: <b>${rarity}</b>
⚔️ Weapon: <b>${weapon}</b>
──────────────────
📦 Item berhasil disimpan ke inventory!
💎 Sisa saldo kamu: <b>${member.rhystal.toLocaleString()}</b> Rhystal
`,
      { parse_mode: 'HTML' }
    );

  } catch (err) {
    console.error('❌ Gagal melakukan gacha:', err);
    ctx.reply('❌ Terjadi kesalahan saat melakukan gacha.');
  }

  break;
}


        case '/menumember': {
          await msgHandler.menuMember(ctx);
        break;
    }
        case '/makerhystal': {
                const args = ctx.message.text.split(' ');
               const rsId = args[1]; // contoh: /makerhystal 2188

              if (!rsId) return ctx.reply('⚠️ Contoh penggunaan: /makerhystal 2188');
              var amount = parseInt(rsId);
              const isAdmin = await func.isAdmin(userId);
              if (!isAdmin) return ctx.reply("❌ Kamu bukan admin.");
              await addRhystal(userId, parseInt(amount));
              ctx.reply(`Berhasil membuat 💎${amount.toLocaleString()} Rhystal`)
          break;
        }
        case '/addadmin':
        case '/promote': {
             const fromId = ctx.from.id;
              const args = ctx.message.text.split(" ").slice(1);
              const targetId = parseInt(args[0]);

              const isAdmin = await func.isAdmin(fromId);
              if (!isAdmin) return ctx.reply("❌ Kamu bukan admin, ga bisa nambah admin lain.");

              if (!targetId) return ctx.reply("⚠️ Format salah.\nGunakan: /addadmin <id_telegram>");

              const admins = loadData("admins.json");
              if (admins.some(a => a.id === targetId)) {
                return ctx.reply("❌ ID ini sudah terdaftar sebagai admin.");
              }

              // Ambil data user dari Telegram (optional)
              const targetUser = await ctx.telegram.getChat(targetId).catch(() => null);
              const username = targetUser?.username ? `@${targetUser.username}` : "Tanpa Username";
              const name = targetUser?.first_name || "Unknown";

              admins.push({ id: targetId, name, username });
              saveData("admins.json", admins);

              ctx.reply(`✅ Berhasil menambahkan admin baru:\n<b>${name}</b> (${username})\n🆔 <code>${targetId}</code>`, { parse_mode: "HTML" });
                    break;
    }
        case '/adminlist': {
           const fromId = ctx.from.id;
  const isAdmin = await func.isAdmin(fromId);
  if (!isAdmin) return ctx.reply("❌ Kamu bukan admin.");

  const admins = loadData("admins.json");

  if (admins.length === 0) {
    return ctx.reply("📭 Belum ada admin terdaftar.");
  }

  let listText = "<b>📋 Daftar Admin:</b>\n\n";
  admins.forEach((a, i) => {
    listText += `${i + 1}. <b>${a.name}</b> (${a.username || "tanpa username"})\n🆔 <code>${a.id}</code>\n\n`;
  });

  ctx.reply(listText, { parse_mode: "HTML" });
        break;
        }
        case 'deleteadmin': {
          const fromId = ctx.from.id;
  const args = ctx.message.text.split(" ").slice(1);
  const targetId = parseInt(args[0]);

  const isAdmin = await func.isAdmin(fromId);
  if (!isAdmin) return ctx.reply("❌ Kamu bukan admin.");

  if (!targetId) return ctx.reply("⚠️ Format salah.\nGunakan: /deladmin <id_telegram>");

  let admins = loadData("admins.json");
  const index = admins.findIndex(a => a.id === targetId);

  if (index === -1) return ctx.reply("❌ ID ini tidak ditemukan di daftar admin.");

  const removed = admins.splice(index, 1)[0];
  saveData("admins.json", admins);

  ctx.reply(`🗑️ Admin <b>${removed.name}</b> (${removed.username || "tanpa username"}) telah dihapus.`, { parse_mode: "HTML" });
          break;
        }
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
              ctx.reply("🎁 Kamu sukses claim daily 💎50 Rhystal!");
              } else {
              ctx.reply("❌ Kamu belum terdaftar, ketik /register dulu!");
              }
        break;
          }
        case '/pay': {
            const userId = ctx.from.id;
  const args = ctx.message.text.split(' ');
  const payId = args[1]; // contoh: /pay 2188

  if (!payId) return ctx.reply('⚠️ Contoh penggunaan: /pay 2188');

  // Ambil data member
  const member = await getMember(userId);
  if (!member) return ctx.reply('⚠️ Anda belum terdaftar.');

  // Ambil data transaksi
  const transactions = JSON.parse(fs.readFileSync('./transaksi.json', 'utf8'));
  const transaction = transactions.find(t => t.id === payId);

  if (!transaction) return ctx.reply('❌ ID transaksi tidak ditemukan.');
  if (transaction.status !== 'pending') return ctx.reply('⚠️ Transaksi ini sudah dibayar atau dibatalkan.');

  // Cek saldo
  if (member.rhystal < transaction.price) {
    return ctx.reply(`💸 Saldo Anda tidak cukup! Diperlukan ${transaction.price.toLocaleString()} Rhystal.`);
  }

  // Potong saldo user
  var amount = parseInt(transaction.price);
  await useRhystal(userId, parseInt(amount));

  // Ubah status transaksi
  transaction.status = 'paid';
  fs.writeFileSync('./transaksi.json', JSON.stringify(transactions, null, 2));

  ctx.reply(`✅ Pembayaran ID *${payId}* berhasil!
Barang: ${transaction.target}
Harga: 💎 ${transaction.price.toLocaleString()} Rhystal`);
            
        break;
          }
        case '/createticket':
        case '/maketicket': {
           const userId = ctx.from.id;
  const args = ctx.message.text.split(' ').slice(1); 
  const [type, target, price] = args;
      
  if (!type || !target || !price) {
    return ctx.reply(`⚙️ Cara pakai:
\`/maketicket [type] [target] [price]\`

📘 Contoh:
\`/maketicket shop Rhystal_Sword 200\``);
  }

  // Generate ID unik (4 digit random)
  const id = Math.floor(1000 + Math.random() * 9000).toString();

  // Baca transaksi lama
  let transactions = [];
  const path = './transaksi.json';
  if (fs.existsSync(path)) {
    transactions = JSON.parse(fs.readFileSync(path, 'utf8'));
  }

  // Buat transaksi baru
  const newTransaction = {
    id,
    type,
    userId,
    target,
    price: Number(price),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Simpan
  transactions.push(newTransaction);
  fs.writeFileSync(path, JSON.stringify(transactions, null, 2));

  ctx.reply(`🎟️ Ticket transaksi berhasil dibuat!

🆔 ID: ${id}
📦 Tipe: ${type}
🎯 Target: ${target}
💰 Harga: ${price} Rhystal
⏳ Status: Pending

Gunakan perintah:
\`/pay ${id}\` untuk melanjutkan pembayaran.`);
      break;
        }
        
        case '/mytickets':
        case '/myticket':
        case '/mytransactions':
        case '/transactions': {
           const userId = ctx.from.id;
            const path = './transaksi.json';

            if (!fs.existsSync(path)) {
              return ctx.reply('📂 Belum ada data transaksi.');
            }

            const transactions = JSON.parse(fs.readFileSync(path, 'utf8'));
            const myTx = transactions.filter(t => t.userId === userId);
            console.log(myTx)
            if (myTx.length === 0) {
              return ctx.reply('😕 Kamu belum memiliki transaksi apapun.');
            }

            // Format daftar transaksi
            let text = `<b>🎟️ Daftar Ticket Transaksi Kamu</b>\n\n`;
            myTx.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // urut terbaru dulu

            for (const tx of myTx.slice(0, 10)) { // tampilkan max 10 transaksi
              const statusEmoji = tx.status === 'pending' ? '⏳' :
                                  tx.status === 'success' ? '✅' :
                                  '✅';
              text += `<b>Transactions ID: </b><i>${tx.id}</i>\nTransactions <b>Type:</b> <i>${tx.type}</i>\nTransactions <b>Name:</b> <i>${tx.target}</i>\nTransactions <b>Price:</b> <i>💎 ${tx.price}</i> Rhystal \n<b>Status: </b> <i>${statusEmoji} ${tx.status.toUpperCase()}</i>\nCreated at ${new Date(tx.createdAt).toLocaleString()}\n\n`;
            }

            text += `Tampilkan ${myTx.length > 10 ? '10 dari ' + myTx.length : myTx.length} transaksi.\nGunakan /pay [id] untuk membayar ticket.`;

            ctx.reply(text, { parse_mode: 'HTML' });
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
        /*
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
*/
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
