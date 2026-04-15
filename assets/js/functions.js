// saavn-search.js - Fixed & debug-friendly version

// DOM refs
var results_container = document.querySelector("#saavn-results");
var results_objects = {};
const searchUrl = "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=";

// playlist / playback state
var songQueue = [];        // array of song IDs (strings)
var currentSongIndex = -1; // index in songQueue (-1 = none)
var lastSearch = "";       // track last search term
var page_index = 1;

// Ensure audio 'ended' triggers next track
(function attachAudioEnded() {
  var audio = document.getElementById('player');
  if (!audio) return;
  audio.addEventListener('ended', function () {
    // try to play next automatically
    try {
      NextSong();
    } catch (e) {
      console.error("Error on audio ended handling:", e);
    }
  });
})();

// ----------------------
// Search & paging
// ----------------------
function SaavnSearch(e) {
  if (e && e.preventDefault) e.preventDefault();

  var q = document.querySelector("#saavn-search-box").value || "";
  q = q.trim();
  if (!q) return;

  lastSearch = q; // store plain text lastSearch
  var encoded = encodeURIComponent(q);
  window.location.hash = encoded;
  doSaavnSearch(encoded);
}

function nextPage() {
  var query = document.querySelector("#saavn-search-box").value.trim();
  if (!query) { query = lastSearch || ""; }
  if (!query) return;
  query = encodeURIComponent(query);
  doSaavnSearch(query, 0, true);
}

async function doSaavnSearch(query, NotScroll, page) {
  if (!query) return;
  // store plain lastSearch for future calls
  try { lastSearch = decodeURIComponent(query); } catch (e) { lastSearch = query; }

  document.querySelector("#saavn-search-box").value = lastSearch;
  results_container.innerHTML = `<span class="loader">Searching...</span>`;
  var q = query + "&limit=40";

  if (page) {
    page_index = page_index + 1;
    q += "&page=" + page_index;
  } else {
    page_index = 1;
    q += "&page=1";
  }

  let response;
  try {
    response = await fetch(searchUrl + q);
  } catch (err) {
    console.error("Fetch error:", err);
    results_container.innerHTML = `<span class="error">Network error: ${err}</span>`;
    return;
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    console.error("JSON parse error:", err, response);
    results_container.innerHTML = `<span class="error">Failed to parse response.</span>`;
    return;
  }

  if (response.status !== 200) {
    console.error("API non-200:", response.status, json);
    results_container.innerHTML = `<span class="error">Error: ${json && json.message ? json.message : 'API error'}</span>`;
    return;
  }

  var items = json && json.data && json.data.results ? json.data.results : null;
  if (!items || items.length === 0) {
    results_container.innerHTML = "<p>No result found. Try other keywords.</p>";
    return;
  }

  // If new search (page not provided), reset queue. If loading more, append.
  if (!page) {
    songQueue = [];
  }

  var results = [];
  for (let track of items) {
    // push id as string to keep consistency
    var song_id = String(track.id);
    if (!songQueue.includes(song_id)) songQueue.push(song_id);

    // store track object for later use
    results_objects[song_id] = { track: track };

    // UI fields
    var song_name = TextAbstract(track.name, 25);
    var album_name = track.album && track.album.name ? TextAbstract(track.album.name, 20) : "";
    if (track.album && track.album.name === track.name) album_name = "";
    var measuredTime = new Date(null);
    measuredTime.setSeconds(track.duration || 0);
    var play_time = measuredTime.toISOString().substr(11, 8);
    if (play_time.startsWith("00:0")) play_time = play_time.slice(4);
    if (play_time.startsWith("00:")) play_time = play_time.slice(3);

    var year = track.year || "";
    var song_image = (track.image && track.image[1] && track.image[1].link) ? track.image[1].link : "";
    var song_artist = TextAbstract(track.primaryArtists || "", 30);

    // get bitrate index (safe)
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = 3; // default to 160 (value '3' per your select)
    if (bitrate && bitrate.options && bitrate.selectedIndex >= 0) {
      bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    }

    // check downloadUrl availability
    if (track.downloadUrl && track.downloadUrl[bitrate_i]) {
      var download_url = track.downloadUrl[bitrate_i]['link'];
      results.push(`
        <div class="text-left song-container" style="margin-bottom:20px;border-radius:10px;background-color:#1c1c1c;padding:10px;">
          <div class="row" style="margin:auto;">
            <div class="col-auto" style="padding:0px;">
              <img id="${song_id}-i" class="img-fluid d-inline" style="width:115px;border-radius:5px;height:115px;padding-right:10px;" src="${song_image}" loading="lazy"/>
            </div>
            <div class="col" style="padding:2px;">
              <p class="float-right" style="margin:0px;color:#fff;padding-right:10px;">${year}</p>
              <p id="${song_id}-n" style="margin:0px;color:#fff;max-width:100%;">${song_name}</p>
              <p id="${song_id}-a" style="margin:0px;color:#fff;max-width:100%;">${album_name}</p>
              <p id="${song_id}-ar" style="margin:0px;color:#fff;max-width:100%;">${song_artist}</p>
              <button class="btn btn-primary song-btn" type="button" style="margin:0px 2px;" onclick='PlayAudio("${download_url.replace(/"/g, '&quot;')}","${song_id}")'>▶</button>
              <button class="btn btn-success song-btn" type="button" style="margin:0px 2px;" onclick='AddDownload("${song_id}")'>⬇ Download</button>
              <p class="float-right" style="margin:0px;color:#fff;padding-right:10px;padding-top:15px;">${play_time}</p>
            </div>
          </div>
        </div>
      `);
    } else {
      // if no download URL for selected bitrate, still allow play if any url exists
      var anyUrl = null;
      if (track.downloadUrl) {
        for (let k in track.downloadUrl) {
          if (track.downloadUrl[k] && track.downloadUrl[k].link) { anyUrl = track.downloadUrl[k].link; break; }
        }
      }
      if (anyUrl) {
        results_objects[song_id] = { track: track };
        results.push(`
          <div class="text-left song-container" style="margin-bottom:20px;border-radius:10px;background-color:#1c1c1c;padding:10px;">
            <div class="row" style="margin:auto;">
              <div class="col-auto" style="padding:0px;">
                <img id="${song_id}-i" class="img-fluid d-inline" style="width:115px;border-radius:5px;height:115px;padding-right:10px;" src="${song_image}" loading="lazy"/>
              </div>
              <div class="col" style="padding:2px;">
                <p class="float-right" style="margin:0px;color:#fff;padding-right:10px;">${year}</p>
                <p id="${song_id}-n" style="margin:0px;color:#fff;max-width:100%;">${song_name}</p>
                <p id="${song_id}-a" style="margin:0px;color:#fff;max-width:100%;">${album_name}</p>
                <p id="${song_id}-ar" style="margin:0px;color:#fff;max-width:100%;">${song_artist}</p>
                <button class="btn btn-primary song-btn" type="button" style="margin:0px 2px;" onclick='PlayAudio("${anyUrl.replace(/"/g, '&quot;')}","${song_id}")'>▶</button>
                <button class="btn btn-success song-btn" type="button" style="margin:0px 2px;" onclick='AddDownload("${song_id}")'>⬇ Download</button>
                <p class="float-right" style="margin:0px;color:#fff;padding-right:10px;padding-top:15px;">${play_time}</p>
              </div>
            </div>
          </div>
        `);
      }
    }
  } // end for

  results_container.innerHTML = results.join(' ');
  if (!NotScroll) {
    var el = document.getElementById("saavn-results");
    if (el && el.scrollIntoView) el.scrollIntoView();
  }
}

