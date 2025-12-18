document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();

  const LS_CLIENTES = "anotone_clientes";
  const LS_ANOTACOES = "anotone_anotacoes";
  const LS_CORES = "anotone_clientes_cores";

  /* ========= CARGA + MIGRAÇÃO ========= */

  const clientesRaw = JSON.parse(localStorage.getItem(LS_CLIENTES)) || [];
  const anotacoes = JSON.parse(localStorage.getItem(LS_ANOTACOES)) || [];
  const coresClientes =
    JSON.parse(localStorage.getItem(LS_CORES)) || {};

  const clientes = [];
  
  let indexEmEdicao = null;


  clientesRaw.forEach(c => {
    if (typeof c === "string") {
      clientes.push(c);
    } else if (c && typeof c === "object") {
      const nome = c.nome || String(c);
      clientes.push(nome);
      if (c.cor && !coresClientes[nome]) {
        coresClientes[nome] = c.cor;
      }
    }
  });

  const notificacao = document.getElementById("notificacao");
const notificacaoTexto = document.getElementById("notificacaoTexto");

function showNotif(texto) {
  if (!notificacao) return;
  notificacaoTexto.textContent = texto;
  notificacao.classList.add("show");
  setTimeout(() => notificacao.classList.remove("show"), 2500);
}


  salvarClientes();
  salvarCores();

  let clienteSelecionado = null;

  /* ========= ELEMENTOS ========= */

  const el = {
    novoCliente: document.getElementById("novoCliente"),
    addClienteBtn: document.getElementById("addClienteBtn"),
    tabs: document.getElementById("tabs"),
    form: document.getElementById("noteForm"),
    etapa: document.getElementById("etapa"),
    obs: document.getElementById("observacoes"),
    data: document.getElementById("data"),
    tbody: document.querySelector("#notesTable tbody"),
    titulo: document.getElementById("tituloTabela"),
    export: document.getElementById("exportExcel")
  };

  /* ========= STORAGE ========= */

  function salvarClientes() {
    localStorage.setItem(LS_CLIENTES, JSON.stringify(clientes));
  }

  function salvarAnotacoes() {
    localStorage.setItem(LS_ANOTACOES, JSON.stringify(anotacoes));
  }

  function salvarCores() {
    localStorage.setItem(LS_CORES, JSON.stringify(coresClientes));
  }

  /* ========= TABS ========= */

  function criarAba(nome) {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = nome;
    btn.style.background = coresClientes[nome] || "#0047ff";

    if (clienteSelecionado === nome) {
      btn.classList.add("active");
    }

    // selecionar
    btn.onclick = () => {
      clienteSelecionado = nome;
      renderTabs();
      renderTabela();
    };

    // editar nome (duplo clique)
    btn.ondblclick = () => {
      const novoNome = prompt("Editar nome do cliente:", nome);
      if (!novoNome || novoNome === nome) return;

      const idx = clientes.indexOf(nome);
      if (idx !== -1) clientes[idx] = novoNome;

      anotacoes.forEach(a => {
        if (a.cliente === nome) a.cliente = novoNome;
      });

      if (coresClientes[nome]) {
        coresClientes[novoNome] = coresClientes[nome];
        delete coresClientes[nome];
      }

      clienteSelecionado = novoNome;

      salvarClientes();
      salvarAnotacoes();
      salvarCores();

      renderTabs();
      renderTabela();
    };

    // editar cor (clique direito)
    btn.oncontextmenu = (e) => {
      e.preventDefault();

      const novaCor = prompt(
        "Cor do cliente (hex ou nome):",
        coresClientes[nome] || "#0047ff"
      );

      if (!novaCor) return;

      coresClientes[nome] = novaCor;
      salvarCores();
      renderTabs();
    };

    return btn;
  }

  function renderTabs() {
    el.tabs.innerHTML = "";

    const todas = document.createElement("button");
    todas.className = "tab-btn";
    todas.textContent = "Todas";
    if (!clienteSelecionado) todas.classList.add("active");

    todas.onclick = () => {
      clienteSelecionado = null;
      renderTabs();
      renderTabela();
    };

    el.tabs.appendChild(todas);

    clientes.forEach(c => {
      el.tabs.appendChild(criarAba(c));
    });
  }

  /* ========= TABELA ========= */

  function renderTabela() {
  el.tbody.innerHTML = "";
  el.titulo.textContent = clienteSelecionado
    ? `Anotações — ${clienteSelecionado}`
    : "Anotações — Todas";

  anotacoes.forEach((a, realIndex) => {
    if (clienteSelecionado && a.cliente !== clienteSelecionado) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.cliente}</td>
      <td>${a.etapa}</td>
      <td>${a.obs}</td>
      <td>${a.data}</td>
      <td>
        <button onclick="editarAnotacao(${realIndex})">✏️</button>
        <button onclick="excluirAnotacao(${realIndex})">🗑</button>
      </td>
    `;
    el.tbody.appendChild(tr);
  });
}


  /* ========= ANOTAÇÕES ========= */

  window.excluirAnotacao = (i) => {
    anotacoes.splice(i, 1);
    salvarAnotacoes();
    renderTabela();
  };

  window.editarAnotacao = (index) => {
  const a = anotacoes[index];

  // Preenche o formulário
  el.etapa.value = a.etapa;
  el.obs.value = a.obs;

  // Converter data para datetime-local
  const dataISO = new Date(a.data).toISOString().slice(0, 16);
  el.data.value = dataISO;

  indexEmEdicao = index;

  showNotif("Editando anotação");
};


  /* ========= EVENTOS ========= */

  el.addClienteBtn.onclick = () => {
    const nome = el.novoCliente.value.trim();
    if (!nome || clientes.includes(nome)) return;

    clientes.push(nome);
    coresClientes[nome] = "#0047ff";

    salvarClientes();
    salvarCores();

    el.novoCliente.value = "";
    renderTabs();
  };

  el.form.onsubmit = (e) => {
  e.preventDefault();
  if (!clienteSelecionado) {
    alert("Selecione um cliente.");
    return;
  }

  const anotacao = {
    cliente: clienteSelecionado,
    etapa: el.etapa.value,
    obs: el.obs.value,
    data: new Date(el.data.value).toLocaleString("pt-BR")
  };

  if (indexEmEdicao !== null) {
    // MODO EDIÇÃO
    anotacoes[indexEmEdicao] = anotacao;
    indexEmEdicao = null;
    showNotif("Anotação atualizada");
  } else {
    // MODO NOVO
    anotacoes.push(anotacao);
    showNotif("Anotação adicionada");
  }

  salvarAnotacoes();
  renderTabela();
  el.form.reset();
};


  el.export.onclick = () => {
    if (!window.XLSX) return;
    const rows = [["Cliente", "Etapa", "Observações", "Data"]];
    anotacoes.forEach(a =>
      rows.push([a.cliente, a.etapa, a.obs, a.data])
    );
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anotações");
    XLSX.writeFile(wb, "anotacoes.xlsx");
  };

  showNotif("Anotação excluída");

  indexEmEdicao = null;
el.form.reset();
el.form.querySelector("button[type='submit']").textContent = "Adicionar anotação";


  renderTabs();
  renderTabela();
});






