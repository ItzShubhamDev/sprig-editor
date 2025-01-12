"use client";
import { PngToSprite } from "@/components/pngToSprite";
import { runGame } from "@/utils/sprig";
import { useRef, useEffect, useState } from "react";
import { webEngine } from "sprig/web";

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const initialize = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            const game = webEngine(canvas);
            runGame(game);
            canvas.focus();
            return game;
        }
    };

    useEffect(() => {
        const game = initialize();
        return () => {
            game?.cleanup();
        };
    }, []);

    return (
        <div className="w-full min-h-screen p-8 lg:flex space-x-4 bg-gray-900">
            <canvas
                width={500}
                height={400}
                ref={canvasRef}
                tabIndex={0}
                className="rounded-lg w-[500px] h-[400px] lg:w-[750px] lg:h-[600px] bg-black focus:outline-none focus:border-4 border-gray-200"
            ></canvas>
            <PngToSprite />
        </div>
    );
}
