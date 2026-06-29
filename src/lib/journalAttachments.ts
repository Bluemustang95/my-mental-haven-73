import { supabase } from "@/integrations/supabase/client";

export type StoredAttachment = {
  id: string;
  name: string;
  type: "image" | "file" | "audio";
  path: string;          // storage path
  url: string;           // signed URL (transient)
  size?: number;
};

const BUCKET = "journal-attachments";

export async function uploadAttachment(file: File, type: "image" | "file" | "audio"): Promise<StoredAttachment | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const id = crypto.randomUUID();
  const ext = file.name.split(".").pop() || (type === "image" ? "jpg" : type === "audio" ? "webm" : "bin");
  const path = `${user.id}/${id}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return null;
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return {
    id,
    name: file.name,
    type,
    path,
    url: signed?.signedUrl ?? "",
    size: file.size,
  };
}

export async function deleteAttachment(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function refreshSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
