import { useEffect, useState } from "preact/hooks";
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
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [sprite, setSprite] = useState<string | null>(null);
    const [spriteImage, setSpriteImage] = useState<string | null>(null);

    const handleChange = (element: HTMLInputElement) => {
        if (!element.files) return;
        const file = element.files[0];
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
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
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
        <div
            className={
                "w-full rounded-md flex max-md:flex-col bg-gray-800 text-white p-4 justify-between overflow-x-auto space-y-2 md:space-y-0"
            }
        >
            <div className={"flex flex-col space-y-2 mr-2"}>
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-blue-500 w-full text-center py-2 rounded-md hover:bg-blue-600 h-fit"
                >
                    Choose File
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleChange(e.currentTarget)}
                />
                <div className="flex">
                    {spriteImage && image?.src && (
                        <img
                            src={image?.src}
                            className={
                                "bg-gray-700 rounded-md w-1/2 md:w-40 aspect-square mr-2"
                            }
                        />
                    )}
                    {spriteImage && (
                        <img
                            src={spriteImage}
                            className={
                                "bg-gray-700 w-1/2 md:w-40 aspect-square rounded-md"
                            }
                        />
                    )}
                </div>
            </div>

            {sprite && (
                <div className={"flex flex-col relative"}>
                    <pre
                        className={
                            "bg-gray-700 rounded-md text-xs p-2 leading-none w-full md:w-52 h-fit text-center"
                        }
                    >
                        {sprite}
                    </pre>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(sprite);
                            alert("Copied to clipboard");
                        }}
                        className={"text-xs absolute z-10 right-2 top-2"}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="lucide lucide-copy"
                        >
                            <rect
                                width="14"
                                height="14"
                                x="8"
                                y="8"
                                rx="2"
                                ry="2"
                            />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
