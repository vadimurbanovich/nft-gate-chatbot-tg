const { Bot, GrammyError, HttpError } = require("grammy");
const { NFTChecker } = require("./lib/tonChecker"); 
require("dotenv").config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const PRIVATE_CHAT_ID = process.env.PRIVATE_CHAT_ID;

const nftChecker = new NFTChecker(
  process.env.TON_API_ENDPOINT,
  process.env.TON_API_KEY,
  process.env.COLLECTION_ADDRESS
);

bot.command("start", (ctx) => {
  ctx.reply(
    "Привет! Я бот для проверки NFT и доступа к приватной группе.\n\n" +
      "Чтобы получить доступ, отправьте команду /connect с вашим TON адресом.\n" +
      "Пример: /connect EQxxxxxx..."
  );
});

bot.command("connect", async (ctx) => {
  const walletAddress = ctx.message.text.split(" ")[1];

  if (!walletAddress || !walletAddress.startsWith("EQ")) {
    return ctx.reply(
      "Пожалуйста, отправьте ваш TON адрес в формате /connect EQ..."
    );
  }

  await ctx.reply("Проверяем наличие NFT...");

  try {
    const hasNFT = await nftChecker.checkNFT(walletAddress);

    if (hasNFT) {
      const chatMember = await ctx.api
        .getChatMember(PRIVATE_CHAT_ID, ctx.from.id)
        .catch(() => null);

      if (chatMember) {
        return ctx.reply("Вы уже состоите в приватной группе!");
      }

      const inviteLink = await ctx.api.createChatInviteLink(PRIVATE_CHAT_ID, {
        member_limit: 1,
        expires_in: 3600,
      });

      await ctx.reply(
        `Поздравляю! NFT найден. Вот ваша ссылка для входа в группу: ${inviteLink.invite_link}\n\nСсылка действительна в течение 1 часа и может быть использована только 1 раз.`
      );
    } else {
      await ctx.reply("К сожалению, у вас нет нужного NFT. Доступ запрещён.");
    }
  } catch (error) {
    console.error("Ошибка при проверке NFT:", error);
    await ctx.reply(
      "Произошла ошибка при проверке. Пожалуйста, попробуйте позже или обратитесь к администратору."
    );
  }
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(
    `Error while handling update ${ctx.update.update_id}:`,
    err.error
  );
});

const nftCollection = new tonweb.nft.NftCollection(
  tonweb.utils.address(COLLECTION_ADDRESS)
);

const data = await nftCollection.getData();
console.log("Коллекция через tonweb:", data);

bot.start();
