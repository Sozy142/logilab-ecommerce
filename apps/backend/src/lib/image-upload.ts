import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env.js";
import { badRequest } from "./app-error.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Không dùng static key — SDK tự lấy credentials qua default provider chain
// (IAM role của EC2 instance khi chạy production, AWS CLI credentials của
// máy dev khi chạy local), giống cách backup-db.sh dùng AWS CLI.
const s3 = new S3Client({ region: env.awsRegion });

// Nén + đưa mọi ảnh về cùng 1 định dạng (WebP) và giới hạn kích thước, tránh
// admin lỡ dán ảnh gốc vài chục MB làm trang chậm. Không phóng to ảnh nhỏ.
export async function processAndUploadImage(buffer: Buffer, mimetype: string): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    throw badRequest("File không phải ảnh hợp lệ (chỉ nhận JPEG/PNG/WebP)");
  }

  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .rotate() // tự xoay theo EXIF orientation trước khi bỏ EXIF
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw badRequest("File không phải ảnh hợp lệ (không đọc được nội dung ảnh)");
  }

  const key = `${randomUUID()}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.mediaBucket,
      Key: key,
      Body: processed,
      ContentType: "image/webp",
    })
  );

  return `https://${env.mediaBucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
}
