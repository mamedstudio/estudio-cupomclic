export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { imagem, estilo } = req.body;

    if (!imagem) {
      return res.status(400).json({ erro: 'Foto não encontrada.' });
    }

    const falKey = process.env.FAL_KEY;

    if (!falKey) {
      return res.status(500).json({ erro: 'Chave FAL_KEY não configurada na Vercel.' });
    }

    console.log("🚀 Processando no GPT-Image-2 (1080x1350 Instagram). Estilo:", estilo);

    // PROMPTS HIPER-REALISTAS COM MODELOS E FORMATO VERTICAL INSTAGRAM (4:5)
    const promptsRobustos = {
      // 1. JOIAS: Modelo de alta costura com joia no pescoço
      joias: 'High-fashion luxury editorial portrait photography. Close-up portrait of an elegant female model wearing this gold necklace around her neck and collarbone. Glamour lighting, soft shadows, sophisticated dark luxury backdrop, Vogue magazine cover aesthetic, shot on 85mm portrait lens, f/2.0, cinematic depth of field, vertical 4:5 aspect ratio, 1080x1350 resolution, hyper-realistic, 8k.',

      // 2. OUTDOOR/LIFESTYLE: Modelo usando os óculos/acessório em cenário de estrada/praia
      clean: 'High-end commercial outdoor lifestyle campaign. Close-up portrait shot of an attractive model wearing or presenting this product outdoors on a sunlit coastal highway, ocean view background, golden hour natural light, motion blur, 85mm lens, f/2.8, vertical 4:5 portrait aspect ratio, 1080x1350 format, ultra-realistic commercial advertisement.',

      // 3. MODA: Modelo vestindo a roupa em estúdio de revista
      moda: 'Haute-couture fashion editorial campaign. Full-body or 3/4 shot of a professional fashion model wearing this exact clothing item. Clean minimalist modern studio backdrop with warm beige tones, Vogue magazine aesthetic, soft studio lighting, 85mm lens, vertical 4:5 aspect ratio, 1080x1350 format, highly detailed, photorealistic.',

      // 4. BELEZA: Modelo segurando/usando o cosmético em ambiente spa
      beleza: 'Luxury skincare and beauty advertisement. Close-up portrait of a stunning female model with glowing flawless skin holding or posing alongside this cosmetic product. Soft spa studio lighting, smooth silk and water ripple background, pastel color palette, macro photography, vertical 4:5 aspect ratio, 1080x1350 format, hyper-realistic.',

      // 5. GOURMET: Apresentação gourmet refinada para doces/bolos
      gourmet: 'Award-winning Michelin-star gourmet food photography. Appetizing food styling presentation resting on an Italian white marble table in a bright upscale bakery. Soft natural side window sunlight, shallow depth of field, 100mm macro lens, vertical 4:5 portrait aspect ratio, 1080x1350 format, hyper-realistic.',

      // 6. RÚSTICO: Apresentação aconchegante para lanches/cafés
      rustico: 'Artisanal cozy cafe food photography. Gourmet food presentation resting on a dark reclaimed oak wood table. Warm cinematic golden hour backlighting, beautiful bokeh background with warm cafe ambient lights, vertical 4:5 portrait aspect ratio, 1080x1350 format, 8k resolution.'
    };

    const promptEscolhido = promptsRobustos[estilo] || promptsRobustos.joias;

    const respostaIA = await fetch('https://fal.run/openai/gpt-image-2/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
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
      return res.status(500).json({ erro: `Fal.ai recusou: ${textoErro}` });
    }

    const dados = await respostaIA.json();
    const fotoFinalUrl = dados.images?.[0]?.url || dados.image?.url || dados.url;

    if (!fotoFinalUrl) {
      return res.status(500).json({ erro: 'A IA não retornou o link da imagem.' });
    }

    return res.status(200).json({ 
      sucesso: true,
      mensagem: "Anúncio pronto para Instagram (1080x1350) gerado com sucesso!",
      imagemResultado: fotoFinalUrl
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: 'Erro interno ao processar a imagem.' });
  }
}
