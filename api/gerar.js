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

    // Aceita o envio do link da imagem ou nome do produto
    const imagem = body?.imagem || body?.image || body?.produto;
    const estilo = body?.estilo || 'joias';

    if (!imagem) {
      return res.status(400).json({ erro: 'Foto ou produto não informado.' });
    }

    const rawKey = process.env.FAL_KEY;
    if (!rawKey) {
      return res.status(500).json({ erro: 'Chave FAL_KEY não configurada na Vercel.' });
    }

    const cleanKey = rawKey.trim().replace(/^Key\s+/i, '');

    console.log("🚀 Processando no Fal.ai (Flux Image-to-Image 1080x1350). Estilo:", estilo);

    // PROMPTS HIPER-REALISTAS COM MODELOS E FORMATO VERTICAL INSTAGRAM (4:5)
    const promptsRobustos = {
      joias: 'High-fashion luxury editorial portrait photography. Close-up portrait of an elegant female model wearing this gold necklace around her neck and collarbone. Glamour lighting, soft shadows, sophisticated dark luxury backdrop, Vogue magazine cover aesthetic, shot on 85mm portrait lens, f/2.0, cinematic depth of field, vertical 4:5 aspect ratio, 1080x1350 resolution, hyper-realistic, 8k.',
      clean: 'High-end commercial outdoor lifestyle campaign. Close-up portrait shot of an attractive model wearing or presenting this product outdoors on a sunlit coastal highway, ocean view background, golden hour natural light, motion blur, 85mm lens, f/2.8, vertical 4:5 portrait aspect ratio, 1080x1350 format, ultra-realistic commercial advertisement.',
      moda: 'Haute-couture fashion editorial campaign. Full-body or 3/4 shot of a professional fashion model wearing this exact clothing item. Clean minimalist modern studio backdrop with warm beige tones, Vogue magazine aesthetic, soft studio lighting, 85mm lens, vertical 4:5 aspect ratio, 1080x1350 format, highly detailed, photorealistic.',
      beleza: 'Luxury skincare and beauty advertisement. Close-up portrait of a stunning female model with glowing flawless skin holding or posing alongside this cosmetic product. Soft spa studio lighting, smooth silk and water ripple background, pastel color palette, macro photography, vertical 4:5 aspect ratio, 1080x1350 format, hyper-realistic.',
      gourmet: 'Award-winning Michelin-star gourmet food photography. Appetizing food styling presentation resting on an Italian white marble table in a bright upscale bakery. Soft natural side window sunlight, shallow depth of field, 100mm macro lens, vertical 4:5 portrait aspect ratio, 1080x1350 format, hyper-realistic.',
      rustico: 'Artisanal cozy cafe food photography. Gourmet food presentation resting on a dark reclaimed oak wood table. Warm cinematic golden hour backlighting, beautiful bokeh background with warm cafe ambient lights, vertical 4:5 portrait aspect ratio, 1080x1350 format, 8k resolution.'
    };

    const promptEscolhido = promptsRobustos[estilo] || promptsRobustos.joias;

    // Chamada oficial para o modelo Flux Dev Image-to-Image no Fal.ai
    const respostaIA = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imagem,
        prompt: promptEscolhido,
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
      mensagem: "Anúncio pronto para Instagram (1080x1350) gerado com sucesso!",
      imageUrl: fotoFinalUrl,
      imagemResultado: fotoFinalUrl
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: `Erro interno ao processar a imagem: ${erro.message}` });
  }
}
