"use client";

import { useStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X } from "lucide-react";
import { useState, useEffect } from "react";

export const MateWidget = () => {
    const { isMateActive, settings, toggleMate } = useStore();
    const [message, setMessage] = useState("I'm watching your wallet, pal.");

    // Mock "Sarcasm Engine" updates
    useEffect(() => {
        if (!isMateActive) return;

        const messages = [
            "Do you really need that?",
            "Your bank account is crying.",
            "I've seen better choices in a dollar store.",
            "Buying this won't fill the void.",
            "Adding to cart... regret loading...",
        ];

        const interval = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 10000);

        return () => clearInterval(interval);
    }, [isMateActive]);

    if (!isMateActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-24 right-6 bg-gradient-to-br from-purple-900 to-black border border-purple-500/30 p-4 rounded-xl shadow-lg shadow-purple-500/10 max-w-xs z-50 backdrop-blur-md"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                        <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm text-purple-200 mb-1">Shopaholics Mate</h3>
                        <p className="text-xs text-slate-300 italic">"{message}"</p>
                    </div>
                    <button onClick={toggleMate} className="text-slate-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-purple-400 bg-purple-500/10 w-fit px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                    ACTIVE JUDGMENT
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
