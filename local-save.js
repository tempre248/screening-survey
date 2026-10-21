'use strict';
(()=>{
 const draftKey='screening-survey-draft-v1',recordKey='screening-survey-records-v1';
 const status=$('submit-status'),button=$('submit-response');let id=crypto.randomUUID(),completed=false;
 function read(key,fallback){const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}
 function saveDraft(){
  try{localStorage.setItem(draftKey,JSON.stringify({id,answers,details,page,consent:$('consent').checked,completed,participant:window.participantLabel||''}));$('connection-state').textContent='填写进度已自动保存到本机。';}
  catch(e){$('connection-state').textContent='本机保存失败，请勿关闭页面，完成后下载备份。';}
 }
 try{
  const d=read(draftKey,null);
  if(d&&typeof d.answers==='object'&&typeof d.details==='object'){
   Object.assign(answers,d.answers);Object.assign(details,d.details);id=d.id||id;completed=Boolean(d.completed);
   page=Number.isInteger(d.page)?Math.min(5,Math.max(0,d.page)):0;
   $('consent').checked=Boolean(d.consent);$('start').disabled=!d.consent;
   window.participantLabel=d.participant||'';$('participant-id').value=window.participantLabel;
   $('connection-state').textContent='已恢复本机保存的进度。';
   if(completed)status.textContent='这份答卷已保存到本机，可下载备份或返回修改后重新保存。';
  }else $('connection-state').textContent='填写时将自动保存进度。';
 }catch(e){$('connection-state').textContent='无法读取本地记录，请下载答卷备份。';}
 function drawRegistry(){
  const body=$('participant-rows');body.replaceChildren();
  try{
   const rows=read(recordKey,[]);
   rows.forEach((r,k)=>{const tr=el('tr');[String(k+1),r.participant||r.response?.填写者||'未登记（历史答卷）','已保存',new Date(r.savedAt).toLocaleString('zh-CN')].forEach(t=>tr.append(el('td',t)));body.append(tr);});
   if(!rows.length){const tr=el('tr'),td=el('td','本机暂无已保存答卷');td.colSpan=4;tr.append(td);body.append(tr);}
  }catch(e){$('registration-status').textContent='无法读取本机登记表。';}
 }
 drawRegistry();
 $('registration-form').onsubmit=e=>{
  e.preventDefault();const label=$('participant-id').value.trim();
  if(!label){$('registration-status').textContent='请先输入姓名或编号。';return;}
  if(window.participantLabel&&window.participantLabel!==label){
   if(!confirm('姓名或编号与当前进度不一致。是否清空当前进度，开始新答卷？已保存答卷不受影响。'))return;
   for(const key of Object.keys(answers))delete answers[key];for(const key of Object.keys(details))delete details[key];
   id=crypto.randomUUID();completed=false;page=0;$('consent').checked=false;$('start').disabled=true;
  }
  window.participantLabel=label;window.participantConfirmed=true;saveDraft();
  $('registration').hidden=true;$('welcome').hidden=false;
  if($('consent').checked){$('welcome').hidden=true;$('survey').hidden=completed;$('done').hidden=!completed;render();}
 };
 document.addEventListener('input',saveDraft);document.addEventListener('change',saveDraft);
 document.addEventListener('click',e=>{if(e.target.closest('button')&&e.target.id!=='new-response')saveDraft();});
 button.onclick=()=>{
  if(!window.participantConfirmed)return;
  try{
   const records=read(recordKey,[]);if(!Array.isArray(records))throw Error('Invalid local records');
   const record={id,participant:window.participantLabel,savedAt:new Date().toISOString(),response:buildResponse()};
   const at=records.findIndex(r=>r.id===id);if(at<0)records.push(record);else records[at]=record;
   localStorage.setItem(recordKey,JSON.stringify(records));
   if(!read(recordKey,[]).some(r=>r.id===id))throw Error('Local verification failed');
   completed=true;saveDraft();status.textContent='已成功保存到本机！答卷编号：'+id+'。建议再下载文件备份。';
  }catch(e){status.textContent='本机保存失败，可能是存储空间不足或浏览器限制。请立即下载答卷备份。';}
 };
 $('new-response').onclick=()=>{
  if(!confirm('开始新答卷将清除当前填写进度。已保存的本机答卷仍保留；请先下载当前答卷备份。继续吗？'))return;
  try{localStorage.removeItem(draftKey);}catch(e){status.textContent='无法清除本机进度。';return;}
  location.reload();
 };
 // Allow downloading all completed records from this browser, including earlier responses.
 const exportButton=el('button','导出本机全部已保存答卷','secondary');exportButton.id='export-local';
 exportButton.onclick=()=>{
  try{
   const rows=read(recordKey,[]);if(!rows.length){status.textContent='本机尚无已保存答卷。';return;}
   const url=URL.createObjectURL(new Blob([JSON.stringify(rows,null,2)],{type:'application/json;charset=utf-8'}));
   const a=el('a');a.href=url;a.download='本机全部答卷_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){status.textContent='无法读取已保存答卷。';}
 };
 $('done').append(exportButton);
})();
