import { motion } from "framer-motion";
import { X, Search } from "lucide-react";
import "./ChatSearch.css";

interface ChatSearchProps {
    query: string;
    onQueryChange: (q: string) => void;
    onClose: () => void;
}

const ChatSearch = ({ query, onQueryChange, onClose }: ChatSearchProps) => {
    return (
        <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="chat-search-bar"
        >
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon-inner" />
                <input 
                    autoFocus
                    type="text" 
                    placeholder="Tìm kiếm tin nhắn..." 
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    className="chat-search-input"
                />
            </div>
            <button className="search-close-btn" onClick={onClose}>
                <X size={20} />
            </button>
        </motion.div>
    );
};

export default ChatSearch;
