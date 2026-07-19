export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { imagem } = req.body;

    if (!imagem) {
      return res.status(400).json({ erro: 'Foto não encontrada.' });
    }

    console.log("📥 Foto recebida. Conectando ao Google AI Studio...");

    // Limpamos o cabeçalho do Base64 para enviar apenas o texto puro da imagem para o Google
    const imagemPuraBase64 = imagem.split(',')[1];

    // Pegamos a chave que você configurou no painel da Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ erro: 'Chave GEMINI_API_KEY não configurada na Vercel.' });
    }

    // O seu prompt vencedor combinado com a direção de arte do CupomClic
    const promptCupomClic = `
      Transforme esse produto em um anuncio profissional para postagem.
      Reestruture o cenário completamente mantendo o produto intacto.
      Crie um fundo de estúdio infinito, elegante e moderno.
      Use a paleta de cores da marca para a iluminação, reflexos e elementos sutis do cenário: Azul Marinho Escuro, Cobre metálico, toques de Roxo e Verde Água.
      O produto deve ficar perfeitamente iluminado, centralizado e em destaque absoluto.
    `;

    // Chamada oficial para o motor de imagem do Google (Imagen 3) no AI Studio
    const urlGoogle = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

    const respostaGoogle = await fetch(urlGoogle, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: promptCupomClic,
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "1:1",
        // Passamos a foto do lojista como referência para a IA reformular o cenário ao redor
        imageContext: {
          inputImage: {
            imageBytes: imagemPuraBase64
          }
        }
      })
    });

    const dadosGoogle = await respostaGoogle.json();

    if (!dadosGoogle.generatedImages || dadosGoogle.generatedImages.length === 0) {
      return res.status(500).json({ erro: 'A IA do Google não conseguiu processar esta imagem.' });
    }

    // O Google nos devolve a foto nova em formato de texto (Base64)
    const fotoTratadaBase64 = dadosGoogle.generatedImages[0].image.imageBytes;
    const fotoFinal = `data:image/jpeg;base64,${fotoTratadaBase64}`;

    // Enviamos a foto linda e reformulada de volta para o painel do lojista
    return res.status(200).json({ 
      sucesso: true,
      mensagem: "O Estúdio CupomClic finalizou o seu anúncio com sucesso!",
      imagemResultado: fotoFinal
    });

  } catch (erro) {
    console.error("Erro interno:", erro);
    return res.status(500).json({ erro: 'Erro ao processar a imagem na IA.' });
  }
}
