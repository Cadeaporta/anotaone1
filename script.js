// script.js — versão corrigida (IDs, exclusão estável, XLSX)
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

  document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
});




  // dados locais
  const LS_CLIENTES = "anotone_clientes";
  const LS_ANOTACOES = "anotone_anotacoes";
  let clientes = JSON.parse(localStorage.getItem(LS_CLIENTES)) || [];
  let anotacoes = JSON.parse(localStorage.getItem(LS_ANOTACOES)) || [];
  let clienteSelecionado = null; // null = todas

  // Se houver anotações sem id (versões antigas), corrige e salva
  let precisaSalvarIds = false;
  anotacoes = anotacoes.map(a => {
    if (!a.id) {
      a.id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();
      precisaSalvarIds = true;
    }
    return a;
  });
  if (precisaSalvarIds) salvarAnotacoes();

  // --------- utilitários ----------
  function salvarClientes() {
    localStorage.setItem(LS_CLIENTES, JSON.stringify(clientes));
  }

  function salvarAnotacoes() {
    localStorage.setItem(LS_ANOTACOES, JSON.stringify(anotacoes));
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

  function limpaTabela() {
    notesTableBody.innerHTML = "";
  }

  function criarLinhaTabela(anotacao) {
    const tr = document.createElement("tr");

    const tdCliente = document.createElement("td");
    const tdEtapa = document.createElement("td");
    const tdObs = document.createElement("td");
    const tdData = document.createElement("td");
    const tdAcoes = document.createElement("td");

    tdCliente.innerText = anotacao.cliente;
    tdEtapa.innerText = anotacao.etapa;
    tdObs.innerText = anotacao.obs;
    tdData.innerText = anotacao.data;

    // Botão de excluir (usa data-id para segurança)
    const btnExcluir = document.createElement("button");
    btnExcluir.innerHTML = '<i id="trash" data-lucide="trash-2"></i>';
    btnExcluir.style.padding = "5px 10px";
    btnExcluir.style.fontSize = "16px";
    btnExcluir.dataset.id = anotacao.id;

    btnExcluir.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      if (!id) return;
      if (confirm("Excluir esta anotação?")) {
        anotacoes = anotacoes.filter(a => a.id !== id);
        salvarAnotacoes();
        renderTabela();
      }
    });

    // Botão de editar (igual o excluir, só que sem matar ninguém)
const btnEditar = document.createElement("button");
btnEditar.innerHTML = '<i id="edit" data-lucide="edit-2"></i>';
btnEditar.style.padding = "5px 10px";
btnEditar.style.fontSize = "16px";
btnEditar.dataset.id = anotacao.id;

btnEditar.addEventListener("click", (e) => {
  const id = e.currentTarget.dataset.id;
  if (!id) return;

  // pega a anotação pelo id
  const item = anotacoes.find(a => a.id == id);
  if (!item) return;

  // coloca no formulário
  document.getElementById("cliente").value = item.cliente;
  document.getElementById("etapa").value = item.etapa;
  document.getElementById("obs").value = item.obs;
  document.getElementById("data").value = item.data;

  // marca que não é novo
  editandoId = id;
});


    tdAcoes.appendChild(btnExcluir);

    tr.appendChild(tdCliente);
    tr.appendChild(tdEtapa);
    tr.appendChild(tdObs);
    tr.appendChild(tdData);
    tr.appendChild(tdAcoes);
    notesTableBody.appendChild(tr);
  }

  function excluirCliente(nomeCliente) {
    if (confirm(`Excluir o cliente "${nomeCliente}" e todas suas anotações?`)) {
      // Remove o cliente da lista
      clientes = clientes.filter(c => c !== nomeCliente);
      salvarClientes();

      // Remove todas as anotações desse cliente
      anotacoes = anotacoes.filter(a => a.cliente !== nomeCliente);
      salvarAnotacoes();

      // Se estava selecionado, volta para "Todas"
      if (clienteSelecionado === nomeCliente) {
        clienteSelecionado = null;
      }

      renderTabs();
      renderTabela();
    }
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

    // abas dos clientes com botão de excluir
    clientes.forEach(nome => {
      const divTab = document.createElement("div");
      divTab.style.display = "inline-flex";
      divTab.style.alignItems = "center";
      divTab.style.gap = "5px";

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

      const deleteBtn = document.createElement("button");
deleteBtn.classList.add("close-btn");
deleteBtn.textContent = "×"; // mais bonitinho
deleteBtn.title = `Excluir cliente "${nome}"`;
deleteBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // evita disparar o clique da aba
  excluirCliente(nome);
});

// faz o container agir como "tag"
divTab.classList.add("tag");

b.classList.add("tag-name"); // só pra organizar

divTab.appendChild(b);
divTab.appendChild(deleteBtn);

      tabsContainer.appendChild(divTab);
    });
  }

  function renderTabela() {
    limpaTabela();
    const filtro = clienteSelecionado;
    tituloTabela.innerText = filtro ? `Anotações — ${filtro}` : "Anotações — Todas";

    const itens = anotacoes
      .filter(a => (filtro ? a.cliente === filtro : true));

    itens.forEach(item => criarLinhaTabela(item));
  }

  // --------- eventos ----------
  btnAddCliente.addEventListener("click", () => {
    const nome = inputNovoCliente.value.trim();
    if (!nome) return;
    if (clientes.includes(nome)) {
      alert("Cliente já existe!");
      inputNovoCliente.value = "";
      inputNovoCliente.focus();
      return;
    }
    clientes.push(nome);
    salvarClientes();
    inputNovoCliente.value = "";
    clienteSelecionado = nome;
    renderTabs();
    renderTabela();
  });

  noteForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const etapa = inputEtapa.value.trim();
    const obs = inputObs.value.trim();
    const dataVal = inputData.value;
    if (!etapa || !obs || !dataVal) return;

    const cliente = clienteSelecionado || "Geral";
    if (cliente === "Geral" && !clientes.includes("Geral")) {
      clientes.push("Geral");
      salvarClientes();
      renderTabs();
    }

    // Enter adiciona cliente
inputNovoCliente.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    btnAddCliente.click();
  }
});


    const dataBr = formatarDataBr(dataVal);
    const registro = {
      id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      cliente,
      etapa,    
      obs,
      data: dataBr,
      _rawDate: dataVal
    };

    anotacoes.push(registro);
    salvarAnotacoes();

    if (cliente !== clienteSelecionado) {
      clienteSelecionado = cliente;
      renderTabs();
    }
    renderTabela();

    inputEtapa.value = "";
    inputObs.value = "";
    inputData.value = "";
  });

  btnExport.addEventListener("click", () => {
    const filtro = clienteSelecionado;
    const itens = anotacoes.filter(a => (filtro ? a.cliente === filtro : true));

    // Monta os dados no formato que o sheetjs entende
    const rows = [
      ["Cliente", "Etapa", "Observações", "Data"]
    ];

    itens.forEach(a => { 
      rows.push([a.cliente, a.etapa, a.obs, a.data]);
    });

    // Cria a planilha
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Cria o workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anotações");

    const nomeArquivo = filtro
      ? `anotacoes_${filtro}.xlsx`
      : "anotacoes_todas.xlsx";

    // Exporta o arquivo XLSX
    XLSX.writeFile(wb, nomeArquivo);
  });

  // --------- inicialização ----------
  renderTabs();
  renderTabela();

  console.log("script.js inicializado com exclusão estável e export XLSX.");
});
