export default {
  async fetch(request, env) {
    // Permitir llamadas desde la web/app
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Usa una petición POST" },
        405,
        corsHeaders
      );
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse(
        { error: "Falta configurar GEMINI_API_KEY en el servidor" },
        500,
        corsHeaders
      );
    }

    try {
      const body = await request.json();

      const titulo = body.titulo || "";
      const informacion = body.informacion || "";
      const tipo = body.tipo || "oferta de restaurante";

      if (!titulo.trim()) {
        return jsonResponse(
          { error: "Debes enviar un título" },
          400,
          corsHeaders
        );
      }

      const prompt = `
Crea una imagen publicitaria profesional para redes sociales
de un restaurante pizzería llamado RESTAURANTE PIZZERÍA NOYA.

Tipo de publicación:
${tipo}

Título principal:
${titulo}

Información adicional:
${informacion}

La imagen debe ser vertical 4:5, llamativa, moderna y profesional.

Debe parecer una campaña publicitaria real de un restaurante.

Incluye pizzas apetitosas y elementos visuales relacionados con
el tema de la promoción.

No inventes precios, fechas ni condiciones que no aparezcan
en el título o en la información adicional.

Integra el texto principal de forma clara y legible.
`;

      const model = "gemini-2.0-flash-preview-image-generation";

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${model}:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: [
              "TEXT",
              "IMAGE"
            ]
          }
        })
      });

      const data = await geminiResponse.json();

      if (!geminiResponse.ok) {
        return jsonResponse(
          {
            error: "Error de Gemini",
            details: data
          },
          geminiResponse.status,
          corsHeaders
        );
      }

      const parts =
        data?.candidates?.[0]?.content?.parts || [];

      let imageBase64 = null;
      let mimeType = "image/png";
      let texto = "";

      for (const part of parts) {
        if (part.text) {
          texto += part.text;
        }

        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          mimeType =
            part.inlineData.mimeType || "image/png";
        }
      }

      if (!imageBase64) {
        return jsonResponse(
          {
            error: "Gemini no devolvió ninguna imagen",
            respuesta: data
          },
          502,
          corsHeaders
        );
      }

      return jsonResponse(
        {
          success: true,
          texto: texto,
          image: `data:${mimeType};base64,${imageBase64}`
        },
        200,
        corsHeaders
      );

    } catch (error) {
      return jsonResponse(
        {
          error: "Error interno del servidor",
          details: error.message
        },
        500,
        corsHeaders
      );
    }
  }
};

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}
