/* ---------------- estado ---------------- */
const uid=()=>Math.random().toString(36).slice(2,9);
function hoje(){const d=new Date();return d.toISOString().slice(0,10)}
function semente(){
 const mk=(pid,etapa)=>{const p=PAUTAS.find(x=>x.id===pid);return {id:uid(),titulo:p.hook,formato:p.formato==="Carrossel"?"carrossel":"reels",etapa:etapa,pilar:"",pauta:pid,aula:p.aula,data:"",notas:""}};
 return {status:{"aula-1":2,"aula-2":1,"aula-3":1},esteira:[mk("trend",0),mk("plateia",0),mk("realtime",0),mk("vendermais",0),mk("pessoaquer",0)],
  analise:[{id:"ex1",exemplo:true,titulo:"Exemplo: como fica uma ficha preenchida",formato:"reels",data:"",views:2400,likes:180,ncom:14,
   comentarios:[{id:uid(),texto:"Eu travava exatamente nisso, salvei pra mandar pra minha sócia.",tag:"Identificação"},{id:uid(),texto:"Você faz uma série sobre como montar a fotografia do ponto A?",tag:"Pedido de conteúdo"},{id:uid(),texto:"Discordo um pouco, às vezes trend é o que dá alcance.",tag:"Discordância"}],
   insights:"Gancho em primeira pessoa segurou bem. Testar a mesma estrutura em carrossel."}],
  insights:[],pendDone:{},pendExtra:[],fontes:[],canvas:{},tab:{}};
}
let S=null, sb=null, usuario=null, salvando=null;
const CFG=window.CADERNO_CONFIG||{};
const temConfig=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey&&!CFG.supabaseUrl.includes("COLE"));
function salvar(){
 if(!usuario||!S) return;
 clearTimeout(salvando);
 salvando=setTimeout(async()=>{
  const {error}=await sb.from("estudo_estado").upsert({owner:usuario.id,dados:S,atualizado:new Date().toISOString()});
  salvando=null;
  if(error) toast("Não consegui salvar. Confira a internet e tente de novo.");
 },700);
}

const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const aulaDe=id=>AULAS.find(a=>a.id===id);
let toastT;
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2200)}

function gcal(titulo,data,detalhes){
 let ini=data||(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10)})();
 const d=new Date(ini+"T12:00:00");d.setDate(d.getDate()+1);
 const fim=d.toISOString().slice(0,10).replace(/-/g,"");
 return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(titulo)+"&dates="+ini.replace(/-/g,"")+"/"+fim+"&details="+encodeURIComponent(detalhes||"Do meu Caderno de Estudos");
}
const dataBR=s=>s?s.split("-").reverse().join("/"):"";
const STATUS=["A estudar","Estudando","Revisada"];

/* ---------------- navegação ---------------- */
let R={view:"painel",id:null};
function lerHash(){
 const h=location.hash.replace("#","");
 if(!h){R={view:"painel"};return}
 const m=h.match(/^(aula|ferramenta)-(.+)$/);
 if(m){R={view:m[1],id:m[1]==="aula"?"aula-"+m[2]:m[2]}}else R={view:h};
}
function ir(view,id){
 const h=view==="aula"?id:(view==="ferramenta"?"ferramenta-"+id:view);
 if(location.hash.replace("#","")===h) render(); else location.hash=h;
 window.scrollTo(0,0);
}
window.addEventListener("hashchange",()=>{lerHash();render();window.scrollTo(0,0)});

/* ---------------- views ---------------- */
function vPainel(){
 const abertas=[...PEND_BASE,...S.pendExtra].filter(p=>!S.pendDone[p.id]);
 const prox=S.esteira.filter(c=>c.data&&c.data>=hoje()).sort((a,b)=>a.data<b.data?-1:1).slice(0,5);
 const porEtapa={};S.esteira.forEach(c=>{const n=ETAPAS[c.formato][c.etapa];porEtapa[n]=(porEtapa[n]||0)+1});
 return `<div class="largo">
 <div class="cab"><span class="label"><span class="ast">✱</span>Painel</span><h1>O que tá em movimento</h1><p class="muted">Seu estudo, as pendências e o que está andando na esteira do perfil.</p></div>
 <div class="painel">
  <div class="cartao" style="grid-column:1/-1"><span class="label">Bootcamp de Estratégia 2026.3 · Miami Ad School</span>
   <div class="grade">${AULAS.map(a=>`<button class="aula-linha" data-aula="${a.id}"><span class="num">${a.n}</span><span><b>${esc(a.titulo)}</b><br><span class="muted" style="font-size:13.5px">${esc(a.prof)}</span></span><span class="chip st-${S.status[a.id]||0}">${STATUS[S.status[a.id]||0]}</span></button>`).join("")}</div></div>
  <div class="cartao"><span class="label">Pendências abertas · ${abertas.length}</span><ul class="lista">${abertas.slice(0,5).map(p=>`<li><span>${esc(p.texto)}</span></li>`).join("")||"<li class='muted'>Nada pendente.</li>"}</ul><div><button class="btn mini fant" data-go="pendencias">Ver todas</button></div></div>
  <div class="cartao"><span class="label">Esteira do perfil · ${S.esteira.length} conteúdos</span><ul class="lista">${Object.keys(porEtapa).map(k=>`<li><span>${esc(k)}</span><b>${porEtapa[k]}</b></li>`).join("")||"<li class='muted'>Nenhum conteúdo na esteira.</li>"}</ul><div><button class="btn mini fant" data-go="esteira">Abrir esteira</button></div></div>
  <div class="cartao"><span class="label">Próximas datas</span><ul class="lista">${prox.map(c=>`<li><span>${esc(c.titulo)}</span><span class="chip bleu">${dataBR(c.data)}</span></li>`).join("")||"<li class='muted'>Nenhum conteúdo com data. Abra um card na esteira e coloque a data prevista.</li>"}</ul></div>
  <div class="cartao"><span class="label">Insights recentes</span><ul class="lista">${S.insights.slice(-4).reverse().map(i=>`<li><span>${esc(i.texto)}</span><span class="chip">${esc(aulaDe(i.aula)?.titulo||"")}</span></li>`).join("")||"<li class='muted'>Ainda sem insights. Abra uma aula e use a aba Insights.</li>"}</ul></div>
 </div></div>`;
}

