import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    let ext = path.extname(file.name).toLowerCase();
    let name = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    if (ext === ".avif") {
      const converted = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
      buffer = Buffer.from(converted);
      name = name.replace(/\.avif$/i, ".jpg");
      ext = ".jpg";
    }

    const filename = `${Date.now()}-${name}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", filename);

    await writeFile(uploadPath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
