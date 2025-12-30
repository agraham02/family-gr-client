import { WebSocketProvider } from "@/contexts/WebSocketContext";
import ReconnectingBanner from "@/components/ReconnectingBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RoomLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WebSocketProvider>
            <ErrorBoundary>
                <ReconnectingBanner />
                {children}
            </ErrorBoundary>
        </WebSocketProvider>
    );
}
