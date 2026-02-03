import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { generateImage } from './ai';

/**
 * Generates an AI image for evidence and uploads it to Firebase Storage
 * @param {string} evidenceDescription - Description of the evidence
 * @param {string} evidenceLabel - Label/name of the evidence
 * @param {string} caseId - The case ID for organizing storage
 * @param {string} nodeId - The node ID for unique naming
 * @param {string} apiKey - AI API key for image generation
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export async function generateAndUploadEvidenceImage(evidenceDescription, evidenceLabel, caseId, nodeId, apiKey) {
    try {
        // AI Image Generation is currently disabled to reduce costs
        // We use a descriptive placeholder instead
        const imageBlob = await createPlaceholderEvidenceImage(evidenceLabel);

        if (!imageBlob) {
            throw new Error('Failed to generate image blob');
        }

        // Upload to Firebase Storage
        const fileName = `evidence-${nodeId}-${Date.now()}.png`;
        const storageRef = ref(storage, `cases/${caseId}/evidence/${fileName}`);

        await uploadBytes(storageRef, imageBlob);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;

    } catch (error) {
        // Return null if generation fails - node remains functional
        return null;
    }
}

/**
 * Creates a placeholder evidence image using Canvas API
 * This is a fallback when AI image generation fails
 */
async function createPlaceholderEvidenceImage(label) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        // Create a gradient background
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);

        // Add border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 8;
        ctx.strokeRect(20, 20, 760, 560);

        // Add "EVIDENCE" label
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EVIDENCE', 400, 80);

        // Add evidence label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';

        // Word wrap for long labels
        const words = label.split(' ');
        let line = '';
        let y = 300;
        const maxWidth = 700;

        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, 400, y);
                line = word + ' ';
                y += 60;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 400, y);

        // Add case number
        ctx.fillStyle = '#888888';
        ctx.font = '20px monospace';
        ctx.fillText(`CASE #${Date.now().toString().slice(-6)}`, 400, 550);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}

/**
 * Batch generate images for multiple evidence nodes
 * @param {Array} evidenceNodes - Array of evidence node objects
 * @param {string} caseId - The case ID
 * @param {string} apiKey - AI API key for image generation
 * @returns {Promise<Map>} - Map of nodeId to image URL
 */
export async function generateEvidenceImagesForNodes(evidenceNodes, caseId, apiKey) {
    const imageUrls = new Map();

    // Generate images in parallel (limit to 3 at a time)
    const batchSize = 3;
    for (let i = 0; i < evidenceNodes.length; i += batchSize) {
        const batch = evidenceNodes.slice(i, i + batchSize);

        const promises = batch.map(async (node) => {
            const description = node.data.description || node.data.label || 'Evidence item';
            const label = node.data.label || 'Evidence';

            const imageUrl = await generateAndUploadEvidenceImage(
                description,
                label,
                caseId,
                node.id,
                apiKey
            );

            if (imageUrl) {
                imageUrls.set(node.id, imageUrl);
            }
        });

        await Promise.all(promises);

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < evidenceNodes.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return imageUrls;
}
