const map=L.map('map').setView([63.095,21.616],10);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker;
const settings=JSON.parse(localStorage.getItem('settings')||'{"green":80,"yellow":60}');
document.getElementById('green').value=settings.green;
document.getElementById('yellow').value=settings.yellow;
document.getElementById('settingsBtn').onclick=()=>document.getElementById('settings').classList.toggle('hidden');
document.getElementById('save').onclick=()=>{settings.green=+green.value;settings.yellow=+yellow.value;localStorage.setItem('settings',JSON.stringify(settings));alert('Tallennettu');};
map.on('click',async e=>{
 if(marker) map.removeLayer(marker);
 marker=L.marker(e.latlng).addTo(map);
 const url=`https://api.open-meteo.com/v1/forecast?latitude=${e.latlng.lat}&longitude=${e.latlng.lng}&hourly=wind_speed_10m,relative_humidity_2m,precipitation_probability&forecast_days=3`;
 const res=await fetch(url); const data=await res.json();
 render(data.hourly);
});
function score(w,p,h){
 let s=0;
 if(w<=4)s+=50; else if(w<=6)s+=30; else if(w<=8)s+=10;
 if(p<=10)s+=30; else if(p<=30)s+=15;
 if(h>=50&&h<=90)s+=20; else if(h>=40&&h<=95)s+=10;
 return s;
}
function render(h){
 const tb=document.getElementById('forecast'); tb.innerHTML='';
 for(let i=0;i<h.time.length;i++){
  const sc=score(h.wind_speed_10m[i],h.precipitation_probability[i],h.relative_humidity_2m[i]);
  let cls='bad'; if(sc>=settings.green) cls='good'; else if(sc>=settings.yellow) cls='ok';
  tb.insertAdjacentHTML('beforeend',`<tr class="${cls}"><td>${h.time[i].replace('T',' ')}</td><td>${h.wind_speed_10m[i]}</td><td>${h.precipitation_probability[i]}</td><td>${h.relative_humidity_2m[i]}</td><td>${sc}</td></tr>`);
 }
}