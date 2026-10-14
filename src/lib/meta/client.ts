const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v20.0";
const GRAPH_BASE = "https://graph.facebook.com";

export type MetaResult<T> = { ok: true; data: T } | { ok: false; error: string };

type GraphError = { error?: { message?: string; code?: number; type?: string } };

async function graphRequest<T>(
  path: string,
  init: RequestInit & { accessToken: string },
): Promise<MetaResult<T>> {
  const { accessToken, headers, ...rest } = init;

  try {
    const response = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}${path}`, {
      ...rest,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...headers,
      },
    });

    const payload = (await response.json()) as T & GraphError;

    if (!response.ok || payload?.error) {
      return {
        ok: false,
        error: payload?.error?.message ?? `Meta Graph API returned ${response.status}.`,
      };
    }

    return { ok: true, data: payload };
  } catch {
    return { ok: false, error: "Network error contacting the Meta Graph API." };
  }
}

export type WhatsAppCredentials = {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
};

export type ValidationDetails = {
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  wabaName?: string;
};

export async function validateCredentials(
  credentials: WhatsAppCredentials,
): Promise<MetaResult<ValidationDetails>> {
  const phone = await graphRequest<{
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
  }>(
    `/${credentials.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
    { accessToken: credentials.accessToken },
  );

  if (!phone.ok) return phone;

  const waba = await graphRequest<{ name?: string }>(`/${credentials.wabaId}?fields=name`, {
    accessToken: credentials.accessToken,
  });

  return {
    ok: true,
    data: {
      displayPhoneNumber: phone.data.display_phone_number,
      verifiedName: phone.data.verified_name,
      qualityRating: phone.data.quality_rating,
      wabaName: waba.ok ? waba.data.name : undefined,
    },
  };
}

export async function sendTextMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}): Promise<MetaResult<{ waMessageId?: string }>> {
  const result = await graphRequest<{ messages?: { id?: string }[] }>(
    `/${params.phoneNumberId}/messages`,
    {
      accessToken: params.accessToken,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "text",
        text: { preview_url: false, body: params.body },
      }),
    },
  );

  if (!result.ok) return result;
  return { ok: true, data: { waMessageId: result.data.messages?.[0]?.id } };
}

export async function sendTemplateMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  variables: string[];
}): Promise<MetaResult<{ waMessageId?: string }>> {
  const result = await graphRequest<{ messages?: { id?: string }[] }>(
    `/${params.phoneNumberId}/messages`,
    {
      accessToken: params.accessToken,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to,
        type: "template",
        template: {
          name: params.templateName,
          language: { code: params.languageCode },
          components: params.variables.length
            ? [
                {
                  type: "body",
                  parameters: params.variables.map((value) => ({ type: "text", text: value })),
                },
              ]
            : undefined,
        },
      }),
    },
  );

  if (!result.ok) return result;
  return { ok: true, data: { waMessageId: result.data.messages?.[0]?.id } };
}

export { GRAPH_VERSION };
