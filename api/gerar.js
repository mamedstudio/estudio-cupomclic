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

    console.log("🚀 Enviando para o motor de substituição de fundo do Fal.ai...");

    // PROMPTS FOCADOS APENAS NO CENÁRIO (Sem descrever o produto para não alterar os pixels)
    const promptsDeCenario = {
      clean: 'Modern luxury advertising studio background, soft neutral gradient tone, professional lighting, realistic soft shadows, 8k resolution',
      moda: 'Vogue editorial fashion backdrop, elegant minimalist nude texture, soft studio spotlight, blurred high-fashion background',
      beleza: 'Luxury spa backdrop, smooth glossy marble pedestal surface, subtle silk fabric drape, soft pastel lighting, water ripple bokeh',
      gourmet: 'Luxury cafe table surface, soft side window morning light, cozy bakery blurred background, professional food presentation',
      rustico: 'Dark rustic wood surface, warm golden hour cafe background, cozy cinematic atmosphere'
    };

    const promptEscolhido = promptsDeCenario[estilo] || promptsDeCenario.clean;

    // Usamos o endpoint do Fal.ai focado em Background Replacement / Inpainting
    const respostaIA = await fetch('https://fal.run/fal-ai/bria/background/replace', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imagem,
        prompt: promptEscolhido,
        refine: true
      })
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      console.error("Erro no Fal.ai:", textoErro);
      return res.status(500).json({ erro: `Fal.ai recuzou: ${textoErro}` });
    }

    const dados = await respostaIA.json();
    const fotoFinalUrl = dados.image?.url || dados.images?.[0]?.url;

    if (!fotoFinalUrl) {
      return res.status(500).json({ erro: 'O Fal.ai não retornou a imagem.' });
    }

    return res.status(200).json({ 
      sucesso: true,
      mensagem: "Anúncio gerado com sucesso via Fal.ai!",
      imagemResultado: fotoFinalUrl
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: 'Erro interno ao processar a imagem.' });
  }
}
