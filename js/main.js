const d = document;
class cinemaCls {
    constructor() {
        this.d = d.querySelectorAll('[data-container="body"]')[0];
        this.formEl = this.d.querySelectorAll('[data-content="content"]')[0];
        this.header = this.d.querySelectorAll('[data-header="title"]')[0];
        this.btn = this.d.querySelectorAll('[data-header="next"]')[0];
        this.geriBtn = this.d.querySelectorAll('[data-header="back"]')[0];
        this.footer_sol = this.d.querySelectorAll('[data-footer="sol_title"]')[0];
        this.footer_sag = this.d.querySelectorAll('[data-footer="sag_title"]')[0];
        this.selectedSeats = [];
        this.sifirla();
    }
    async sifirla() {
        this.steps = await this.steps();
        this.stepOrder = ['step1', 'step2', 'step3', 'step4'];
        this.stepIndex = -1;
        this.insertData = {};
        this.timeInSeconds = 300;
        this.init();
    }
    async init() {
        console.log(location.hash.split('#')[1])
        this.d.querySelectorAll('[data-content="content"]')[0].innerHTML = '';
        this.secili_step = this.stepOrder[this.stepIndex];
        this.modal_path_move('next');
    }

    modal_path_move(direction) {
        if (direction === 'next' && this.stepIndex < this.stepOrder.length - 1) {
            this.stepIndex++;
        } else if (direction === 'back' && this.stepIndex > 0) {
            this.stepIndex--;
        }
        this.secili_step = this.stepOrder[this.stepIndex];
        this.insertData.secili_step = this.secili_step;
        d.querySelectorAll('[data-secili_step]').forEach(item => item.classList.add('hidden'));
        if (d.querySelectorAll('[data-secili_step]').length > 0) {
            this.d.querySelectorAll('[data-secili_step]')[0].classList.add('hidden');
        }

        this.stepMove = this.step[this.secili_step] || this.step['404_Page'];
        this.d.dataset.aktif_tab = this.secili_step;
        this.header.innerHTML = this.stepMove.header_title;
        this.btn.onclick = () => { cinema.stepMove.next_step_func(); };
        this.geriBtn.onclick = () => { cinema.stepMove.prev_step_func() };
        this.geriBtn.classList[this.stepIndex === 0 ? 'add' : 'remove']('hidden')
        this.footer_sol.innerHTML = `Adım : ${this.stepIndex + 1} / ${this.stepOrder.length}`;
        this.footer_sag.innerHTML = this.stepMove.fotter_sag;
        let currentStep = this.formEl.querySelectorAll(`[data-secili_step="${this.secili_step}"]`);
        if (currentStep.length == 0) {
            const div = d.createElement('div');
            div.dataset.secili_step = this.secili_step;
            div.innerHTML = this.stepMove.content.in_html;
            this.formEl.appendChild(div);
        } else {
            currentStep[0].classList.remove('hidden');
        }
        location.hash = '#' + this.secili_step
        this.stepMove.init();
    }
    steps() {
        return new Promise(async (resolve) => {
            this.step = {
                "step1": {
                    init: async () => {
                        this.btn.classList.add('hidden');
                        var film_list = [];
                        /* Back-End veri çekilecek alan */
                        for (let a = 0; a < 1; a++) {
                            film_list.push(`
                                    <div onclick="cinema.stepMove.next_step_func();" class="bg-gray-200 p-4 rounded-lg">
                                        <img src="https://via.placeholder.com/150" alt="Film ${a + 1}"
                                            class="w-full h-48 object-cover rounded-lg mb-2">
                                        <h3 class="text-center font-semibold">Film ${a + 1}</h3>
                                    </div>`);
                        }
                        d.getElementById('film_listesi').innerHTML = film_list.join('')
                    },
                    header_title: 'Lütfen izlemek istediğiniz filmi seçin',
                    content: {
                        in_html: ` <div class="mb-4 max-h-96 overflow-y-auto">
                                    <div id="film_listesi" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">    
                                    </div>
                                </div>`
                    },
                    fotter_sag: '',
                    next_step_func: () => {
                        cinema.modal_path_move('next');
                    },
                    prev_step_func: () => {
                        cinema.modal_path_move('back');
                    },
                },
                "step2": {
                    init: async () => {
                        this.socket = io("http://localhost:5000");
                        this.btn.classList.remove('hidden');
                        var koltuk_list = [];
                        var koltuk_sayisi = 0;
                        for (let a = 1; a < 7; a++) {
                            koltuk_list.push('<div class="flex justify-center gap-2">');
                            for (let aa = 1; aa < 9; aa++) {
                                koltuk_sayisi++
                                koltuk_list.push(`<button data-seat="${koltuk_sayisi}" class="seat">${koltuk_sayisi}</button>`);
                                if (aa == 4) koltuk_list.push(`<div class="w-8"></div>`);
                            }
                            koltuk_list.push('</div>');

                        }
                        d.getElementById('koltuk_listesi').innerHTML = koltuk_list.join('');
                        this.stepMove.socketRun();
                        if (!this.stepMove.timer_calisti) {
                            this.stepMove.timer_calisti = true;
                            this.stepMove.timerCalistir();
                        }
                    },
                    timer_calisti: false,
                    timerCalistir: () => {
                        this.timerInterval = setInterval(() => {
                            const minutes = Math.floor(this.timeInSeconds / 60);  // Dakika hesapla
                            const seconds = this.timeInSeconds % 60;  // Saniye hesapla
                            cinema.footer_sag.innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            if (this.timeInSeconds === 0) {
                                clearInterval(this.timerInterval);
                                this.socket.emit('timeUp');
                                this.socket.off();
                                window.cinema = new cinemaCls();
                            }
                            this.timeInSeconds--;
                        }, 1000);
                    },
                    socketRun: () => {
                        if(!cinema.socket.connected){
                            alert('Back-end bağlı değil')
                        }


                        this.seats = document.querySelectorAll(".seat");
                        this.socket.on("currentSeats", (currentSeats) => {
                            console.log(currentSeats)
                            Object.keys(currentSeats).forEach((seat) => {
                                const button = document.querySelector(`button[data-seat="${seat}"]`);
                                if (button) {
                                    if (currentSeats[seat] === "purchased") {
                                        button.classList.add("purchased");
                                    } else if (currentSeats[seat] === this.socket.id) {
                                        this.selectedSeats.push(seat);
                                        button.classList.add("selected");
                                    } else {
                                        button.classList.add("occupied");
                                    }
                                }
                            });
                        });

                        this.seats.forEach((seat) => {
                            seat.addEventListener("click", () => {
                                const seatNumber = seat.dataset.seat;
                                if (seat.classList.contains("selected")) {
                                    this.socket.emit("deselectSeat", seatNumber);
                                } else if (!seat.classList.contains("occupied") && !seat.classList.contains("purchased")) {
                                    this.socket.emit("selectSeat", seatNumber);
                                }
                            });
                        });

                        this.socket.on("seatSelected", ({ seatNumber, user }) => {
                            const button = document.querySelector(`button[data-seat="${seatNumber}"]`);
                            if (button) {
                                if (user === this.socket.id) {
                                    this.selectedSeats.push(seatNumber);
                                    button.classList.add("selected");
                                } else {
                                    button.classList.add("occupied");
                                }
                            }
                        });

                        this.socket.on("seatDeselected", ({ seatNumber }) => {
                            this.selectedSeats = this.selectedSeats.filter((seat) => seat !== seatNumber);
                            const button = document.querySelector(`button[data-seat="${seatNumber}"]`);
                            if (button) button.classList.remove("selected", "occupied");
                        });
                    },
                    header_title: 'Lütfen koltukları seçin:',
                    content: {
                        in_html: ` 
                        <div class="mb-4">
                            <div class="w-full bg-gray-300 text-center py-3 rounded-t-lg mb-6 relative">
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-gray-700 font-bold text-lg">Perde</span>
                                </div>
                            </div>
                            <div class="space-y-3" id="koltuk_listesi"></div>
                        </div>
                        <div class="m-auto mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 flex justify-center gap-4">
                            <div class="pl-4 pr-4 rounded-t-lg bg-black text-white flex justify-center">Dolu</div>
                            <div class="pl-4 pr-4 rounded-t-lg bg-gray-300 flex justify-center">Boş</div>
                            <div class="pl-4 pr-4 rounded-t-lg bg-green-300 text-stone-500 flex justify-center">Seçili</div>
                            <div class="pl-4 pr-4 rounded-t-lg bg-red-500 text-white flex justify-center">Aktif Seçilen</div>
                        </div>
                        `
                    },
                    fotter_sag: '',
                    next_step_func: () => {
                        cinema.modal_path_move('next');
                        this.socket.emit('timeUp');
                        this.socket.off();
                    },
                    prev_step_func: () => {
                        this.stepMove.timer_calisti = false;
                        this.timeInSeconds = 300;
                        this.socket.emit('timeUp');
                        this.socket.off();
                        clearInterval(this.timerInterval);
                        cinema.modal_path_move('back');
                    },
                },
                "step3": {
                    init: async () => {
                        this.selectedSeats.forEach((seat) => {
                            const seatCard = document.createElement("div");
                            seatCard.className = "bg-green-500 text-white p-2 rounded text-center";
                            seatCard.textContent = `Koltuk ${seat}`;
                            document.getElementById("preview-seats").appendChild(seatCard);
                          });

                     },
                    header_title: 'Seçiminizi gözden geçirin:',
                    content: {
                        in_html: ` 
                            <div class="bg-gray-100 p-4 rounded-lg mb-4">
                                   <div onclick="cinema.stepMove.next_step_func();" class="bg-gray-200 p-4 rounded-lg">
                                        <img src="https://via.placeholder.com/150" alt="Film 1"
                                            class="w-full h-48 object-cover rounded-lg mb-2">
                                        <h3 class="text-center font-semibold">Film 1</h3>
                                    </div>
                                   <div class="modal-content p-4 space-y-4">
                                        <h3 class="text-lg font-semibold">Seçili Koltuklar:</h3>
                                        <div id="preview-seats" class="grid grid-cols-4 gap-2">
                                        </div>
                                    </div>
                            </div>
                        </div>`
                    },
                    fotter_sag: '',
                    next_step_func: () => {
                        cinema.modal_path_move('next');
                    },
                    prev_step_func: () => {
                        alert('seçili koltuklar silindi');
                        cinema.modal_path_move('back');
                    },
                },
                "step4": {
                    init: async () => { },
                    header_title: 'Ödeme bilgilerinizi girin:',
                    content: {
                        in_html: `
                           <div class="mb-4 mt-8">
                                <p class="text-gray-700 mb-4"></p>
                                <input type="text" placeholder="Kart Numarası"
                                    class="w-full p-2 border border-gray-300 rounded-lg mb-2">
                                <input type="text" placeholder="Ad Soyad" class="w-full p-2 border border-gray-300 rounded-lg mb-2">
                                <input type="text" placeholder="Son Kullanma Tarihi"
                                    class="w-full p-2 border border-gray-300 rounded-lg mb-2">
                                <input type="text" placeholder="CVC" class="w-full p-2 border border-gray-300 rounded-lg mb-2">
                             </div>
                        `
                    },
                    fotter_sag: '',
                    next_step_func: () => {
                        cinema.modal_path_move('next');
                    },
                    prev_step_func: () => {
                        cinema.modal_path_move('back');
                    },
                },
            }
            resolve(this.step);
        });

    }
}
window.cinema = new cinemaCls();
