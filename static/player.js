function createPlayer({
  elementId,
  src = 'https://dvmn.org/media/filer_public/78/db/78db3456-3fd3-4504-9ed9-d2d1fd843c0b/highest_peak.mp4'
}) {
  const player = Playable.create({
    fillAllSpace: true,
    src: src,
    hideOverlay: true,
    hideMainUI: true,
  });

  const playerContainer = document.getElementById(elementId);
  if (!playerContainer) throw Error(`Element with id "${elementId}" not found.`);

  const videoContainer = playerContainer.querySelector('.js-video-container');
  if (!videoContainer) throw Error(`Element with class "js-video-container" not found.`);

  player.attachToElement(videoContainer);

  const $playerContainer = $(playerContainer);

  // Play / Pause
  (function () {
    const $playButton = $playerContainer.find('.js-play-button');
    const $pauseButton = $playerContainer.find('.js-pause-button');

    $playButton.click(() => player.play());
    $pauseButton.click(() => player.pause());

    function showPlay() {
      $playButton.attr("hidden", false);
      $pauseButton.attr("hidden", true);
    }
    function showPause() {
      $playButton.attr("hidden", true);
      $pauseButton.attr("hidden", false);
    }

    showPlay();
    player.on(Playable.ENGINE_STATES.PLAYING, showPause);
    player.on(Playable.ENGINE_STATES.PAUSED, showPlay);
    player.on(Playable.ENGINE_STATES.ENDED, () => {
      player.reset();
      showPlay();
    });
  })();

  // Volume
  (function () {
    const $volumeButton = $playerContainer.find('.js-volume-button');
    const $muteButton = $playerContainer.find('.js-mute-button');

    $volumeButton.click(() => player.setVolume(100));
    $muteButton.click(() => player.setVolume(0));

    function showVolume() {
      $volumeButton.attr("hidden", false);
      $muteButton.attr("hidden", true);
    }
    function showMute() {
      $volumeButton.attr("hidden", true);
      $muteButton.attr("hidden", false);
    }
    function toggle() {
      player.getVolume() > 0 ? showMute() : showVolume();
    }

    player.on(Playable.VIDEO_EVENTS.VOLUME_CHANGED, toggle);
    toggle();
  })();

  // Fullscreen
  $playerContainer.find('.js-fullscreen-button').click(() => player.enterFullScreen());

  // Time formatting
  function formatTime(seconds) {
    const format = val => `0${Math.floor(val)}`.slice(-2);
    const hours = seconds / 3600;
    const minutes = (seconds % 3600) / 60;
    return [Math.floor(hours), format(minutes), format(seconds % 60)].join(':');
  }

  // Time labels
  (function () {
    const $currentTime = $playerContainer.find('.js-current-time');
    const $duration = $playerContainer.find('.js-duration');

    function updateCurrent() {
      $currentTime.text(formatTime(player.getCurrentTime()));
    }
    function updateDuration() {
      $duration.text(formatTime(player.getDuration()));
    }

    player.on(Playable.VIDEO_EVENTS.CURRENT_TIME_UPDATED, updateCurrent);
    player.on(Playable.VIDEO_EVENTS.DURATION_UPDATED, updateDuration);

    updateCurrent();
    updateDuration();
  })();

  // Progress bar с ползунком, появляющимся при наведении
  (function () {
    const $progress = $playerContainer.find('.js-progress');
    const $slider = $progress.find('.js-progress-slider');
    let $thumb = $playerContainer.find('.progress-thumb');

    if (!$thumb.length) {
      $thumb = $('<div class="progress-thumb"></div>');
      $progress.append($thumb);
    }

    function setSlider(percentage) {
      $slider.css("width", `${percentage}%`);
      $thumb.css("left", `${percentage}%`);
    }

    function updateFromPlayer() {
      const duration = player.getDuration();
      if (!duration) return setSlider(0);
      setSlider((player.getCurrentTime() / duration) * 100);
    }

    // Плавное обновление ползунка по событиям плеера
    player.on(Playable.VIDEO_EVENTS.CURRENT_TIME_UPDATED, updateFromPlayer);
    player.on(Playable.VIDEO_EVENTS.DURATION_UPDATED, updateFromPlayer);
    updateFromPlayer();

    function seekToPosition(pageX) {
      const duration = player.getDuration();
      let percentage = ((pageX - $progress.offset().left) / $progress.width()) * 100;
      percentage = Math.max(0, Math.min(percentage, 100));
      setSlider(percentage);
      player.seekTo(duration * percentage / 100);
    }

    // Клик по прогресс-бару
    $progress.on('mousedown', function (e) {
      seekToPosition(e.pageX);
      $(document).on('mousemove.video', e => seekToPosition(e.pageX));
    });

    $(document).on('mouseup.video', function () {
      $(document).off('mousemove.video');
    });

    // Перетаскивание ползунка
    $thumb.on('mousedown', function (e) {
      e.stopPropagation();
      $(document).on('mousemove.thumb', e => seekToPosition(e.pageX));
    });

    $(document).on('mouseup.thumb', function () {
      $(document).off('mousemove.thumb');
    });
  })();
}