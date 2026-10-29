/* =====================================================================
   Meu Perfil › Produzir carrossel  e  Meu Perfil › Temas em alta
   A receita da Alana em passos: pauta › headline › como eu contaria ›
   prompt › cards › checklist › esteira. Os rascunhos ficam em S.rascunhos.
   Os temas em alta ficam na tabela caderno_temas (o Claude pesquisa e grava
   todo dia; a Lidi guarda, usa ou descarta).
   ===================================================================== */

/* ---------- palavras fortes (da aula + método da alta ativação) ---------- */
const PALAVRAS_FORTES = ["vergonha","cafonice","cafona","pobre","rico","indignado","indignada","confronto","arrasada","arrasado",
 "raiva","medo","culpa","mentira","erro","errado","errada","absurdo","ridículo","ridícula","preguiça","caos","perrengue","fracasso",
 "falido","falida","ninguém","nunca","pior","proibido","segredo","inveja","orgulho","humilhação","vício","burro","burra","lixo",
 "desespero","pânico","choque","escândalo","cancelada","cancelado","golpe","fake","perda","dinheiro jogado fora","sem noção"];
const temPalavraForte = t => { const s = (t||"").toLowerCase(); return PALAVRAS_FORTES.filter(p => s.includes(p)); };
const BANIDAS_RX = () => (ESTRATEGIA.banidas||[]).filter(Boolean);

/* ---------- rascunhos ---------- */
function novoRascunho(base){
 const r = Object.assign({id:uid(),criado:hoje(),editoria:"",fato:"",opiniao:"",quente:false,tema:null,
  headlines:[],headline:"",conversa:"",publico:ESTRATEGIA.publico.principal,fmtCarrossel:"",cards:"",legenda:"",check:{},enviado:""}, base||{});
 S.rascunhos.unshift(r); S.rascSel = r.id; salvar(); return r;
}
const rascAtual = () => (S.rascunhos||[]).find(r => r.id === S.rascSel) || null;
const headlineEscolhida = r => (r.headlines||[]).find(h => h.id === r.headline);
const tituloRasc = r => headlineEscolhida(r)?.texto || (r.fato||"").split("\n")[0].slice(0,70) || "Carrossel sem título";
const nCheckR = r => CHECK_CARROSSEL.filter((_,i) => r.check && r.check[i]).length;
const editoriaDe = nome => ESTRATEGIA.editorias.find(e => e.nome === nome);

/* Separa a resposta do Claude em cards e legenda.
   Aceita "Card 1: ...", "Slide 2 - ...", "**Card 3:**" ou, sem marcação, parágrafos separados por linha em branco. */
function lerCards(txt){
 const t = (txt||"").replace(/\r/g,"");
 let legenda = "";
 let corpo = t;
 const mLeg = t.match(/^\s*(?:\*\*)?\s*legenda\s*(?:\*\*)?\s*[:\-–]\s*(?:\*\*)?/im);
 if (mLeg) { legenda = t.slice(mLeg.index + mLeg[0].length).trim(); corpo = t.slice(0, mLeg.index); }
 const marca = /^\s*(?:\*\*)?\s*(?:card|slide|cartão|tela)\s*(\d+)\s*(?:\*\*)?\s*[:.\-–)]\s*(?:\*\*)?\s*/gim;
 const pos = []; let m;
 while ((m = marca.exec(corpo))) pos.push({ i: m.index, fim: m.index + m[0].length });
 let cards;
 if (pos.length) {
  cards = pos.map((p, k) => corpo.slice(p.fim, k + 1 < pos.length ? pos[k + 1].i : corpo.length).trim());
 } else {
  cards = corpo.split(/\n\s*\n/).map(s => s.trim());
 }
 cards = cards.map(c => c.replace(/\*\*/g, "").trim()).filter(Boolean);
 let headlines = [];
 if (pos.length) {
  const antes = corpo.slice(0, pos[0].i);
  const mh = antes.match(/headlines?\s*:?([\s\S]*)$/i);
  if (mh) headlines = mh[1].split("\n").map(l => l.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "").replace(/\*\*/g, "").trim()).filter(l => l && l.length < 160);
 }
 return { cards, legenda, headlines };
}

