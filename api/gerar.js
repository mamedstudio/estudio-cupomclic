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
      return res.status(500).json({ 
        erro: 'Chave FAL_KEY não encontrada na Vercel.' 
      });
    }

    console.log("🚀 Conectando ao motor Flux (Fal.ai)... Estilo:", estilo);

    // Dicionário de Prompts Expandido com Moda e Beleza
    const promptsDeCampanha = {
      gourmet: 'High-end commercial food photography, gourmet dessert presentation on a luxury marble table in an upscale cafe, soft window light, shallow depth of field, 8k resolution, award winning advertisement',
      rustico: 'Cozy artisanal cafe setting, warm cinematic golden hour lighting, coffee shop ambient background, depth of field, commercial advertisement photograph',
      clean: 'Professional advertising campaign photoshoot, sleek product floating over a sunlit coastal highway, ocean view in the background, motion blur, dramatic lighting, 8k resolution, ultra-realistic',
      // NOVO: Estilo Editorial de Moda
      moda: 'High fashion editorial style, clean modern minimalist studio background with soft neutral elegant tones, professional studio lighting, soft shadows, Vogue magazine aesthetic, 8k resolution, photorealistic clothing e-commerce presentation',
      // NOVO: Estilo Spa / Cosméticos
      beleza: 'Luxury beauty and cosmetic product photography, resting on a smooth glossy surface with subtle silk and water ripple background, soft pastel pink and beige tones, glowing spa lighting, highly detailed reflection, 8k, photorealistic advertisement'
    };

    const promptEscolhido = promptsDeCampanha[estilo] || promptsDeCampanha.clean;

    const respostaIA = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imagem,
        prompt: promptEscolhido,
        strength: 0.65, // Ideal para manter os traços da roupa/produto
        guidance_scale: 3.5,
        num_inference_steps: 28
      })
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      console.error("Erro retornado pelo Fal.ai:", textoErro);
      return res.status(500).json({ erro: `Erro no Fal.ai: ${textoErro}` });
    }

    const dados = await respostaIA.json();
    const fotoFinalUrl = dados.images?.[0]?.url;

    if (!fotoFinalUrl) {
      return res.status(500).json({ erro: 'A IA não retornou o link da imagem gerada.' });
    }

    return res.status(200).json({ 
      sucesso: true,
      mensagem: "Anúncio gerado com sucesso via Flux (Fal.ai)!",
      imagemResultado: fotoFinalUrl
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: 'Erro interno no servidor ao processar a imagem.' });
  }
}
