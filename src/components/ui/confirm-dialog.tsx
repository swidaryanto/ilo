"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description: string;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
}: ConfirmDialogProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            setTimeout(() => setIsVisible(false), 200); // Wait for animation
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={onClose}
        >
            <div
                className={cn(
                    "w-[90%] max-w-[400px] bg-background p-6 rounded-2xl shadow-xl transition-all duration-200 transform scale-100",
                    isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col gap-4">
                    {/* The user requested design doesn't really have a title "Are you sure..." is the content */}
                    <p className="text-base font-medium leading-relaxed">
                        {description}
                    </p>

                    <div className="flex justify-end gap-2 mt-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="bg-[#1F7A9E] hover:bg-[#165E7A] text-white font-medium px-6 rounded-lg"
                        >
                            OK
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
