import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface FileUploadProps {
    onUpload: (fileName: string, base64: string, contentType: string) => Promise<void>;
    isLoading: boolean;
}

export function FileUpload({ onUpload, isLoading }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFile = (selectedFile: File) => {
        if (selectedFile.type !== "application/pdf") {
            setError("Please upload a PDF statement.");
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError("File is too large (max 10MB).");
            return;
        }
        setFile(selectedFile);
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                await onUpload(file.name, base64, file.type);
                setFile(null);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError("Failed to read file.");
        }
    };

    return (
        <div className="w-full space-y-4">
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center",
                    dragActive ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : "border-slate-200 bg-white hover:border-slate-300",
                    isLoading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleChange}
                />

                {file ? (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <FileText size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">{file.name}</p>
                            <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setFile(null)} className="rounded-full">
                                <X size={14} className="mr-1" /> Remove
                            </Button>
                            <Button size="sm" onClick={handleSubmit} className="rounded-full bg-blue-600 hover:bg-blue-700">
                                <CheckCircle2 size={14} className="mr-1" /> Ingest
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                            <Upload size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Upload Your Statement</p>
                            <p className="text-xs text-slate-500">Drag & drop or <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:underline">browse</button></p>
                            <p className="text-[10px] text-slate-400 mt-2 italic">PDF statements only (max 10MB)</p>
                        </div>
                    </>
                )}

                {error && (
                    <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-red-500 text-xs font-medium animate-in slide-in-from-top-2 duration-300">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
            </div>
        </div>
    );
}
