// Matrix Background
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = [];

for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100;
}

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00d4ff';
    ctx.font = `${fontSize}px monospace`;
    
    for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 33);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

function switchPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    const targetLink = document.querySelector(`[data-page="${pageId}"]`);
    
    if (targetPage) targetPage.classList.add('active');
    if (targetLink) targetLink.classList.add('active');
}

// Add event listeners to all navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const pageId = link.getAttribute('data-page');
        if (pageId) {
            e.preventDefault();
            switchPage(pageId);
            window.location.hash = pageId;
        }
    });
});

// Add event listeners to all elements with data-page attribute (CTA buttons, etc.)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-page]').forEach(element => {
        // Skip if already handled (nav links)
        if (!element.classList.contains('nav-link')) {
            element.addEventListener('click', (e) => {
                const pageId = element.getAttribute('data-page');
                if (pageId) {
                    e.preventDefault();
                    console.log('Switching to page:', pageId);
                    switchPage(pageId);
                    window.location.hash = pageId;
                }
            });
        }
    });
});

// Handle hash on page load
window.addEventListener('load', () => {
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'games', 'updates'].includes(hash)) {
        switchPage(hash);
    }
});

// Fetch player count
async function fetchPlayerCount() {
    try {
        const response = await fetch('https://games.roproxy.com/v1/games?universeIds=5371687033');
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            const count = data.data[0].playing;
            document.getElementById('player-count').textContent = count.toLocaleString();
        }
    } catch (error) {
        console.error('Error fetching player count:', error);
        document.getElementById('player-count').textContent = '--';
    }
}

fetchPlayerCount();
setInterval(fetchPlayerCount, 30000);
