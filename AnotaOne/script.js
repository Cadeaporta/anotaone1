// script.js — versão compatível com seu HTML atual
document.addEventListener("DOMContentLoaded", () => {
  // elementos (IDs do seu HTML)
  const inputNovoCliente = document.getElementById("novoCliente");
  const btnAddCliente = document.getElementById("addClienteBtn");
  const tabsContainer = document.getElementById("tabs");
  const noteForm = document.getElementById("noteForm");
  const inputEtapa = document.getElementById("etapa");
  const inputObs = document.getElementById("observacoes");
  const inputData = document.getElementById("data");
  const notesTableBody = document.querySelector("#notesTable tbody");
  const btnExport = document.getElementById("exportExcel");
  const tituloTabela = document.getElementById("tituloTabela");

  if (!inputNovoCliente || !btnAddCliente || !tabsContainer || !noteForm || !inputEtapa ||
      !inputObs || !inputData || !notesTableBody || !btnExport) {
    console.error("Algum elemento não foi encontrado — confira os IDs no HTML.");
    return;
  }

  // dados locais
  const LS_CLIENTES = "anotone_clientes";
  const LS_ANOTACOES = "anotone_anotacoes";
  let clientes = JSON.parse(localStorage.getItem(LS_CLIENTES)) || [];
  let anotacoes = JSON.parse(localStorage.getItem(LS_ANOTACOES)) || [];
  let clienteSelecionado = null; // null = todas

  // --------- utilitários ----------
  function salvarClientes() {
    localStorage.setItem(LS_CLIENTES, JSON.stringify(clientes));
  }

  function salvarAnotacoes() {
    localStorage.setItem(LS_ANOTACOES, JSON.stringify(anotacoes));
  }

  function formatarDataBr(dateString) {
  if (!dateString) return "";

  // Se vier no formato yyyy-mm-dd
  if (dateString.includes("-")) {
    const [ano, mes, dia] = dateString.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  // Se já estiver no formato BR, só devolve
  if (dateString.includes("/")) {
    return dateString;
  }

  // Caso venha algo inesperado
  return dateString;
}


  function limpaTabela() {
    notesTableBody.innerHTML = "";
  }

  function criarLinhaTabela({ etapa, obs, data }) {
    const tr = document.createElement("tr");
    const tdEtapa = document.createElement("td");
    const tdObs = document.createElement("td");
    const tdData = document.createElement("td");

    tdEtapa.innerText = etapa;
    tdObs.innerText = obs;
    tdData.innerText = data;

    tr.appendChild(tdEtapa);
    tr.appendChild(tdObs);
    tr.appendChild(tdData);
    notesTableBody.appendChild(tr);
  }

  // --------- renderização de abas e tabela ----------
  function renderTabs() {
    tabsContainer.innerHTML = "";
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
    tabsContainer.appendChild(btnAll);

    // abas dos clientes
    clientes.forEach(nome => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab-btn";
      b.innerText = nome;
      if (clienteSelecionado === nome) b.classList.add("active");
      b.addEventListener("click", () => {
        clienteSelecionado = nome;
        renderTabs();
        renderTabela();
      });
      tabsContainer.appendChild(b);
    });
  }

  function renderTabela() {
    limpaTabela();
    const filtro = clienteSelecionado;
    tituloTabela.innerText = filtro ? `Anotações — ${filtro}` : "Anotações — Todas";
    const itens = anotacoes.filter(a => (filtro ? a.cliente === filtro : true));
    itens.forEach(item => criarLinhaTabela(item));
  }

  // --------- eventos ----------
  btnAddCliente.addEventListener("click", () => {
    const nome = inputNovoCliente.value.trim();
    if (!nome) return;
    if (clientes.includes(nome)) {
      // evita duplicata
      inputNovoCliente.value = "";
      inputNovoCliente.focus();
      return;
    }
    clientes.push(nome);
    salvarClientes();
    inputNovoCliente.value = "";
    clienteSelecionado = nome; // selecionar automaticamente
    renderTabs();
    renderTabela();
  });

  noteForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const etapa = inputEtapa.value.trim();
    const obs = inputObs.value.trim();
    const dataVal = inputData.value;
    if (!etapa || !obs || !dataVal) return;

    // se nenhum cliente selecionado, salva como "Geral"
    const cliente = clienteSelecionado || "Geral";
    if (cliente === "Geral" && !clientes.includes("Geral")) {
      // opcional: manter "Geral" como cliente se usar esse padrão
      clientes.push("Geral");
      salvarClientes();
      renderTabs();
    }

    const dataBr = formatarDataBr(dataVal);
    const registro = { cliente, etapa, obs, data: dataBr };
    anotacoes.push(registro);
    salvarAnotacoes();

    // se quiser que a tabela mostre só do cliente criado, garante seleção
    if (cliente !== clienteSelecionado) {
      clienteSelecionado = cliente;
      renderTabs();
    }
    renderTabela();

    // limpar form
    inputEtapa.value = "";
    inputObs.value = "";
    inputData.value = "";
  });

  btnExport.addEventListener("click", () => {
    // exporta as linhas atualmente visíveis
    const rows = [];
    // header
    rows.push(['"Cliente"', '"Etapa"', '"Observações"', '"Data"'].join(","));
    const filtro = clienteSelecionado;
    const itens = anotacoes.filter(a => (filtro ? a.cliente === filtro : true));
    itens.forEach(a => {
      // escapando aspas nas células
      const safe = [
        `"${(a.cliente || "").replace(/"/g, '""')}"`,
        `"${(a.etapa || "").replace(/"/g, '""')}"`,
        `"${(a.obs || "").replace(/"/g, '""')}"`,
        `"${(a.data || "").replace(/"/g, '""')}"`
      ];
      rows.push(safe.join(","));
    });

    const csvContent = rows.join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;'\"'" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const nomeArquivo = clienteSelecionado ? `anotacoes_${clienteSelecionado}.csv` : "anotacoes_todas.csv";
    link.download = nomeArquivo;
    link.click();
  });

  // --------- inicialização ----------
  // se não houver clientes, mantém tudo visível (ou cria "Geral" se preferir)
  renderTabs();
  renderTabela();

  console.log("script.js inicializado — abas e botões operacionais.");
});