/* ---------- prompt com a estratégia do perfil ---------- */
function promptProdutor(r){
 const ed = editoriaDe(r.editoria);
 const h = headlineEscolhida(r);
 const base = promptCarrossel({
  pauta: [r.fato && r.fato.trim(), r.opiniao && ("o que eu acho: " + r.opiniao.trim())].filter(Boolean).join(". ") || "",
  headline: h ? h.texto : ((r.headlines||[])[0]?.texto || ""),
  conversa: r.conversa,
  publico: r.publico
 });
 const E = ESTRATEGIA;
 const ctx = [
  `Contexto do meu perfil: ${E.posicionamento.eixo}. ${E.promessa}`,
  ed ? `Este carrossel é da editoria "${ed.nome}" (pilar ${ed.pilar}): ${ed.sobre}` : "",
  r.quente ? "É pauta quente: o fato é do momento, então o primeiro card depois da capa precisa situar rápido o que aconteceu." : "",
  r.fmtCarrossel ? `Formato visual: ${r.fmtCarrossel}${r.fmtCarrossel==="Headline grandona"?" (frases curtas, cada card com uma ideia grande)":r.fmtCarrossel==="Tela dividida"?" (metade foto, metade texto: no máximo 2 frases por card)":r.fmtCarrossel==="Texto nativo do Instagram"?" (texto corrido como se fosse digitado no próprio Instagram)":""}.` : "",
  `Meu tom: ${E.tom.map(([s]) => s).join("; ")}. ${E.jeito}`,
  `Nunca use: ${BANIDAS_RX().join(", ")}. Nada de: ${E.naoFalo.slice(0,4).join("; ").toLowerCase()}.`
 ].filter(Boolean).join("\n");
 const formato = `Me devolve a resposta exatamente neste formato, pra eu colar no meu caderno:
Headlines:
1. ...
2. ...
3. ...
Card 1: (a capa, com a headline)
Card 2: ...
(até no máximo Card 10)
Legenda: ...`;
 return base + "\n\n" + ctx + "\n\n" + formato;
}

/* ---------- prévia dos cards ---------- */
function slidesHTML(r){
 const { cards, headlines: hsClaude } = lerCards(r.cards);
 const jaTem = new Set((r.headlines || []).map(x => x.texto.trim().toLowerCase()));
 const novasH = (hsClaude || []).filter(x => !jaTem.has(x.toLowerCase()));
 const btnH = novasH.length ? `<div class="aviso" style="margin-bottom:8px">O Claude sugeriu ${novasH.length} headline${novasH.length > 1 ? "s" : ""}. <button class="btn mini" type="button" data-rimporth="1">Guardar como versões no passo 2</button></div>` : "";
 const h = headlineEscolhida(r);
 const fm = r.fmtCarrossel || "";
 const cls = fm === "Tela dividida" ? "dividida" : fm === "Headline grandona" ? "grandona" : fm === "Texto nativo do Instagram" ? "nativo" : "";
 if (!cards.length) {
  return `<div class="slides vazio-slides"><div class="slide capa ${cls}"><span class="sn">1</span><div class="st">${esc(h ? h.texto : "A capa aparece aqui")}</div></div><p class="muted" style="font-size:13.5px;align-self:center;max-width:32ch">Quando você colar os cards do Claude no campo acima, a prévia monta sozinha aqui.</p></div>`;
 }
 const ult = cards[cards.length - 1] || "";
 return btnH + `<div class="slides">${cards.map((c, i) => {
  const longo = c.length > 220;
  return `<div class="slide ${i === 0 ? "capa" : ""} ${cls}">${cls === "dividida" ? `<div class="foto">foto</div>` : ""}<span class="sn">${i + 1}</span><div class="st">${esc(c)}</div>${longo ? `<span class="chip terre aviso-slide">longo pra uma respiração</span>` : ""}</div>`;
 }).join("")}</div>
 <div class="chips" style="margin-top:8px"><span class="chip ${cards.length > 10 ? "terre" : "ok"}">${cards.length} card${cards.length > 1 ? "s" : ""}${cards.length > 10 ? " · passou de 10" : ""}</span>${h && ult && !palavrasEmComum(h.texto, ult) ? `<span class="chip miel">o último card não parece voltar à headline</span>` : ""}</div>`;
}
function palavrasEmComum(a, b){
 const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w => w.length > 3);
 const A = new Set(norm(a));
 return norm(b).some(w => A.has(w));
}

