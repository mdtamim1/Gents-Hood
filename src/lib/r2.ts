import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID || '06bbfed101d103050baf1e518c7548fb';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '76a6682f3378c73479411cc92c317dee';
const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY ||
  '5224336a45b4112054742c0798e613e077ad83feebfe92f6574f32b0321ffb0d';
const bucketName = process.env.R2_BUCKET_NAME || 'gentshood-media';
const publicUrl = (process.env.R2_PUBLIC_URL || 'https://media.gentshood.com').replace(/\/$/, '');

export const isR2Configured = Boolean(accessKeyId && secretAccessKey && accountId);

export const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export interface R2UploadResult {
  success: boolean;
  url: string;
  key: string;
  error?: string;
}

/**
 * Upload a file buffer directly to Cloudflare R2 bucket
 * with 1-year immutable edge CDN cache headers.
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/webp'
): Promise<R2UploadResult> {
  if (!r2Client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const cleanKey = key.replace(/^\/+/, '');

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return {
    success: true,
    url: `${publicUrl}/${cleanKey}`,
    key: cleanKey,
  };
}

/**
 * Delete a file object from Cloudflare R2 bucket
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!r2Client) return false;
  try {
    const cleanKey = key.replace(/^\/+/, '');
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      })
    );
    return true;
  } catch (error) {
    console.error('Failed to delete from R2:', error);
    return false;
  }
}