// ----------------------
// Utility
// ----------------------
function TextAbstract(text, length) {
  if (!text) return "";
  if (text.length <= length) return text;
  text = text.substring(0, length);
  var last = text.lastIndexOf(" ");
  if (last > 0) text = text.substring(0, last);
  return text + "...";
}

// ----------------------
// Player functions
// ----------------------
function PlayAudio(audio_url, song_id) {
  try {
    var audio = document.getElementById('player');
    var source = document.getElementById('audioSource');
    source.src = audio_url;
    var nameEl = document.getElementById(song_id + "-n");
    var albumEl = document.getElementById(song_id + "-a");
    var imgEl = document.getElementById(song_id + "-i");

    var name = nameEl ? nameEl.textContent : '';
    var album = albumEl ? albumEl.textContent : '';
    var image = imgEl ? imgEl.getAttribute("src") : '';

    document.title = name + " - " + album;
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = (bitrate && bitrate.options && bitrate.selectedIndex >= 0) ? bitrate.options[bitrate.selectedIndex].value : '3';

    document.getElementById("player-name").innerHTML = name;
    document.getElementById("player-album").innerHTML = album;
    if (document.getElementById("player-image")) document.getElementById("player-image").setAttribute("src", image);

    var promise = audio.load();
    if (promise && promise.catch) promise.catch(function (error) { console.error(error); });
    audio.play().catch(function (err) { console.warn("Play() prevented:", err); });

    // Save current song index (string match)
    currentSongIndex = songQueue.indexOf(String(song_id));
  } catch (e) {
    console.error("PlayAudio error:", e);
  }
}

function searchSong(search_term) {
  var el = document.getElementById('saavn-search-box');
  if (el) el.value = search_term;
  var goButton = document.getElementById("saavn-search-trigger");
  if (goButton) goButton.click();
}

// ----------------------
// Next / Previous controls
// ----------------------
function NextSong() {
  try {
    if (songQueue.length === 0) { alert("No songs in queue."); return; }
    if (currentSongIndex < 0) {
      // if nothing is playing, start from first
      currentSongIndex = 0;
    }
    var nextIndex = currentSongIndex + 1;
    if (nextIndex >= songQueue.length) {
      alert("End of playlist reached.");
      return;
    }
    var nextSongId = String(songQueue[nextIndex]);
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = (bitrate && bitrate.options && bitrate.selectedIndex >= 0) ? bitrate.options[bitrate.selectedIndex].value : '3';
    var trackData = results_objects[nextSongId] && results_objects[nextSongId].track ? results_objects[nextSongId].track : null;
    if (!trackData) { console.warn("Track data missing for", nextSongId); return; }

    // pick url for selected bitrate, fallback to any available
    var next_url = (trackData.downloadUrl && trackData.downloadUrl[bitrate_i] && trackData.downloadUrl[bitrate_i].link) ?
      trackData.downloadUrl[bitrate_i].link : (function () {
        for (let k in trackData.downloadUrl) if (trackData.downloadUrl[k] && trackData.downloadUrl[k].link) return trackData.downloadUrl[k].link;
        return null;
      })();

    if (!next_url) { console.warn("No playable URL for", nextSongId); return; }
    PlayAudio(next_url, nextSongId);
  } catch (e) {
    console.error("NextSong error:", e);
  }
}

