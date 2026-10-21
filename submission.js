'use strict';
(()=>{
 const cfg=window.DATABASE_CONFIG||{};
 const ready=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url||'')&&Boolean(cfg.publicKey);
 const button=document.getElementById('submit-response'),status=document.getElementById('submit-status');
 document.getElementById('connection-state').textContent=ready?'已配置在线收集，提交成功后保存':'尚未连接数据库，请暂勿用于正式收集';
 button.disabled=!ready;
 if(!ready)status.textContent='数据库尚未连接，暂时无法在线提交。您仍可下载答卷备份。';
 const id=crypto.randomUUID();let busy=false,submitted=false,payload=null;
 button.onclick=async()=>{
  if(!ready||busy||submitted)return;
  if(!document.getElementById('consent').checked){status.textContent='请先阅读说明并确认自愿参加。';return;}
  busy=true;button.disabled=true;document.getElementById('back').disabled=true;
  status.textContent='正在保存，请保持页面打开……';
  // Reuse identical content and ID on retry, including after an ambiguous network failure.
  payload=payload||{submission_id:id,response:buildResponse()};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const res=await fetch(cfg.url+'/rest/v1/rpc/submit_questionnaire',{
    method:'POST',headers:{apikey:cfg.publicKey,'Content-Type':'application/json'},
    body:JSON.stringify({p_id:payload.submission_id,p_response:payload.response}),signal:controller.signal
   });
   if(!res.ok)throw Error('HTTP '+res.status);
   const result=await res.json();if(result!==id)throw Error('Invalid confirmation');
   submitted=true;button.textContent='已提交';
   status.textContent='保存成功！答卷编号：'+id+'。感谢您的参与。';
  }catch(e){status.textContent='未能确认保存成功，请检查网络后重试。重试不会重复保存本份答卷；也可先下载备份。';button.disabled=false;}
  finally{clearTimeout(timer);busy=false;}
 };
})();
