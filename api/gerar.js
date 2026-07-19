export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { imagem } = req.body;

    if (!imagem) {
      return res.status(400).json({ erro: 'Foto não encontrada.' });
    }

    const apiKey = process.env.PHOTOROOM_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'Chave PHOTOROOM_API_KEY não configurada na Vercel.' });
    }

    // Convertemos a imagem limpa vinda do canvas em arquivo binário
    const base64Data = imagem.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    const formData = new FormData();
    // Nome do campo corrigido exatamente para as exigências da API
    formData.append('imageFile', blob, 'produto.jpg');
    formData.append('background.mode', 'ai');
    
    const promptCenario = 'Studio background, infinite drop, elegant and modern product photography. Professional studio lighting with deep navy blue, metallic copper, subtle touches of purple and teal water color highlights. Realistic shadows and studio ambient.';
    formData.append('background.prompt', promptCenario);

    const respostaIA = await fetch('https://image-api.photoroom.com/v1/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      return res.status(500).json({ erro: `A IA recusou os parâmetros: ${textoErro}` });
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
