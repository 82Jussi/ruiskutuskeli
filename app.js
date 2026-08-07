// Asetusikkuna
 document.getElementById('gear').onclick = () => {
    document.getElementById('modal').classList.add('show');
};

document.getElementById('modal').onclick = (e) => {
    if (e.target.id === 'modal') {
        e.target.classList.remove('show');
    }
};

// Kartta
const map = L.map('map').setView([63.095, 21.616], 9);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Valittu piste
let marker = null;

// Klikkaus kartalle
map.on('click', function (e) {

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map);

    document.getElementById('best').innerHTML = `
        <strong>Valittu piste</strong><br>
        Lat: ${lat.toFixed(5)}<br>
        Lon: ${lng.toFixed(5)}
    `;

    localStorage.setItem('selectedLat', lat);
    localStorage.setItem('selectedLng', lng);
});

const savedLat = localStorage.getItem('selectedLat');
const savedLng = localStorage.getItem('selectedLng');

if (savedLat && savedLng) {
    const lat = parseFloat(savedLat);
    const lng = parseFloat(savedLng);

    marker = L.marker([lat, lng]).addTo(map);

    document.getElementById('best').innerHTML = `
        <strong>Valittu piste</strong><br>
        Lat: ${lat.toFixed(5)}<br>
        Lon: ${lng.toFixed(5)}
    `;
}
