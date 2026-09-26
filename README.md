# Latest Update

Version 2.3 bounds Chromium's lifetime to reclaim browser/rendering memory.
`BROWSER_RECYCLE_INTERVAL_MS` defaults to `21600000` (six hours); set `0` to
disable, or an integer of at least `10000` for testing. The interval starts
when the browser becomes ready. Cleanup closes the old browser before opening
another, using the same single-flight gate as error recovery.

During cleanup, the last JPEG is repeated with backpressure protection while
FFmpeg and audio keep running. The weather picture briefly freezes while the
page reloads. This is a memory-growth mitigation, not proof that the underlying
leak is fixed. `/health` includes browser age, recovery state, fallback frame
count, last fresh capture time, Node memory and cgroup v2 container memory.
Container memory includes reclaimable cache. Health becomes unsuccessful if
fresh captures stop for two minutes. Memory is also logged before each browser
launch and in capture health summaries.

Validate with `npm test` and an isolated container using a short recycle
interval (`15000`), then run:

```bash
RECYCLE_TEST_URL=http://127.0.0.1:19798 node --test test/browser-recycle.integration.test.js
```

Use the isolated container's mapped port in the URL. Confirm browser PIDs change, FFmpeg's PID stays constant, HLS sequence
numbers keep advancing during recovery, fresh captures resume, and memory
falls after recycling. Production needs a multi-day observation window.

Version 2.2 uses JPEG screenshots and wall-clock input timestamps. FFmpeg
duplicates frames when capture is slower than `FRAME_RATE`, preserving live
playback timing rather than compressing elapsed time into fewer frames.
Output is H.264/yuv420p with closed two-second GOPs, two-second HLS segments,
and a six-segment playlist. Playlists are not cached, segment writes are
atomic, and epoch-based names avoid stale segment reuse after a restart.

`FRAME_RATE` must be an integer from 1 to 60 (default 10). The encoder is
software libx264; `VIDEO_OPTIONS` is not supported. GPU environment settings
do not activate hardware encoding. Run `npm test`; the real-time regression
test requires `ffmpeg` and `ffprobe` and deliberately feeds screenshots below
the requested output frame rate.

07/11/2026 version2.1  Added attempt to fix rare stream being more than 3 minutes behind and racing catchup.  Added better logging to troubleshoot this issue.http://<host>:9798/health

05/04/2026
Added PR from netbymatt changing from jpeg to png.

05/03/2026
Added PR from ws4kp's netbymatt in anticipation of ws4kp versions 7.X and addition of PERMALINK_URL: Pass configuration parameters via permalink generated from ws4kp.  As usual I did not have time to test the update so please report any issues.

Pull ws4kp container.

```bash

docker pull ghcr.io/netbymatt/ws4kp:latest
```

Run ws4kp container.

```bash

docker run -d \
  --name ws4kp \
  --restart unless-stopped \
  -p 9090:8080 \
  ghcr.io/netbymatt/ws4kp:latest
```




# Known Bugs
Rare cases of the stream getting 30+ minutes behind and racing to catch up after stream is played long term.

# ws4channels

A Dockerized Node.js application to stream WeatherStar 4000 data into Channels DVR using Puppeteer and FFmpeg.

## Prerequisites

- 850MB availabe RAM
- Docker installed
- WS4KP running and installed
   https://github.com/netbymatt/ws4kp
  
## Usage

Build and run the container:

Step 1: Pull the Docker Image

```bash

docker pull ghcr.io/rice9797/ws4channels:latest
```

Step 2: Run the Container

Next, run the container using the following command. This will start the container in detached mode and set the required environment variables.

```bash

docker run -d \
  --name ws4channels \
  --restart unless-stopped \
  --memory="1096m" \
  --cpus="1.0" \
  -p 9798:9798 \
  -e PERMALINK_URL=your_permalink_generated_from_ws4kp \
  -e ZIP_CODE=your_zip_code \
  -e WS4KP_HOST=ws4kp_host \
  -e WS4KP_PORT=ws4kp_port \
http://ghcr.io/rice9797/ws4channels:latest
```

Example:

 --memory="1096m" --cpus="1.0" -p 9798:9798 -e ZIP_CODE=63101 -e WS4KP_PORT=8080 -e WS4KP_HOST=192.168.1.152

-1096m=the amount of maximum ram the container can use in mb. 

-1.0= maximum amount of cpu cores the container can use. Default is 1 core

-PERMALINK_URL=  Add if you created a permalink within ws4kp, delete this variable if not.

-63101= enter your zip code

-WS4KP_PORT= this is the port you set up WeatherStar4000 container with if you didn’t choose another port that container defaults to 8080.

-WS4KP_HOST= the ip of the machine that WeatherStar4000 container runs on.

Environment Variables

	•  ZIP_CODE: Your ZIP code (default: 90210)
 
	•  WS4KP_HOST: Host running WS4KP (default: localhost)
 
	•  WS4KP_PORT: Port for WS4KP (default: 8080)
 
	•  --cpus: CPU limit (default: 1.0)
 
	•  --memory: RAM limit in MB (default: 1096)
 
	•  FRAME_RATE: Stream frame rate (default: 10)

	•  CHANNEL_NUMBER: Sets the channel number (default: 275)
  
    •  SHUFFLE_MUSIC: Randomize the order in which detected mp3s are played (default: false)
  
    •  PERMALINK_URL: Pass configuration parameters via permalink generated from ws4kp
	
	•  VIEW_MODE: One of: `standard`, `wide` (default), `wide-enhanced` or `portrait-enhanced`. These values correspond to the modes available in ws4kp, with the last two only available in ws4kp v7.0+. Video sizes are 640x480, 1280x720 or 720x1280 to match.

## Hardware Acceleration, ARM Multi Arch Support

Currently hardware encoding and Multi Arch are not supported. 


### Accessing the Stream

M3U Playlist:

 http://<ip.of.pc.running.ws4channels>:9798/playlist.m3u

Example: <http://192.168.1.131:9798/playlist.m3u>
In Channels DVR, use MPEG-TS format with this URL.

  Guide Data
  XMLTV Guide:
  
 http://<ip.of.pc.running.ws4channels>:9798/guide.xml

Example: <http://192.168.1.131:9798/guide.xml>

Latest additions
 6/21/25 Update:

## Music Configuration

- The application plays MP3 files from the `music` folder in the project root.
- Default tracks included:
  - 01 WST26.mp3
  - 02 WST3.mp3
  - 03 TB.mp3
  - 04 LNC.mp3
  - 05 CF.mp3
  - 06 WST14.mp3
  - 07 WST18.mp3
  
- To customize, add your own MP3 files to the `music` folder. Only `.mp3` files are included in the stream.
- If no MP3s are found, the default tracks are used.
- After adding your mp3 tracks to the music folder restart the container so the app will pick up the new music.

 Prior Updates:

 -Includes seven looping jazz tracks as background music.

-Provides an XMLTV guide with hourly “Local Weather” entries.

-Added guide logo

-Optimized cropping for a clean video feed by removing white bars.

-Changed default cpu and memory limits to 1 cpu core and 1gb ram. Adjust if your system requires.

About:

A nostalgic weather streaming solution for Channels DVR, built with Node.js, Puppeteer, and FFmpeg.

[Buy me a coffee ☕](https://www.buymeacoffee.com/rice9797)