function vBiblioteca(){
 return `<div class="largo"><div class="cab"><span class="label"><span class="ast">✱</span>Biblioteca</span><h1>Tudo o que você está estudando</h1><p class="muted">Cursos, livros, vídeos e artigos. Cada fonte vira páginas para estudar.</p></div>
 <div class="cartao" style="margin-bottom:22px"><div class="linha-btns" style="justify-content:space-between"><div><span class="chip terre">Curso</span><h2 style="margin-top:8px">Bootcamp de Estratégia 2026.3</h2><p class="muted">Miami Ad School · 3 aulas resumidas</p></div></div>
  <div style="display:grid;gap:10px">${AULAS.map(a=>`<button class="aula-linha" data-aula="${a.id}"><span class="num">${a.n}</span><span><b>${esc(a.titulo)}</b><br><span class="muted" style="font-size:13.5px">${esc(a.prof)} · ${esc(a.data)}</span></span><span class="chip st-${S.status[a.id]||0}">${STATUS[S.status[a.id]||0]}</span></button>`).join("")}</div></div>
 <h2 style="margin-bottom:12px">Outras fontes</h2>
 <div class="grade" style="margin-bottom:22px">${S.fontes.map(f=>`<div class="cartao"><span class="chip">${esc(f.tipo)}</span><h3>${esc(f.titulo)}</h3>${f.autor?`<p class="muted">${esc(f.autor)}</p>`:""}${f.link?`<a href="${esc(f.link)}" target="_blank" rel="noopener">Abrir link</a>`:""}${f.notas?`<p style="font-size:14.5px">${esc(f.notas)}</p>`:""}<div><button class="btn mini fant" data-delfonte="${f.id}">Remover</button></div></div>`).join("")||`<p class="vazio" style="grid-column:1/-1">Nenhum livro, vídeo ou artigo ainda. Adicione o primeiro abaixo.</p>`}</div>
 <form class="cartao form" id="f-fonte"><span class="label">Adicionar fonte</span>
  <div class="duas"><div class="campo"><label for="ff-tipo">Tipo</label><select id="ff-tipo"><option>Livro</option><option>Vídeo</option><option>Artigo</option><option>Podcast</option><option>Curso</option></select></div><div class="campo"><label for="ff-titulo">Título</label><input type="text" id="ff-titulo" required></div></div>
  <div class="duas"><div class="campo"><label for="ff-autor">Autor ou canal</label><input type="text" id="ff-autor"></div><div class="campo"><label for="ff-link">Link</label><input type="url" id="ff-link" placeholder="https://"></div></div>
  <div class="campo"><label for="ff-notas">Por que vale estudar</label><textarea id="ff-notas"></textarea></div>
  <div><button class="btn pri" type="submit">Adicionar à biblioteca</button></div></form></div>`;
}