function checksHeadline(t){
 const fortes = temPalavraForte(t);
 const banida = BANIDAS_RX().find(b => new RegExp("\\b" + b + "\\b", "i").test(t));
 const curta = t.length <= 70;
 return `<span class="chip ${curta ? "ok" : "terre"}">${curta ? "1 linha" : t.length + " caracteres"}</span><span class="chip ${fortes.length ? "ok" : ""}">${fortes.length ? "palavra forte: " + esc(fortes[0]) : "sem palavra forte"}</span>${banida ? `<span class="chip terre">tem “${esc(banida)}”</span>` : ""}`;
}

/* ---------- view: produtor ---------- */
function vProdutor(){
 const rs = S.rascunhos || [];
 const r = rascAtual();
 const topo = `<div class="cab"><span class="label" style="color:var(--bleu-tinta)"><span class="ast">✱</span>Meu Perfil · Produzir carrossel</span><h1>Produtor de carrossel</h1>
  <p class="tese">Pauta, headline, carrossel. Nessa ordem, sem inverter.</p>
  <div class="linha-btns">${rs.map(x => `<button class="rasc ${x.id === S.rascSel ? "on" : ""}" data-rasc="${x.id}">${esc(tituloRasc(x))}${x.enviado ? " ✓" : ""}</button>`).join("")}<button class="btn mini pri" data-rnovo="1">+ Novo carrossel</button></div></div>`;
 if (!r) {
  return `<div class="ler">${topo}<div class="cartao" style="text-align:center;padding:36px 20px"><p class="gancho">Um carrossel é uma opinião dita em voz alta.</p><p class="muted">Comece por uma pauta sua, ou pegue uma pauta quente nos temas em alta.</p><div class="linha-btns" style="justify-content:center;margin-top:8px"><button class="btn pri" data-rnovo="1">Começar um carrossel</button><button class="btn" data-go="temas">Ver temas em alta</button></div></div></div>`;
 }
 const tema = r.tema;
 const ed = editoriaDe(r.editoria);
 const nk = nCheckR(r);
 const hs = r.headlines || [];
 const passo = (n, titulo, sub, corpo, feito) => `<section class="cartao passo ${feito ? "feito" : ""}"><div class="passo-cab"><span class="pn">${n}</span><div><h3>${titulo}</h3>${sub ? `<p class="muted" style="font-size:14px">${sub}</p>` : ""}</div></div>${corpo}</section>`;
 const { cards } = lerCards(r.cards);

 return `<div class="ler">${topo}
 <div style="display:grid;gap:14px">
 ${passo(1, "Pauta", "O tema dentro de uma editoria sua. A pauta junta um fato com o que você acha dele.", `
  ${tema ? `<div class="aviso"><b>Veio dos temas em alta:</b> ${esc(tema.titulo)}${tema.angulo ? `<br><span>Ângulo sugerido: ${esc(tema.angulo)}</span>` : ""}${tema.fonte_url ? `<br><a href="${esc(tema.fonte_url)}" target="_blank" rel="noopener">${esc(tema.fonte_nome || "Fonte")}</a>` : ""}</div>` : ""}
  <div class="campo"><label for="rp-ed">Editoria</label><select id="rp-ed" data-rsel="editoria"><option value="">Escolher</option>${ESTRATEGIA.editorias.map(e => `<option value="${esc(e.nome)}" ${r.editoria === e.nome ? "selected" : ""}>${esc(e.nome)} · ${esc(e.pilar)}</option>`).join("")}</select>${ed ? `<span class="muted" style="font-size:13px">${esc(ed.sobre)}</span>` : ""}</div>
  <div class="campo"><label for="rp-fato">O fato</label><textarea id="rp-fato" data-rp="fato" placeholder="O que aconteceu, o assunto, a situação">${esc(r.fato)}</textarea></div>
  <div class="campo"><label for="rp-op">O que eu acho disso</label><textarea id="rp-op" data-rp="opiniao" placeholder="Sua opinião, sem medo. Eu diria isso numa mesa de bar?">${esc(r.opiniao)}</textarea></div>
  <label class="check"><input type="checkbox" data-rchk="quente" ${r.quente ? "checked" : ""}> É pauta quente (assunto do dia ou da semana)</label>`, r.fato && r.opiniao)}

 ${passo(2, "Headline", "A parte mais importante. Uma linha, uma palavra forte, e você sustentaria pra sempre. Escreva várias e escolha uma.", `
  ${hs.map(h => `<div class="hl ${h.id === r.headline ? "on" : ""}"><button class="estrela" type="button" data-rhesc="${h.id}" aria-label="Escolher esta headline" aria-pressed="${h.id === r.headline}">✱</button><span><span style="display:block">${esc(h.texto)}</span><span class="chips" style="margin-top:4px">${checksHeadline(h.texto)}</span></span><button class="btn mini fant" type="button" data-rhdel="${h.id}" aria-label="Apagar versão">×</button></div>`).join("") || `<p class="muted" style="font-size:14px">Nenhuma versão ainda. A Alana escrevia cem frases sobre a mesma coisa antes de usar IA.</p>`}
  <form class="duas" style="grid-template-columns:1fr auto" data-rfhead="1"><input type="text" id="rp-nh" placeholder="Nova versão, em uma linha" aria-label="Nova versão de headline" required><button class="btn mini" type="submit">Guardar</button></form>
  <details class="mais"><summary>Palavras fortes pra se inspirar</summary><div class="chips">${PALAVRAS_FORTES.slice(0, 24).map(p => `<span class="chip">${esc(p)}</span>`).join("")}</div><p class="muted" style="font-size:13px;margin-top:6px">Emoções de alta ativação: raiva, indignação, vergonha, FOMO, surpresa. Evite as mornas: calma, gratidão, inspiração.</p></details>`, !!r.headline)}

 ${passo(3, "Como eu contaria pra uma amiga", "Escreve corrido, do seu jeito, sem pensar em cards. A IA só organiza.", `
  <div class="campo"><label for="rp-conv" class="sr">Como eu contaria</label><textarea id="rp-conv" data-rp="conversa" style="min-height:150px" placeholder="Mano, então, aconteceu isso...">${esc(r.conversa)}</textarea></div>
  <div class="duas"><div class="campo"><label for="rp-pub">Pra quem eu falo</label><input type="text" id="rp-pub" data-rp="publico" value="${esc(r.publico)}"></div>
  <div class="campo"><label for="rp-fmt">Formato do carrossel</label><select id="rp-fmt" data-rsel="fmtCarrossel"><option value="">Escolher</option>${FORMATOS_CARROSSEL.map(x => `<option ${r.fmtCarrossel === x ? "selected" : ""}>${x}</option>`).join("")}</select></div></div>`, !!r.conversa)}

 ${passo(4, "Prompt pro Claude", "Já vai com a sua estratégia, seu tom e as palavras que você não usa. É só copiar e colar no Claude.", `
  <div class="linha-btns"><button class="btn pri" type="button" data-rcopiar="1">Copiar prompt</button>${!(r.fato && r.conversa) ? `<span class="muted" style="font-size:13px">Dica: preencha o fato e o “como eu contaria” antes, que o prompt fica bem melhor.</span>` : ""}</div>
  <details class="mais"><summary>Ver o prompt completo</summary><pre class="prompt" id="rp-prompt">${esc(promptProdutor(r))}</pre></details>`, false)}

 ${passo(5, "Os cards", "Cola aqui a resposta do Claude inteira. Ela vira a prévia, e a legenda vai pro campo de baixo. Pode editar à vontade.", `
  <div class="campo"><label for="rp-cards">Cards</label><textarea id="rp-cards" data-rp="cards" style="min-height:180px" placeholder="Card 1: ...&#10;Card 2: ...&#10;Legenda: ...">${esc(r.cards)}</textarea></div>
  <div id="rp-prev">${slidesHTML(r)}</div>
  <div class="campo"><label for="rp-leg">Legenda</label><textarea id="rp-leg" data-rp="legenda" placeholder="Continua a conversa em vez de repetir o carrossel, e fecha com uma pergunta específica">${esc(r.legenda)}</textarea></div>`, cards.length > 0)}

 ${passo(6, `Checklist · <span id="rp-nk">${nk}</span>/8`, "Se um item falhar, volta e arruma.", `
  ${CHECK_CARROSSEL.map((x, i) => `<label class="check" style="align-items:flex-start"><input type="checkbox" data-rcheck="${i}" ${r.check && r.check[i] ? "checked" : ""} style="margin-top:4px"><span>${esc(x)}</span></label>`).join("")}`, nk === 8)}

 <div class="cartao" style="background:var(--bleu-fundo);border-color:var(--bleu)">
  <div id="rp-envio" style="display:grid;gap:10px">${envioHTML(r)}</div>
  <div class="linha-btns" style="justify-content:flex-end"><button class="btn mini fant" data-rdel="1">Apagar este rascunho</button></div>
 </div>
 </div></div>`;
}

