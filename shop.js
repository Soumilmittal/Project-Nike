document.addEventListener('DOMContentLoaded', () => {

    // --- COUNTDOWN TIMER ---
    const countdown = () => {
        // Set the date for the end of the drop (e.g., 7 days from now)
        const countDate = new Date();
        countDate.setDate(countDate.getDate() + 7);
        const targetTime = countDate.getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetTime - now;

            if (distance < 0) {
                clearInterval(interval);
                document.getElementById('countdown-timer').innerHTML = '<div class="timer-ended">The Drop is Live!</div>';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('days').innerText = String(days).padStart(2, '0');
            document.getElementById('hours').innerText = String(hours).padStart(2, '0');
            document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
            document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');

        }, 1000);
    };

    // --- PRODUCT FILTERING ---
    const productFiltering = () => {
        const filterButtons = document.getElementById('filter-buttons');
        const productCards = document.querySelectorAll('.product-card');

        if (!filterButtons) return;

        filterButtons.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;

            const filter = e.target.dataset.filter;

            // Update active button state
            filterButtons.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');

            // Filter products
            productCards.forEach(card => {
                const category = card.dataset.category;
                const shouldShow = filter === 'all' || filter === category;
                
                // Add a small delay for animation effect
                card.style.animation = 'none'; // Reset animation
                void card.offsetWidth; // Trigger reflow

                if (shouldShow) {
                    card.classList.remove('hidden');
                    card.style.animation = 'popIn 0.5s ease-out forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    };

    // Initialize all functions
    countdown();
    productFiltering();

});
