const menuMember = (ctx) => {
return ctx.reply(`
      🔹 *Command List*
      Here is the list of commands\!
      For more info on a specific command, use \`/help {command}\`\.
      Need more help? Come join our *guild*  
      
      📌 *Rankings*  
      \`top\` \`my\`
      
      💰 *Economy*  
      \`rhystal\` \`give\` \`daily\` \`pay\` \`quest\`
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
      Here is the list of commands\!
      For more info on a specific command, use \`/help {command}\`\.
      Need more help? Come join our *guild*  
      
      📌 *Rankings*  
      \`top\` \`my\`
      
      💰 *Economy*  
      \`cowoncy\` \`give\` \`daily\` \`vote\` \`quest\` \`checklist\` \`shop\` \`buy\`
      
      🌱 *Animals*  
      \`zoo\` \`hunt\` \`sell\` \`sacrifice\` \`battle\` \`inv\` \`equip\` \`authowent\` \`owodex\` \`lootbox\`  
      \`crate\` \`battlesetting\` \`team\` \`weapon\` \`rename\` \`dismantle\`
      
      🎲 *Gambling*  
      \`slots\` \`coinflip\` \`lottery\` \`blackjack\`
      
      😆 *Fun*  
      \`8b\` \`define\` \`gif\` \`pic\` \`translate\` \`roll\` \`choose\` \`bell\`
        `, { parse_mode: 'Markdown' });
}
module.exports = { menuAdmin, menuMember}