function envioHTML(r){
 const { cards } = lerCards(r.cards);
 return (r.enviado && S.esteira.some(c => c.id === r.enviado))
   ? `<p><b>Esse carrossel já está na esteira.</b> Se você mexeu aqui depois, atualize o card de lá.</p><div class="linha-btns"><button class="btn pri" data-renviar="1">Atualizar card na esteira</button><button class="btn" data-go="esteira">Abrir esteira</button></div>`
   : `<p><b>Pronto pra produzir?</b> O carrossel vai pra esteira com headline, insumos, cards, legenda e checklist. ${cards.length ? "Entra direto na etapa Design." : "Sem cards ainda, entra na etapa Texto."}</p><div class="linha-btns"><button class="btn pri" data-renviar="1">Mandar pra esteira</button></div>`;
}
function atualizarProdutorParcial(){
 const r = rascAtual(); if (!r) return;
 const pv = document.getElementById("rp-prompt"); if (pv) pv.textContent = promptProdutor(r);
 const pr = document.getElementById("rp-prev"); if (pr) pr.innerHTML = slidesHTML(r);
 const en = document.getElementById("rp-envio"); if (en) en.innerHTML = envioHTML(r);
}

function enviarRascunho(r){
 const { cards, legenda } = lerCards(r.cards);
 const leg = r.legenda || legenda;
 const notas = (cards.length ? cards.map((c, i) => `Card ${i + 1}: ${c}`).join("\n\n") : "") + (leg ? `\n\nLegenda:\n${leg}` : "");
 const dados = {
  titulo: tituloRasc(r), formato: "carrossel", pilar: editoriaDe(r.editoria)?.pilar || "", editoria: r.editoria,
  ins: { pauta: [r.fato, r.opiniao].filter(Boolean).join(" — "), headline: headlineEscolhida(r)?.texto || "", conversa: r.conversa, publico: r.publico },
  headlines: JSON.parse(JSON.stringify(r.headlines || [])), headline: r.headline, fmtCarrossel: r.fmtCarrossel,
  check: Object.assign({}, r.check), notas: notas.trim(), origem: "produtor", rascunho: r.id
 };
 const existente = r.enviado && S.esteira.find(c => c.id === r.enviado);
 if (existente) { Object.assign(existente, dados); toast("Card atualizado na esteira"); }
 else {
  const etapa = cards.length ? ETAPAS.carrossel.indexOf("Design") : ETAPAS.carrossel.indexOf("Texto");
  const c = Object.assign({ id: uid(), etapa, data: "" }, dados);
  S.esteira.push(c); r.enviado = c.id; toast("Foi pra esteira, em " + ETAPAS.carrossel[etapa]);
  if (r.tema && r.tema.id) marcarTema(r.tema.id, "usado");
 }
 salvar();
}

