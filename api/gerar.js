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

    console.log("🚀 Enviando para openai/gpt-image-2/edit no Fal.ai com estilo:", estilo);

    // Dicionário Otimizado com Prompt Específico para Modelo vestindo a Joia
    const promptsRobustos = {
      // NOVO PROMPT: Modelo elegante vestindo a joia
      joias: 'High-fashion luxury editorial photography. Close-up portrait of an elegant female model wearing this gold necklace around her neck and collarbone. Glamour lighting, soft shadows, sophisticated dark luxury backdrop, Vogue magazine cover aesthetic, shot on 85mm portrait lens, f/2.0, cinematic depth of field, hyper-realistic, 8k.',
      
      clean: 'Professional advertising campaign photoshoot, sleek product floating over a sunlit coastal highway, ocean view in the background, motion blur, dramatic lighting, 8k resolution, ultra-realistic',
      
      moda: 'High-end fashion editorial product shot, resting on a minimalist matte concrete pedestal. Subtle warm spotlighting creating soft elegant shadows. Sophisticated neutral beige and light grey background, Vogue magazine cover aesthetic, cinematic lighting, highly detailed.',
      
      beleza: 'Luxury beauty and cosmetics product photography, resting on a polished rose quartz stone. Surrounded by shallow clear water ripples and soft silk fabric. Soft pastel pink and warm beige color palette, glowing luxury spa lighting, hyper-realistic macro photography.',
      
      gourmet: 'Award-winning gourmet food photography, resting on a luxury Italian white marble countertop. Soft morning natural sunlight streaming from the side creating appetizing highlights. Cozy upscale bakery blurred in the background, hyper-realistic, shot on 100mm macro lens, cinematic depth of field.',
      
      rustico: 'Artisanal cozy cafe product photography, resting on a dark rustic reclaimed wood table. Warm cinematic golden hour backlighting. Beautiful bokeh background featuring blurred warm cafe lights and coffee shop elements, hyper-realistic depth of field, 8k.'
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
      mensagem: "Anúncio de alta conversão gerado com sucesso via GPT!",
      imagemResultado: fotoFinalUrl
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: 'Erro interno ao processar a imagem.' });
  }
}
