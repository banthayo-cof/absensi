// Override fungsi loadPaketOptions untuk menampilkan tombol Midtrans
const originalLoadPaketOptions = window.loadPaketOptions;
window.loadPaketOptions = function() {
    if (originalLoadPaketOptions) originalLoadPaketOptions();
    
    // Ganti semua tombol package-btn agar memanggil perpanjangDenganMidtrans
    document.querySelectorAll('.package-btn').forEach(btn => {
        const originalOnclick = btn.getAttribute('onclick');
        if (originalOnclick && originalOnclick.includes('perpanjangPaketViaWA')) {
            // Ambil data dari tombol
            const price = btn.getAttribute('data-price');
            const duration = btn.getAttribute('data-duration');
            const days = btn.getAttribute('data-days');
            const name = btn.innerText.split('\n')[0].trim();
            btn.setAttribute('onclick', `perpanjangDenganMidtrans({price:${price}, duration:'${duration}', days:${days}, name:'${name}'})`);
        }
    });
};

// Fungsi perpanjang dengan Midtrans
window.perpanjangDenganMidtrans = async function(paket) {
    const uid = currentUser.uid;
    const nama = currentUser.name;
    const email = currentUser.email;

    const btn = event.target.closest('.package-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membuat transaksi...';

    try {
        const res = await apiCall('createMidtransTransaction', {
            uid: uid,
            nama: nama,
            email: email,
            paket: paket.duration,
            harga: paket.price,
            tipe: 'perpanjang'
        });

        if (!res.success) {
            showToast('Gagal: ' + res.message);
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }

        const { token } = res.data;

        snap.pay(token, {
            onSuccess: function(result) {
                showToast('Pembayaran berhasil! Paket Anda akan segera diperpanjang.');
                setTimeout(() => location.reload(), 3000);
            },
            onPending: function(result) {
                showToast('Pembayaran tertunda. Silakan selesaikan pembayaran.', 'warning');
                btn.disabled = false;
                btn.innerHTML = originalText;
            },
            onError: function(result) {
                showToast('Pembayaran gagal: ' + result.status_message, 'error');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });

    } catch (err) {
        showToast('Error: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

// Panggil ulang loadPaketOptions setelah halaman siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.loadPaketOptions());
} else {
    window.loadPaketOptions();
}