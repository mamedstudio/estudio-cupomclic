export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e){}
    }

    const imagem = body?.imagem;
    const estilo = body?.estilo || 'gourmet';

    if (!imagem) {
      return res.status(400).json({ erro: 'Por favor, envie ou selecione uma foto para transformar.' });
    }

    const rawKey = process.env.FAL_KEY;
    if (!rawKey) {
      return res.status(500).json({ erro: 'Chave FAL_KEY não configurada na Vercel.' });
    }

    const cleanKey = rawKey.trim().replace(/^Key\s+/i, '');

    // PROMPTS HIPER-REALISTAS DE ESTÚDIO PARA EDITAR A FOTO ENVIADA
    const promptsRobustos = {
      gourmet: 'Award-winning Michelin-star gourmet food photography. Transforming the provided product photo into an appetizing high-end food presentation resting on an Italian white marble table in a bright upscale restaurant. Soft natural side window sunlight, shallow depth of field, 100mm macro lens, 1080x1350 vertical format, hyper-realistic, 8k.',
      joias: 'High-fashion luxury editorial portrait photography. Transform the provided product into a stunning high-end advertisement, placed elegantly on a dark luxury velvet pedestal with glamour lighting, soft shadows, Vogue magazine aesthetic, hyper-realistic 8k.',
      moda: 'Haute-couture fashion studio editorial campaign. Transform the provided clothing/item into a high-end commercial photo in a minimalist modern studio backdrop with warm beige tones, Vogue magazine aesthetic, soft studio lighting, 8k photorealistic.',
      beleza: 'Luxury skincare and beauty advertisement. Place the provided cosmetic product in a soft spa studio lighting setting with smooth silk and water ripple background, macro photography, 1080x1350 format, hyper-realistic.',
      clean: 'High-end commercial outdoor lifestyle campaign. Transform the provided product into an outdoor photo on a sunlit coastal setting, golden hour natural light, 85mm lens, ultra-realistic commercial advertisement.',
      rustico: 'Artisanal cozy cafe food photography. Transform the provided food item resting on a dark reclaimed oak wood table, warm cinematic golden backlighting, beautiful ambient lights, 8k.'
    };

    const promptEscolhido = promptsRobustos[estilo] || promptsRobustos.gourmet;

    console.log("🚀 Enviando foto amadora para transformação no Fal.ai (GPT-Image-2 Edit)...");

    // Requisita a API de edição do Fal.ai
    const respostaIA = await fetch('https://fal.run/openai/gpt-image-2/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_urls: [imagem],
        prompt: promptEscolhido
      })
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      console.error("Erro no Fal.ai:", textoErro);
      return res.status(500).json({ erro: `Fal.ai recusou a imagem [Código ${respostaIA.status}]: ${textoErro}` });
    }

    const dados = await respostaIA.json();
    const fotoFinalUrl = dados.images?.[0]?.url || dados.image?.url || dados.url;

    if (!fotoFinalUrl) {
      return res.status(500).json({ erro: 'A IA não retornou o link da imagem editada.' });
    }

    return res.status(200).json({
      sucesso: true,
      imageUrl: fotoFinalUrl
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: `Erro interno ao processar a foto: ${erro.message}` });
  }
}
