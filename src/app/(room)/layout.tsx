import { WebSocketProvider } from "@/contexts/WebSocketContext";
import ReconnectingBanner from "@/components/ReconnectingBanner";

export default function RoomLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WebSocketProvider>
            <ReconnectingBanner />
            {children}
        </WebSocketProvider>
    );
}