/* ---------- temas em alta ---------- */
let TEMAS = [], temasCarregados = false, temasErro = "", filtroTemas = "novo", pilarTemas = "";
async function carregarTemas(){
 if (!sb) { temasErro = "sem-nuvem"; temasCarregados = true; return; }
 const { data, error } = await sb.from("caderno_temas").select("*").neq("status", "descartado").order("data", { ascending: false }).order("criado_em", { ascending: false }).limit(300);
 temasCarregados = true;
 if (error) { temasErro = error.message; return; }
 temasErro = ""; TEMAS = data || [];
 const n = document.getElementById("n-temas"); if (n) n.textContent = TEMAS.filter(t => t.status === "novo").length || "";
}
async function marcarTema(id, status){
 const t = TEMAS.find(x => x.id === id); if (t) t.status = status;
 if (sb) { const { error } = await sb.from("caderno_temas").update({ status }).eq("id", id); if (error) toast("Não consegui salvar o tema"); }
}
const JANELA = { hoje: "vale hoje", semana: "vale esta semana", mes: "vale este mês" };
function rotDia(d){
 const h = hoje(); const ontem = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return x.toISOString().slice(0, 10); })();
 if (d === h) return "Hoje"; if (d === ontem) return "Ontem";
 const dt = new Date(d + "T12:00:00");
 return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, c => c.toUpperCase());
}
function diasDesde(d){ return Math.round((new Date(hoje() + "T12:00:00") - new Date(d + "T12:00:00")) / 86400000); }
function frio(t){ const n = diasDesde(t.data); return t.janela === "hoje" ? n >= 2 : t.janela === "semana" ? n >= 8 : n >= 31; }

