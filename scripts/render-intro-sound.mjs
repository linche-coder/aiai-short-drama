import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const filter=fs.readFileSync(new URL('./intro-sound-sync-filter.txt',import.meta.url),'utf8');
const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i','public/assets/audio/aiai-intro-cinematic-v2.wav','-filter_complex',filter,'-map','[out]','-t','3.862','-ar','44100','-ac','2','-c:a','pcm_s16le','public/assets/audio/aiai-intro-logo-synced-v3.wav'],{stdio:'inherit'});
process.exit(result.status??1);
