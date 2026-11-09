'use strict';

function streamOptions(frameRate) {
  if (!Number.isInteger(frameRate) || frameRate < 1 || frameRate > 60) {
    throw new Error('FRAME_RATE must be an integer between 1 and 60');
  }
  return {
    input: [
      '-vcodec mjpeg', '-probesize 32', '-analyzeduration 0', '-fpsprobesize 0',
      `-framerate ${frameRate}`, '-use_wallclock_as_timestamps 1',
    ],
    output: [
      '-map [v]', '-map [a]', '-c:v libx264', '-c:a aac', '-b:a 128k',
      '-preset ultrafast', '-tune zerolatency', '-b:v 1000k',
      '-vf scale=in_range=pc:out_range=tv,format=yuv420p',
      '-pix_fmt yuv420p', `-r ${frameRate}`, '-fps_mode cfr',
      `-g ${frameRate * 2}`, `-keyint_min ${frameRate * 2}`, '-sc_threshold 0',
      '-flags +cgop', '-f hls', '-hls_time 2', '-hls_list_size 6',
      '-hls_delete_threshold 3', '-hls_start_number_source epoch',
      '-hls_flags delete_segments+independent_segments+temp_file',
    ],
  };
}

module.exports = { streamOptions };
