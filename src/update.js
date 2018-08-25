import format from 'date-fns/format';

var span = document.querySelector('#time-now');

export function update() {
	span.textContent = format(new Date(), 'h:mm:ssa');
	setTimeout(update, 1000);
}
