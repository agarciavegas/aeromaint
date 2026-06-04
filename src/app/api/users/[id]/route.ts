import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/users/[id] - Get user by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const sessionRole = (session.user as any).role;
    const sessionUserId = (session.user as any).id;

    // Admin can update anyone, users can update their own name/password
    if (sessionRole !== "admin" && sessionUserId !== id) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, active } = body;

    // Non-admin users can only change name and password
    if (sessionRole !== "admin") {
      const updateData: { name?: string; password?: string } = {};
      if (name) updateData.name = name;
      if (password) {
        if (password.length < 6) {
          return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }
        updateData.password = await bcrypt.hash(password, 12);
      }

      const user = await db.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(user);
    }

    // Admin updates
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      active?: boolean;
    } = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }
    if (role) {
      const validRoles = ["admin", "manager", "technician", "viewer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
      }
      updateData.role = role;
    }
    if (typeof active === "boolean") updateData.active = active;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Deactivate user (admin only, can't delete self)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sessionRole = (session.user as any).role;
    const sessionUserId = (session.user as any).id;

    if (sessionRole !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden desactivar usuarios" }, { status: 403 });
    }

    const { id } = await params;

    if (sessionUserId === id) {
      return NextResponse.json({ error: "No puede desactivar su propia cuenta" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json({ error: "Error al desactivar usuario" }, { status: 500 });
  }
}
