// função para ler arquivos txt e retornar array de linhas minúsculas
async function carregarArquivo(caminho) {
  try {
    const resposta = await fetch(caminho);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const texto = await resposta.text();
    return texto.split(/\s+/).map(l => l.trim().toLowerCase()).filter(Boolean);
  } catch (err) {
    console.error(`Erro ao carregar ${caminho}:`, err);
    return [];
  }
}

let palavrasConhecidas = [];
let listaNGL = [];
let ultimaAnalise = { desconhecidas: [], ngl: [] };

// inicializa e habilita botão apenas quando ambas listas estiverem carregadas
(async function init() {
  document.getElementById('resultado').innerText = 'Carregando listas...';
  palavrasConhecidas = await carregarArquivo('./conhecidas.txt');
  listaNGL = await carregarArquivo('./listNGL.txt');

  if (!palavrasConhecidas.length || !listaNGL.length) {
    document.getElementById('resultado').innerText =
      'Aviso: não foi possível carregar conhecidas.txt ou listNGL.txt.';
  } else {
    document.getElementById('resultado').innerText =
      'Listas carregadas. Pronto para analisar!';
    document.getElementById('btnCalcular').disabled = false;
  }
})();

document.getElementById('btnCalcular').addEventListener('click', () => {
  const texto = document.getElementById('textoEntrada').value;
  analisarTexto(texto);
});

function analisarTexto(texto) {
  const regexPalavras = /\b[\p{L}']+\b/gu;
  const achados = texto.match(regexPalavras) || [];
  const palavras = achados.map(w => w.toLowerCase());

  const total = palavras.length;
  const distintas = new Set(palavras);

  // palavras conhecidas
  const conhecidasArr = palavras.filter(p => palavrasConhecidas.includes(p));
  const conhecidasDistintas = new Set(conhecidasArr);

  // palavras NGL (excluindo as já conhecidas)
  const nglArr = palavras.filter(
    p => listaNGL.includes(p) && !palavrasConhecidas.includes(p)
  );
  const nglDistintas = new Set(nglArr);

  // métricas
  const coberturaTotalConhecidas = total
    ? (conhecidasArr.length / total * 100).toFixed(2)
    : '0.00';
  const coberturaVocabConhecidas = distintas.size
    ? (conhecidasDistintas.size / distintas.size * 100).toFixed(2)
    : '0.00';

  const coberturaTotalNGL = total
    ? (nglArr.length / total * 100).toFixed(2)
    : '0.00';
  const coberturaVocabNGL = distintas.size
    ? (nglDistintas.size / distintas.size * 100).toFixed(2)
    : '0.00';

  document.getElementById('resultado').innerHTML = `
    <b>Com base em palavras conhecidas:</b><br>
    Total de palavras: ${total} <br>
    Total de palavras distintas: ${distintas.size} <br>
    Palavras conhecidas no total: ${conhecidasArr.length} <br>
    Cobertura total: ${coberturaTotalConhecidas}% <br>
    Cobertura de vocabulário: ${coberturaVocabConhecidas}% <br><br>

    <b>Com base na NGL (não conhecidas):</b><br>
    Palavras NGL no total: ${nglArr.length} <br>
    Cobertura total: ${coberturaTotalNGL}% <br>
    Cobertura de vocabulário: ${coberturaVocabNGL}%
  `;

  // legenda
  document.getElementById('legenda').innerHTML = `
  <b>Legenda:</b> 
  <span class="conhecida">Palavra conhecida</span> 
  <span class="ngl">Palavra NGL (não conhecida)</span> 
  <span class="nao-conhecida">Palavra não conhecida</span>
  `;

  // marcação do texto
  const partes = texto.split(/(\b[\p{L}']+\b)/gu);

  const marcado = partes
    .map(part => {
      if (part.match(/^\b[\p{L}']+\b$/u)) {
        const limpo = part.toLowerCase();
        if (palavrasConhecidas.includes(limpo)) {
          return `<span class="conhecida">${escapeHtml(part)}</span>`;
        } else if (listaNGL.includes(limpo)) {
          return `<span class="ngl">${escapeHtml(part)}</span>`;
        } else {
          return `<span class="nao-conhecida">${escapeHtml(part)}</span>`;
        }
      }
      return escapeHtml(part);
    })
    .join('');

  document.getElementById('textoMarcado').innerHTML = marcado;

  // salvar palavras para o botão "Listar"
  const desconhecidas = [];
  const nglPalavras = [];
  for (let w of distintas) {
    if (!palavrasConhecidas.includes(w)) {
      if (listaNGL.includes(w)) {
        nglPalavras.push(w);
      } else {
        desconhecidas.push(w);
      }
    }
  }
  ultimaAnalise = { desconhecidas, ngl: nglPalavras };

  // habilitar botão listar
  document.getElementById('btnListar').disabled = false;
}

// botão "Listar"
document.getElementById('btnListar').addEventListener('click', () => {
  const { desconhecidas, ngl } = ultimaAnalise;
  if (!desconhecidas.length && !ngl.length) {
    document.getElementById('listaDesconhecidas').innerHTML =
      '<i>Nenhuma palavra desconhecida!</i>';
    return;
  }

  let html = '<strong>Palavras desconhecidas:</strong><br>';
  html += desconhecidas
    .map(w => `<span class="nao-conhecida">${w}</span>`)
    .join(' ');

  html += '<br><br><strong>Palavras NGL:</strong><br>';
  html += ngl.map(w => `<span class="ngl">${w}</span>`).join(' ');

  document.getElementById('listaDesconhecidas').innerHTML = html;
});

// escapa caracteres especiais HTML
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
