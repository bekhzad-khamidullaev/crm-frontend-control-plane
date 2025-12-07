import{a as n}from"./index-BX7VplVf.js";function d({icon:c="add",label:s="",onClick:e,extended:i=!1}={}){const a=document.createElement("button");return a.className=i?"mdc-fab mdc-fab--extended":"mdc-fab",i?a.innerHTML=`
      <div class="mdc-fab__ripple"></div>
      <span class="material-icons mdc-fab__icon">${c}</span>
      <span class="mdc-fab__label">${s}</span>
    `:(a.innerHTML=`
      <div class="mdc-fab__ripple"></div>
      <span class="material-icons mdc-fab__icon">${c}</span>
    `,s&&a.setAttribute("aria-label",s)),n.attachTo(a),e&&a.addEventListener("click",e),a}export{d as F};
