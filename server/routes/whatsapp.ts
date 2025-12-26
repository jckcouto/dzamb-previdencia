import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import type { Request, Response } from "express";

const router = Router();

interface WhatsAppOAuthResponse {
  access_token: string;
  token_type: string;
}

interface WABADebugResponse {
  data: {
    granular_scopes: Array<{
      scope: string;
      target_ids: string[];
    }>;
  };
}

interface PhoneNumberResponse {
  data: Array<{
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating?: string;
  }>;
}

// Armazenamento temporário de conexões WhatsApp (em produção, usar database)
const whatsappConnections = new Map<string, {
  accessToken: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  connectedAt: Date;
}>();

/**
 * POST /api/whatsapp/exchange-token
 * Troca o código OAuth por um access token permanente
 */
router.post("/exchange-token", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Código OAuth não fornecido" });
    }

    if (!redirectUri) {
      return res.status(400).json({ error: "redirect_uri não fornecido" });
    }

    const appId = process.env.WHATSAPP_APP_ID;
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appId || !appSecret) {
      console.error("WhatsApp credentials not configured");
      return res.status(500).json({ 
        error: "Credenciais do WhatsApp não configuradas. Configure WHATSAPP_APP_ID e WHATSAPP_APP_SECRET." 
      });
    }

    // Exchange code for short-lived access token (MUST include redirect_uri)
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token`;
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      code: code,
      redirect_uri: redirectUri, // CRITICAL: Must match FB.login redirect_uri
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams}`);
    const tokenData = await tokenResponse.json() as WhatsAppOAuthResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return res.status(400).json({ 
        error: "Falha ao trocar código por token",
        details: tokenData 
      });
    }

    let accessToken = tokenData.access_token;

    // Exchange short-lived token for long-lived token (60 days)
    // Note: For embedded signup with whatsapp_business_management permission,
    // Meta actually issues permanent tokens (no expiry) by default
    // But we'll exchange anyway for best practices
    const longLivedUrl = `https://graph.facebook.com/v20.0/oauth/access_token`;
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: accessToken,
    });

    try {
      const longLivedResponse = await fetch(`${longLivedUrl}?${longLivedParams}`);
      const longLivedData = await longLivedResponse.json() as WhatsAppOAuthResponse;
      
      if (longLivedResponse.ok && longLivedData.access_token) {
        accessToken = longLivedData.access_token;
        console.log("Upgraded to long-lived token");
      } else {
        console.log("Using short-lived token (long-lived exchange failed or not needed)");
      }
    } catch (error) {
      console.log("Token upgrade skipped, using original token:", error);
    }

    // Debug token to get WABA ID
    const debugUrl = `https://graph.facebook.com/debug_token`;
    const debugParams = new URLSearchParams({
      input_token: accessToken,
      access_token: `${appId}|${appSecret}`,
    });

    const debugResponse = await fetch(`${debugUrl}?${debugParams}`);
    const debugData = await debugResponse.json() as WABADebugResponse;

    if (!debugResponse.ok) {
      console.error("Token debug failed:", debugData);
      return res.status(400).json({ 
        error: "Falha ao validar token",
        details: debugData 
      });
    }

    // Extract WABA ID from granular_scopes
    const wabaScope = debugData.data.granular_scopes?.find(
      scope => scope.scope === "whatsapp_business_management"
    );

    if (!wabaScope || !wabaScope.target_ids || wabaScope.target_ids.length === 0) {
      return res.status(400).json({ 
        error: "Nenhuma WABA encontrada. Verifique as permissões concedidas." 
      });
    }

    const wabaId = wabaScope.target_ids[0];

    // Get phone numbers for this WABA
    const phonesUrl = `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers`;
    const phonesResponse = await fetch(phonesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const phonesData = await phonesResponse.json() as PhoneNumberResponse;

    if (!phonesResponse.ok || !phonesData.data || phonesData.data.length === 0) {
      console.error("No phone numbers found:", phonesData);
      return res.status(400).json({ 
        error: "Nenhum número de telefone encontrado nesta WABA" 
      });
    }

    const phoneInfo = phonesData.data[0];

    // Store connection info (in production, save to database)
    const userId = req.user!.id;
    whatsappConnections.set(userId, {
      accessToken,
      wabaId,
      phoneNumberId: phoneInfo.id,
      displayPhoneNumber: phoneInfo.display_phone_number,
      verifiedName: phoneInfo.verified_name,
      connectedAt: new Date(),
    });

    return res.json({
      success: true,
      connection: {
        wabaId,
        phoneNumberId: phoneInfo.id,
        displayPhoneNumber: phoneInfo.display_phone_number,
        verifiedName: phoneInfo.verified_name,
        qualityRating: phoneInfo.quality_rating || "UNKNOWN",
      },
    });

  } catch (error: any) {
    console.error("WhatsApp OAuth error:", error);
    return res.status(500).json({ 
      error: "Erro ao processar autenticação WhatsApp",
      details: error.message 
    });
  }
});

/**
 * GET /api/whatsapp/connection
 * Retorna informações da conexão WhatsApp do usuário
 */
router.get("/connection", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const connection = whatsappConnections.get(userId);

    if (!connection) {
      return res.json({ connected: false });
    }

    // Validate token is still valid
    const phonesUrl = `https://graph.facebook.com/v20.0/${connection.wabaId}/phone_numbers`;
    const phonesResponse = await fetch(phonesUrl, {
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
      },
    });

    if (!phonesResponse.ok) {
      // Token expired or invalid
      whatsappConnections.delete(userId);
      return res.json({ connected: false });
    }

    return res.json({
      connected: true,
      connection: {
        wabaId: connection.wabaId,
        phoneNumberId: connection.phoneNumberId,
        displayPhoneNumber: connection.displayPhoneNumber,
        verifiedName: connection.verifiedName,
        connectedAt: connection.connectedAt,
      },
    });

  } catch (error: any) {
    console.error("Error fetching WhatsApp connection:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/connection
 * Desconecta o WhatsApp Business
 */
router.delete("/connection", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    whatsappConnections.delete(userId);

    return res.json({ 
      success: true,
      message: "WhatsApp Business desconectado com sucesso" 
    });

  } catch (error: any) {
    console.error("Error disconnecting WhatsApp:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/config
 * Retorna configurações públicas para o frontend
 */
router.get("/config", async (req: Request, res: Response) => {
  const appId = process.env.WHATSAPP_APP_ID;
  const configId = process.env.WHATSAPP_CONFIGURATION_ID;

  if (!appId || !configId) {
    return res.json({ 
      configured: false,
      message: "Configure WHATSAPP_APP_ID e WHATSAPP_CONFIGURATION_ID para habilitar integração WhatsApp" 
    });
  }

  return res.json({
    configured: true,
    appId,
    configId,
  });
});

export default router;