function vAula(){
 const a=aulaDe(R.id); if(!a) return vBiblioteca();
 const tab=S.tab[a.id]||"resumo";
 const pautas=PAUTAS.filter(p=>p.aula===a.id), ins=S.insights.filter(i=>i.aula===a.id);
 const f=FERRAMENTAS.find(x=>x.id===a.ferramenta);
 let corpo="";
 if(tab==="resumo") corpo=`<div class="resumo">${a.resumo}</div>`;
 if(tab==="ferramenta") corpo=`<div class="cartao"><span class="label">Ferramenta desta aula</span><h2>${esc(f.nome)}</h2><p>${esc(f.desc)}</p><div><button class="btn pri" data-ferr="${f.id}">Abrir ferramenta</button></div></div>`;
 if(tab==="pautas") corpo=pautas.length?`<p class="muted" style="margin-bottom:14px">${pautas.length} pautas para o seu perfil. Mande para a esteira as que quiser produzir.</p><div style="display:grid;gap:12px">${pautas.map(cardPauta).join("")}</div>`:`<p class="vazio">Nenhuma pauta saiu desta aula ainda.</p>`;
 if(tab==="insights") corpo=`<form class="cartao form" id="f-insight" data-insaula="${a.id}"><span class="label">Novo insight</span>
   <div class="campo"><label for="fi-texto">O que você pensou a partir da aula</label><textarea id="fi-texto" required placeholder="Ex.: levar a pergunta “o que é sucesso pra você?” para todo briefing da ÔDO"></textarea></div>
   <div class="linha-btns"><span class="campo" style="font-size:13px;font-weight:600;color:var(--suave)">Aplicar em</span><label class="check"><input type="checkbox" id="fi-odo" checked> ÔDO</label><label class="check"><input type="checkbox" id="fi-perfil"> Meu Perfil</label></div>
   <div class="duas"><div class="campo"><label for="fi-data">Quando agir (opcional)</label><input type="date" id="fi-data"></div></div>
   <div><button class="btn pri" type="submit">Salvar insight</button></div></form>
   <div style="display:grid;gap:12px;margin-top:16px">${ins.map(i=>`<div class="cartao"><p>${esc(i.texto)}</p><div class="chips">${i.odo?'<span class="chip terre">ÔDO</span>':""}${i.perfil?'<span class="chip bleu">Meu Perfil</span>':""}${i.data?`<span class="chip">${dataBR(i.data)}</span>`:""}</div>
    <div class="linha-btns"><a class="btn mini" href="${gcal(i.texto.slice(0,80),i.data,"Insight da aula "+a.n+" ("+a.titulo+"): "+i.texto)}" target="_blank" rel="noopener">Marcar na agenda</a>${i.perfil?`<button class="btn mini" data-insightpauta="${i.id}">Virar ideia na esteira</button>`:""}<button class="btn mini fant" data-delinsight="${i.id}">Excluir</button></div></div>`).join("")||`<p class="vazio">Nenhum insight desta aula ainda.</p>`}</div>`;
 if(tab==="bruto") corpo=`<div style="display:grid;gap:16px"><div class="cartao"><span class="label">Arquivos originais</span><ul style="margin:0;padding-left:20px">${a.arquivos.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="aviso">No protótipo os arquivos ficam listados. Na versão com Supabase eles ficam anexados aqui para abrir e baixar.</p></div>
  ${a.anotacoes?`<div class="cartao"><span class="label">Suas anotações</span><p style="white-space:pre-wrap;font-size:15px">${esc(a.anotacoes)}</p></div>`:`<p class="vazio">As anotações desta aula estão no PDF original.</p>`}</div>`;
 const tabs=[["resumo","Resumo"],["ferramenta","Ferramenta"],["pautas","Pautas",pautas.length],["insights","Insights",ins.length],["bruto","Material bruto"]];
 return `<div class="ler">
 <div class="cab"><div class="migalha"><button data-go="biblioteca">Biblioteca</button><span>›</span><span>Bootcamp de Estratégia</span><span>›</span><span>Aula ${a.n}</span></div>
  <span class="label">Aula ${a.n} · ${esc(a.prof)} · ${esc(a.data)}</span><h1>${esc(a.nomeCompleto)}</h1><p class="tese">${esc(a.tese)}</p>
  <div class="linha-btns"><label class="muted" for="st-${a.id}" style="font-size:14px">Status</label><select id="st-${a.id}" data-status="${a.id}" style="width:auto">${STATUS.map((s,i)=>`<option value="${i}" ${(S.status[a.id]||0)===i?"selected":""}>${s}</option>`).join("")}</select></div></div>
 <div class="pontos"><span class="label" style="color:var(--espresso)">Pontos principais</span><ul>${a.pontos.map(p=>`<li><span>${esc(p)}</span></li>`).join("")}</ul></div>
 <div class="abas" role="tablist">${tabs.map(([k,l,n])=>`<button role="tab" aria-selected="${tab===k}" data-tab="${k}">${l}${n!=null?`<span class="n">${n}</span>`:""}</button>`).join("")}</div>
 ${corpo}</div>`;
}

function cardPauta(p){
 const na=S.esteira.some(c=>c.pauta===p.id);
 return `<div class="cartao"><div class="chips"><span class="chip ${p.origem==="sua"?"miel":""}">${p.origem==="sua"?"Sua ideia":"Sugestão do Claude"}</span><span class="chip ${p.prio==="alta"?"terre":""}">${PRIO[p.prio]}</span><span class="chip">${esc(p.formato)}</span></div>
 <p class="gancho">${esc(p.hook)}</p><p style="font-size:15px">${esc(p.angulo)}</p>
 <details class="mais"><summary>Esboço</summary><ol style="margin:0;padding-left:20px;font-size:14.5px">${p.esboco.map(e=>`<li>${esc(e)}</li>`).join("")}</ol></details>
 <div>${na?`<span class="chip ok">Já está na esteira</span>`:`<button class="btn mini pri" data-pauta="${p.id}">Mandar pra esteira</button>`}</div></div>`;
}

function vFerramentas(){
 return `<div class="largo"><div class="cab"><span class="label"><span class="ast">✱</span>Estante de ferramentas</span><h1>Para abrir no meio de um projeto</h1><p class="muted">Os métodos e frameworks que saíram das aulas, reunidos num lugar só.</p></div>
 <div class="grade">${FERRAMENTAS.map(f=>`<div class="cartao"><span class="chip">Aula ${aulaDe(f.aula).n}</span><h3>${esc(f.nome)}</h3><p style="font-size:15px">${esc(f.desc)}</p><div><button class="btn pri mini" data-ferr="${f.id}">Abrir</button></div></div>`).join("")}</div></div>`;
}

