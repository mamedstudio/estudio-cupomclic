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

    const produto = body?.produto || body?.nome || '';
    const estilo = body?.estilo || 'gourmet';

    if (!produto || produto.trim() === '') {
      return res.status(400).json({ erro: 'Por favor, informe o nome do produto.' });
    }

    const rawKey = process.env.FAL_KEY;
    if (!rawKey) {
      return res.status(500).json({ erro: 'Chave FAL_KEY não configurada na Vercel.' });
    }

    const cleanKey = rawKey.trim().replace(/^Key\s+/i, '');

    // Prompts de estilo ambiente para o estúdio
    const estilosFotograficos = {
      gourmet: 'Award-winning Michelin-star gourmet food photography, appetizing styling on a white marble table in a luxury restaurant, warm natural sunlight, shallow depth of field, 85mm macro lens, hyper-realistic, 8k resolution.',
      joias: 'High-fashion luxury editorial studio photography, glamour lighting, soft shadows, sophisticated dark luxury backdrop, Vogue cover aesthetic, macro lens, hyper-realistic.',
      moda: 'Haute-couture fashion studio editorial photography, modern minimalist beige backdrop, soft studio lighting, Vogue aesthetic, 8k resolution.',
      beleza: 'Luxury cosmetics and skincare beauty product advertisement photography, soft spa lighting, smooth silk and water ripple background, pastel colors, hyper-realistic.',
      clean: 'High-end commercial outdoor lifestyle campaign, golden hour natural sunlight, coastal highway background, 85mm lens, ultra-realistic commercial advertisement.',
      rustico: 'Artisanal cozy cafe food presentation, resting on a dark reclaimed oak wood table, warm cinematic golden backlighting, beautiful bokeh background, 8k.'
    };

    const estiloPrompt = estilosFotograficos[estilo] || estilosFotograficos.gourmet;
    
    // INJETA O NOME DO PRODUTO NO PROMPT FINAL
    const promptFinal = `Professional high-end commercial studio product photograph of ${produto}. ${estiloPrompt}, vertical 4:5 aspect ratio, 1080x1350 resolution.`;

    console.log("🚀 Criando foto no Fal.ai (Flux Dev). Produto:", produto, "| Estilo:", estilo);

    // Chamada oficial Text-to-Image (Flux Dev)
    const respostaIA = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptFinal,
        image_size: {
          width: 1080,
          height: 1350
        }
      })
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      console.error("Erro no Fal.ai:", textoErro);
      return res.status(500).json({ erro: `Fal.ai recusou [Código ${respostaIA.status}]: ${textoErro}` });
    }

    const dados = await respostaIA.json();
    const fotoFinalUrl = dados.images?.[0]?.url || dados.image?.url || dados.url;

    if (!fotoFinalUrl) {
      return res.status(500).json({ erro: 'A IA não retornou o link da imagem.' });
    }

    return res.status(200).json({
      sucesso: true,
      imageUrl: fotoFinalUrl
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: `Erro ao processar imagem: ${erro.message}` });
  }
}
