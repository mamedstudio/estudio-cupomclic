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
      return res.status(500).json({ erro: 'Chave PHOTOROOM_API_KEY não encontrada na Vercel.' });
    }

    console.log("📥 Foto recebida. Conectando ao motor generativo da IA...");

    // 1. Convertemos o Base64 da tela em arquivo binário para a IA
    const base64Data = imagem.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    // 2. Montamos o FormData com os campos exatos que o Photoroom exige
    const formData = new FormData();
    formData.append('image_file', blob, 'produto.jpg');
    
    // Ativamos o modo Inteligência Artificial Generativa no endpoint principal
    formData.append('background.mode', 'ai');
    
    // O seu prompt vencedor de cenário com as cores do CupomClic
    const promptCenario = 'Studio background, infinite drop, elegant and modern product photography. Professional studio lighting with deep navy blue, metallic copper, subtle touches of purple and teal water color highlights. Realistic shadows and studio ambient.';
    formData.append('background.prompt', promptCenario);

    // 3. Chamamos o endpoint principal e mais estável do Photoroom
    const respostaIA = await fetch('https://image-api.photoroom.com/v1/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });

    if (!respostaIA.ok) {
      const textoErro = await respostaIA.text();
      console.error("Erro detalhado da IA:", textoErro);
      return res.status(500).json({ erro: `Erro da IA: ${textoErro}` });
    }

    // 4. Capturamos a imagem gerada e convertemos para texto exibir na tela
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
    return res.status(500).json({ erro: 'Erro interno ao processar a imagem.' });
  }
}
