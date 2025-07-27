import { WebSocketProvider } from "@/contexts/WebSocketContext";

export default function RoomLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <WebSocketProvider>{children}</WebSocketProvider>;
}
