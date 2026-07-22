import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};




serve(async (req) => {
  if (req.method === "OPTIONS") {
  return new Response("ok", {
    headers: corsHeaders,
  });
}
  try {
    const datos = await req.json();

   

console.log("Datos recibidos:");
console.log(datos);
console.log("Correo:", datos.correo_profesional);
console.log("Contraseña:", datos.contrasena);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Crear usuario en Authentication
    const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
  email: datos.correo_profesional,
  password: datos.contrasena,
  email_confirm: true,
  user_metadata: {
    rol: "medico",
  },
});

    if (authError) {
      throw authError;
    }
// 🔥 CORREGIR EL ROL EN LA TABLA perfiles
await supabase
  .from("perfiles")
  .update({
    rol: "medico"
  })
  .eq("id", authData.user.id);

  
    // 2. Guardar médico en la tabla
    const { data: medicoData, error: medicoError } = await supabase
      .from("medicos")
      .insert([
        {
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          dni: datos.dni,
          sexo: datos.sexo,
          telefono: datos.telefono,
          correo_profesional: datos.correo_profesional,
          especialidades: datos.especialidades,
          estado: "Activo",
          auth_user_id: authData.user.id,
        },
      ])
      .select();

    if (medicoError) {
      throw medicoError;
    }

    return new Response(
  JSON.stringify({
    ok: true,
    mensaje: "Médico creado correctamente",
    usuario: authData.user.id,
    medico: medicoData,
  }),
  {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  }
);
  } catch (error) {
    return new Response(
  JSON.stringify({
    ok: false,
    error: String(error),
  }),
  {
    status: 500,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  }
);
  }
});