let faseSel=0;
function vFerramenta(){
 const f=FERRAMENTAS.find(x=>x.id===R.id); if(!f) return vFerramentas();
 const a=aulaDe(f.aula);
 let c="";
 if(f.id==="pesquisa"){
  c=`<p class="tese" style="margin-bottom:18px">As fontes são um cardápio, não uma lista de tarefas.</p>
  ${ETAPAS_PESQUISA.map(p=>`<h3 style="margin:24px 0 10px">${p.p}</h3><div style="display:grid;gap:8px">${p.e.map(e=>`<details class="etapa"><summary><span class="id">${e[0]}</span><span class="nm">${esc(e[1])}</span><span class="chip ${e[2]==="ess"?"terre":""}">${e[2]==="ess"?"Essencial":"Opcional"}</span></summary><div class="corpo"><p style="font-size:16.5px">${esc(e[3])}</p><div><span class="label">Como</span><ol style="margin:4px 0 0;padding-left:20px;font-size:15px">${e[4].map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div><div class="tres"><div><span class="label">Saída</span><p>${esc(e[5])}</p></div><div><span class="label">Check</span><p>${esc(e[6])}</p></div><div class="arm"><span class="label">Armadilha</span><p>${esc(e[7])}</p></div></div></div></details>`).join("")}</div>`).join("")}
  <h3 style="margin:28px 0 10px">Anexos</h3><div style="display:grid;gap:8px">${ANEXOS_PESQUISA.map(x=>`<details class="etapa"><summary><span class="nm">${esc(x[0])}</span></summary><div class="corpo"><p style="font-size:15px">${esc(x[1])}</p></div></details>`).join("")}</div>`;
 }
 if(f.id==="radar"){
  const fs=FASES[faseSel];
  c=`<span class="label">Em que fase eu estou?</span><div class="rota" style="margin:10px 0 14px">${FASES.map((x,i)=>`<button aria-pressed="${i===faseSel}" data-fase="${i}">${x[0]} · ${x[1]}</button>`).join("")}</div>
  <div class="cartao"><h3>Fase ${fs[0]} · ${fs[1]}</h3><p class="muted">${esc(fs[2])}</p><span class="label">Habilidades em protagonismo e perguntas de bolso</span><ul style="margin:0;padding-left:20px;display:grid;gap:6px">${fs[3].map(k=>`<li><b>${SKILLS[k][0]}:</b> ${esc(SKILLS[k][1])}</li>`).join("")}</ul><span class="label">Não esquecer</span><ul style="margin:0;padding-left:20px">${fs[4].map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="aviso">Criatividade vale em todas as fases. Gestão de pessoas entra sempre que houver equipe ou parceiros.</p></div>
  <h3 style="margin:26px 0 10px">Prioridade por momento de carreira</h3><div class="grade">${[["Júnior","Construir a base do time.",["desk","ana","pesq"]],["Pleno","Contar e defender.",["story","marca","neg"]],["Sênior","Fazer os outros protagonistas.",["integ","proj","pess"]]].map(l=>`<div class="cartao"><h3>${l[0]}</h3><p class="muted">${l[1]}</p><div class="chips">${l[2].map(k=>`<span class="chip">${SKILLS[k][0]}</span>`).join("")}</div></div>`).join("")}</div>
  <p style="margin-top:16px"><a href="https://strategic-skillscanner.lovable.app/" target="_blank" rel="noopener">Abrir a SkillScanner</a></p>`;
 }
 if(f.id==="seispassos"){
  const cx=[["ab","1. A para B","DE onde você está PARA onde quer chegar, em quanto tempo"],["pm","2. Problema da marca","O que está ruim para a marca ou o negócio"],["pp","3. Problema das pessoas","O que está ruim na vida de quem você quer atingir"],["hi","4. Hipóteses de resolução","Os caminhos possíveis, antes de escolher"],["de","5. Decisão estratégica","O caminho escolhido, numa frase que direciona"],["ex","6. Execução e métricas","O que será feito e como saber que funcionou"]];
  c=`<p class="muted" style="margin-bottom:14px">Preencha para um projeto real. Lembre: problema é sempre uma coisa ruim. O que você escreve fica salvo neste navegador.</p>
  <div class="campo" style="margin-bottom:12px"><label for="cv-nome">Projeto</label><input type="text" id="cv-nome" data-canvas="nome" value="${esc(S.canvas.nome||"")}" placeholder="Ex.: Desafio da Banana, G4"></div>
  <div class="canvas6">${cx.map(x=>`<div class="cx"><b>${x[1]}</b><span class="muted" style="font-size:13px">${x[2]}</span><textarea id="cv-${x[0]}" data-canvas="${x[0]}">${esc(S.canvas[x[0]]||"")}</textarea></div>`).join("")}</div>
  <details class="mais" style="margin-top:20px"><summary>Ver o exemplo do Nike Run Club SP</summary><div class="tabwrap"><table><tbody>
   <tr><td><b>A para B</b></td><td>De uma iniciativa pontual com a mesma panelinha para um clube com novas pessoas e reconhecimento em 6 meses.</td></tr>
   <tr><td><b>Marca</b></td><td>A Nike tem cara de marca técnica demais, só para profissionais.</td></tr>
   <tr><td><b>Pessoas</b></td><td>Há diferentes níveis e estilos de corredores e é difícil achar iniciativas para cada um.</td></tr>
   <tr><td><b>Hipóteses</b></td><td>Copiar o Rio · focar no técnico · adaptar a SP.</td></tr>
   <tr><td><b>Decisão</b></td><td>Segmentar os treinos e comunicar com linguagem paulistana.</td></tr>
   <tr><td><b>Execução</b></td><td>Dados do Nike+, treinos com o time técnico, crews. Métrica: pessoas novas no clube.</td></tr></tbody></table></div></details>`;
 }
 if(f.id==="hhh"){
  c=`<div class="grade">${[["Hero","Gera conhecimento","Lançamentos, anúncios e grandes momentos para um público amplo. Poucos por ano."],["Hub","Aproxima","Conteúdo contínuo e duradouro que cria relação com a audiência."],["Help","Responde","Tira as dúvidas do público. Função educativa, vive em YouTube, blog e redes."]].map(x=>`<div class="cartao"><span class="chip terre">${x[0]}</span><h3>${x[1]}</h3><p style="font-size:15px">${x[2]}</p></div>`).join("")}</div>
  <p class="aviso" style="margin-top:16px">É um framework de conteúdo, não de estratégia: serve para organizar o portfólio dos clientes e dos perfis. A professora ficou de mandar o link de referência (está nas pendências).</p>`;
 }
 if(f.id==="pmg"){
  c=`<div class="grade">${[["P","Um dia","O que chega e precisa de resposta rápida. Grande volume."],["M","Uma semana","Projetos com potencial de escala, onde vale negociar mais dias."],["G","Um mês","Planejamento anual ou projeto especial. Um ou dois por ano."]].map(x=>`<div class="cartao"><span class="gancho" style="font-size:40px;color:var(--terre)">${x[0]}</span><h3>${x[1]}</h3><p style="font-size:15px">${x[2]}</p></div>`).join("")}</div>
  <p style="margin-top:16px">Como esticar prazo: mostrando valor. Ganhou 3 dias, mostre o que os 3 dias renderam, e no próximo peça 4.</p><p class="aviso" style="margin-top:12px">A nomenclatura ficou embaralhada na transcrição. Conferir com a professora.</p>`;
 }
 return `<div class="ler"><div class="cab"><div class="migalha"><button data-go="ferramentas">Estante de ferramentas</button><span>›</span><span>${esc(f.nome)}</span></div>
 <span class="label">Da aula ${a.n} · ${esc(a.titulo)}</span><h1>${esc(f.nome)}</h1></div>${c}</div>`;
}

