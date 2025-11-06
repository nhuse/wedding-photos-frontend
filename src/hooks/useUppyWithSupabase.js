import { useState, useEffect } from "react";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

// Use environment variables for Supabase credentials
const projectURL = process.env.REACT_APP_SUPABASE_URL;
const secretKey = process.env.REACT_APP_SUPABASE_SECRET_KEY;

/**
 * Custom hook for configuring Uppy with Supabase authentication and TUS resumable uploads
 * @returns {Object} uppy - Uppy instance with configured upload settings.
 */
export const useUppyWithSupabase = () => {
    const [uppy] = useState(() => new Uppy());
    // No need for supabase client or session for public uploads

    useEffect(() => {
        if (!uppy.getPlugin('Tus')) {
            uppy.use(Tus, {
                endpoint: `${projectURL}/storage/v1/upload/resumable`,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    apikey: secretKey,
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true,
                chunkSize: 6 * 1024 * 1024,
                allowedMetaFields: [
                    "bucketName",
                    "objectName",
                    "contentType",
                    "cacheControl",
                ],
                onError: (error) => console.error("Upload error:", error),
            }).on("file-added", (file) => {
                let bucketName;
                if (file.type.startsWith("image/")) {
                    bucketName = "images";
                } else if (file.type.startsWith("video/")) {
                    bucketName = "videos";
                } else {
                    console.error("File type not supported");
                    return;
                }
                file.meta = {
                    ...file.meta,
                    bucketName,
                    objectName: file.name,
                    contentType: file.type,
                };
            });
        }

        return () => {
            uppy.destroy();
        };
    }, [uppy]);

    return uppy;
}; 