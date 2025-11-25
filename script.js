// ==================== INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  // ==================== ELEMENTOS DO DOM ====================
  const elementos = {
    inputNovoCliente: document.getElementById("novoCliente"),
    btnAddCliente: document.getElementById("addClienteBtn"),
    tabsContainer: document.getElementById("tabs"),
    noteForm: document.getElementById("noteForm"),
    inputEtapa: document.getElementById("etapa"),
    inputObs: document.getElementById("observacoes"),
    inputData: document.getElementById("data"),
    notesTableBody: document.querySelector("#notesTable tbody"),
    btnExport: document.getElementById("exportExcel"),
    tituloTabela: document.getElementById("tituloTabela"),
    notificacao: document.getElementById("notificacao"),
    notificacaoTexto: document.getElementById("notificacaoTexto")
  };

  // Verificação de elementos
  if (Object.values(elementos).some(el => !el)) {
    console.error("Algum elemento não foi encontrado — confira os IDs no HTML.");
    return;
  }

  // ==================== VARIÁVEIS GLOBAIS ====================
  const LS_CLIENTES = "anotone_clientes";
  const LS_ANOTACOES = "anotone_anotacoes";
  
  let clientes = JSON.parse(localStorage.getItem(LS_CLIENTES)) || [];
  let anotacoes = JSON.parse(localStorage.getItem(LS_ANOTACOES)) || [];
  let clienteSelecionado = null; // null = todas
  let editandoId = null; // ID da anotação sendo editada

  // ==================== CORREÇÃO DE IDS ====================
  corrigirIdsAntigos();

  // ==================== FUNÇÕES DE STORAGE ====================
  function salvarClientes() {
    localStorage.setItem(LS_CLIENTES, JSON.stringify(clientes));
  }

  function salvarAnotacoes() {
    localStorage.setItem(LS_ANOTACOES, JSON.stringify(anotacoes));
  }

  function corrigirIdsAntigos() {
    let precisaSalvar = false;
    anotacoes = anotacoes.map(a => {
      if (!a.id) {
        a.id = gerarId();
        precisaSalvar = true;
      }
      return a;
    });
    if (precisaSalvar) salvarAnotacoes();
  }

  // ==================== FUNÇÕES AUXILIARES ====================
  function gerarId() {
    return (crypto && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : String(Date.now()) + Math.random();
  }

  function formatarDataBr(dateString) {
    if (!dateString) return "";
    const data = new Date(dateString);
    if (isNaN(data)) return dateString;
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function limparFormulario() {
    elementos.inputEtapa.value = "";
    elementos.inputObs.value = "";
    elementos.inputData.value = "";
    editandoId = null;
  }

  function mostrarNotificacao(mensagem, tipo = "sucesso") {
    elementos.notificacaoTexto.textContent = mensagem;
    
    // Remove classe antiga e adiciona nova
    elementos.notificacao.classList.remove("erro");
    if (tipo === "erro") {
      elementos.notificacao.classList.add("erro");
    }
    
    // Mostra notificação
    elementos.notificacao.classList.add("show");
    
    // Recarrega ícones
    lucide.createIcons();
    
    // Remove após 3 segundos
    setTimeout(() => {
      elementos.notificacao.classList.remove("show");
    }, 3000);
  }

  // ==================== FUNÇÕES DE TABELA ====================
  function limpaTabela() {
    elementos.notesTableBody.innerHTML = "";
  }

  function criarBotaoAcao(icone, cor, callback) {
    const btn = document.createElement("button");
    btn.innerHTML = `<i data-lucide="${icone}"></i>`;
    btn.style.padding = "5px 10px";
    btn.style.fontSize = "16px";
    btn.style.background = cor;
    btn.addEventListener("click", callback);
    return btn;
  }

  function criarLinhaTabela(anotacao) {
    const tr = document.createElement("tr");

    // Células
    const tdCliente = document.createElement("td");
    const tdEtapa = document.createElement("td");
    const tdObs = document.createElement("td");
    const tdData = document.createElement("td");
    const tdAcoes = document.createElement("td");

    tdCliente.innerText = anotacao.cliente;
    tdEtapa.innerText = anotacao.etapa;
    tdObs.innerText = anotacao.obs;
    tdData.innerText = anotacao.data;

    // Botão de editar
    const btnEditar = criarBotaoAcao("edit-2", "#0047ff", (e) => {
      const item = anotacoes.find(a => a.id === anotacao.id);
      if (!item) return;

      elementos.inputEtapa.value = item.etapa;
      elementos.inputObs.value = item.obs;
      elementos.inputData.value = item._rawDate || "";
      editandoId = item.id;

      elementos.inputEtapa.focus();
    });

    // Botão de excluir
    const btnExcluir = criarBotaoAcao("trash-2", "#ff4d4d", () => {
      if (confirm("Excluir esta anotação?")) {
        anotacoes = anotacoes.filter(a => a.id !== anotacao.id);
        salvarAnotacoes();
        renderTabela();
      }
    });

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnExcluir);

    tr.appendChild(tdCliente);
    tr.appendChild(tdEtapa);
    tr.appendChild(tdObs);
    tr.appendChild(tdData);
    tr.appendChild(tdAcoes);

    elementos.notesTableBody.appendChild(tr);
    
    // Recarrega os ícones do Lucide
    lucide.createIcons();
  }

  function renderTabela() {
    limpaTabela();
    const filtro = clienteSelecionado;
    elementos.tituloTabela.innerText = filtro 
      ? `Anotações — ${filtro}` 
      : "Anotações — Todas";

    const itens = anotacoes.filter(a => 
      filtro ? a.cliente === filtro : true
    );

    itens.forEach(item => criarLinhaTabela(item));
  }

  // ==================== FUNÇÕES DE ABAS ====================
  function criarAbaCliente(nome) {
    const divTab = document.createElement("div");
    divTab.classList.add("tag");

    const btnNome = document.createElement("button");
    btnNome.type = "button";
    btnNome.className = "tab-btn tag-name";
    btnNome.innerText = nome;
    if (clienteSelecionado === nome) btnNome.classList.add("active");
    
    btnNome.addEventListener("click", () => {
      clienteSelecionado = nome;
      renderTabs();
      renderTabela();
    });

    const btnDelete = document.createElement("button");
    btnDelete.classList.add("close-btn");
    btnDelete.textContent = "×";
    btnDelete.title = `Excluir cliente "${nome}"`;
    btnDelete.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirCliente(nome);
    });

    divTab.appendChild(btnNome);
    divTab.appendChild(btnDelete);

    return divTab;
  }

  function renderTabs() {
    elementos.tabsContainer.innerHTML = "";

    // Aba "Todas"
    const btnAll = document.createElement("button");
    btnAll.type = "button";
    btnAll.className = "tab-btn";
    btnAll.innerText = "Todas";
    if (clienteSelecionado === null) btnAll.classList.add("active");
    
    btnAll.addEventListener("click", () => {
      clienteSelecionado = null;
      renderTabs();
      renderTabela();
    });
    
    elementos.tabsContainer.appendChild(btnAll);

    // Abas dos clientes
    clientes.forEach(nome => {
      elementos.tabsContainer.appendChild(criarAbaCliente(nome));
    });
  }

  // ==================== FUNÇÕES DE CLIENTE ====================
  function adicionarCliente() {
    const nome = elementos.inputNovoCliente.value.trim();
    
    if (!nome) {
      mostrarNotificacao("Digite um nome para o cliente!", "erro");
      return;
    }
    
    if (clientes.includes(nome)) {
      mostrarNotificacao("Cliente já existe!", "erro");
      elementos.inputNovoCliente.value = "";
      elementos.inputNovoCliente.focus();
      return;
    }
    
    clientes.push(nome);
    salvarClientes();
    elementos.inputNovoCliente.value = "";
    clienteSelecionado = nome;
    renderTabs();
    renderTabela();
    
    mostrarNotificacao(`Cliente "${nome}" adicionado com sucesso!`);
  }

  function excluirCliente(nomeCliente) {
    if (confirm(`Excluir o cliente "${nomeCliente}" e todas suas anotações?`)) {
      clientes = clientes.filter(c => c !== nomeCliente);
      salvarClientes();

      anotacoes = anotacoes.filter(a => a.cliente !== nomeCliente);
      salvarAnotacoes();

      if (clienteSelecionado === nomeCliente) {
        clienteSelecionado = null;
      }

      renderTabs();
      renderTabela();
    }
  }

  // ==================== FUNÇÕES DE ANOTAÇÃO ====================
  function adicionarOuEditarAnotacao(ev) {
    ev.preventDefault();
    
    const etapa = elementos.inputEtapa.value.trim();
    const obs = elementos.inputObs.value.trim();
    const dataVal = elementos.inputData.value;
    
    if (!etapa || !obs || !dataVal) {
      mostrarNotificacao("Preencha todos os campos!", "erro");
      return;
    }

    const cliente = clienteSelecionado || "Geral";
    
    // Garante que "Geral" existe como cliente
    if (cliente === "Geral" && !clientes.includes("Geral")) {
      clientes.push("Geral");
      salvarClientes();
      renderTabs();
    }

    const dataBr = formatarDataBr(dataVal);

    // Se está editando
    if (editandoId) {
      const index = anotacoes.findIndex(a => a.id === editandoId);
      if (index !== -1) {
        anotacoes[index] = {
          ...anotacoes[index],
          etapa,
          obs,
          data: dataBr,
          _rawDate: dataVal
        };
        mostrarNotificacao("Anotação editada com sucesso!");
      }
    } else {
      // Adicionar nova
      const registro = {
        id: gerarId(),
        cliente,
        etapa,
        obs,
        data: dataBr,
        _rawDate: dataVal
      };
      anotacoes.push(registro);
      mostrarNotificacao("Anotação adicionada com sucesso!");
    }

    salvarAnotacoes();

    if (cliente !== clienteSelecionado) {
      clienteSelecionado = cliente;
      renderTabs();
    }
    
    renderTabela();
    limparFormulario();
  }

  // ==================== FUNÇÃO DE EXPORTAÇÃO ====================
  function exportarParaExcel() {
    const filtro = clienteSelecionado;
    const itens = anotacoes.filter(a => 
      filtro ? a.cliente === filtro : true
    );

    if (itens.length === 0) {
      mostrarNotificacao("Nenhuma anotação para exportar!", "erro");
      return;
    }

    const rows = [
      ["Cliente", "Etapa", "Observações", "Data"]
    ];

    itens.forEach(a => {
      rows.push([a.cliente, a.etapa, a.obs, a.data]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anotações");

    const nomeArquivo = filtro
      ? `anotacoes_${filtro}.xlsx`
      : "anotacoes_todas.xlsx";

    XLSX.writeFile(wb, nomeArquivo);
    
    mostrarNotificacao("Arquivo exportado com sucesso!");
  }

  // ==================== EVENTOS ====================
  elementos.btnAddCliente.addEventListener("click", adicionarCliente);
  
  elementos.inputNovoCliente.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarCliente();
    }
  });

  elementos.noteForm.addEventListener("submit", adicionarOuEditarAnotacao);
  
  elementos.btnExport.addEventListener("click", exportarParaExcel);

  // ==================== INICIALIZAÇÃO FINAL ====================
  renderTabs();
  renderTabela();

  console.log("✅ AnotaOne carregado com sucesso!");
});