import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificationManager } from "@/lib/notificationSystem";
import { connect } from "http2";

export async function GET(request: NextRequest) {
  try {
    // ---------------------------------------
    // AUTH
    // ---------------------------------------
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // ---------------------------------------
    // PAGINATION
    // ---------------------------------------
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Number(searchParams.get("limit") || 20));
    const skip = (page - 1) * limit;

    // ---------------------------------------
    // FILTERS
    // ---------------------------------------
    const role = searchParams.get("role") || undefined; // RIDER / STORE_MANAGER
    const type = searchParams.get("type") || undefined; // STORE
    const status = searchParams.get("status") || undefined;
    const q = searchParams.get("q") || undefined;
    // ---------------------------------------
    // STORE VERIFICATION TAB
    // ---------------------------------------
    if (type === "STORE") {
      const where: any = {};

      if (status) where.applicationStatus = status;

      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
          { phoneNumber: { contains: q } },
        ];
      }
      const [stores, total] = await Promise.all([
        prisma.store.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            state: true,
            phoneNumber: true,
            email: true,
            address: true,
            latitude: true,
            longitude: true,
            managerId: true,
            applicationStatus: true,
            isVerified: true,
            manager: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        }),

        prisma.store.count({ where }),
      ]);
      console.log(stores);
      return NextResponse.json({
        success: true,
        stores,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        filters: {
          role: null,
          type,
          status,
          q,
        },
      });
    }

    // ---------------------------------------
    // APPLICATIONS TAB (RIDER + STORE_MANAGER)
    // ---------------------------------------

    const where: any = {};

    if (role) where.role = role;
    if (status && status !== "all") where.status = status;

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phoneNumber: { contains: q } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          status: true,
          submittedAt: true,
          role: true,
          vehicleType: true,
          vehicleNumber: true,
          licenseNumber: true,
          emergencyContact: true,
          emergencyPhone: true,
          storeId: true,
          documents: true,
          invitation: {
            select: {
              serviceAreas: true,
              stores: true,
              token: true,
            },
          },
        },
      }),

      prisma.application.count({ where }),
    ]);

    const safeApplications = applications.map((app) => ({
      ...app,
      invitation: app.invitation
        ? {
            ...app.invitation,
            serviceAreas: Array.isArray(app.invitation.serviceAreas)
              ? (app.invitation.serviceAreas as string[])
              : [],
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      applications: safeApplications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        role,
        type: null,
        status,
        q,
      },
    });
  } catch (error) {
    console.error("GET applications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ---------------------------------------
    // AUTH
    // ---------------------------------------
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, type, action, notes } = await request.json();

    if (!id || !type || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    // =====================================================================
    // 1️⃣ APPLICATION APPROVAL (RIDER / STORE_MANAGER)
    // =====================================================================
    if (type === "APPLICATION") {
      const application = await prisma.application.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          role: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          password: true,
          storeId: true,
          vehicleType: true,
          vehicleNumber: true,
          licenseNumber: true,
          emergencyContact: true,
          emergencyPhone: true,
          city: true,
          invitation: {
            select: { serviceAreas: true },
          },
        },
      });

      if (!application)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

      if (application.status !== "PENDING")
        return NextResponse.json(
          { error: "Application already reviewed" },
          { status: 400 }
        );

      return await prisma.$transaction(async (tx) => {
        let createdUser = null;

        // ---------------------------------------
        // APPROVE: CREATE USER
        // ---------------------------------------
        if (action === "approve") {
          createdUser = await tx.user.create({
            data: {
              fullName: application.fullName,
              email: application.email,
              phoneNumber: application.phoneNumber,
              password: application.password,
              userRoles: [application.role],
              activeRole: application.role,
              emailVerified: true,
              phoneVerified: true,
              isActive: true,
            },
          });

          // ---------------------------------------
          // RIDER PROFILE
          // ---------------------------------------
          if (application.role === "RIDER") {
            const riderProfile = await tx.riderProfile.create({
              data: {
                vehicleType: application.vehicleType ?? "",
                vehicleNumber: application.vehicleNumber ?? null,
                licenseNumber: application.licenseNumber ?? null,
                emergencyContact: application.emergencyContact ?? null,
                emergencyPhone: application.emergencyPhone ?? null,
                city: application.city ?? "",
                user: {
                  connect: { id: createdUser.id },
                },
              },
            });

            // SAFE JSON ARRAY - handle both invitation-based and direct applications
            const areaRaw = application.invitation?.serviceAreas;
            let serviceAreas: string[] = [];
            let serviceAreaId: string | null = null;

            if (Array.isArray(areaRaw)) {
              serviceAreas = areaRaw as string[];
            }

            // For direct applications (no invitation), assign to default service area
            if (serviceAreas.length === 0) {
              const defaultServiceArea = await tx.serviceArea.findFirst({
                where: { isActive: true },
                select: { id: true, name: true },
              });

              if (defaultServiceArea) {
                serviceAreas = [defaultServiceArea.name];
                serviceAreaId = defaultServiceArea.id;
              }
            } else {
              // For invitation-based applications, find the service area by name
              const serviceArea = await tx.serviceArea.findFirst({
                where: { name: serviceAreas[0], isActive: true },
                select: { id: true },
              });

              if (serviceArea) {
                serviceAreaId = serviceArea.id;
              }
            }

            if (serviceAreaId) {
              await tx.riderZoneAssignment.create({
                data: {
                  riderId: riderProfile.id,
                  serviceAreaId: serviceAreaId,
                  assignedZones: serviceAreas,
                  isCurrentlyValid: true,
                  lastValidation: new Date(),
                },
              });
            }
          }

          // ---------------------------------------
          // STORE MANAGER PROFILE
          // ---------------------------------------
          if (application.role === "STORE_MANAGER" && application.storeId) {
            await tx.storeStaff.create({
              data: {
                userId: createdUser.id,
                storeId: application.storeId,
                role: "manager",
                isActive: true,
              },
            });
          }
        }

        // ---------------------------------------
        // UPDATE APPLICATION STATUS
        // ---------------------------------------
        await tx.application.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
            approvedAt: action === "approve" ? new Date() : null,
            reviewNotes: notes ?? null,
            userId: createdUser?.id ?? null,
          },
        });

        // ---------------------------------------
        // SEND NOTIFICATION
        // ---------------------------------------
        try {
          if (action === "approve" && createdUser) {
            await notificationManager.sendNotification(
              createdUser.id,
              "admin_manual",
              {
                title: "Application Approved",
                message: "Your application has been approved.",
              },
              ["email", "in_app"]
            );
          } else {
            await notificationManager.sendExternalEmail(
              application.email,
              "Application Rejected",
              `Your application was rejected.${notes ? ` Reason: ${notes}` : ""}`
            );
          }
        } catch (err) {
          console.error("Notification error:", err);
        }

        return NextResponse.json({
          success: true,
          message: `Application ${action}d successfully`,
        });
      });
    }

    // =====================================================================
    // 2️⃣ STORE VERIFICATION
    // =====================================================================
    if (type === "STORE") {
      const store = await prisma.store.findUnique({
        where: { id },
      });

      if (!store)
        return NextResponse.json({ error: "Store not found" }, { status: 404 });

      if (store.applicationStatus !== "PENDING")
        return NextResponse.json(
          { error: "Store already reviewed" },
          { status: 400 }
        );

      await prisma.store.update({
        where: { id },
        data: {
          applicationStatus: newStatus,
          isVerified: action === "approve",
          updatedAt: new Date(),
        },
      });

      try {
        if (store.email) {
          await notificationManager.sendExternalEmail(
            store.email,
            "Store Verification Update",
            action === "approve"
              ? "Your store has been verified."
              : `Your store verification was rejected.${notes ? ` Reason: ${notes}` : ""}`
          );
        }
      } catch (err) {
        console.error("Email error:", err);
      }

      return NextResponse.json({
        success: true,
        message: `Store verification ${action}d successfully`,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("PUT ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
