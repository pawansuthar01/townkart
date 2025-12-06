import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string; documentType: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, documentType } = params;

    // Get the application
    const application = await (prisma as any).application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if document exists
    const documents = (application.documents as Record<string, string>) || {};
    const filename = documents[documentType];

    if (!filename) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Read the file
    const filePath = join(process.cwd(), "uploads", "applications", filename);

    try {
      const fileBuffer = await readFile(filePath);

      // Determine content type based on file extension
      const extension = filename.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";

      if (extension === "pdf") {
        contentType = "application/pdf";
      } else if (["jpg", "jpeg"].includes(extension || "")) {
        contentType = "image/jpeg";
      } else if (extension === "png") {
        contentType = "image/png";
      }

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (fileError) {
      console.error("Error reading file:", fileError);
      return NextResponse.json(
        { error: "File not found or corrupted" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
