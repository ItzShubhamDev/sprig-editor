"use client";

import React from "react";
import { palette } from "sprig/base";

function getColorValue(pixel: number[]) {
    let closestDistance = Infinity;
    let closestColor = palette[0];

    palette.forEach((p) => {
        const distance = Math.sqrt(
            (pixel[0] - p[1][0]) ** 2 +
                (pixel[1] - p[1][1]) ** 2 +
                (pixel[2] - p[1][2]) ** 2 +
                (pixel[3] - p[1][3]) ** 2
        );
        if (distance < closestDistance) {
            closestDistance = distance;
            closestColor = p;
        }
    });

    return closestColor;
}

export function PngToSprite() {
    const [image, setImage] = React.useState<HTMLImageElement | null>(null);
    const [sprite, setSprite] = React.useState<string | null>(null);
    const [spriteImage, setSpriteImage] = React.useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    setImage(img);
                    generateSprite(img);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const generateSprite = async (img: HTMLImageElement) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 16;
        canvas.height = 16;

        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 16, 16);

        const sprite = [];
        for (let y = 0; y < 16; y++) {
            let row = "";
            for (let x = 0; x < 16; x++) {
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                const color = getColorValue([
                    pixel[0],
                    pixel[1],
                    pixel[2],
                    pixel[3],
                ]);
                row += color[0];
            }
            sprite.push(row);
        }
        setSprite(sprite.join("\n"));

        const spriteCanvas = document.createElement("canvas");
        const spriteCtx = spriteCanvas.getContext("2d");
        if (!spriteCtx) return;

        spriteCanvas.width = 128;
        spriteCanvas.height = 128;

        sprite.forEach((row, y) => {
            row.split("").forEach((code, x) => {
                const color = palette.find((p) => p[0] === code)?.[1];
                if (!color) return;
                spriteCtx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
                spriteCtx.fillRect(x * 8, y * 8, 8, 8);
            });
        });

        setSpriteImage(spriteCanvas.toDataURL());
    };

    return (
        <div className="w-full rounded-md flex flex-col 2xl:flex-row bg-gray-700 p-4">
            <div className="flex flex-col h-40">
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"   
                    onChange={handleChange}
                    className="w-56 text-white"
                />
                {image?.src && <img src={image?.src} className="mt-4 w-32" />}
            </div>
            <div className="flex flex-col ml-4 items-center space-y-2 text-white">
                <h1 className="text-xl font-semibold">Generated Sprite</h1>
                <div className="flex space-x-2">
                    {spriteImage && (
                        <img src={spriteImage} className="w-32 h-32 rounded-md" />
                    )}
                    {sprite && (
                        <div className="flex flex-col items-center space-y-2">
                            <pre className="bg-gray-800 rounded-md text-sm p-2 leading-none">
                                {sprite}
                            </pre>
                            <button
                                className="ml-2 bg-gray-800 p-2 py-1 rounded-md"
                                onClick={() => {
                                    navigator.clipboard.writeText(sprite);
                                    alert("Copied to clipboard");
                                }}
                            >
                                Copy
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
