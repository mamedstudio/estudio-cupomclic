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

    console.log("📥 Foto recebida. Conectando à Versão 2 (V2) da IA...");

    // 1. Prepara o arquivo binário vindo do nosso otimizador
    const base64Data = imagem.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    // 2. Monta o pacote de dados exato para a V2 do Photoroom
    const formData = new FormData();
    formData.append('imageFile', blob, 'produto.jpg');
    
    // O seu prompt direcionando a arte para os padrões do CupomClic
    const promptCenario = 'Studio background, infinite drop, elegant and modern product photography. Professional studio lighting with deep navy blue, metallic copper, subtle touches of purple and teal water color highlights. Realistic shadows and studio ambient.';
    formData.append('background.prompt', promptCenario);

    // 3. MUDANÇA CRUCIAL: Endereço do novo motor generativo V2
    const respostaIA = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });

    // 4. Captura a resposta
    if (!respostaIA.ok) {
      let mensagemErro = "";
      try {
        mensagemErro = await respostaIA.text();
      } catch (e) {
        mensagemErro = respostaIA.statusText;
      }
      
      console.error("Erro na V2 da IA:", mensagemErro);
      return res.status(500).json({ 
        erro: `Erro da IA: ${mensagemErro || 'Código ' + respostaIA.status}` 
      });
    }

    // 5. Transforma o resultado para exibir na tela do lojista
    const arrayBuffer = await respostaIA.arrayBuffer();
    const bufferResultado = Buffer.from(arrayBuffer);
    const fotoFinalBase64 = `data:image/jpeg;base64,${bufferResultado.toString('base64')}`;

    return res.status(200).json({ 
      sucesso: true,
      mensagem: "O Estúdio CupomClic finalizou o seu anúncio com sucesso!",
      imagemResultado: fotoFinalBase64
    });

  } catch (erro) {
    console.error("Erro crítico no servidor:", erro);
    return res.status(500).json({ erro: 'Erro interno ao processar a imagem.' });
  }
}
