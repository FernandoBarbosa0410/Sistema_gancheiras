const $ = (id) => document.getElementById(id);
const KEYS = { items: "controleGancheiras_v1", operators: "controleGancheiras_operadores_v1", password: "controleGancheiras_admin_password_v1", history: "controleGancheiras_historico_v1" };
let items = JSON.parse(localStorage.getItem(KEYS.items) || "[]");
let operators = JSON.parse(localStorage.getItem(KEYS.operators) || "[]");
let history = JSON.parse(localStorage.getItem(KEYS.history) || "[]");
let adminPassword = localStorage.getItem(KEYS.password) || "1234";
let setorAtual = "Galvânica";
let selecionadoId = null;

const save = () => {
  localStorage.setItem(KEYS.items, JSON.stringify(items));
  localStorage.setItem(KEYS.operators, JSON.stringify(operators));
  localStorage.setItem(KEYS.history, JSON.stringify(history));
  localStorage.setItem(KEYS.password, adminPassword);
};
const norm = v => String(v ?? "").trim().toLocaleLowerCase("pt-BR");
const showPage = id => ["paginaInicial","paginaConsulta","paginaAdmin"].forEach(p => $(p).classList.toggle("hidden", p !== id));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getItem = id => items.find(x => x.id === id);

document.querySelectorAll(".process-card").forEach(btn => btn.addEventListener("click", () => {
  setorAtual = btn.dataset.setor; $("tituloSetor").textContent = setorAtual; $("pesquisaCodigo").value = ""; selecionadoId = null; showPage("paginaConsulta"); renderConsulta();
}));
$("btnVoltar").onclick = () => showPage("paginaInicial");
$("logoInicio").onclick = e => { e.preventDefault(); showPage("paginaInicial"); };
$("limparPesquisa").onclick = () => { $("pesquisaCodigo").value = ""; renderConsulta(); $("pesquisaCodigo").focus(); };
$("pesquisaCodigo").addEventListener("input", renderConsulta);

function renderConsulta() {
  const term = norm($("pesquisaCodigo").value);
  const subset = items.filter(x => x.setor === setorAtual && (!term || norm(x.codigoPeca).includes(term)));
  $("totalSetor").textContent = `${items.filter(x=>x.setor===setorAtual).length} gancheiras`;
  $("quantidadeResultados").textContent = `${subset.length} resultado(s)`;
  $("listaGancheiras").innerHTML = subset.length ? subset.map(x => `<button class="gabarito-row ${x.id===selecionadoId?"selected":""}" data-id="${x.id}"><span class="row-main"><b class="row-code">Peça ${esc(x.codigoPeca)}</b><small class="row-description">Gancheira ${esc(x.posicao)} • Bloco ${esc(x.bloco)}</small></span><span class="row-side"><span class="row-location">${esc(x.posicao)}</span><span class="status ${x.status==="Disponível"?"available":"unavailable"}">${esc(x.status)}</span></span></button>`).join("") : `<div class="empty-list">${term ? "Nenhuma gancheira encontrada para esse código." : "Nenhuma gancheira cadastrada neste setor."}</div>`;
  $("listaGancheiras").querySelectorAll("[data-id]").forEach(b => b.onclick = () => { selecionadoId = b.dataset.id; renderConsulta(); });
  const selected = getItem(selecionadoId) || (subset.length === 1 ? subset[0] : null);
  if (selected) {
    selecionadoId = selected.id;
    $("painelLocalizacao").innerHTML = `<div class="location-result"><span class="label">LOCALIZAÇÃO DA GANCHEIRA</span><h2>Peça ${esc(selected.codigoPeca)}</h2><div class="big-location">${esc(selected.posicao)}</div><div class="detail"><span>SETOR</span><strong>${esc(selected.setor)}</strong></div><div class="detail"><span>BLOCO</span><strong>${esc(selected.bloco)}</strong></div><div class="detail"><span>POSIÇÃO</span><strong>${esc(selected.posicao)}</strong></div><div class="detail"><span>CÓDIGO DA PEÇA</span><strong>${esc(selected.codigoPeca)}</strong></div><span class="status ${selected.status==="Disponível"?"available":"unavailable"}">${selected.status}</span></div>`;
  } else {
    $("painelLocalizacao").innerHTML = `<div class="placeholder"><span>⌖</span><h2>Nenhuma peça selecionada</h2><p>Digite um código ou selecione uma peça da lista para visualizar a localização da gancheira.</p></div>`;
  }
}