function PrevSong() {
  try {
    if (songQueue.length === 0 || currentSongIndex <= 0) { alert("You're already at the first song."); return; }
    var prevIndex = currentSongIndex - 1;
    var prevSongId = String(songQueue[prevIndex]);
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = (bitrate && bitrate.options && bitrate.selectedIndex >= 0) ? bitrate.options[bitrate.selectedIndex].value : '3';
    var trackData = results_objects[prevSongId] && results_objects[prevSongId].track ? results_objects[prevSongId].track : null;
    if (!trackData) { console.warn("Track data missing for", prevSongId); return; }

    var prev_url = (trackData.downloadUrl && trackData.downloadUrl[bitrate_i] && trackData.downloadUrl[bitrate_i].link) ?
      trackData.downloadUrl[bitrate_i].link : (function () {
        for (let k in trackData.downloadUrl) if (trackData.downloadUrl[k] && trackData.downloadUrl[k].link) return trackData.downloadUrl[k].link;
        return null;
      })();

    if (!prev_url) { console.warn("No playable URL for", prevSongId); return; }
    PlayAudio(prev_url, prevSongId);
  } catch (e) {
    console.error("PrevSong error:", e);
  }
}

// ----------------------
// Download logic
// ----------------------
function AddDownload(id) {
  try {
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = (bitrate && bitrate.options && bitrate.selectedIndex >= 0) ? bitrate.options[bitrate.selectedIndex].value : '3';

    var trackData = results_objects[String(id)] && results_objects[String(id)].track ? results_objects[String(id)].track : null;
    if (!trackData) {
      alert("Track metadata not available for download.");
      return;
    }

    var download_url = (trackData.downloadUrl && trackData.downloadUrl[bitrate_i] && trackData.downloadUrl[bitrate_i].link) ?
      trackData.downloadUrl[bitrate_i].link : (function () {
        for (let k in trackData.downloadUrl) if (trackData.downloadUrl[k] && trackData.downloadUrl[k].link) return trackData.downloadUrl[k].link;
        return null;
      })();

    if (!download_url) {
      alert("Download link not available for this track.");
      return;
    }

    var song_name = (trackData.name || "song").replace(/[^\w\s]/gi, '').trim();
    var album_name = (trackData.album && trackData.album.name) ? trackData.album.name : "Unknown Album";
    var bitrate_label = bitrate_i == 4 ? "320kbps" : "160kbps";

    // Append to download list UI
    var download_list = document.getElementById("download-list");
    if (download_list) {
      var download_item = document.createElement("li");
      download_item.className = "no-bullets";
      download_item.innerHTML = `
        <div class="col">
          <img class="track-img" src="${(trackData.image && trackData.image[2] && trackData.image[2].link) ? trackData.image[2].link : ''}" width="50px">
          <div style="display:inline;">
            <span class="track-name">${song_name}</span> - 
            <span class="track-album">${album_name}</span><br>
            <span class="track-size">Quality: ${bitrate_label}</span>
            <span class="track-status" style="color:green;">
              <a href="${download_url}" download="${song_name}_${bitrate_label}.mp3" target="_blank">⬇ Download MP3</a>
            </span>
          </div>
        </div>
        <hr>
      `;
      download_list.appendChild(download_item);
    }

    // Auto-trigger browser download
    var a = document.createElement('a');
    a.href = download_url;
    a.download = `${song_name}_${bitrate_label}.mp3`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // optional feedback
    try {
      var float_tap = document.getElementById('mpopupLink');
      if (float_tap) {
        float_tap.style.backgroundColor = "green";
        float_tap.style.borderColor = "green";
        setTimeout(function () {
          float_tap.style.backgroundColor = "#007bff";
          float_tap.style.borderColor = "#007bff";
        }, 1000);
      }
    } catch (e) { /* ignore */ }

    alert(`Download started: ${song_name} (${bitrate_label})`);
  } catch (err) {
    console.error("AddDownload error:", err);
    alert("Failed to start download.");
  }
}

// ----------------------
// initialize: if there's a hash on load, call search
// ----------------------
(function initFromHash() {
  try {
    if (window.location.hash && window.location.hash.length > 1) {
      var q = window.location.hash.substring(1);
      doSaavnSearch(q, 1);
    } else {
      // default search
      doSaavnSearch(encodeURIComponent('english'), 1);
    }
  } catch (e) { console.error("Init error:", e); }
})();