function vPendencias(){
 const todas=[...PEND_BASE,...S.pendExtra];
 const linha=p=>{const a=aulaDe(p.aula);const feito=!!S.pendDone[p.id];return `<div class="cartao" style="${feito?"opacity:.6":""}"><label class="check" style="align-items:flex-start"><input type="checkbox" data-pend="${p.id}" ${feito?"checked":""} style="margin-top:4px"><span style="${feito?"text-decoration:line-through":""}">${esc(p.texto)}</span></label>
  <div class="chips">${a?`<span class="chip">Aula ${a.n}</span>`:""}${p.ligado?`<span class="chip bleu">${esc(p.ligado)}</span>`:""}</div>
  ${feito?"":`<div class="linha-btns"><a class="btn mini" href="${gcal(p.texto,"","Pendência do Caderno de Estudos")}" target="_blank" rel="noopener">Marcar na agenda</a>${p.extra?`<button class="btn mini fant" data-delpend="${p.id}">Excluir</button>`:""}</div>`}</div>`};
 const ab=todas.filter(p=>!S.pendDone[p.id]),fe=todas.filter(p=>S.pendDone[p.id]);
 return `<div class="ler"><div class="cab"><span class="label"><span class="ast">✱</span>Pendências</span><h1>O que ficou para completar</h1><p class="muted">Coisas que as aulas deixaram em aberto e que destravam pautas ou ferramentas.</p></div>
 <div style="display:grid;gap:10px">${ab.map(linha).join("")||`<p class="vazio">Tudo resolvido.</p>`}</div>
 <form class="cartao form" id="f-pend" style="margin-top:18px"><span class="label">Nova pendência</span><div class="duas"><div class="campo"><label for="fp-texto">O que falta</label><input type="text" id="fp-texto" required></div><div class="campo"><label for="fp-aula">Aula</label><select id="fp-aula"><option value="">Nenhuma</option>${AULAS.map(a=>`<option value="${a.id}">Aula ${a.n} · ${esc(a.titulo)}</option>`).join("")}</select></div></div><div><button class="btn pri" type="submit">Adicionar</button></div></form>
 ${fe.length?`<h3 style="margin:28px 0 10px">Resolvidas</h3><div style="display:grid;gap:10px">${fe.map(linha).join("")}</div>`:""}</div>`;
}

function vEstrategia(){
 const blocos=["Posicionamento: quem eu sou aqui, como dona da ÔDO e estrategista","Público","Promessa do perfil","Pilares","Editorias","Tom de voz","Funil e monetização"];
 return `<div class="ler"><div class="cab"><span class="label" style="color:var(--bleu-tinta)"><span class="ast">✱</span>Meu Perfil · Estratégia</span><h1>A estratégia do meu perfil</h1><p class="aviso">Em branco de propósito. Você vai repensar a estratégia falando como dona da ÔDO e estrategista, e a gente preenche quando estiver definida.</p></div>
 <div style="display:grid;gap:10px">${blocos.map(b=>`<div class="cartao" style="border-top:4px solid var(--bleu)"><h3>${b}</h3><p class="muted" style="font-size:14px">A definir.</p></div>`).join("")}</div></div>`;
}

