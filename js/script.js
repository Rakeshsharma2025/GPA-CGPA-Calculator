document.addEventListener('DOMContentLoaded', () => {
    // === Theme Management ===
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    // Check localStorage for theme
    const savedTheme = localStorage.getItem('au_calc_theme');

    // Default to light mode unless 'dark' is explicitly saved
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (icon) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    } else {
        body.classList.remove('dark-theme');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-theme');

            if (body.classList.contains('dark-theme')) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                localStorage.setItem('au_calc_theme', 'dark');
            } else {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                localStorage.setItem('au_calc_theme', 'light');
            }

            // Re-render charts if they exist with new theme colors
            if (window.gpaChartInstance) updateChartColors(window.gpaChartInstance);
            if (window.cgpaChartInstance) updateChartColors(window.cgpaChartInstance);
        });
    }

    function isDarkMode() {
        return body.classList.contains('dark-theme');
    }

    // === FAQ Accordion ===
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    function getTextColor() {
        return isDarkMode() ? '#ffffff' : '#2b3674';
    }

    function getGridColor() {
        return isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    }

    function updateChartColors(chart) {
        chart.options.scales.x.ticks.color = getTextColor();
        chart.options.scales.x.grid.color = getGridColor();
        chart.options.scales.y.ticks.color = getTextColor();
        chart.options.scales.y.grid.color = getGridColor();
        chart.options.plugins.legend.labels.color = getTextColor();
        chart.update();
    }

    // === GPA Calculator Logic ===
    const gpaBtn = document.getElementById('calculate-gpa-btn');
    if (gpaBtn) {
        gpaBtn.addEventListener('click', calculateGPA);
    }

    function calculateGPA() {
        // Elements
        const totalSubjectsInput = document.getElementById('total-subjects');
        const errBox = document.getElementById('validation-error');

        // Grades counts
        const o = parseInt(document.getElementById('grade-o').value) || 0;
        const aplus = parseInt(document.getElementById('grade-aplus').value) || 0;
        const a = parseInt(document.getElementById('grade-a').value) || 0;
        const bplus = parseInt(document.getElementById('grade-bplus').value) || 0;
        const b = parseInt(document.getElementById('grade-b').value) || 0;
        const c = parseInt(document.getElementById('grade-c').value) || 0;

        const totalSubjects = parseInt(totalSubjectsInput.value);
        const sumGrades = o + aplus + a + bplus + b + c;

        // Validation
        if (!totalSubjects || totalSubjects <= 0) {
            showError(errBox, "Please enter a valid Total Subjects number.");
            return;
        }

        if (sumGrades !== totalSubjects) {
            showError(errBox, `Total grades entered (${sumGrades}) must equal Total Subjects (${totalSubjects})!`);
            return;
        }

        // Hide Error
        errBox.style.display = 'none';

        // Calculation
        // GPA = (O×10 + A+×9 + A×8 + B+×7 + B×6 + C×5) / Total Subjects
        const totalPoints = (o * 10) + (aplus * 9) + (a * 8) + (bplus * 7) + (b * 6) + (c * 5);
        const gpa = totalPoints / totalSubjects;

        displayResult('final-gpa', 'gpa-progress', gpa, 10, 'gpa-msg');
        renderGPAChart([o, aplus, a, bplus, b, c]);

        // Scroll to results on mobile
        if (window.innerWidth < 850) {
            document.getElementById('gpa-content-area').scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    // === CGPA Calculator Logic ===
    const cgpaBtn = document.getElementById('calculate-cgpa-btn');
    if (cgpaBtn) {
        cgpaBtn.addEventListener('click', calculateCGPA);
    }

    function calculateCGPA() {
        const errBox = document.getElementById('cgpa-validation-error');
        let totalGPA = 0;
        let semCount = 0;
        let semData = [];

        for (let i = 1; i <= 8; i++) {
            const val = parseFloat(document.getElementById(`sem-${i}`).value);
            if (!isNaN(val) && val > 0 && val <= 10) {
                totalGPA += val;
                semCount++;
                semData.push(val);
            } else {
                semData.push(null); // Keep array index aligned with semester
            }
        }

        if (semCount === 0) {
            showError(errBox, "Please enter valid GPA (1-10) for at least one semester.");
            return;
        }

        errBox.style.display = 'none';

        const cgpa = totalGPA / semCount;
        displayResult('final-cgpa', 'cgpa-progress', cgpa, 10, 'cgpa-msg');
        renderCGPAChart(semData);

        if (window.innerWidth < 850) {
            document.getElementById('cgpa-content-area').scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    // === Shared Utilities ===

    function showError(el, msg) {
        el.querySelector('span').innerText = msg;
        el.style.display = 'flex';
    }

    function displayResult(elementId, progressId, value, maxVal, msgId) {
        const valElem = document.getElementById(elementId);
        const progressElem = document.getElementById(progressId);
        const msgElem = document.getElementById(msgId);

        // Counter Animation
        let startVal = 0;
        const duration = 1500;
        const stepTime = Math.abs(Math.floor(duration / (value * 100)));

        const timer = setInterval(() => {
            startVal += 0.05;
            if (startVal >= value) {
                valElem.innerText = value.toFixed(2);
                clearInterval(timer);
            } else {
                valElem.innerText = startVal.toFixed(2);
            }
        }, stepTime);

        // Circular Progress
        const circumference = 283; // 2 * pi * r (r=45)
        const offset = circumference - (value / maxVal) * circumference;

        // Add a small delay for visual effect
        setTimeout(() => {
            progressElem.style.strokeDashoffset = offset;

            // Dynamic color based on score
            if (value >= 9) {
                progressElem.style.stroke = 'var(--grade-o)'; // Gold
                msgElem.innerText = "Outstanding! Keep up the brilliant work! 🌟";
                msgElem.style.color = 'var(--grade-o)';
            } else if (value >= 8) {
                progressElem.style.stroke = 'var(--grade-aplus)'; // Green
                msgElem.innerText = "Excellent performance! 🚀";
                msgElem.style.color = 'var(--grade-aplus)';
            } else if (value >= 7) {
                progressElem.style.stroke = 'var(--primary)'; // Blue
                msgElem.innerText = "Good job! You can do even better! 📚";
                msgElem.style.color = 'var(--primary)';
            } else {
                progressElem.style.stroke = 'var(--grade-c)'; // Red
                msgElem.innerText = "Focus and push harder next time! 💪";
                msgElem.style.color = 'var(--grade-c)';
            }
        }, 100);
    }

    // === Charts ===

    // Chart Defaults
    Chart.defaults.font.family = "'Poppins', sans-serif";

    function renderGPAChart(data) {
        const ctx = document.getElementById('gpaChart');
        if (!ctx) return;

        document.querySelector('.chart-container').style.display = 'block';

        if (window.gpaChartInstance) {
            window.gpaChartInstance.destroy();
        }

        window.gpaChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['O', 'A+', 'A', 'B+', 'B', 'C'],
                datasets: [{
                    label: 'No. of Subjects',
                    data: data,
                    backgroundColor: [
                        '#f59e0b', // O
                        '#10b981', // A+
                        '#3b82f6', // A
                        '#8b5cf6', // B+
                        '#ec4899', // B
                        '#ef4444'  // C
                    ],
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: getTextColor() },
                        grid: { color: getGridColor(), drawBorder: false }
                    },
                    x: {
                        ticks: { color: getTextColor() },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderCGPAChart(data) {
        const ctx = document.getElementById('cgpaChart');
        if (!ctx) return;

        document.querySelector('.chart-container').style.display = 'block';

        if (window.cgpaChartInstance) {
            window.cgpaChartInstance.destroy();
        }

        const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
        const cleanData = data.map(d => d === null ? 0 : d);

        window.cgpaChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Semester GPA',
                    data: cleanData,
                    borderColor: '#0284c7',
                    backgroundColor: 'rgba(2, 132, 199, 0.2)',
                    borderWidth: 3,
                    pointBackgroundColor: '#2dd4bf',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: Math.max(0, Math.min(...data.filter(d => d !== null)) - 1),
                        max: 10,
                        ticks: { color: getTextColor() },
                        grid: { color: getGridColor() }
                    },
                    x: {
                        ticks: { color: getTextColor() },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // === PDF Export ===
    const gpaPdfBtn = document.getElementById('download-gpa-pdf');
    const cgpaPdfBtn = document.getElementById('download-cgpa-pdf');

    if (gpaPdfBtn) {
        gpaPdfBtn.addEventListener('click', () => {
            downloadPDF('gpa-content-area', 'My_Semester_GPA_Result.pdf');
        });
    }

    if (cgpaPdfBtn) {
        cgpaPdfBtn.addEventListener('click', () => {
            downloadPDF('cgpa-content-area', 'My_CGPA_Result.pdf');
        });
    }

    function downloadPDF(elementId, filename) {
        const element = document.getElementById(elementId);

        // Add a temporary class to fix layout for PDF printing (handling dark mode background)
        const isDark = isDarkMode();
        const originalBg = element.style.backgroundColor;

        if (isDark) {
            element.style.backgroundColor = '#0B1120';
        } else {
            element.style.backgroundColor = '#ffffff';
        }

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Restore styles
            element.style.backgroundColor = originalBg;
        });
    }

    // === Share API ===
    const gpaShareBtn = document.getElementById('share-gpa');
    const cgpaShareBtn = document.getElementById('share-cgpa');

    if (gpaShareBtn) {
        gpaShareBtn.addEventListener('click', () => {
            const score = document.getElementById('final-gpa').innerText;
            if (score !== '0.00') {
                shareResult('GPA', score);
                localStorage.setItem('saved_gpa', score);
            }
        });
    }

    if (cgpaShareBtn) {
        cgpaShareBtn.addEventListener('click', () => {
            const score = document.getElementById('final-cgpa').innerText;
            if (score !== '0.00') {
                shareResult('CGPA', score);
                localStorage.setItem('saved_cgpa', score);
            }
        });
    }

    function shareResult(type, score) {
        if (navigator.share) {
            navigator.share({
                title: `My Anna University ${type}`,
                text: `I just calculated my ${type} using AU Calc Pro and got ${score}! 🎓`,
                url: window.location.href
            }).catch((error) => console.log('Error sharing', error));
        } else {
            alert(`Your ${type} is ${score}! (Web Share not supported on this device)`);
        }
    }
});
