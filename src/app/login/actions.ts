"use server";

import { cookies } from "next/headers";

export async function loginAction(username: string, password: string) {
  // Ambil data dari .env
  const superUser = process.env.SUPER_USER;
  const superPass = process.env.SUPER_PASS;
  
  const operatorUser = process.env.OPERATOR_USER;
  const operatorPass = process.env.OPERATOR_PASS;

  let role = "";

  // Cek apakah dia Super Admin?
  if (username === superUser && password === superPass) {
    role = "SUPERADMIN";
  } 
  // Cek apakah dia Operator?
  else if (username === operatorUser && password === operatorPass) {
    role = "OPERATOR";
  } 
  // Jika salah semua
  else {
    return { success: false, error: "Username atau Password Salah!" };
  }

  // Simpan ROLE tersebut sebagai tiket masuk (Cookie)
  (await
        // Simpan ROLE tersebut sebagai tiket masuk (Cookie)
        cookies()).set("admin_session", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 hari
    path: "/",
  });

  return { success: true, role };
}

export async function logoutAction() {
  (await cookies()).delete("admin_session");
}

// Fungsi tambahan untuk mengecek role siapa yang sedang aktif
export async function getCurrentRole() {
  const session = (await cookies()).get("admin_session");
  return session?.value || null; // Akan mengembalikan "SUPERADMIN" atau "OPERATOR"
}