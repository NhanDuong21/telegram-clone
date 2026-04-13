import { useMemo } from "react";
import { X, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { Message, User } from "../../../types";
import Avatar from "../../common/Avatar";
import "./SearchSidebar.css";

interface SearchSidebarProps {
    messages: Message[];
    onClose: () => void;
    onScrollToMessage: (id: string) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

const SearchSidebar = ({ messages, onClose, onScrollToMessage, searchQuery, onSearchChange }: SearchSidebarProps) => {
    const results = useMemo(() => {
        if (!searchQuery?.trim()) return [];
        const q = searchQuery.toLowerCase();
        return (messages || []).filter(m => {
            if (!m.text) return false;
            return m.text.toLowerCase().includes(q);
        });
    }, [messages, searchQuery]);

    const formatDateShort = (iso: string) => {
        if (!iso) return "--/--";
        const d = new Date(iso);
        return d.toLocaleDateString([], { month: "2-digit", day: "2-digit" });
    };

    const renderSnippet = (text: string, highlight: string) => {
        if (!highlight || !text) return text || "";
        const q = highlight.toLowerCase();
        const index = text.toLowerCase().indexOf(q);
        if (index === -1) return text;

        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + q.length + 30);
        const prefix = start > 0 ? "..." : "";
        const suffix = end < text.length ? "..." : "";

        const snippet = text.substring(start, end);
        const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = snippet.split(regex);

        return (
            <span>
                {prefix}
                {parts.map((part, i) => 
                    part.toLowerCase() === q ? (
                        <span key={i} className="search-result-highlight">{part}</span>
                    ) : (
                        part
                    )
                )}
                {suffix}
            </span>
        );
    };

    return (
        <motion.div 
            initial={{ width: 0, x: 20, opacity: 0 }}
            animate={{ width: 350, x: 0, opacity: 1 }}
            exit={{ width: 0, x: 20, opacity: 0 }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="search-sidebar"
            style={{ overflow: 'hidden' }}
        >
            <div style={{ width: 350 }}> {/* Fixed width inner container to prevent content squushing */}
                <div className="search-sidebar-header">
                    <button className="search-sidebar-close" onClick={onClose} aria-label="Close search">
                        <X size={22} />
                    </button>
                    <div className="search-sidebar-title">Tìm kiếm</div>
                </div>

            <div className="search-sidebar-input-row">
                <div className="search-sidebar-input-wrapper">
                    <Search size={18} className="search-input-icon" />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        value={searchQuery || ""}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => onSearchChange("")}>
                            Xóa
                        </button>
                    )}
                </div>
            </div>

            <div className="search-results-list">
                {!searchQuery?.trim() ? (
                    <div className="search-empty-state">Nhập từ khóa để tìm kiếm tin nhắn</div>
                ) : results.length === 0 ? (
                    <div className="search-empty-state">Không tìm thấy tin nhắn nào</div>
                ) : (
                    results.map((msg) => {
                        const sender = msg.sender as unknown as User;
                        return (
                            <div 
                                key={msg._id} 
                                className="search-result-item"
                                onClick={() => onScrollToMessage(msg._id)}
                            >
                                <div className="result-avatar">
                                    <Avatar user={sender} size={36} />
                                </div>
                                <div className="result-content">
                                    <div className="result-top">
                                        <span className="result-name">{sender?.fullName || sender?.username || "Người dùng"}</span>
                                        <span className="result-date">{formatDateShort(msg.createdAt)}</span>
                                    </div>
                                    <div className="result-snippet">
                                        {renderSnippet(msg.text || "", searchQuery)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
          </div>
        </motion.div>
    );
};

export default SearchSidebar;
