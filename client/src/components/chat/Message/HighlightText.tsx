interface HighlightTextProps {
    text: string;
    highlight: string;
}

const HighlightText = ({ text, highlight }: HighlightTextProps) => {
    if (!highlight || !highlight.trim()) return <>{text}</>;
    
    // Escape special characters for regex
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);
    
    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="highlight-text">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

export default HighlightText;
