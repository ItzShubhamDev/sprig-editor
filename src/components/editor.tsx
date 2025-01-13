import { useEffect, useRef, useState } from "preact/hooks";

declare global {
    interface Window {
        tern: any;
    }
}

import CodeMirror from "codemirror";
import type { Editor } from "codemirror";

import tern from "tern";
import "tern/plugin/doc_comment";
import "tern/plugin/complete_strings";

import "codemirror/mode/javascript/javascript";

import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/tern/tern";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/search/search";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/search/jump-to-line";
import "codemirror/addon/dialog/dialog";

import "codemirror/addon/dialog/dialog.css";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/tern/tern.css";
import "codemirror/addon/fold/foldgutter.css";
import "./editor.css";

import { _performSyntaxCheck, runGame } from "../lib/engine";
import { PngToSprite } from "./pngToSprite";
import gameEngine from "../lib/tern/defs/gameEngine.json";

type Error = ReturnType<typeof _performSyntaxCheck>;

const CodeEditor = () => {
    const editorRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [codemirror, setCodemirror] = useState<Editor | null>(null);
    const [code, setCode] = useState<string>("");
    const [error, setError] = useState<Error["error"] | null>(null);
    const [running, setRunning] = useState<boolean>(false);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (editorRef.current && !codemirror) {
            window.tern = tern;
            const ternServer = new CodeMirror.TernServer({
                defs: [gameEngine],
            });
            const code = localStorage.getItem("code") ?? "";

            const instance = CodeMirror(editorRef.current, {
                value: code,
                mode: "javascript",
                theme: "material",
                lineNumbers: true,
                autoCloseBrackets: true,
                autoCloseTags: true,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                lineWrapping: true,
                tabSize: 2,
                indentWithTabs: false,
                extraKeys: {
                    "Ctrl-Space": (cm) => {
                        ternServer.complete(cm);
                    },
                    "Ctrl-U": (cm) => cm.execCommand("foldAll"),
                    "Ctrl-I": (cm) => cm.execCommand("unfoldAll"),
                },
            });

            instance.execCommand("foldAll");
            setCodemirror(instance);

            instance.on("change", (instance) => {
                setCode(instance.getValue());
            });

            instance.on("cursorActivity", (instance) => {
                ternServer.updateArgHints(instance);
            });

            instance.on("keyup", () => {
                const cursor = instance.getCursor();
                const token = instance.getTokenAt(cursor);
                if (
                    !instance.state.completionActive &&
                    token.type === "variable"
                ) {
                    ternServer.complete(instance);
                }
            });
        }
    }, []);

    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.height = canvasRef.current.clientHeight;
            canvasRef.current.width = canvasRef.current.clientWidth;
        }
    }, [canvasRef.current]);

    const run = () => {
        if (running) return;
        if (!canvasRef.current || code.length === 0) return;

        const res = runGame(code, canvasRef.current, (error) => {
            alert("Error: " + error.description);
            console.error(error);
        });

        canvasRef.current.focus();

        if (res) {
            cleanupRef.current = res.cleanup;
            setRunning(true);
        }
    };

    const stop = () => {
        if (!running) return;
        cleanupRef.current?.();
        setRunning(false);
    };

    useEffect(() => {
        localStorage.setItem("code", code);
        if (code.length === 0) return;
        const { error, cleanup } = _performSyntaxCheck(code);
        setError(error);
        return cleanup;
    }, [code]);

    return (
        <>
            <div className={"flex p-2 w-full space-x-2 h-screen bg-gray-900"}>
                <div className={"flex flex-col w-3/5 space-y-2"}>
                    <div
                        ref={editorRef}
                        className={"flex-1 w-full overflow-y-auto"}
                    />
                    <PngToSprite />
                </div>
                <div className={"flex flex-col w-2/5 space-y-2"}>
                    <div className="w-full relative">
                        <canvas
                            ref={canvasRef}
                            className="w-full aspect-[5/4] bg-gray-800 rounded-lg focus:outline-none"
                            tabIndex={0}
                        />
                        <button
                            onClick={running ? stop : run}
                            className={
                                "absolute z-10 right-2 top-2 text-gray-100 hover:text-gray-300 transition-colors focus:outline-none"
                            }
                        >
                            {running ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-square"
                                >
                                    <rect
                                        width="18"
                                        height="18"
                                        x="3"
                                        y="3"
                                        rx="2"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <polygon points="6 3 20 12 6 21 6 3" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div
                        className={"w-full flex-1 bg-[#263238] rounded-lg p-4"}
                    >
                        <div className={"text-gray-200"}>Errors</div>
                        <div className={"w-full"}>
                            {error && (
                                <pre
                                    className={
                                        "text-sm text-red-500 overflow-auto"
                                    }
                                >
                                    {error.description}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CodeEditor;
