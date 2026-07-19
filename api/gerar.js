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

    console.log("📥 Foto recebida. Conectando ao motor generativo...");

    // 1. Prepara o arquivo binário vindo do otimizador do frontend
    const base64Data = imagem.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    // 2. Monta o formulário com as exigências exatas da IA
    const formData = new FormData();
    formData.append('imageFile', blob, 'produto.jpg');
    
    // CORREÇÃO: O modo do cenário precisa ser estritamente em letras maiúsculas (AI)
    formData.append('background.mode', 'AI');
    
    // O seu prompt direcionando a arte para os padrões do CupomClic
    const promptCenario = 'Studio background, infinite drop, elegant and modern product photography. Professional studio lighting with deep navy blue, metallic copper, subtle touches of purple and teal water color highlights. Realistic shadows and studio ambient.';
    formData.append('background.prompt', promptCenario);

    // 3. Envia os dados para o servidor da inteligência artificial
    const respostaIA = await fetch('https://image-api.photoroom.com/v1/edit', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });

    // 4. Se der erro, tentamos ler a resposta ou pegamos o status puro do servidor
    if (!respostaIA.ok) {
      let mensagemErro = "";
      try {
        mensagemErro = await respostaIA.text();
      } catch (e) {
        mensagemErro = respostaIA.statusText;
      }
      
      console.error("Erro no motor da IA:", mensagemErro);
      return res.status(500).json({ 
        erro: `A IA recusou os parâmetros: ${mensagemErro || 'Código de resposta ' + respostaIA.status}` 
      });
    }

    // 5. Deu tudo certo! Transforma a foto gerada em texto para exibir na tela
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
