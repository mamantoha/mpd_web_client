$(document).ready(function () {
  connect();
});

function connect() {
  url = `ws://${location.host}/mpd`;
  ws = new WebSocket(url);

  ws.onopen = function () {
    console.log(`Connected to socket ${url}`);
    bindEvents(ws);
    $.get("/current_song", function (data, textStatus, jqXHR) {
      if (data) {
        changeSongTitle(data);
      } else {
        $(document).prop("title", "MPD Web Client");
      }

      changeAlbumArt();
    });
    $.get("/status", function (data, textStatus, jqXHR) {
      mpd_status = JSON.parse(data);
      changeFavicon(mpd_status.state);
      changeButtonState(mpd_status.state);
      changeRandomButtonState(mpd_status.random);
      changeRepeatButtonState(mpd_status.repeat);
      changeSingleButtonState(mpd_status.single);
      changeVolume(mpd_status.volume);

      if (mpd_status.time) {
        time = mpd_status.time.split(":");
        position = parseInt(time[0]);
        duration = parseInt(time[1]);
        changeTimeProgress(position, duration);
      }
    });
  };

  ws.onclose = function (e) {
    console.log(
      "Socket is closed. Reconnect will be attempted in 1 second.",
      e.reason
    );
    unbindEvents();
    setTimeout(function () {
      connect();
    }, 1000);
  };

  window.onbeforeunload = function () {
    ws.onclose = function () {}; // disable onclose handler first
    ws.close();
  };

  ws.onmessage = function (e) {
    data = JSON.parse(e.data);

    switch (data.action) {
      case "song":
        changeSongTitle(data.song);
        changeAlbumArt();
        break;
      case "state":
        changeFavicon(data.state);
        changeButtonState(data.state);
        break;
      case "random":
        changeRandomButtonState(data.state);
        break;
      case "repeat":
        changeRepeatButtonState(data.state);
        break;
      case "single":
        changeSingleButtonState(data.state);
        break;
      case "time":
        position = parseInt(data.position);
        duration = parseInt(data.duration);
        changeTimeProgress(position, duration);
        break;
      case "volume":
        volume = data.volume;
        changeVolume(volume);
        break;
      default:
      // nothing
    }
  };
}

function bindEvents(ws) {
  $("button#nextSong").bind("click", function (e) {
    message = JSON.stringify({
      action: "nextSong",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#prevSong").bind("click", function (e) {
    message = JSON.stringify({
      action: "prevSong",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#togglePlayPause").bind("click", function (e) {
    message = JSON.stringify({
      action: "togglePlayPause",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#toggleRandom").bind("click", function (e) {
    message = JSON.stringify({
      action: "toggleRandom",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#toggleRepeat").bind("click", function (e) {
    message = JSON.stringify({
      action: "toggleRepeat",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("button#toggleSingle").bind("click", function (e) {
    message = JSON.stringify({
      action: "toggleSingle",
    });

    ws.send(message);
    e.preventDefault();
  });

  $("#progressBar").bind("click", function (e) {
    x = e.pageX - this.offsetLeft;
    clickedValue = (x * this.max) / this.offsetWidth;

    message = JSON.stringify({
      action: "seek",
      data: clickedValue,
    });

    ws.send(message);
    e.preventDefault();
  });

  $("input#volumeRange").on("change mousemove", function () {
    handleChangeVolumeInput(this);
  });

  $("input#volumeRange").on("change touchmove", function () {
    handleChangeVolumeInput(this);
  });
}

function unbindEvents() {
  $("button#nextSong").unbind("click");
  $("button#prevSong").unbind("click");
  $("button#togglePlayPause").unbind("click");
  $("button#toggleRandom").unbind("click");
  $("button#toggleRepeat").unbind("click");
  $("button#toggleSingle").unbind("click");
  $("input#volumeRange").unbind();
}

function handleChangeVolumeInput(volumeInput) {
  message = JSON.stringify({
    action: "volume",
    data: parseInt(volumeInput.value),
  });

  ws.send(message);
}

function changeSongTitle(data) {
  song = JSON.parse(data);

  pageTitle = `${song["Artist"]} - ${song["Title"]}`;
  $("#currentSong #artist").html(song["Artist"]);
  $("#currentSong #title").html(song["Title"]);
  $(document).prop("title", pageTitle);
}

function changeAlbumArt() {
  newSrc = `/albumart?timestamp=${new Date().getTime()}`;
  $("#albumCover").attr("src", newSrc);
  $("#albumCover-preview").attr("src", newSrc);
}

function changeButtonState(state) {
  togglePlayPauseButton = $("button#togglePlayPause");

  switch (state) {
    case "play":
      togglePlayPauseButton.html("<i class='fas fa-pause'></i>");
      disablePrevNextButtons(false);
      break;
    case "pause":
      togglePlayPauseButton.html("<i class='fas fa-play'></i>");
      disablePrevNextButtons(true);
      break;
    case "stop":
      togglePlayPauseButton.html("<i class='fas fa-play'></i>");
      disablePrevNextButtons(true);
      break;
    default:
    // unknown state
  }
}

function changeRandomButtonState(state) {
  toggleRandomButton = $("button#toggleRandom");

  switch (state) {
    case "0":
      toggleRandomButton.removeClass("active");
      break;
    case "1":
      toggleRandomButton.addClass("active");
      break;
    default:
    // unknown state
  }
}

function changeRepeatButtonState(state) {
  toggleRepeatButton = $("button#toggleRepeat");

  switch (state) {
    case "0":
      toggleRepeatButton.removeClass("active");
      break;
    case "1":
      toggleRepeatButton.addClass("active");
      break;
    default:
    // unknown state
  }
}

function changeSingleButtonState(state) {
  toggleSingleButton = $("button#toggleSingle");

  switch (state) {
    case "0":
      toggleSingleButton.removeClass("active");
      break;
    case "1":
      toggleSingleButton.addClass("active");
      break;
    default:
    // unknown state
  }
}

function changeFavicon(state) {
  $('link[rel="shortcut icon"]').attr("href", `/favicons/${state}.ico`);
}

function disablePrevNextButtons(disabled) {
  $("button#prevSong").attr("disabled", disabled);
  $("button#nextSong").attr("disabled", disabled);
}

function changeTimeProgress(position, duration) {
  progressBar = $("progress#progressBar")[0];
  progressBar.value = position / duration;
  $(".timestamp").html(`${toMMSS(position)} / ${toMMSS(duration)}`);
}

function toMMSS(totalSeconds) {
  minutes = Math.floor(totalSeconds / 60);
  seconds = totalSeconds % 60;
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return `${minutes}:${seconds}`;
}

function changeVolume(volume) {
  $("input#volumeRange").val(volume);
}