$("btnAdministrar").onclick = () => { $("senhaLogin").value=""; $("erroLogin").textContent=""; $("modalLogin").classList.remove("hidden"); };
$("formLogin").onsubmit = e => { e.preventDefault(); if ($("senhaLogin").value === adminPassword) { $("modalLogin").classList.add("hidden"); showPage("paginaAdmin"); renderAdmin(); } else $("erroLogin").textContent = "Senha incorreta. Tente novamente."; };
$("btnSairAdmin").onclick = () => showPage("paginaInicial");
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => $(b.dataset.close).classList.add("hidden"));
document.querySelectorAll(".modal").forEach(m => m.addEventListener("click", e => { if(e.target===m) m.classList.add("hidden"); }));

document.querySelectorAll(".tab").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===b));
  document.querySelectorAll(".tab-content").forEach(t=>t.classList.toggle("hidden",t.id!==`tab-${b.dataset.tab}`));
  if(b.dataset.tab==="historico") renderHistory();
});

$("formGancheira").onsubmit = e => {
  e.preventDefault();
  const id = $("registroId").value;
  const item = { id: id || crypto.randomUUID(), setor: $("setor").value, bloco: $("bloco").value.trim(), posicao: $("posicao").value.trim().toUpperCase(), codigoPeca: $("codigoPeca").value.trim(), status: id ? getItem(id).status : "Disponível" };
  const duplicateCode = items.find(x => norm(x.codigoPeca)===norm(item.codigoPeca) && x.id!==id);
  const duplicatePosition = items.find(x => x.setor===item.setor && norm(x.posicao)===norm(item.posicao) && x.id!==id);
  if (duplicateCode) return $("erroCadastro").textContent = "Este código de peça já está cadastrado em outra gancheira.";
  if (duplicatePosition) return $("erroCadastro").textContent = "Esta posição já está cadastrada neste setor.";
  $("erroCadastro").textContent = "";
  if(id) items = items.map(x=>x.id===id?item:x); else items.push(item);
  save(); resetForm(); renderAdmin();
};
function resetForm(){ $("formGancheira").reset(); $("registroId").value=""; $("setor").value="Galvânica"; $("tituloFormulario").textContent="Cadastrar gancheira"; $("btnSalvar").textContent="Salvar gancheira"; $("cancelarEdicao").classList.add("hidden"); $("erroCadastro").textContent=""; }
$("cancelarEdicao").onclick = resetForm;
$("pesquisaAdmin").oninput = renderTable;

