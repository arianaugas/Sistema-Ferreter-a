document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const alertBox = document.getElementById('demo-alert');
    const alertText = alertBox.querySelector('.alert-text');
    const overlay = document.getElementById('success-overlay');

    // Verificar si ya hay sesión activa
    fetch('/api/auth/me', { credentials: 'include' })
        .then(res => {
            if (res.ok) window.location.href = '/inicio';
        })
        .catch(() => {});

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('nameUser').value.trim();
        const password = document.getElementById('password').value.trim();

        alertBox.classList.add('hidden');

        if (!username || !password) {
            alertText.textContent = 'Por favor completa todos los campos.';
            alertBox.classList.remove('hidden');
            return;
        }

        try {
            const res  = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                overlay.classList.add('visible');
                setTimeout(() => { window.location.href = '/inicio'; }, 2500);
            } else {
                alertText.textContent = data.error || 'Credenciales incorrectas.';
                alertBox.classList.remove('hidden');
            }

        } catch (err) {
            alertText.textContent = 'No se pudo conectar con el servidor.';
            alertBox.classList.remove('hidden');
        }
    });
});