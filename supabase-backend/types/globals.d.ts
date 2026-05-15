// Global type declarations for Deno Edge Functions
declare module "https://esm.sh/@supabase/supabase-js@2.39.0" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/@supabase/functions-js@2.1.5" {
  export * from "@supabase/functions-js";
}

declare module "https://esm.sh/cors@2.8.5" {
  export * from "cors";
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
  export const serve: any;
}

// Additional ESM.sh modules
declare module "https://esm.sh/*" {
  const content: any;
  export default content;
}

// Deno global types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};