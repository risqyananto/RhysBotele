const menuMember = (ctx) => {
return ctx.reply(`
      🔹 *Command List*
      Here is the list of commands\!
      For more info on a specific command, use \`/help {command}\`\.
      Need more help? Come join our *guild*  
      
      📌 *Rankings*  
      \`/top\` \`/my\`
      
      💰 *Economy*  
       \`/store\` \`/rhystal\` \`/give\` \`/daily\` \`/pay\` \`/referral\`  

      😆 *Fun*  
      \`/gacha\` \`/inventory\`  \`/shop(coming soon)\`  \`/hunt(coming soon)\`  
      `
      /*🌱 *Animals*  
      \`zoo\` \`hunt\` \`sell\` \`sacrifice\` \`battle\` \`inv\` \`equip\` \`authowent\` \`owodex\` \`lootbox\`  
      \`crate\` \`battlesetting\` \`team\` \`weapon\` \`rename\` \`dismantle\`
      
      🎲 *Gambling*  
      \`slots\` \`coinflip\` \`lottery\` \`blackjack\`
      
      😆 *Fun*  
      \`8b\` \`define\` \`gif\` \`pic\` \`translate\` \`roll\` \`choose\` \`bell\`
        `
        */, { parse_mode: 'Markdown' });
}
const menuAdmin = (ctx) => {
return ctx.reply(`
      🔹 *Command List*
         🔹 *Command List*
      Here is the list of commands\!
      For more info on a specific command, use \`/help {command}\`\.
      Need more help? Come join our *guild*  
      
      📌 *Rankings*  
      \`/top\` \`/my\`
      
      💰 *Economy*  
       \`/store\` \`/rhystal\` \`/give\` \`/daily\` \`/pay\` \`/referral\`  

      😆 *Fun*  
      \`/gacha\` \`/inventory\`  \`/shop(coming soon)\`  \`/hunt(coming soon)\`
      
      🛠️ *Admin*
      \`/addadmin\` \`/deleteadmin\` \`/maketicket\` \`/makerhystal\` \`/ban\`
        `, { parse_mode: 'Markdown' });
}
module.exports = { menuAdmin, menuMember}
