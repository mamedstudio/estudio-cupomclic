export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { imagem, estilo } = req.body;

    if (!imagem) {
      return res.status(400).json({ erro: 'Foto não encontrada.' });
    }

    const apiKey = process.env.PHOTOROOM_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'Chave PHOTOROOM_API_KEY não configurada na Vercel.' });
    }

    // DICIONÁRIO DE PROMPTS: Mapeia a escolha do usuário para o prompt correto
    const promptsDeArte = {
      gourmet: 'On a clean white marble countertop, soft natural window light from the side, cozy bakery bokeh background out of focus, professional food photography',
      rustico: 'On a dark rustic wooden table, warm cinematic studio light, soft depth of field, cozy cafe ambient background, professional food photography',
      clean: 'On a smooth beige neutral surface, soft directional studio lighting, subtle realistic shadows, minimal clean aesthetic'
    };

    // Se o usuário não escolher nada, usamos o 'clean' como padrão de segurança
    const promptCenario = promptsDeArte[estilo] || promptsDeArte.clean;

    // Converte a imagem vinda do canvas para o formato binário
    const base64Data = imagem.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('imageFile', blob, 'produto.jpg');
    formData.append('background.prompt', promptCenario);

    const respostaIA = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      return res.status(500).json({ erro: `Erro na IA: ${textoErro}` });
    }

    const arrayBuffer = await respostaIA.arrayBuffer();
    const bufferResultado = Buffer.from(arrayBuffer);
    const fotoFinalBase64 = `data:image/jpeg;base64,${bufferResultado.toString('base64')}`;

    return res.status(200).json({ 
      sucesso: true,
      mensagem: "O Estúdio CupomClic finalizou o seu anúncio com sucesso!",
      imagemResultado: fotoFinalBase64
    });

  } catch (erro) {
    console.error("Erro no servidor:", erro);
    return res.status(500).json({ erro: 'Erro interno ao processar a imagem.' });
  }
}
