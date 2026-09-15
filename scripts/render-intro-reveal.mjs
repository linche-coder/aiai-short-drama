import {spawnSync} from 'node:child_process';
const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i','public/assets/audio/aiai-intro-cinematic-v2.wav','-af','atrim=start=0:end=1.15,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.03,afade=t=out:st=0.85:d=0.30','-ar','44100','-ac','2','-c:a','pcm_s16le','public/assets/audio/aiai-intro-reveal-v4.wav'],{stdio:'inherit'});
process.exit(result.status??1);
