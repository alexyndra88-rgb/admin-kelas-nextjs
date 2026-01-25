import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = Date.now() + "_" + file.name.replaceAll(" ", "_");

    try {
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await writeFile(path.join(uploadDir, filename), buffer);
        return NextResponse.json({
            message: "Success",
            url: `/uploads/${filename}`
        });
    } catch (error) {
        console.error("Error occured ", error);
        return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
    }
}
