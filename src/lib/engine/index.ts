import { playTune } from "./tune";
import type { PlayTuneRes } from "sprig";
import { baseEngine, textToTune } from "sprig/base";
import { webEngine } from "sprig/web";
import * as Babel from "@babel/standalone";
import TransformDetectInfiniteLoop, {
    BuildDuplicateFunctionDetector,
    dissallowBackticksInDoubleQuotes,
} from "../custom-babel-transforms";
import { normalizeGameError } from "./error";
import type { NormalizedError } from "./error";
// import { logInfo } from "../../components/logs";

interface RunResult {
    error: NormalizedError | null;
    cleanup: () => void;
}

function getErrorObject(): Error {
    try {
        throw new Error("");
    } catch (err) {
        return err as Error;
    }
}

function parseErrorStack(err?: Error): [number | null, number | null] {
    const stack = err?.stack;
    const chromePattern = /<anonymous>:(\d+):(\d+)/;
    const firefoxPattern = /Function:(\d+):(\d+)/;

    let match =
        chromePattern.exec(stack ?? "") || firefoxPattern.exec(stack ?? "");
    if (match && match.length >= 3) {
        const line = parseInt(match[1]!, 10);
        const column = parseInt(match[2]!, 10);
        if (!isNaN(line) && !isNaN(column)) {
            return [line - 2, column];
        }
    }
    return [null, null];
}

export function transformAndThrowErrors(
    code: string,
    engineAPIKeys: string[],
    runCb: (code: any) => any
) {
    try {
        const transformedCode = Babel.transform(code, {
            plugins: [
                TransformDetectInfiniteLoop,
                BuildDuplicateFunctionDetector(engineAPIKeys),
                dissallowBackticksInDoubleQuotes,
            ],
            retainLines: true,
        });
        runCb(transformedCode);
        return null;
    } catch (error: any) {
        return normalizeGameError({ kind: "runtime", error });
    }
}

export function _performSyntaxCheck(code: string): {
    error: NormalizedError | null;
    cleanup: () => void;
} {
    const game = baseEngine();

    const engineAPIKeys = Object.keys(game.api);
    return {
        error: transformAndThrowErrors(code, engineAPIKeys, () => {}),
        cleanup: () => void 0,
    };
}

export function runGame(
    code: string,
    canvas: HTMLCanvasElement,
    onPageError: (error: NormalizedError) => void
): RunResult | undefined {
    const game = webEngine(canvas);
    const tunes: PlayTuneRes[] = [];
    const timeouts: number[] = [];
    const intervals: number[] = [];

    const errorListener = (event: ErrorEvent) => {
        onPageError(normalizeGameError({ kind: "page", error: event.error }));
    };
    window.addEventListener("error", errorListener);

    const cleanup = () => {
        game.cleanup();
        tunes.forEach((tune) => tune.end());
        timeouts.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        window.removeEventListener("error", errorListener);
    };

    const api = {
        ...game.api,
        setTimeout: (fn: TimerHandler, ms: number) => {
            const timer = setTimeout(fn, ms);
            timeouts.push(timer);
            return timer;
        },
        setInterval: (fn: TimerHandler, ms: number) => {
            const timer = setInterval(fn, ms);
            intervals.push(timer);
            return timer;
        },
        setLegend: (..._bitmaps: [string, string][]) => {
            // this is bad; but for some reason i could not do _bitmaps === [undefined]
            // @ts-ignore
            if (JSON.stringify(_bitmaps) === "[null]") {
                throw new Error(
                    "The sprites passed into setLegend each need to be in square brackets, like setLegend([player, bitmap`...`])."
                );
            }
            return game.api.setLegend(..._bitmaps);
        },
        playTune: (text: string, n: number) => {
            const tune = textToTune(text);
            const playTuneRes = playTune(tune, n);
            tunes.push(playTuneRes);
            return playTuneRes;
        },
        console: {
            ...console,
            log: (...args: any[]) => {
                console.log(...args);
                const err = getErrorObject();
                const nums = parseErrorStack(err);
            },
            error: (...args: any[]) => {
                console.error(...args);
                const err = getErrorObject();
                const nums = parseErrorStack(err);
            },
        },
    };

    const engineAPIKeys = Object.keys(api);
    return {
        error: transformAndThrowErrors(
            code,
            engineAPIKeys,
            (transformedCode) => {
                const fn = new Function(
                    ...engineAPIKeys,
                    transformedCode.code!
                );
                fn(...Object.values(api));
            }
        ),
        cleanup,
    };
}

export function runGameHeadless(code: string): void {
    const game = webEngine(document.createElement("canvas"));

    const api = {
        ...game.api,
        setTimeout: () => {},
        setInterval: () => {},
        setLegend: (..._bitmaps: [string, string][]) => {
            // this is bad; but for some reason i could not do _bitmaps === [undefined]
            if (JSON.stringify(_bitmaps) === "[null]") {
                throw new Error(
                    "The sprites passed into setLegend each need to be in square brackets, like setLegend([player, bitmap`...`])."
                );
            }
            return game.api.setLegend(..._bitmaps);
        },
        playTune: () => {},
    };

    code = `"use strict";\n${code}`;
    try {
        const fn = new Function(...Object.keys(api), code);
        fn(...Object.values(api));
    } catch (error: any) {
        normalizeGameError({ kind: "runtime", error });
    }

    game.cleanup();
}
