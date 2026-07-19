export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  try {
    const { imagem } = req.body;

    if (!imagem) {
      return res.status(400).json({ erro: 'Foto não encontrada.' });
    }

    console.log("📥 Foto recebida no backend com sucesso!");

    const promptCupomClic = `
      Transforme esse produto em um anuncio profissional para postagem.
      Remova o fundo original.
      Crie um fundo de estúdio infinito, elegante e moderno.
      Use a paleta de cores da marca para a iluminação de fundo e elementos sutis do cenário: Azul Marinho Escuro, Cobre metálico, toques de Roxo e Verde Água.
    `;

    // Resposta atualizada, sem citar a Vercel, mantendo a credibilidade da sua marca
    return res.status(200).json({ 
      mensagem: "Foto recebida! O Estúdio CupomClic está preparando a sua imagem."
    });

  } catch (erro) {
    console.error("Erro:", erro);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}
