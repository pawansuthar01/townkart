import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  context: { params: { applicationId: string; documentType: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, documentType } = context.params;

    // ==========================
    // 1️⃣ TRY FETCH FROM APPLICATION MODEL
    // ==========================
    let docSource: "application" | "store" | null = null;
    let documents: any = null;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { documents: true },
    });

    if (application?.documents) {
      documents = application.documents as Record<string, string>;
      docSource = "application";
    }

    // Nothing found
    if (!documents) {
      return NextResponse.json(
        { error: "No documents found for this ID" },
        { status: 404 }
      );
    }

    // ==========================
    // 3️⃣ RESOLVE FILE NAME
    // ==========================
    const filename = documents[documentType];

    if (!filename) {
      return NextResponse.json(
        { error: `${documentType} document not found` },
        { status: 404 }
      );
    }

    // ==========================
    // 4️⃣ CHOOSE CORRECT BASE DIRECTORY
    // ==========================
    const baseDir =
      docSource === "application" ? "uploads/applications" : "uploads/stores";

    const filePath = join(process.cwd(), baseDir, filename);

    // ==========================
    // 5️⃣ READ AND RETURN FILE
    // ==========================
    try {
      const fileBuffer = await readFile(filePath);

      // Detect file content type
      const ext = filename.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";

      if (ext === "pdf") contentType = "application/pdf";
      if (["jpg", "jpeg"].includes(ext || "")) contentType = "image/jpeg";
      if (ext === "png") contentType = "image/png";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (err) {
      console.error("File read error:", err);
      return NextResponse.json(
        { error: "File missing or corrupted" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Download document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