function cardTema(t){
 const f = frio(t);
 return `<div class="cartao tema ${f ? "frio" : ""}"><div class="chips">${t.pilar ? `<span class="chip bleu">${esc(t.pilar)}</span>` : ""}${t.editoria ? `<span class="chip">${esc(t.editoria)}</span>` : ""}${t.janela ? `<span class="chip ${f ? "" : "miel"}">${f ? "pauta esfriando" : JANELA[t.janela]}</span>` : ""}${t.origem === "manual" ? `<span class="chip">sua</span>` : ""}${t.status === "usado" ? `<span class="chip ok">virou conteúdo</span>` : ""}</div>
 <p class="gancho">${esc(t.titulo)}</p>
 ${t.porque ? `<p style="font-size:14.5px"><span class="label">Por que tá em alta</span><br>${esc(t.porque)}</p>` : ""}
 ${t.angulo ? `<p style="font-size:14.5px"><span class="label">Seu ângulo</span><br>${esc(t.angulo)}</p>` : ""}
 ${t.headline ? `<p class="tema-hl">“${esc(t.headline)}”</p>` : ""}
 ${t.fonte_url ? `<a href="${esc(t.fonte_url)}" target="_blank" rel="noopener" style="font-size:13.5px">${esc(t.fonte_nome || "Abrir fonte")} ↗</a>` : ""}
 <div class="linha-btns"><button class="btn mini pri" data-tprod="${t.id}">Produzir carrossel</button><button class="btn mini" data-testeira="${t.id}">Ideia de reels na esteira</button>${t.status === "guardado" ? `<button class="btn mini fant" data-tstatus="${t.id}|novo">Tirar dos guardados</button>` : t.status === "novo" ? `<button class="btn mini fant" data-tstatus="${t.id}|guardado">Guardar</button>` : ""}<button class="btn mini fant" data-tstatus="${t.id}|descartado">Descartar</button></div></div>`;
}

