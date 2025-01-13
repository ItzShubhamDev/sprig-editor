import { lazy } from "../utils/lazy";
import type { PlayTuneRes, Tune } from "sprig";
import { playTuneHelper } from "sprig/web";

const audioCtx = lazy(() => new AudioContext());
const volGain = lazy(() => {
    const volGain = audioCtx.createGain();
    volGain.connect(audioCtx.destination);
    return volGain;
});

export function playTune(tune: Tune, number = 1): PlayTuneRes {
    const playingRef = { playing: true };
    playTuneHelper(tune, number, playingRef, audioCtx, volGain.__lazy_self);
    return {
        end() {
            playingRef.playing = false;
        },
        isPlaying() {
            return playingRef.playing;
        },
    };
}