let fmt="reels";
function vEsteira(){
 const cols=ETAPAS[fmt];
 const cards=S.esteira.filter(c=>c.formato===fmt);
 return `<div class="largo"><div class="cab"><span class="label" style="color:var(--bleu-tinta)"><span class="ast">✱</span>Meu Perfil · Esteira</span><h1>Esteira de produção</h1>
  <div class="linha-btns" style="justify-content:space-between"><div class="alternar" role="group" aria-label="Formato"><button aria-pressed="${fmt==="reels"}" data-fmt="reels">Reels · ${S.esteira.filter(c=>c.formato==="reels").length}</button><button aria-pressed="${fmt==="carrossel"}" data-fmt="carrossel">Carrossel · ${S.esteira.filter(c=>c.formato==="carrossel").length}</button></div></div></div>
 <form class="cartao form" id="f-ideia" style="margin-bottom:18px"><span class="label">Nova ideia</span><div class="duas"><div class="campo"><label for="fn-titulo">Ideia</label><input type="text" id="fn-titulo" required placeholder="O gancho ou a ideia em uma frase"></div><div class="campo"><label for="fn-fmt">Formato</label><select id="fn-fmt"><option value="reels" ${fmt==="reels"?"selected":""}>Reels</option><option value="carrossel" ${fmt==="carrossel"?"selected":""}>Carrossel</option></select></div></div><div><button class="btn pri" type="submit">Pôr na esteira</button></div></form>
 <div class="quadro"><div class="colunas">${cols.map((nome,i)=>{const cs=cards.filter(c=>c.etapa===i);return `<div class="coluna"><h4>${nome}<span class="n">${cs.length}</span></h4>${cs.map(c=>cardEsteira(c,cols)).join("")||`<div class="vazio">Nada aqui</div>`}</div>`}).join("")}</div></div></div>`;
}
function cardEsteira(c,cols){
 const p=c.pauta?PAUTAS.find(x=>x.id===c.pauta):null; const a=c.aula?aulaDe(c.aula):null;
 return `<div class="card"><span class="t">${esc(c.titulo)}</span><div class="chips">${a?`<span class="chip">Aula ${a.n}</span>`:""}${c.origem==="comentario"?`<span class="chip">De um comentário</span>`:""}${c.data?`<span class="chip miel">${dataBR(c.data)}</span>`:""}</div>
 <details class="mais"><summary>Detalhes</summary><div class="form">
  ${p?`<p style="font-size:13.5px" class="muted">${esc(p.angulo)}</p>`:""}
  <div class="campo"><label for="d-${c.id}">Data prevista</label><input type="date" id="d-${c.id}" data-cdata="${c.id}" value="${esc(c.data)}"></div>
  <div class="campo"><label for="n-${c.id}">Texto, roteiro ou notas</label><textarea id="n-${c.id}" data-cnotas="${c.id}">${esc(c.notas||(p?p.esboco.map((e,i)=>(i+1)+". "+e).join("\n"):""))}</textarea></div>
  <div class="linha-btns"><a class="btn mini" href="${gcal(c.titulo,c.data,"Conteúdo do perfil: "+c.titulo)}" target="_blank" rel="noopener">Agenda</a>${a?`<button class="btn mini fant" type="button" data-aula="${a.id}">Ver aula</button>`:""}<button class="btn mini fant" type="button" data-delcard="${c.id}">Excluir</button></div></div></details>
 <div class="mover"><button class="btn mini fant" data-mv="${c.id}" data-d="-1" ${c.etapa===0?"disabled":""} aria-label="Voltar etapa">‹ Voltar</button><button class="btn mini" data-mv="${c.id}" data-d="1" ${c.etapa===cols.length-1?"disabled":""} aria-label="Avançar etapa">Avançar ›</button></div></div>`;
}

function vAnalise(){
 const F=S.analise, num=v=>Number(v)||0;
 const tv=F.reduce((s,f)=>s+num(f.views),0),tl=F.reduce((s,f)=>s+num(f.likes),0),tc=F.reduce((s,f)=>s+num(f.ncom),0);
 const media=t=>{const x=F.filter(f=>f.formato===t&&num(f.views));return x.length?Math.round(x.reduce((s,f)=>s+num(f.views),0)/x.length):0};
 const cont={};TAGS.forEach(t=>cont[t]=0);F.forEach(f=>f.comentarios.forEach(c=>cont[c.tag]=(cont[c.tag]||0)+1));
 const maxT=Math.max(1,...Object.values(cont));
 const rank=[...F].sort((a,b)=>num(b.views)-num(a.views)).slice(0,5);const maxV=Math.max(1,...rank.map(f=>num(f.views)));
 const fmtN=n=>n.toLocaleString("pt-BR");
 return `<div class="largo"><div class="cab"><span class="label" style="color:var(--bleu-tinta)"><span class="ast">✱</span>Meu Perfil · Análise</span><h1>Como os conteúdos estão indo</h1><p class="muted">Cada conteúdo que chega na etapa Análise da esteira ganha uma ficha aqui. Você preenche os números à mão.</p></div>
 <div class="kpis"><div class="kpi"><span class="label">Visualizações</span><b>${fmtN(tv)}</b></div><div class="kpi"><span class="label">Curtidas</span><b>${fmtN(tl)}</b></div><div class="kpi"><span class="label">Comentários</span><b>${fmtN(tc)}</b></div><div class="kpi"><span class="label">Média reels · carrossel</span><b style="font-size:22px">${fmtN(media("reels"))} · ${fmtN(media("carrossel"))}</b></div></div>
 <div class="painel" style="margin-top:16px">
  <div class="cartao"><span class="label">Que conversas eu estou gerando</span>${TAGS.map(t=>`<div class="barra"><span>${t}</span><span class="trilho"><span class="enche" style="display:block;width:${cont[t]/maxT*100}%"></span></span><span class="v">${cont[t]}</span></div>`).join("")}</div>
  <div class="cartao"><span class="label">Ranking por visualizações</span>${rank.map(f=>`<div class="barra"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.titulo)}</span><span class="trilho"><span class="enche" style="display:block;width:${num(f.views)/maxV*100}%;background:var(--terre)"></span></span><span class="v">${num(f.views)>=1000?(num(f.views)/1000).toFixed(1)+"k":num(f.views)}</span></div>`).join("")||"<p class='muted'>Sem fichas ainda.</p>"}</div>
 </div>
 <h2 style="margin:30px 0 12px">Fichas</h2>
 <div style="display:grid;gap:14px">${F.map(fichaHTML).join("")||`<p class="vazio">Quando um conteúdo chegar em Análise na esteira, a ficha aparece aqui.</p>`}</div></div>`;
}
function fichaHTML(f){
 return `<div class="cartao"><div class="linha-btns" style="justify-content:space-between"><div class="chips">${f.exemplo?'<span class="chip miel">Exemplo</span>':""}<span class="chip">${f.formato==="reels"?"Reels":"Carrossel"}</span></div><button class="btn mini fant" data-delficha="${f.id}">Excluir ficha</button></div>
 <h3>${esc(f.titulo)}</h3>
 <div class="duas" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="campo"><label for="v-${f.id}">Visualizações</label><input type="number" min="0" id="v-${f.id}" data-fm="${f.id}" data-k="views" value="${esc(f.views)}"></div><div class="campo"><label for="l-${f.id}">Curtidas</label><input type="number" min="0" id="l-${f.id}" data-fm="${f.id}" data-k="likes" value="${esc(f.likes)}"></div><div class="campo"><label for="c-${f.id}">Comentários</label><input type="number" min="0" id="c-${f.id}" data-fm="${f.id}" data-k="ncom" value="${esc(f.ncom)}"></div></div>
 <span class="label">Comentários que valem guardar</span>
 <div style="display:grid;gap:8px">${f.comentarios.map(c=>`<div class="comentario"><p style="font-size:15px">${esc(c.texto)}</p><div class="linha-btns"><select data-ctag="${f.id}|${c.id}" style="width:auto;padding:4px 8px;font-size:13px" aria-label="Tipo de conversa">${TAGS.map(t=>`<option ${t===c.tag?"selected":""}>${t}</option>`).join("")}</select><button class="btn mini" data-viraideia="${f.id}|${c.id}">Virar ideia</button><button class="btn mini fant" data-delcom="${f.id}|${c.id}">Excluir</button></div></div>`).join("")||"<p class='muted' style='font-size:14px'>Nenhum comentário guardado.</p>"}</div>
 <form class="form" data-fcom="${f.id}"><div class="duas" style="grid-template-columns:1fr auto"><input type="text" id="nc-${f.id}" placeholder="Cole um comentário" aria-label="Novo comentário" required><select id="nt-${f.id}" style="width:auto" aria-label="Tipo">${TAGS.map(t=>`<option>${t}</option>`).join("")}</select></div><div><button class="btn mini" type="submit">Guardar comentário</button></div></form>
 <div class="campo"><label for="i-${f.id}">Meus insights</label><textarea id="i-${f.id}" data-fm="${f.id}" data-k="insights" placeholder="O que funcionou, o que não funcionou, o que testar no próximo">${esc(f.insights)}</textarea></div></div>`;
}