function vTemas(){
 if (!temasCarregados) { carregarTemas().then(() => { if (R.view === "temas") render(); }); }
 const n = s => TEMAS.filter(t => t.status === s).length;
 let lista = TEMAS.filter(t => t.status === filtroTemas);
 if (pilarTemas) lista = lista.filter(t => t.pilar === pilarTemas);
 const dias = [...new Set(lista.map(t => t.data))];
 const pilares = ESTRATEGIA.pilares.map(p => p.nome);
 const corpo = !temasCarregados ? `<p class="muted">Carregando os temas…</p>`
  : temasErro ? `<p class="aviso">${temasErro === "sem-nuvem" ? "Os temas ficam na nuvem, e este aparelho está sem conexão com o Supabase." : "Não consegui carregar os temas agora (" + esc(temasErro) + "). Tente recarregar a página."}</p>`
  : !lista.length ? `<p class="vazio">${filtroTemas === "novo" ? "Nenhum tema novo por aqui. O Claude pesquisa toda manhã; enquanto isso, dá pra anotar um tema seu abaixo." : filtroTemas === "guardado" ? "Nada guardado. Use “Guardar” nos temas que você quer usar depois." : "Nenhum tema virou conteúdo ainda."}</p>`
  : dias.map(d => `<h3 style="margin:22px 0 10px">${rotDia(d)}</h3><div class="grade temas">${lista.filter(t => t.data === d).map(cardTema).join("")}</div>`).join("");
 return `<div class="largo"><div class="cab"><span class="label" style="color:var(--bleu-tinta)"><span class="ast">✱</span>Meu Perfil · Temas em alta</span><h1>O que tá em alta pra virar conteúdo</h1>
  <p class="muted">Toda manhã o Claude pesquisa pautas quentes ligadas aos seus pilares e coloca aqui, já com um ângulo seu. Pauta quente perde validade: a de hoje vale mais que a de amanhã.</p>
  <div class="linha-btns" style="justify-content:space-between"><div class="alternar" role="group" aria-label="Quais temas"><button aria-pressed="${filtroTemas === "novo"}" data-tfiltro="novo">Novos · ${n("novo")}</button><button aria-pressed="${filtroTemas === "guardado"}" data-tfiltro="guardado">Guardados · ${n("guardado")}</button><button aria-pressed="${filtroTemas === "usado"}" data-tfiltro="usado">Viraram conteúdo · ${n("usado")}</button></div>
  <div class="rota"><button aria-pressed="${!pilarTemas}" data-tpilar="">Todos os pilares</button>${pilares.map(p => `<button aria-pressed="${pilarTemas === p}" data-tpilar="${esc(p)}">${esc(p)}</button>`).join("")}</div></div></div>
 ${corpo}
 <form class="cartao form" id="f-tema" style="margin-top:26px;max-width:780px"><span class="label">Anotar um tema que você viu</span>
  <div class="campo"><label for="ft-titulo">O tema</label><input type="text" id="ft-titulo" required placeholder="Ex.: a ativação da marca X no festival Y"></div>
  <div class="duas"><div class="campo"><label for="ft-porque">Por que chamou sua atenção</label><input type="text" id="ft-porque"></div><div class="campo"><label for="ft-link">Link</label><input type="url" id="ft-link" placeholder="https://"></div></div>
  <div class="campo"><label for="ft-pilar">Pilar</label><select id="ft-pilar"><option value="">Escolher</option>${pilares.map(p => `<option>${esc(p)}</option>`).join("")}</select></div>
  <div><button class="btn pri" type="submit">Guardar tema</button></div></form></div>`;
}

function temaParaRascunho(t){
 novoRascunho({
  tema: { id: t.id, titulo: t.titulo, angulo: t.angulo, fonte_url: t.fonte_url, fonte_nome: t.fonte_nome },
  editoria: t.editoria && editoriaDe(t.editoria) ? t.editoria : "",
  fato: [t.titulo, t.porque].filter(Boolean).join(". "),
  quente: t.janela === "hoje" || t.janela === "semana",
  headlines: t.headline ? [{ id: uid(), texto: t.headline }] : []
 });
 const r = rascAtual(); if (r.headlines.length) r.headline = r.headlines[0].id;
 if (t.status !== "usado") marcarTema(t.id, "guardado");
 salvar();
}

