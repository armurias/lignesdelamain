"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import Image from "next/image";

interface FileUploadProps {
    image: string | null;
    onImageChange: (image: string | null) => void;
    analyzing: boolean;
    result: string | null;
    onAnalyze: () => void;
}

export default function FileUpload({ image, onImageChange, analyzing, result, onAnalyze }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageChange(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageChange(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div
            className={`glass-panel rounded-2xl p-8 text-center transition-all duration-300 ${image ? 'border-purple-500/50' : 'border-white/10 hover:border-purple-400/30'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {!image ? (
                <div
                    className="flex flex-col items-center gap-6 cursor-pointer py-10"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Télécharger une photo</h3>
                        <p className="text-sm text-gray-400">Glissez-déposez ou cliquez pour parcourir</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-white/20">
                        <Image src={image} alt="Uploaded Hand" fill className="object-cover" />
                    </div>

                    {!result && !analyzing && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => onImageChange(null)}
                                className="flex-1 py-3 px-6 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium text-sm"
                            >
                                Changer
                            </button>
                            <button
                                onClick={onAnalyze}
                                className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-900/50 transition-all transform hover:scale-105"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Lire ma main
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
