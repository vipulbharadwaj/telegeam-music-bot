const TelegramBot = require('node-telegram-bot-api');
const { request } = require('undici');

const BOT_TOKEN = "7820212598:AAEbFiLJM2a4F32JfApPZlUWSJKmKcxeaFU";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  console.log(username);
  bot.sendMessage(chatId, `Welcome! ${msg.from.first_name} Send me a song name and I will fetch the song for you.`);
});

// Handle incoming text messages from users (song names)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const query = msg.text; 

  if (query === "/start") return;
  

  try {
    const { statusCode, body } = await request(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`, {
      headers: {
        Accept: '*/*',
      }
    });

    // Check if the response is successful
    if (statusCode !== 200) {
      bot.sendMessage(chatId, 'Failed to fetch song details. Please try again later.');
      return;
    }

    const responseData = await body.json();
    const results = responseData?.data?.results;

    if (Array.isArray(results) && results.length > 0) {
      const song = results[0];
      const downloadUrl = song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url;

      if (downloadUrl) {
        const songName = song.name;
        const language = song.language;
        const imageUrl = song.image?.[1]?.url || '';

        let message = `Song Name: ${songName}\nLanguage: ${language}`;
        if(imageUrl){
            message += `\nImage: ${imageUrl}`
        }
        bot.sendMessage(chatId, message);
        bot.sendAudio(chatId, downloadUrl,{caption: songName});
        
      } else {
        bot.sendMessage(chatId,  "Sorry, the song is not available for download.");
      }
    } else {
      bot.sendMessage(chatId, 'No songs found for the given query.');
    }
  } catch (error) {
    console.error('Error fetching song data:', error);
   // bot.sendMessage(chatId, 'An error occurred while searching for the song. Please try again later.');
  }
});
