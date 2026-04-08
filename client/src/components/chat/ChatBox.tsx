import { useEffect, useRef } from "react";

export interface Message {
    _id: string;
    text: string;
    sender: {
        _id: string;
        username: string;
    };
    createdAt: string;
}

interface ChatBoxProps {
    messages: Message[];
    currentUserId: string;
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatBox = ({ messages, currentUserId }: ChatBoxProps) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#bbb",
                    fontSize: "14px",
                }}
            >
                Chưa có tin nhắn nào. Hãy nói lời chào !!
            </div>
        );
    }

    return (
        <div
            style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
            }}
        >
            {messages.map((msg) => {
                const isMe = msg.sender._id === currentUserId;
                return (
                    <div
                        key={msg._id}
                        style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                        }}
                    >
                        <div
                            style={{
                                maxWidth: "65%",
                                padding: "8px 12px",
                                borderRadius: isMe
                                    ? "16px 16px 4px 16px"
                                    : "16px 16px 16px 4px",
                                backgroundColor: isMe ? "#0088cc" : "#f0f0f0",
                                color: isMe ? "white" : "#222",
                                fontSize: "14px",
                                lineHeight: "1.4",
                                wordBreak: "break-word",
                            }}
                        >
                            {!isMe && (
                                <div
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#0088cc",
                                        marginBottom: "2px",
                                    }}
                                >
                                    {msg.sender.username}
                                </div>
                            )}
                            <div>{msg.text}</div>
                            <div
                                style={{
                                    fontSize: "10px",
                                    marginTop: "4px",
                                    textAlign: "right",
                                    opacity: 0.6,
                                }}
                            >
                                {formatTime(msg.createdAt)}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatBox;
