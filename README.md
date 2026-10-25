# Santa's Surprise

A two-player Christmas party game: take turns opening presents, and try not to
open the one with the bomb inside.

**Play it at [santa-surprise.com](https://santa-surprise.com)**

> **Warning:** the normal **Scary** style has loud sounds, sudden scary
> pictures and a flashing, shaking screen. It is not suitable for young
> children or anyone sensitive to flashing lights. For young children, pick
> **Kids** on the home screen: no scary pictures and no flashing.

## How to play

1. On the home screen pick **👻 Scary** or **🧸 Kids**, press **Play**, and
   choose to play with a friend or against the bot.
2. Each player picks a character (Santa, Boy Elf, Girl Elf, Gingerbread Man,
   Snowman or Reindeer) and can type a name.
3. There are 16 presents. Players take turns opening one.
   - A safe present has a prize inside: sweets, a teddy bear, a dinosaur, a
     yo-yo, a robot and more. It shows for a moment, then goes away. If you
     are very lucky (about 1 in 100), it is a 💎 diamond, which stays on the
     board. Prizes are just for fun and don't change the score. Sometimes a
     Christmas joke comes with it too.
   - The bomb gives a jump scare (in Kids style, a snowball splat instead),
     and the **other** player gets a point.
   - If only one present is left, it must be the bomb, so both players get a
     point.
4. After 3 rounds the higher score wins. A tie goes to **sudden death**: a
   spinning wheel picks who starts, and whoever opens the bomb loses.
5. After each round a pop-up shows what happened, the points and each
   player's prizes. At the end it shows the winner and every prize from the
   whole game, with a fanfare and confetti.

**Prize collection:** every prize you find is added to your collection
(📖 on the home screen). Found prizes show in colour, missing ones as "?".
Can you find them all, including the diamond? The bot's prizes don't count.

Players take turns going first each round. The 🏠 button goes back to the home
screen and 🔊 turns the music on or off.

## Run it on your computer

It is a plain web page with no build step and no dependencies. From the project
folder, start any local web server, for example:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. A server is needed (not just opening
`index.html`) because the game loads its sound files.

## Files

| File | What it is |
|---|---|
| `index.html` | The page and its screens |
| `game.js` | Game rules, the bot, the wheel, music and sounds |
| `style.css` | Layout and look |
| `*.jpeg` | Character, present and scare pictures |
| `*.mp3` | Jump scare sounds and vinyl crackle |
| `CREDITS.txt` | Where the sounds came from and their licenses |
| `NOTES.txt` | Design notes (not published on the website) |

The site is hosted on GitHub Pages from the `main` branch. Every push to `main`
goes live within a minute or two. Changes to `game.js` or `style.css` also need
the `?v=` number bumped in `index.html` so browsers load the new version.

## Privacy

The game has no accounts, cookies or ads. Names you type stay in your browser
and are gone when you close the page. Your prize collection and the Scary/Kids
choice are saved in your browser only (local storage) and are never sent
anywhere.

It counts visits with [Umami](https://umami.is), which uses no cookies and
stores nothing that identifies you. It records anonymous totals like country,
device type, browser and the site you came from, plus game events: games
started (friend or bot, Scary or Kids), characters picked, games finished or
left early, sudden deaths, diamonds found, collection views and feedback
clicks. Typed names are never sent.
Stats are only counted on santa-surprise.com, not when running it locally.

## Feedback

Use the **💬 Send feedback** button on the home screen, or email
[info@skydistribute.com](mailto:info@skydistribute.com).

## Credits and license

- Vinyl crackle sounds by [lulyc](https://freesound.org/people/lulyc/packs/19233/)
  on Freesound, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Jump scare sounds from [Pixabay](https://pixabay.com/sound-effects/search/jumpscare/),
  under the Pixabay Content License.
- Pictures were made with an AI image tool. The carols are traditional,
  public domain tunes played by the game itself.

The game's code and pictures are under the [Apache 2.0 license](LICENSE). The
sounds keep their own licenses; see [CREDITS.txt](CREDITS.txt).

Made by Dylan Lange.