function renderAdmin() {
  $("totalAdmin").textContent = `${items.length} registros`;
  renderTable(); renderOperators(); renderHistory();
}
function renderTable() {
  const term=norm($("pesquisaAdmin").value);
  const rows=items.filter(x=>[x.setor,x.bloco,x.posicao,x.codigoPeca,x.status].some(v=>norm(v).includes(term)));
  $("tabelaGancheiras").innerHTML=rows.map(x=>`<tr><td>${esc(x.setor)}</td><td>${esc(x.bloco)}</td><td><b>${esc(x.posicao)}</b></td><td>${esc(x.codigoPeca)}</td><td><span class="status ${x.status==="Disponível"?"available":"unavailable"}">${x.status}</span></td><td><button class="table-action edit" data-edit="${x.id}">Editar</button><button class="table-action move" data-move="${x.id}">${x.status==="Disponível"?"Retirar":"Devolver"}</button><button class="table-action delete" data-delete="${x.id}">Excluir</button></td></tr>`).join("") || `<tr><td colspan="6">Nenhum registro encontrado.</td></tr>`;
  $("tabelaGancheiras").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editItem(b.dataset.edit));
  $("tabelaGancheiras").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteItem(b.dataset.delete));
  $("tabelaGancheiras").querySelectorAll("[data-move]").forEach(b=>b.onclick=()=>openMovement(b.dataset.move));
}
function editItem(id){ const x=getItem(id); if(!x)return; $("registroId").value=x.id; $("setor").value=x.setor; $("bloco").value=x.bloco; $("posicao").value=x.posicao; $("codigoPeca").value=x.codigoPeca; $("tituloFormulario").textContent="Editar gancheira"; $("btnSalvar").textContent="Salvar alterações"; $("cancelarEdicao").classList.remove("hidden"); window.scrollTo({top:0,behavior:"smooth"}); }
function deleteItem(id){ const x=getItem(id); if(!x)return; if(confirm(`Excluir a gancheira ${x.posicao} / peça ${x.codigoPeca}?`)){items=items.filter(a=>a.id!==id); if(selecionadoId===id)selecionadoId=null; save();renderAdmin();renderConsulta();}}
function renderOperators(){
  $("tabelaOperadores").innerHTML=operators.map(o=>`<tr><td>${esc(o.codigo)}</td><td>${esc(o.nome)}</td><td><span class="status ${o.ativo?"available":"unavailable"}">${o.ativo?"Ativo":"Inativo"}</span></td><td><button class="table-action edit" data-toggleop="${o.id}">${o.ativo?"Desativar":"Ativar"}</button><button class="table-action delete" data-delop="${o.id}">Excluir</button></td></tr>`).join("") || `<tr><td colspan="4">Nenhum operador cadastrado.</td></tr>`;
  $("tabelaOperadores").querySelectorAll("[data-toggleop]").forEach(b=>b.onclick=()=>{const o=operators.find(x=>x.id===b.dataset.toggleop);o.ativo=!o.ativo;save();renderOperators();});
  $("tabelaOperadores").querySelectorAll("[data-delop]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este operador?")){operators=operators.filter(x=>x.id!==b.dataset.delop);save();renderOperators();}});
}
$("formOperador").onsubmit=e=>{e.preventDefault();const codigo=$("codigoOperador").value.trim(),nome=$("nomeOperador").value.trim();if(operators.some(o=>norm(o.codigo)===norm(codigo)))return alert("Já existe um operador com esse código.");operators.push({id:crypto.randomUUID(),codigo,nome,ativo:true});save();$("formOperador").reset();renderOperators();};
function openMovement(id){const x=getItem(id);if(!x)return;if(!operators.some(o=>o.ativo))return alert("Cadastre pelo menos um operador ativo antes de registrar movimentações.");$("movimentoId").value=id;$("tituloMovimento").textContent=x.status==="Disponível"?"Registrar retirada":"Registrar devolução";$("textoMovimento").textContent=`Peça ${x.codigoPeca} • Gancheira ${x.posicao} • ${x.setor}`;$("operadorMovimento").innerHTML=operators.filter(o=>o.ativo).map(o=>`<option value="${o.id}">${esc(o.codigo)} — ${esc(o.nome)}</option>`).join("");$("erroMovimento").textContent="";$("modalMovimento").classList.remove("hidden");}
$("formMovimento").onsubmit=e=>{e.preventDefault();const x=getItem($("movimentoId").value),op=operators.find(o=>o.id===$("operadorMovimento").value);if(!x||!op)return;$("modalMovimento").classList.add("hidden");x.status=x.status==="Disponível"?"Indisponível":"Disponível";history.unshift({id:crypto.randomUUID(),data:new Date().toLocaleString("pt-BR"),codigoPeca:x.codigoPeca,setor:x.setor,tipo:x.status==="Disponível"?"Devolução":"Retirada",operador:`${op.codigo} — ${op.nome}`});save();renderAdmin();renderConsulta();};
function renderHistory(){$("tabelaHistorico").innerHTML=history.map(h=>`<tr><td>${esc(h.data)}</td><td>${esc(h.codigoPeca)}</td><td>${esc(h.setor)}</td><td>${esc(h.tipo)}</td><td>${esc(h.operador)}</td></tr>`).join("")||`<tr><td colspan="5">Ainda não há movimentações registradas.</td></tr>`;}
$("formSenha").onsubmit=e=>{e.preventDefault();if($("senhaAtual").value!==adminPassword){$("erroSenha").textContent="A senha atual está incorreta.";return;}adminPassword=$("senhaNova").value;save();$("formSenha").reset();$("erroSenha").textContent="Senha alterada com sucesso.";};
renderConsulta();
