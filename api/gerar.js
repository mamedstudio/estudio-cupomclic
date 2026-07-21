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

    // TRAVA ANTI-TEXTO
    const semTexto = 'IMPORTANT: Generate a perfectly clean image. ABSOLUTELY NO TEXT, NO LETTERS, NO LOGOS, NO WATERMARKS, AND NO WORDS. If there is any text in the original image, erase it completely.';

    // PROMPTS COM SELEÇÃO DE GÊNERO E OPÇÃO SEM MODELO
    const promptsRobustos = {
      gourmet: `Award-winning Michelin-star gourmet food photography. Transforming the provided product photo into an appetizing high-end food presentation resting on an Italian white marble table in a bright upscale restaurant. Soft natural side window sunlight, shallow depth of field, 100mm macro lens, hyper-realistic, 8k. ${semTexto}`,
      
      joias: `High-fashion luxury editorial portrait photography. Transform the provided product into a stunning high-end advertisement, placed elegantly on a dark luxury velvet pedestal with glamour lighting, soft shadows, high-end editorial aesthetic, hyper-realistic 8k. ${semTexto}`,
      
      // 👗 MODA FEMININA
      moda_feminina: `Haute-couture fashion studio editorial campaign. Transform the provided clothing item, wearing it naturally on an elegant professional female fashion model. Minimalist modern studio backdrop with warm beige tones, premium studio lighting, soft shadows, 8k photorealistic. ${semTexto}`,
      
      // 👔 MODA MASCULINA
      moda_masculina: `Haute-couture fashion studio editorial campaign. Transform the provided clothing item, wearing it naturally on a handsome professional male fashion model. Sleek modern studio backdrop with neutral gray/dark tones, masculine studio lighting, 8k photorealistic. ${semTexto}`,
      
      // 🧥 MODA SEM MODELO (GHOST MANNEQUIN / STUDIO PRODUCT)
      moda_produto: `High-end commercial fashion product photography. Transform the provided clothing item into a perfectly styled studio display on a invisible ghost mannequin or elegant hanger. Clean minimalist studio wall, perfectly balanced studio lighting, crisp details, no human models, 8k photorealistic. ${semTexto}`,
      
      beleza: `Luxury skincare and beauty advertisement. Place the provided cosmetic product in a soft spa studio lighting setting with smooth silk and water ripple background, macro photography, hyper-realistic. ${semTexto}`,
      
      clean: `High-end commercial outdoor lifestyle campaign. Transform the provided product into an outdoor photo on a sunlit coastal setting, golden hour natural light, 85mm lens, ultra-realistic commercial advertisement. ${semTexto}`,
      
      rustico: `Artisanal cozy cafe food photography. Transform the provided food item resting on a dark reclaimed oak wood table, warm cinematic golden backlighting, beautiful ambient lights, 8k. ${semTexto}`
    };

    const promptEscolhido = promptsRobustos[estilo] || promptsRobustos.gourmet;

    console.log("🚀 Enviando foto amadora para transformação no Fal.ai. Estilo:", estilo);

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
