// carrega arquivo txt e retorna array de linhas (minúsculas)
async function carregarArquivo(caminho) {
    try {
      const resposta = await fetch(caminho);
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const texto = await resposta.text();
      return texto.split(/\r?\n/).map(l => l.trim().toLowerCase()).filter(Boolean);
    } catch (err) {
      console.error(`Erro ao carregar ${caminho}:`, err);
      return [];
    }
  }
  
  let palavrasConhecidas = [];
  
  // inicializa e habilita botão só quando a lista for carregada
  (async function init() {
    document.getElementById('resultado').innerText = 'Carregando lista de palavras...';
    palavrasConhecidas = await carregarArquivo('./conhecidas.txt');
    if (!palavrasConhecidas.length) {
      document.getElementById('resultado').innerText = 'Aviso: não foi possível carregar conhecidas.txt (verifique caminho / servidor).';
    } else {
      document.getElementById('resultado').innerText = 'Lista carregada. Pronto para analisar!';
      document.getElementById('btnCalcular').disabled = false;
    }
  })();
  
  // Escuta clique
  document.getElementById('btnCalcular').addEventListener('click', () => {
    const texto = document.getElementById('textoEntrada').value;
    analisarTexto(texto);
  });
  
  function analisarTexto(texto) {
    // ===== contagem de palavras (suporta letras acentuadas via \p{L}) =====
    // usamos 'u' (unicode) e 'g' para pegar todas as ocorrências
    const regexPalavras = /\b[\p{L}']+\b/gu;
    const achados = texto.match(regexPalavras) || [];
    const palavras = achados.map(w => w.toLowerCase());
  
    const total = palavras.length;
    const distintas = new Set(palavras);
  
    const conhecidasArr = palavras.filter(p => palavrasConhecidas.includes(p));
    const conhecidasDistintas = new Set(conhecidasArr);
  
    const coberturaTotal = total ? (conhecidasArr.length / total * 100).toFixed(2) : '0.00';
    const coberturaVocab = distintas.size ? (conhecidasDistintas.size / distintas.size * 100).toFixed(2) : '0.00';
  
    document.getElementById('resultado').innerHTML = `
      Total de palavras: ${total} <br>
      Total de palavras distintas: ${distintas.size} <br>
      Palavras conhecidas no total: ${conhecidasArr.length} <br>
      Palavras conhecidas distintas: ${conhecidasDistintas.size} <br>
      Cobertura total: ${coberturaTotal}% <br>
      Cobertura de vocabulário: ${coberturaVocab}%
    `;
  
    // ===== marcação do texto com spans mantendo pontuação e espaços =====
    // split com grupo capturador para manter palavras como tokens
    const partes = texto.split(/(\b[\p{L}']+\b)/gu);
  
    const marcado = partes.map(part => {
      // verifica se 'part' é uma palavra
      if (part.match(/^\b[\p{L}']+\b$/u)) {
        const limpo = part.toLowerCase();
        if (palavrasConhecidas.includes(limpo)) {
          return `<span class="conhecida">${escapeHtml(part)}</span>`;
        } else {
          return `<span class="nao-conhecida">${escapeHtml(part)}</span>`;
        }
      }
      // senão, retorna o token original (pontuação, espaços etc.)
      return escapeHtml(part);
    }).join('');
  
    document.getElementById('textoMarcado').innerHTML = marcado;
  }
  
  // pequena função para escapar texto antes de inserir em innerHTML
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  