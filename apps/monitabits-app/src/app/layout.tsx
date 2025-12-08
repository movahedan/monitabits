import "./styles.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./_components/providers";

export const metadata: Metadata = {
	title: "Monitabits | Quit Smoking Tracker",
	description: "A self-accountability application to help you quit smoking",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Monitabits",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	themeColor: "#ffffff",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-background font-sans antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
