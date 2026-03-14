import JSZip from 'jszip';
import { ref, getBlob, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

const ASSET_FIELDS = [
    'thumbnail',
    'image',
    'evidenceImage',
    'suspectImage',
    'media',
    'background',
    'characterImage',
    'fileUrl',
    'profileImage',
    'portrait',
    'images', // Array field
    'screenshots', // Array field
    'blueprintUrl',
    'url',
    'bgMusicUrl',
    'culpritImage',
    'videoUrl',
    'audioUrl',
    'attachmentUrl',
    'icon',
    'avatar'
];

/**
 * Extracts the folder and filename from a Firebase Storage URL
 */
function parseStorageUrl(url) {
    try {
        if (!url.includes('firebasestorage.googleapis.com')) return null;

        // Pattern: .../o/folder%2Fsubfolder%2Ffilename?alt=media...
        const pathPart = url.split('/o/')[1]?.split('?')[0];
        if (!pathPart) return null;

        const decodedPath = decodeURIComponent(pathPart);
        const parts = decodedPath.split('/');
        const fileName = parts.pop();
        const folder = parts.join('/');

        return { folder, fileName };
    } catch (e) {
        console.warn("[ARCHIVE] Failed to parse storage URL", e);
        return null;
    }
}

/**
 * Recursively find all asset URLs in an object
 */
function findAssets(obj, assets = new Set()) {
    if (!obj || typeof obj !== 'object') return assets;

    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'string' && value.startsWith('http')) {
            const isAssetField = ASSET_FIELDS.includes(key);
            const isStorageUrl = value.includes('firebasestorage.googleapis.com');
            const isUnsplash = value.includes('images.unsplash.com');

            // Be aggressive: if it's a storage URL or an asset field, capture it
            if (isStorageUrl || isAssetField || isUnsplash) {
                assets.add(value);
            }
        } else if (Array.isArray(value)) {
            // Check if this array itself is marked as an asset field (like 'images')
            const isAssetField = ASSET_FIELDS.includes(key);
            value.forEach(item => {
                if (typeof item === 'string' && item.startsWith('http')) {
                    if (isAssetField || item.includes('firebasestorage.googleapis.com')) {
                        assets.add(item);
                    }
                } else {
                    findAssets(item, assets);
                }
            });
        } else if (typeof value === 'object') {
            findAssets(value, assets);
        }
    }
    return assets;
}

/**
 * Recursively replace asset URLs in an object
 */
function replaceAssetUrls(obj, mapping) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => replaceAssetUrls(item, mapping));
    }

    const newObj = {};
    for (const key in obj) {
        let value = obj[key];
        if (typeof value === 'string' && mapping[value]) {
            newObj[key] = mapping[value];
        } else if (typeof value === 'object') {
            newObj[key] = replaceAssetUrls(value, mapping);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}

export const exportCaseToZip = async (caseData) => {
    const zip = new JSZip();
    const assetUrls = findAssets(caseData);
    const assetMapping = {};
    const assetsFolder = zip.folder("assets");

    const assetList = Array.from(assetUrls);
    console.log(`[EXPORT] Found ${assetList.length} assets to package.`);

    const downloadPromises = assetList.map(async (url, index) => {
        try {
            let blob;
            let folderPath = "";
            let originalFileName = "";

            const storageInfo = parseStorageUrl(url);
            if (storageInfo) {
                folderPath = storageInfo.folder;
                originalFileName = storageInfo.fileName;

                // Use Firebase Storage SDK for better CORS handling
                const storageRef = ref(storage, url);
                blob = await getBlob(storageRef);
            } else {
                // Direct fetch for external URLs (like Unsplash)
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                blob = await response.blob();

                // Extract filename from URL if possible
                const urlPath = url.split(/[?#]/)[0];
                originalFileName = urlPath.split('/').pop();
            }

            // Determine extension if missing
            let extension = 'bin';
            const parts = originalFileName.split('.');
            if (parts.length > 1) {
                const ext = parts.pop().toLowerCase();
                if (ext.length <= 4) extension = ext;
            }
            if (extension === 'bin' && blob.type) {
                const typeExt = blob.type.split('/')[1];
                if (typeExt) extension = typeExt;
            }

            // Create a clean filename
            const cleanFileName = originalFileName || `asset_${index}.${extension}`;

            // Maintain folder structure inside the 'assets' zip folder if it exists
            const zipPath = folderPath
                ? `assets/${folderPath}/${cleanFileName}`
                : `assets/${cleanFileName}`;

            zip.file(zipPath, blob);
            assetMapping[url] = zipPath;
        } catch (err) {
            console.warn(`[EXPORT] Failed to package asset: ${url}`, err);
            // Fallback: keep original URL - it won't be replaced in mapping
        }
    });

    await Promise.all(downloadPromises);

    const updatedCaseData = replaceAssetUrls(caseData, assetMapping);
    zip.file("case.json", JSON.stringify(updatedCaseData, null, 2));

    return await zip.generateAsync({ type: "blob" });
};

export const importCaseFromZip = async (zipBlob) => {
    const zip = await JSZip.loadAsync(zipBlob);
    const caseFile = zip.file("case.json");
    if (!caseFile) throw new Error("Invalid ZIP format: case.json is missing.");

    const caseData = JSON.parse(await caseFile.async("string"));
    const assetsFolder = zip.folder("assets");
    const assetMapping = {};

    if (assetsFolder) {
        const assetFiles = [];
        // Walk through all files in the assets folder (including subfolders)
        zip.folder("assets").forEach((relativePath, file) => {
            if (!file.dir) {
                assetFiles.push({ relativePath, file });
            }
        });

        console.log(`[IMPORT] Uploading ${assetFiles.length} assets to Storage...`);

        const uploadPromises = assetFiles.map(async ({ relativePath, file }) => {
            try {
                const blob = await file.async("blob");

                // Extract original folder structure from relativePath: "blueprints/file.jpg"
                const pathParts = relativePath.split('/');
                const fileName = pathParts.pop();
                const originalFolder = pathParts.join('/'); // e.g. "blueprints"

                // Use the original folder name if available, otherwise 'imported_assets'
                const targetFolder = originalFolder || 'imported_assets';

                // Construct a unique but organized storage path
                // Prefix with 'imported/' to distinguish from original files
                const storagePath = `imported/${targetFolder}/${Date.now()}_${fileName}`;
                const storageRef = ref(storage, storagePath);

                await uploadBytes(storageRef, blob, { contentType: blob.type });
                const downloadURL = await getDownloadURL(storageRef);

                // Remap the relative path in JSON to the new Storage URL
                assetMapping[`assets/${relativePath}`] = downloadURL;
            } catch (err) {
                console.error(`[IMPORT] Failed to upload asset ${relativePath}:`, err);
            }
        });

        await Promise.all(uploadPromises);
    }

    return replaceAssetUrls(caseData, assetMapping);
};
