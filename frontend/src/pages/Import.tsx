import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Import: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { user } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('http://localhost:4000/api/v1/import/youtube', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user?.token}`,
                },
            });
            setMessage({ type: 'success', text: 'Data imported successfully!' });
            setFile(null);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to import data. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="text-center">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Import Data</h1>
                <p className="text-muted-foreground mt-2">Upload your YouTube history to track past activity.</p>
            </header>

            <div className="card-minimal p-8 border-dashed border-2 border-border hover:border-primary/50 transition-colors duration-300 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-10 h-10 text-primary" />
                    </div>

                    <h3 className="text-xl font-semibold text-foreground mb-2">Upload JSON File</h3>
                    <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                        Drag and drop your Google Takeout JSON file here, or click to browse.
                    </p>

                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />

                    <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-muted text-primary font-medium cursor-pointer hover:bg-muted/80 hover:text-primary transition-all border border-border hover:border-primary/30"
                    >
                        <FileJson className="w-5 h-5 mr-2" />
                        {file ? file.name : 'Select File'}
                    </label>

                    {file && (
                        <div className="mt-8 animate-fade-in">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center space-x-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Importing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        <span>Start Import</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 ${message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="card-minimal p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                    <li>Go to <a href="#" className="text-primary hover:underline">Google Takeout</a>.</li>
                    <li>Deselect all, then select only <strong>YouTube and YouTube Music</strong>.</li>
                    <li>Choose "history" format as JSON.</li>
                    <li>Download and extract the zip file.</li>
                    <li>Upload the <code>watch-history.json</code> file here.</li>
                </ol>
            </div>
        </div>
    );
};

export default Import;