/* ---------- eventos (complementam os do app.js) ---------- */
document.addEventListener("click", e => {
 const t = e.target.closest("button"); if (!t || !S) return;
 const d = t.dataset;
 if (d.rnovo) { novoRascunho(); render(); window.scrollTo(0, 0); return; }
 if (d.rasc) { S.rascSel = d.rasc; salvar(); render(); return; }
 const r = rascAtual();
 if (d.rhesc && r) { r.headline = r.headline === d.rhesc ? "" : d.rhesc; salvar(); render(); return; }
 if (d.rhdel && r) { r.headlines = r.headlines.filter(h => h.id !== d.rhdel); if (r.headline === d.rhdel) r.headline = ""; salvar(); render(); return; }
 if (d.rcopiar && r) { copiar(promptProdutor(r)); return; }
 if (d.rimporth && r) { const jt = new Set(r.headlines.map(x => x.texto.trim().toLowerCase())); lerCards(r.cards).headlines.filter(x => !jt.has(x.toLowerCase())).forEach(x => r.headlines.push({ id: uid(), texto: x })); if (!r.headline && r.headlines[0]) r.headline = r.headlines[0].id; salvar(); render(); toast("Headlines guardadas no passo 2"); return; }
 if (d.renviar && r) { enviarRascunho(r); render(); return; }
 if (d.rdel && r) { if (!confirm("Apagar este rascunho? O card que já foi pra esteira continua lá.")) return; S.rascunhos = S.rascunhos.filter(x => x.id !== r.id); S.rascSel = S.rascunhos[0]?.id || ""; salvar(); render(); return; }
 if (d.tfiltro) { filtroTemas = d.tfiltro; render(); return; }
 if (d.tpilar !== undefined && t.closest(".rota") && R.view === "temas") { pilarTemas = d.tpilar; render(); return; }
 if (d.tprod) { const tm = TEMAS.find(x => x.id === d.tprod); temaParaRascunho(tm); ir("produtor"); return; }
 if (d.testeira) { const tm = TEMAS.find(x => x.id === d.testeira); paraEsteira({ titulo: tm.headline || tm.titulo, formato: "reels", pilar: tm.pilar || "", origem: "tema", notas: [tm.porque, tm.angulo && "Ângulo: " + tm.angulo, tm.fonte_url].filter(Boolean).join("\n") }); marcarTema(tm.id, "usado"); toast("Foi pra esteira, em Ideia"); render(); return; }
 if (d.tstatus) { const [id, st] = d.tstatus.split("|"); marcarTema(id, st); toast(st === "descartado" ? "Tema descartado" : st === "guardado" ? "Guardado" : "Voltou pros novos"); render(); return; }
});
document.addEventListener("input", e => {
 const t = e.target, d = t.dataset; if (!S) return;
 if (d.rp) { const r = rascAtual(); if (!r) return; r[d.rp] = t.value;
  if (d.rp === "cards" && !r.legenda) { const { legenda } = lerCards(t.value); if (legenda) { r.legenda = legenda; const lg = document.getElementById("rp-leg"); if (lg) lg.value = legenda; } }
  salvar(); atualizarProdutorParcial(); }
});
document.addEventListener("change", e => {
 const t = e.target, d = t.dataset; if (!S) return;
 const r = rascAtual();
 if (d.rsel && r) { r[d.rsel] = t.value; salvar(); render(); return; }
 if (d.rchk && r) { r[d.rchk] = t.checked; salvar(); atualizarProdutorParcial(); return; }
 if (d.rcheck && r) { r.check = r.check || {}; r.check[d.rcheck] = t.checked; salvar(); const n = document.getElementById("rp-nk"); if (n) n.textContent = nCheckR(r); return; }
});
document.addEventListener("submit", e => {
 const f = e.target; if (!S) return;
 if (f.dataset.rfhead || f.id === "f-tema") e.preventDefault();
 if (f.dataset.rfhead) { const r = rascAtual(); const inp = document.getElementById("rp-nh"); const tx = (inp?.value || "").trim(); if (!r || !tx) return; const h = { id: uid(), texto: tx }; r.headlines.push(h); if (!r.headline) r.headline = h.id; salvar(); render(); document.getElementById("rp-nh")?.focus(); return; }
 if (f.id === "f-tema") {
  const v = id => (document.getElementById(id) || {}).value || "";
  const novo = { titulo: v("ft-titulo").trim(), porque: v("ft-porque").trim() || null, fonte_url: v("ft-link").trim() || null, pilar: v("ft-pilar") || null, origem: "manual", janela: "semana", data: hoje() };
  if (!novo.titulo) return;
  if (!sb) { toast("Sem conexão com a nuvem"); return; }
  sb.from("caderno_temas").insert(novo).select().single().then(({ data, error }) => {
   if (error) { toast("Não consegui guardar o tema"); return; }
   TEMAS.unshift(data); filtroTemas = "novo"; toast("Tema guardado"); render();
  });
 }
});
