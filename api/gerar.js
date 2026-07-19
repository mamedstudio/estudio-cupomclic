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

    console.log("📥 Foto recebida. Conectando à IA de ambientação profissional...");

    // 1. Convertemos o Base64 da tela em arquivo binário na memória do servidor
    const base64Data = imagem.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    // 2. Montamos o pacote de envio para a IA
    const formData = new FormData();
    formData.append('image_file', blob, 'produto.jpg');
    
    // O seu prompt estratégico com a identidade visual do CupomClic (em inglês para melhor resultado)
    const promptCenario = 'Studio background, infinite drop, elegant and modern product photography. Professional studio lighting with deep navy blue, metallic copper, subtle touches of purple and teal water color highlights. Realistic shadows and studio ambient.';
    formData.append('prompt', promptCenario);

    // 3. Chamamos a API especialista em reformular cenários de produtos
    const respostaIA = await fetch('https://image-api.photoroom.com/v1/instant-backgrounds', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      console.error("Erro da IA:", textoErro);
      return res.status(500).json({ erro: 'A IA encontrou um problema ao ambientar o produto.' });
    }

    // 4. Transformamos a imagem tratada de volta em texto para exibir na tela do lojista
    const arrayBuffer = await respostaIA.arrayBuffer();
    const bufferResultado = Buffer.from(arrayBuffer);
    const fotoFinalBase64 = `data:image/jpeg;base64,${bufferResultado.toString('base64')}`;

    return res.status(200).json({ 
      sucesso: true,
      mensagem: "O Estúdio CupomClic finalizou o seu anúncio com sucesso!",
      imagemResultado: fotoFinalBase64
    });

  } catch (erro) {
    console.error("Erro interno no backend:", erro);
    return res.status(500).json({ erro: 'Erro ao processar a imagem na IA.' });
  }
}