/* ---------------- render ---------------- */
function render(){
 if(!S) return;
 const v={painel:vPainel,biblioteca:vBiblioteca,aula:vAula,ferramentas:vFerramentas,ferramenta:vFerramenta,pendencias:vPendencias,estrategia:vEstrategia,esteira:vEsteira,analise:vAnalise}[R.view]||vPainel;
 document.getElementById("main").innerHTML=v();
 const atual=R.view==="aula"?"biblioteca":R.view==="ferramenta"?"ferramentas":R.view;
 document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-current",String(b.dataset.go===atual)));
 document.getElementById("n-pend").textContent=[...PEND_BASE,...S.pendExtra].filter(p=>!S.pendDone[p.id]).length;
 document.getElementById("n-esteira").textContent=S.esteira.length;
}

/* ---------------- ações ---------------- */
function paraEsteira(c){S.esteira.push(Object.assign({id:uid(),etapa:0,data:"",notas:""},c));salvar()}
function garantirFicha(c){if(!S.analise.some(f=>f.card===c.id)){S.analise.unshift({id:uid(),card:c.id,titulo:c.titulo,formato:c.formato,data:c.data,views:"",likes:"",ncom:"",comentarios:[],insights:""});toast("Ficha criada na Análise")}}

document.addEventListener("click",e=>{
 const t=e.target.closest("button,[data-aula]");if(!t)return;
 const d=t.dataset;
 if(d.go){ir(d.go);return}
 if(d.aula&&!d.mv){ir("aula",d.aula);return}
 if(d.tab){const a=R.id;S.tab[a]=d.tab;salvar();render();return}
 if(d.ferr){ir("ferramenta",d.ferr);return}
 if(d.fase){faseSel=+d.fase;render();return}
 if(d.fmt){fmt=d.fmt;render();return}
 if(d.pauta){const p=PAUTAS.find(x=>x.id===d.pauta);paraEsteira({titulo:p.hook,formato:p.formato==="Carrossel"?"carrossel":"reels",pilar:"",pauta:p.id,aula:p.aula});toast("Foi pra esteira, em Ideia");render();return}
 if(d.mv){const c=S.esteira.find(x=>x.id===d.mv);const max=ETAPAS[c.formato].length-1;c.etapa=Math.min(max,Math.max(0,c.etapa+Number(d.d)));if(c.etapa===max)garantirFicha(c);salvar();render();return}
 if(d.delcard){S.esteira=S.esteira.filter(x=>x.id!==d.delcard);salvar();toast("Removido da esteira");render();return}
 if(d.delinsight){S.insights=S.insights.filter(x=>x.id!==d.delinsight);salvar();render();return}
 if(d.insightpauta){const i=S.insights.find(x=>x.id===d.insightpauta);paraEsteira({titulo:i.texto.slice(0,140),formato:"reels",pilar:"",aula:i.aula});toast("Virou ideia na esteira");render();return}
 if(d.delfonte){S.fontes=S.fontes.filter(x=>x.id!==d.delfonte);salvar();render();return}
 if(d.delpend){S.pendExtra=S.pendExtra.filter(x=>x.id!==d.delpend);salvar();render();return}
 if(d.delficha){S.analise=S.analise.filter(x=>x.id!==d.delficha);salvar();render();return}
 if(d.delcom){const[f,c]=d.delcom.split("|");const fi=S.analise.find(x=>x.id===f);fi.comentarios=fi.comentarios.filter(x=>x.id!==c);salvar();render();return}
 if(d.viraideia){const[f,c]=d.viraideia.split("|");const fi=S.analise.find(x=>x.id===f);const co=fi.comentarios.find(x=>x.id===c);paraEsteira({titulo:"Responder: "+co.texto.slice(0,120),formato:fi.formato,pilar:"",origem:"comentario"});toast("Virou ideia na esteira");return}
});
document.addEventListener("change",e=>{
 const t=e.target,d=t.dataset;
 if(d.status){S.status[d.status]=+t.value;salvar();toast("Status atualizado");return}
 if(d.pend){S.pendDone[d.pend]=t.checked;salvar();render();return}
 if(d.cdata){const c=S.esteira.find(x=>x.id===d.cdata);c.data=t.value;salvar();render();return}
 if(d.ctag){const[f,c]=d.ctag.split("|");S.analise.find(x=>x.id===f).comentarios.find(x=>x.id===c).tag=t.value;salvar();render();return}
 if(d.fm&&t.type==="number"){render();return}
});
document.addEventListener("input",e=>{
 const t=e.target,d=t.dataset;
 if(d.cnotas){S.esteira.find(x=>x.id===d.cnotas).notas=t.value;salvar()}
 if(d.fm){S.analise.find(x=>x.id===d.fm)[d.k]=t.value;salvar()}
 if(d.canvas){S.canvas[d.canvas]=t.value;salvar()}
});
document.addEventListener("submit",e=>{
 e.preventDefault();const f=e.target;if(f.id==="f-login")return;const v=id=>(document.getElementById(id)||{}).value||"";
 if(f.id==="f-insight"){const tx=v("fi-texto").trim();if(!tx)return;S.insights.push({id:uid(),aula:f.dataset.insaula,texto:tx,odo:document.getElementById("fi-odo").checked,perfil:document.getElementById("fi-perfil").checked,data:v("fi-data")});salvar();toast("Insight salvo");render()}
 if(f.id==="f-fonte"){S.fontes.push({id:uid(),tipo:v("ff-tipo"),titulo:v("ff-titulo"),autor:v("ff-autor"),link:v("ff-link"),notas:v("ff-notas")});salvar();toast("Fonte adicionada");render()}
 if(f.id==="f-pend"){S.pendExtra.push({id:uid(),extra:true,texto:v("fp-texto"),aula:v("fp-aula"),ligado:""});salvar();toast("Pendência adicionada");render()}
 if(f.id==="f-ideia"){const fm=v("fn-fmt");paraEsteira({titulo:v("fn-titulo"),formato:fm,pilar:""});fmt=fm;toast("Ideia na esteira");render()}
 if(f.dataset.fcom){const id=f.dataset.fcom,tx=v("nc-"+id).trim();if(!tx)return;S.analise.find(x=>x.id===id).comentarios.push({id:uid(),texto:tx,tag:v("nt-"+id)});salvar();render()}
});


