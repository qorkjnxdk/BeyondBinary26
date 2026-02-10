import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        requireAuth(request);

        const users = db.prepare(`
      SELECT user_id, real_name, location, last_active
      FROM users
      WHERE account_status = 'active'
      AND location IS NOT NULL
    `).all() as Array<{
            user_id: string;
            real_name: string;
            location: string;
            last_active: number;
        }>;

        const now = Date.now();

        const presence = users.map(u => ({
            userId: u.user_id,
            realName: u.real_name,
            location: u.location,
            lastActive: u.last_active,
            online: now - u.last_active < 5 * 60 * 1000,
        }));

        return NextResponse.json({ presence });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}