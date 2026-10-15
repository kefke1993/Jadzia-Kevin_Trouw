document.addEventListener('DOMContentLoaded', function () {
    const rsvpForm = document.getElementById('rsvpForm');
    const aanwezigheidRadios = document.querySelectorAll('input[name="aanwezigheid"]');
    
    const aantalGezinsledenContainer = document.getElementById('aantalGezinsledenContainer');
    const gezinsDieetContainer = document.getElementById('gezinsDieetContainer');
    
    const aantalGezinsledenInput = document.getElementById('aantalGezinsleden');
    const gezinsledenLijst = document.getElementById('gezinsledenLijst');
    const voegGezinslidToeBtn = document.getElementById('voegGezinslidToeBtn');
    const succesBericht = document.getElementById('succesBericht');
    
    // Zoek de verzendknop op in je formulier (zorg dat je knop type="submit" heeft of een ID, hier zoeken we op type submit)
    const submitBtn = rsvpForm.querySelector('button[type="submit"]') || rsvpForm.querySelector('.btn-submit');

    // Jouw gekoppelde Google Apps Script Web-app URL
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzn1u7extmyK3UDi2qASUXrNT5-o8O8dcShzuK9SZBwN0ihVzDJ6cVQ40eOiEAUeDEq/exec";

    function updateFormulierZichtbaarheid() {
        const gekozenWaarde = document.querySelector('input[name="aanwezigheid"]:checked');
        if (!gekozenWaarde) return;

        if (gekozenWaarde.value === 'neen') {
            aantalGezinsledenContainer.style.display = 'none';
            gezinsDieetContainer.style.display = 'none';
        } else {
            aantalGezinsledenContainer.style.display = 'block';
            gezinsDieetContainer.style.display = 'block';
            herberekenGastenLijst();
        }
    }

    aanwezigheidRadios.forEach(radio => {
        radio.addEventListener('change', updateFormulierZichtbaarheid);
    });

    // Helper om bestand om te zetten naar Base64
    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Functie om een gast-blok te maken (Gast 1 is de hoofdgast die invult)
    function maakGastBlok(index) {
        const isHoofdgast = (index === 1);
        const idSuffix = Date.now() + Math.random().toString(36).substring(2, 7);
        const div = document.createElement('div');
        div.className = 'gezinslid-blok' + (isHoofdgast ? ' hoofdgast-blok' : '');
        div.dataset.index = index;

        const gastLabel = isHoofdgast ? "Jijzelf" : `Gast ${index} (Gezinslid / Partner)`;

        div.innerHTML = `
            <div class="gast-titel">♥ ${gastLabel}</div>
            
            <div class="gezinslid-header">
                <input type="text" placeholder="Voornaam *" class="gast-voornaam" required>
                <input type="text" placeholder="Achternaam *" class="gast-achternaam" required>
                ${!isHoofdgast ? '<button type="button" class="btn-verwijder" title="Verwijderen">×</button>' : ''}
            </div>
            
            <div style="margin-top: 10px;">
                <label style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 4px;">Foto van ${isHoofdgast ? 'jezelf' : 'dit gezinslid/partner'}:</label>
                <input type="file" accept="image/*" class="gast-foto file-input">
            </div>

            <div class="checkbox-card" style="margin-top: 10px;">
                <input type="checkbox" id="dieet_cb_${idSuffix}" class="gast-dieet-cb">
                <label for="dieet_cb_${idSuffix}">Heeft ${isHoofdgast ? 'je' : 'dit gezinslid'} dieetwensen of allergieën?</label>
            </div>
            
            <div class="gast-dieet-details hidden dieet-details">
                <label>Welke dieetwensen of allergieën?</label>
                <input type="text" placeholder="Bijv. vegetarisch, glutenallergie..." class="gast-dieet-input">
            </div>
        `;

        // Dieet checkbox toggle
        const cb = div.querySelector('.gast-dieet-cb');
        const detailsDiv = div.querySelector('.gast-dieet-details');
        const dieetInput = div.querySelector('.gast-dieet-input');

        cb.addEventListener('change', function() {
            if (this.checked) {
                detailsDiv.classList.remove('hidden');
            } else {
                detailsDiv.classList.add('hidden');
                dieetInput.value = '';
            }
        });

        // Verwijderknop voor extra gezinsleden
        if (!isHoofdgast) {
            div.querySelector('.btn-verwijder').addEventListener('click', function() {
                div.remove();
                const huidigeExtra = Math.max(0, gezinsledenLijst.querySelectorAll('.gezinslid-blok').length - 1);
                aantalGezinsledenInput.value = huidigeExtra;
                hernummerGasten();
            });
        }

        return div;
    }

    // Zorgt dat Gast 1 (hoofdgast) altijd aanwezig is, plus N extra gezinsleden
    function herberekenGastenLijst() {
        const extraGezinsleden = parseInt(aantalGezinsledenInput.value) || 0;
        const gewenstTotaal = 1 + extraGezinsleden;
        
        const huidigeBlokken = gezinsledenLijst.querySelectorAll('.gezinslid-blok');

        if (huidigeBlokken.length === 0) {
            gezinsledenLijst.appendChild(maakGastBlok(1));
        }

        const actueelAantal = gezinsledenLijst.querySelectorAll('.gezinslid-blok').length;

        if (gewenstTotaal > actueelAantal) {
            for (let i = actueelAantal + 1; i <= gewenstTotaal; i++) {
                gezinsledenLijst.appendChild(maakGastBlok(i));
            }
        } else if (gewenstTotaal < actueelAantal) {
            for (let i = actueelAantal; i > gewenstTotaal; i--) {
                if (i > 1) {
                    gezinsledenLijst.lastChild.remove();
                }
            }
        }
        hernummerGasten();
    }

    function hernummerGasten() {
        const blokken = gezinsledenLijst.querySelectorAll('.gezinslid-blok');
        blokken.forEach((blok, idx) => {
            const index = idx + 1;
            const titelEl = blok.querySelector('.gast-titel');
            if (index === 1) {
                titelEl.textContent = "♥ Gast 1 (Jijzelf - Persoon die invult)";
            } else {
                titelEl.textContent = `♥ Gast ${index} (Gezinslid / Partner)`;
            }
        });
    }

    aantalGezinsledenInput.addEventListener('input', herberekenGastenLijst);

    voegGezinslidToeBtn.addEventListener('click', function() {
        const huidigeExtra = parseInt(aantalGezinsledenInput.value) || 0;
        aantalGezinsledenInput.value = huidigeExtra + 1;
        herberekenGastenLijst();
    });

    herberekenGastenLijst();

    // Formulier verzenden en doorsturen naar Google Sheets
    rsvpForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        // Blokkeer dubbelklikken door de knop direct uit te schakelen
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.origineleTekst = submitBtn.textContent;
            submitBtn.textContent = "Bezig met verzenden...";
        }

        const formData = new FormData(rsvpForm);
        const data = Object.fromEntries(formData.entries());

        const gastenBlokken = gezinsledenLijst.querySelectorAll('.gezinslid-blok');
        if (gastenBlokken.length === 0) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.origineleTekst || "Verzenden";
            }
            return;
        }

        // Gast 1 (Hoofdgast)
        const hoofdgastBlok = gastenBlokken[0];
        data.voornaam = hoofdgastBlok.querySelector('.gast-voornaam').value;
        data.naam = hoofdgastBlok.querySelector('.gast-achternaam').value;
        
        const heeftHoofdgastDieet = hoofdgastBlok.querySelector('.gast-dieet-cb').checked;
        data.dieet = heeftHoofdgastDieet ? (hoofdgastBlok.querySelector('.gast-dieet-input').value || "Ja") : "Geen";

        const hoofdgastFotoInput = hoofdgastBlok.querySelector('.gast-foto');
        if (hoofdgastFotoInput && hoofdgastFotoInput.files[0]) {
            data.fotoBase64 = await convertFileToBase64(hoofdgastFotoInput.files[0]);
            data.fotoNaam = hoofdgastFotoInput.files[0].name;
        } else {
            data.fotoBase64 = "";
            data.fotoNaam = "Geen foto";
        }

        // Overige gezinsleden (Gast 2, Gast 3, ...)
        const gezinsledenData = [];
        for (let i = 1; i < gastenBlokken.length; i++) {
            const blok = gastenBlokken[i];
            const vNaam = blok.querySelector('.gast-voornaam').value;
            const aNaam = blok.querySelector('.gast-achternaam').value;
            const heeftDieet = blok.querySelector('.gast-dieet-cb').checked;
            const dieetInput = blok.querySelector('.gast-dieet-input').value;
            const fotoInput = blok.querySelector('.gast-foto');
            
            let fotoBase64 = "";
            let fotoNaam = "Geen foto";

            if (fotoInput && fotoInput.files[0]) {
                fotoBase64 = await convertFileToBase64(fotoInput.files[0]);
                fotoNaam = fotoInput.files[0].name;
            }

            gezinsledenData.push({
                naam: `${vNaam} ${aNaam}`,
                dieet: heeftDieet && dieetInput ? dieetInput : (heeftDieet ? "Ja" : "Geen"),
                fotoBase64: fotoBase64,
                fotoNaam: fotoNaam
            });
        }
        data.gezinsledenDetails = gezinsledenData;

        // Verzend de data naar je Google Sheet via het script
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).then(() => {
            rsvpForm.style.display = 'none';
            succesBericht.classList.remove('hidden');
        }).catch(error => {
            console.error('Fout bij verzenden:', error);
            alert('Er ging iets mis bij het verzenden. Probeer het later opnieuw.');
            
            // Herstel de knop mocht er onverhoopt toch een netwerkfout optreden
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.origineleTekst || "Verzenden";
            }
        });
    });
});