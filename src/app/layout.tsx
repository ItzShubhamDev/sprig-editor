import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Sprig Editor",
    description: "",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
