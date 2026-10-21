'use strict';
const $=id=>document.getElementById(id), answers={}, details={};let page=0;
function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
SURVEY.intro.slice(1,3).forEach(t=>{const p=el('p');const marker='（25-64岁）';const at=t.indexOf(marker);if(at>=0){p.append(document.createTextNode(t.slice(0,at)),el('strong',marker),document.createTextNode(t.slice(at+marker.length)));}else p.textContent=t;$('intro').append(p);});
$('start').disabled=true;$('consent').onchange=e=>$('start').disabled=!e.target.checked;
$('start').onclick=()=>{$('welcome').hidden=true;$('survey').hidden=false;render();};
function skipped(i){const n=Number(i.id?.split('q')[1]);return page===0&&((n===22&&answers.s1q21?.startsWith('否'))||(n>=24&&n<=26&&answers.s1q23&&!answers.s1q23.startsWith('是')));}
function render(){
 const s=SURVEY.sections[page];$('form').replaceChildren(el('h2',s.title));$('step').textContent=`第 ${page+1} / 6 部分`;$('bar').value=page+1;$('tabs').replaceChildren();
 SURVEY.sections.forEach((x,k)=>{const b=el('button',x.title.split(' ')[0],k===page?'active':'');b.type='button';b.onclick=()=>{page=k;render();};$('tabs').append(b);});
 s.items.forEach(i=>{
  if(i.note){$('form').append(el('p',i.note,'hint'));return;}if(skipped(i))return;
  const f=el('fieldset'),legend=el('legend');const txt=i.prompt, rest=i.extra.join('\n'), opts=i.options.length?i.options:null;
  legend.textContent=txt;f.append(legend);const wrap=el('div');f.append(wrap);
  if(opts){opts.forEach((o,k)=>{const label=el('label',null,'option'),input=el('input');input.type='radio';input.name=i.id;input.value=o;input.checked=answers[i.id]===o;input.onchange=()=>{answers[i.id]=o;render();};label.append(input,document.createTextNode(o));wrap.append(label);});}
  
  if(!opts|| i.hasDetail){const input=el('input');input.type='text';input.setAttribute('aria-label',txt+' 填写内容');input.placeholder=opts?'如所选项需要填写，请在此补充':'请填写（可留空）';input.value=details[i.id]||'';input.oninput=()=>{details[i.id]=input.value;updateCount();};wrap.append(input);}
  $('form').append(f);
 });
 $('prev').disabled=page===0;$('next').textContent=page===5?'完成并整理答卷':'下一部分 →';updateCount();
}
function updateCount(){$('count').textContent=`本部分已填写 ${SURVEY.sections[page].items.filter(i=>i.id&&!skipped(i)&&(answers[i.id]||details[i.id])).length} 题`;}
$('form').onsubmit=e=>e.preventDefault();$('prev').onclick=()=>{if(page>0){page--;render();window.scrollTo(0,280);}};
$('next').onclick=()=>{if(page<5){page++;render();window.scrollTo(0,280);}else{$('survey').hidden=true;$('done').hidden=false;}};
$('back').onclick=()=>{$('done').hidden=true;$('survey').hidden=false;};
$('download').onclick=()=>{const rows=SURVEY.sections.flatMap((s,k)=>s.items.filter(i=>i.id).map(i=>({部分:s.title,题号:i.id,题目:i.text,答案:k===0&&((Number(i.id.split('q')[1])===22&&answers.s1q21?.startsWith('否'))||(Number(i.id.split('q')[1])>=24&&Number(i.id.split('q')[1])<=26&&answers.s1q23&&!answers.s1q23.startsWith('是')))?'按跳题规则跳过':answers[i.id]||'',补充:details[i.id]||''})));const blob=new Blob([JSON.stringify({问卷:SURVEY.intro[0],版本:'10.21修原稿选项核对版',完成时间:new Date().toISOString(),答卷:rows},null,2)],{type:'application/json;charset=utf-8'});const a=el('a');a.href=URL.createObjectURL(blob);a.download='问卷答卷_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
