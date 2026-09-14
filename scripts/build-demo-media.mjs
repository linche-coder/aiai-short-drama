import {mkdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
// Reuse the existing neutral fixture, adding a quiet test tone and a padded portrait variant.
mkdirSync('public/media/demo',{recursive:true});
function ffmpeg(args){const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw Error('ffmpeg failed');}
ffmpeg(['-stream_loop','2','-i','tests/fixtures/player-test.mp4','-f','lavfi','-i','sine=frequency=440:sample_rate=44100:duration=12','-filter:a','volume=0.04','-c:v','copy','-c:a','aac','-b:a','64k','-shortest','-movflags','+faststart','public/media/demo/landscape.mp4']);
ffmpeg(['-i','public/media/demo/landscape.mp4','-vf','scale=270:152,pad=270:480:0:164:color=0x15111e,setsar=1','-c:v','libx264','-preset','fast','-crf','22','-c:a','copy','-movflags','+faststart','public/media/demo/portrait.mp4']);
