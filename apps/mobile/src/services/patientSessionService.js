import { CONFIG } from './config';
import { supabase } from './supabaseClient';

let sessionPromise = null;
let patientPromise = null;

function requireDemoCredentials() {
  const { demoEmail, demoPassword } = CONFIG.supabase;

  if (!demoEmail || !demoPassword) {
    throw new Error('Faltan las credenciales demo de Supabase en el entorno móvil.');
  }

  return { demoEmail, demoPassword };
}

function formatDisplayName(user) {
  const metadataName =
    user?.user_metadata?.preferred_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name;

  if (metadataName) {
    return metadataName;
  }

  const emailPrefix = user?.email?.split('@')[0] ?? 'Paciente demo';
  const cleaned = emailPrefix.replace(/[._+-]+/g, ' ').trim();
  return cleaned || 'Paciente demo';
}

export async function ensureSupabaseSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (existingSession?.user) {
        return existingSession;
      }

      const { demoEmail, demoPassword } = requireDemoCredentials();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        throw new Error(`No se pudo iniciar sesión en Supabase: ${error.message}`);
      }

      if (!data.session?.user) {
        throw new Error('Supabase no devolvió una sesión válida.');
      }

      return data.session;
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
}

export async function ensurePatientSession() {
  if (!patientPromise) {
    patientPromise = (async () => {
      const session = await ensureSupabaseSession();
      const user = session.user;

      const { data: existingPatients, error: selectError } = await supabase
        .from('patients')
        .select('id, display_name')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (selectError) {
        throw new Error(`No se pudo consultar el paciente en Supabase: ${selectError.message}`);
      }

      const existingPatient = existingPatients?.[0];
      if (existingPatient?.id) {
        return {
          patientId: existingPatient.id,
          displayName: existingPatient.display_name,
          user,
        };
      }

      const { data: createdPatient, error: insertError } = await supabase
        .from('patients')
        .insert({
          owner_user_id: user.id,
          display_name: formatDisplayName(user),
          metadata: {
            bootstrap_source: 'mobile_demo_auth',
          },
        })
        .select('id, display_name')
        .single();

      if (insertError) {
        throw new Error(`No se pudo crear el paciente en Supabase: ${insertError.message}`);
      }

      return {
        patientId: createdPatient.id,
        displayName: createdPatient.display_name,
        user,
      };
    })().catch((error) => {
      patientPromise = null;
      throw error;
    });
  }

  return patientPromise;
}
