import "dotenv/config";
import express from "express";
import { Telegraf } from "telegraf";
import axios from "axios";

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(express.json());

bot.start((ctx) => {
    return ctx.reply(
        `Salom, ${ctx.from.first_name}!\n\nMen Wikipedia qidiruv botiman. Qidirmoqchi bo‘lgan maqola yoki mavzuingiz nomini yuboring.`,
    );
});

bot.help((ctx) => {
    return ctx.reply(
        "Mavzu nomini matn sifatida yuborsangiz, men Wikipedia orqali qisqacha maʼlumot topib beraman.",
    );
});

bot.on("text", async (ctx) => {
    const query = ctx.message.text.trim();

    try {
        await ctx.sendChatAction("typing");

        const searchUrl = `https://uz.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            query,
        )}&format=json&utf8=1`;

        const searchResponse = await axios.get(searchUrl);
        const searchResults = searchResponse.data.query.search;

        if (!searchResults || searchResults.length === 0) {
            return ctx.reply(
                "Kechirasiz, ushbu so‘rov bo‘yicha hech qanday maqola topilmadi.",
            );
        }

        const firstTitle = searchResults[0].title;
        const summaryUrl = `https://uz.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`;
        const summaryResponse = await axios.get(summaryUrl);
        const data = summaryResponse.data;

        const title = data.title;
        const extract = data.extract || "Qisqacha tavsif mavjud emas.";
        const pageUrl =
            data.content_urls?.desktop?.page ||
            `https://uz.wikipedia.org/wiki/${encodeURIComponent(title)}`;

        const message = `📚 *${title}*\n\n${extract}\n\n🔗 [Batafsil o‘qish](${pageUrl})`;

        return ctx.replyWithMarkdown(message);
    } catch (error) {
        return ctx.reply(
            "Maʼlumot olishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.",
        );
    }
});

app.get("/", (req, res) => {
    res.send("Wikipedia Telegram Boti serveri faol ishlamoqda!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi.`);
    bot.launch();
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
