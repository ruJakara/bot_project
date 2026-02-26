/(корень игры)
  index.html
  style.css
  game.js          // entrypoint
  api.js           // telegram bridge only
  config.js        // constants only

  /assets
    /images
      ...png
    /audio
      ...mp3 ...wav

  /src
    /core
      engine.js        // главный цикл update/render, tick
      timer.js         // обратный отсчёт до 60 сек
      input.js         // клики/тачи/клавиши в единый интерфейс
      audio.js         // музыка/звуки, mute, init-on-click
      storage.js       // (опционально) local best score
      utils.js         // мелкие хелперы (rng, clamp)

    /game
      state.js         // игровые данные (score, lives, difficulty)
      rules.js         // правила, коллизии, начисление очков
      entities.js      // сущности (player, enemies, blocks…)
      ui.js            // обновление DOM (очки, таймер, кнопки)
      scenes.js        // 3 экрана (start, play, result)
