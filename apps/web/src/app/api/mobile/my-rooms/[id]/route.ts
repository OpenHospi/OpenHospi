import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, hasError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { getRoom } from "@/lib/queries/rooms";
import { deleteRoomForUser, updateRoomForUser } from "@/lib/services/room-mutations";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;
    const room = await getRoom(id, session.user.id);
    if (!room) return apiError("Room not found", 404);

    return NextResponse.json({
      room: {
        ...room,
        rentPrice: Number(room.rentPrice),
        deposit: room.deposit ? Number(room.deposit) : null,
        serviceCosts: room.serviceCosts ? Number(room.serviceCosts) : null,
        estimatedUtilitiesCosts: room.estimatedUtilitiesCosts
          ? Number(room.estimatedUtilitiesCosts)
          : null,
        totalCost: Number(room.totalCost),
      },
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id } = await params;
    const data = await request.json();
    const result = await updateRoomForUser(session.user.id, id, data);
    if (hasError(result)) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;
    const result = await deleteRoomForUser(session.user.id, id);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof Error && e.message === "Only draft rooms can be deleted") {
      return apiError(e.message, 422);
    }
    return apiError("Internal server error", 500);
  }
}