/* ---------------- conexão e login ---------------- */
function tela(html){document.body.classList.add("deslogado");document.getElementById("main").innerHTML=`<div class="entrada">${html}</div>`}
function telaLogin(msg){
 tela(`<div class="cartao form"><span class="selo grande" aria-hidden="true">✱</span><h1>Caderno de Estudos</h1><p class="muted">Entre com o seu e-mail. Mandamos um link de acesso, sem senha.</p>
  <form id="f-login" class="form"><div class="campo"><label for="lg-email">E-mail</label><input type="email" id="lg-email" required autocomplete="email"></div><div><button class="btn pri" type="submit">Mandar link de acesso</button></div></form>
  ${msg?`<p class="aviso">${esc(msg)}</p>`:""}</div>`);
}
function telaErro(m){tela(`<div class="cartao"><h2>Não consegui abrir o Caderno</h2><p class="muted">${esc(m)}</p></div>`)}
async function carregar(){
 tela(`<p class="muted">Abrindo o seu caderno…</p>`);
 const {data,error}=await sb.from("estudo_estado").select("dados").eq("owner",usuario.id).maybeSingle();
 if(error){telaErro("O banco respondeu: "+error.message);return}
 S=(data&&data.dados&&data.dados.esteira)?data.dados:semente();
 if(!S.tab)S.tab={};
 document.body.classList.remove("deslogado");
 document.getElementById("quem").textContent=usuario.email;
 if(!data) salvar();
 lerHash();render();
}
async function recarregar(){
 if(!usuario||salvando) return;
 const {data}=await sb.from("estudo_estado").select("dados").eq("owner",usuario.id).maybeSingle();
 if(data&&data.dados&&data.dados.esteira&&!salvando){S=data.dados;if(!S.tab)S.tab={};render()}
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")recarregar()});
document.addEventListener("submit",async e=>{
 if(e.target.id!=="f-login")return;
 const email=document.getElementById("lg-email").value.trim();
 const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}});
 telaLogin(error?"Esse e-mail não tem acesso ao Caderno.":"Link enviado para "+email+". Abra o e-mail neste aparelho e toque no link.");
});
document.getElementById("sair").addEventListener("click",async()=>{await sb.auth.signOut()});
async function iniciar(){
 if(!temConfig){telaErro("Falta preencher o endereço e a chave do Supabase no arquivo config.js.");return}
 sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey);
 sb.auth.onAuthStateChange((ev,sess)=>{
  if(sess&&!usuario){usuario=sess.user;carregar()}
  if(ev==="SIGNED_OUT"){usuario=null;S=null;telaLogin()}
 });
 const {data:{session}}=await sb.auth.getSession();
 if(session&&!usuario){usuario=session.user;carregar()}
 else if(!session) telaLogin();
}
iniciar();
