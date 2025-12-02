import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisible = () => {
            if (window.scrollY > 200) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };
        window.addEventListener("scroll", toggleVisible);
        return () => window.removeEventListener("scroll", toggleVisible);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {visible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-5 right-5 hover:bg-[#a78bfa] bg-[#8b5cf6] text-white p-3 rounded-full shadow-xl transition-all duration-300"
                >
                    <ArrowUp size={20} />
                </button>
            )}
        </>
    );
}
