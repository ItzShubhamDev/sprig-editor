import { useEffect, useRef, useState } from "preact/hooks";
import CodeMirror from "codemirror";
import type { Editor } from "codemirror";

import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/addon/hint/show-hint.css";

import "codemirror/mode/javascript/javascript";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/hint/show-hint";

import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter.css";
import "./editor.css";
import { _performSyntaxCheck, runGame } from "../lib/engine";
import keywords from "../lib/utils/keywords";
import { PngToSprite } from "./pngToSprite";

type Error = ReturnType<typeof _performSyntaxCheck>;

const CodeEditor = () => {
    const editorRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [codemirror, setCodemirror] = useState<Editor | null>(null);
    const [code, setCode] = useState<string>("");
    const [error, setError] = useState<Error["error"] | null>(null);
    const [running, setRunning] = useState<boolean>(false);

    useEffect(() => {
        if (editorRef.current && !codemirror) {
            CodeMirror.registerHelper(
                "hint",
                "javascript",
                (editor: Editor) => {
                    const cursor = editor.getCursor();
                    const token = editor.getTokenAt(cursor);
                    const start = token.string;
                    if (start === "") return;
                    const completions: string[] = [];
                    keywords.forEach((key) => {
                        if (key.startsWith(start)) {
                            completions.push(key);
                        }
                    });
                    return {
                        list: completions,
                        from: CodeMirror.Pos(cursor.line, token.start),
                        to: CodeMirror.Pos(cursor.line, token.end),
                    };
                }
            );
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
                    "Ctrl-Space": "autocomplete",
                },
            });

            setCodemirror(instance);

            instance.on("change", (instance) => {
                setCode(instance.getValue());
            });

            instance.on("keyup", (_, event) => {
                if (!instance.state.completionActive && event.key !== "Enter") {
                    CodeMirror.showHint(instance);
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
        runGame(code, canvasRef.current, (error) => {
            console.error(error);
        });
        canvasRef.current.focus();
    };

    useEffect(() => {
        if (code.length === 0) return;
        const { error, cleanup } = _performSyntaxCheck(code);
        setError(error);
        return cleanup;
    }, [code]);

    return (
        <>
            <div className={"flex p-2 w-full space-x-2 h-screen bg-gray-900"}>
                <div className={"flex flex-col w-3/5 space-y-2"}>
                    <div className={"flex-1 w-full relative"}>
                        <div
                            ref={editorRef}
                            className={"hover:cursor-text h-full"}
                        />
                        <button
                            onClick={run}
                            className={
                                "absolute right-2 top-2 text-gray-100 hover:text-gray-300 transition-colors focus:outline-none"
                            }
                        >
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
                        </button>
                    </div>
                    <PngToSprite />
                </div>
                <div className={"flex flex-col w-2/5 space-y-2"}>
                    <canvas
                        ref={canvasRef}
                        className="w-full aspect-[5/4] bg-gray-800 rounded-lg focus:outline-none"
                        tabIndex={0}
                    />
                    <div
                        className={"w-full flex-1 bg-[#263238] rounded-lg p-4"}
                    >
                        <div className={"text-gray-200"}>Errors</div>
                        <div className={"w-full"}>
                            {error && (
                                <pre className={"text-sm text-red-500 overflow-auto"}>
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
